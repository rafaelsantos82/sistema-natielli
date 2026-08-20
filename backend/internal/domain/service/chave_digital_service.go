package service

import (
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"strings"
	"time"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/infrastructure/crypto"
	"espaco-terapia-os/backend/internal/platform/requestcontext"

	"github.com/google/uuid"
)

type ChaveDigitalService struct {
	repo     repository.ChaveDigitalRepository
	envelope *crypto.Envelope
	audit    *AuditService
	logger   *slog.Logger
}

func NewChaveDigitalService(
	repo repository.ChaveDigitalRepository,
	envelope *crypto.Envelope,
	audit *AuditService,
	logger *slog.Logger,
) *ChaveDigitalService {
	return &ChaveDigitalService{repo: repo, envelope: envelope, audit: audit, logger: logger}
}

func (s *ChaveDigitalService) GetAtiva(ctx context.Context, unidadeID uuid.UUID) (*ChaveDigitalDTO, error) {
	rec, err := s.repo.FindActiveByUnidade(ctx, unidadeID)
	if err != nil {
		return nil, err
	}
	if rec == nil {
		return nil, nil
	}
	return s.toPublicDTO(rec), nil
}

func (s *ChaveDigitalService) Register(
	ctx context.Context,
	unidadeID, actorID uuid.UUID,
	pfxReader io.Reader,
	password string,
) (*ChaveDigitalDTO, error) {
	pfxData, err := io.ReadAll(io.LimitReader(pfxReader, 5<<20))
	if err != nil {
		return nil, err
	}
	if len(pfxData) == 0 {
		return nil, domainerrors.NewValidationError("arquivo de certificado vazio")
	}
	password = strings.TrimSpace(password)
	if password == "" {
		return nil, domainerrors.NewValidationError("senha do certificado é obrigatória")
	}

	_, cert, meta, err := crypto.ParsePFX(pfxData, password)
	if err != nil {
		s.recordAudit(ctx, AuditChaveDigitalValidacaoFalha, unidadeID.String(), map[string]string{"reason": err.Error()})
		return nil, domainerrors.NewValidationError(err.Error())
	}
	isICP := crypto.ValidateICPBrasil(cert)
	if !isICP {
		s.logger.Warn("certificado sem cadeia ICP-Brasil reconhecida", slog.String("unidade_id", unidadeID.String()))
	}
	if !crypto.IsCertificateValid(cert, time.Now().UTC()) {
		s.recordAudit(ctx, AuditChaveDigitalValidacaoFalha, unidadeID.String(), map[string]string{"reason": "certificado expirado"})
		return nil, domainerrors.NewValidationError("certificado expirado ou ainda não válido")
	}

	pfxCT, err := s.envelope.Encrypt(pfxData)
	if err != nil {
		return nil, err
	}
	pwdCT, err := s.envelope.EncryptString(password)
	if err != nil {
		return nil, err
	}

	existing, _ := s.repo.FindActiveByUnidade(ctx, unidadeID)
	action := AuditChaveDigitalCadastro
	if existing != nil {
		if err := s.repo.RevokeActiveByUnidade(ctx, unidadeID); err != nil {
			return nil, err
		}
		action = AuditChaveDigitalSubstituicao
	}

	rec := &repository.ChaveDigitalRecord{
		ID:               uuid.New(),
		UnidadeID:        unidadeID,
		SignerCommonName: meta.CommonName,
		SignerOrg:        meta.Organization,
		SignerCPF:        meta.CPF,
		CertValidFrom:    meta.ValidFrom.Format(time.RFC3339),
		CertValidTo:      meta.ValidTo.Format(time.RFC3339),
		CertIssuer:       meta.Issuer,
		CertSerial:       meta.Serial,
		Algoritmo:        "SHA256withRSA",
		PfxCiphertext:    pfxCT,
		PfxPasswordCT:    pwdCT,
		EncryptionKeyID: s.envelope.KeyID(),
		CadastradaPor:    actorID,
	}
	if err := s.repo.Create(ctx, rec); err != nil {
		return nil, err
	}
	s.recordAudit(ctx, action, rec.ID.String(), map[string]string{
		"unidade_id": unidadeID.String(),
		"signer":     meta.CommonName,
	})
	return s.toPublicDTO(rec), nil
}

func (s *ChaveDigitalService) Revoke(ctx context.Context, unidadeID uuid.UUID) error {
	rec, err := s.repo.FindActiveByUnidade(ctx, unidadeID)
	if err != nil {
		return err
	}
	if rec == nil {
		return domainerrors.NewNotFoundError("chave_digital", unidadeID.String())
	}
	if err := s.repo.RevokeActiveByUnidade(ctx, unidadeID); err != nil {
		return err
	}
	s.recordAudit(ctx, AuditChaveDigitalRevogacao, rec.ID.String(), map[string]string{"unidade_id": unidadeID.String()})
	return nil
}

func (s *ChaveDigitalService) DecryptPFX(ctx context.Context, unidadeID uuid.UUID) (pfx []byte, password string, err error) {
	rec, err := s.repo.FindActiveByUnidade(ctx, unidadeID)
	if err != nil {
		return nil, "", err
	}
	if rec == nil {
		return nil, "", domainerrors.NewValidationError("Nenhuma chave digital cadastrada para esta unidade. Cadastre em Administração → Chave Digital.")
	}
	pfx, err = s.envelope.Decrypt(rec.PfxCiphertext)
	if err != nil {
		return nil, "", err
	}
	password, err = s.envelope.DecryptString(rec.PfxPasswordCT)
	return pfx, password, err
}

func (s *ChaveDigitalService) toPublicDTO(rec *repository.ChaveDigitalRecord) *ChaveDigitalDTO {
	from, _ := time.Parse(time.RFC3339, rec.CertValidFrom)
	to, _ := time.Parse(time.RFC3339, rec.CertValidTo)
	now := time.Now().UTC()
	// Re-parse cert metadata for flags without decrypting PFX
	isValid := !now.Before(from) && !now.After(to)
	return &ChaveDigitalDTO{
		ID:               rec.ID,
		UnidadeID:        rec.UnidadeID,
		SignerCommonName: rec.SignerCommonName,
		SignerOrg:        rec.SignerOrg,
		SignerCPF:        rec.SignerCPF,
		CertValidFrom:    rec.CertValidFrom,
		CertValidTo:      rec.CertValidTo,
		CertIssuer:       rec.CertIssuer,
		CertSerial:       rec.CertSerial,
		Algoritmo:        rec.Algoritmo,
		IsICPBrasil:      strings.Contains(strings.ToUpper(rec.CertIssuer), "ICP") || strings.Contains(strings.ToUpper(rec.CertIssuer), "BRASIL"),
		IsValid:          isValid,
	}
}

func (s *ChaveDigitalService) recordAudit(ctx context.Context, action, entityID string, diff any) {
	idStr, name, role := requestcontext.ActorFromContext(ctx)
	actorID, _ := uuid.Parse(idStr)
	var raw json.RawMessage
	if diff != nil {
		raw, _ = json.Marshal(diff)
	}
	_ = RecordAuditHelper(ctx, s.audit, AuditLogInput{
		ActorID: actorID, ActorName: name, ActorRole: role,
		Acao: action, Entidade: AuditEntidadeChaveDigital, EntidadeID: entityID, Diff: raw,
	})
}
