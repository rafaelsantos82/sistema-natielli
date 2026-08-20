package service

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"time"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/infrastructure/crypto"
	"espaco-terapia-os/backend/internal/infrastructure/storage"
	"espaco-terapia-os/backend/internal/platform/requestcontext"

	"github.com/google/uuid"
)

type DocumentoAssinadoService struct {
	repo       repository.DocumentoAssinadoRepository
	chaveSvc   *ChaveDigitalService
	store      *storage.LocalStorage
	audit      *AuditService
	logger     *slog.Logger
}

func NewDocumentoAssinadoService(
	repo repository.DocumentoAssinadoRepository,
	chaveSvc *ChaveDigitalService,
	store *storage.LocalStorage,
	audit *AuditService,
	logger *slog.Logger,
) *DocumentoAssinadoService {
	return &DocumentoAssinadoService{repo: repo, chaveSvc: chaveSvc, store: store, audit: audit, logger: logger}
}

func (s *DocumentoAssinadoService) List(ctx context.Context, unidadeID uuid.UUID, page, pageSize int) ([]*DocumentoAssinadoDTO, int64, error) {
	items, total, err := s.repo.List(ctx, repository.DocumentoAssinadoListFilter{
		UnidadeID: unidadeID, Page: page, PageSize: pageSize,
	})
	if err != nil {
		return nil, 0, err
	}
	out := make([]*DocumentoAssinadoDTO, 0, len(items))
	for _, it := range items {
		out = append(out, toDocumentoAssinadoDTO(it))
	}
	return out, total, nil
}

func (s *DocumentoAssinadoService) Assinar(
	ctx context.Context,
	unidadeID, actorID uuid.UUID,
	name, docType string,
	pdfReader io.Reader,
) (*DocumentoAssinadoDTO, error) {
	name = strings.TrimSpace(name)
	docType = strings.TrimSpace(docType)
	if name == "" {
		return nil, domainerrors.NewValidationError("nome do documento é obrigatório")
	}
	if docType != "prontuario" && docType != "prescricao" && docType != "atestado" {
		return nil, domainerrors.NewValidationError("tipo de documento inválido")
	}
	pdf, err := io.ReadAll(io.LimitReader(pdfReader, 20<<20))
	if err != nil {
		return nil, err
	}
	if len(pdf) < 4 || string(pdf[:4]) != "%PDF" {
		return nil, domainerrors.NewValidationError("arquivo PDF inválido")
	}

	pfx, pwd, err := s.chaveSvc.DecryptPFX(ctx, unidadeID)
	if err != nil {
		return nil, err
	}
	signed, err := crypto.SignPDFBytes(pdf, pfx, pwd)
	if err != nil {
		return nil, domainerrors.NewValidationError(err.Error())
	}

	docID := uuid.New()
	safeName := sanitizeFilename(name) + ".pdf"
	origPath, _, err := s.store.StoreDocumentoAssinado(unidadeID, docID, "original", safeName, bytes.NewReader(pdf))
	if err != nil {
		return nil, err
	}
	stamped := crypto.StampSignedPDF(pdf)
	signedPath, _, err := s.store.StoreDocumentoAssinado(unidadeID, docID, "signed", safeName, bytes.NewReader(stamped))
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	rec := &repository.DocumentoAssinadoRecord{
		ID:               docID,
		Name:             name,
		Type:             docType,
		DocumentHash:     signed.DocumentHashBase64,
		Signature:        signed.SignatureBase64,
		Certificate:      signed.CertificatePEM,
		SignedAt:         now.Format(time.RFC3339),
		Algorithm:        signed.Algorithm,
		SignerCommonName: signed.Metadata.CommonName,
		SignerOrg:        signed.Metadata.Organization,
		SignerCPF:        signed.Metadata.CPF,
		CertValidFrom:    signed.Metadata.ValidFrom.Format(time.RFC3339),
		CertValidTo:      signed.Metadata.ValidTo.Format(time.RFC3339),
		CertIssuer:       signed.Metadata.Issuer,
		CertSerial:       signed.Metadata.Serial,
		UnidadeID:        unidadeID,
		CadastradoPor:    actorID,
		OriginalPath:     origPath,
		SignedPath:       signedPath,
		CreatedAt:        now.Format(time.RFC3339),
	}
	if err := s.repo.Create(ctx, rec); err != nil {
		return nil, err
	}
	s.recordDocAudit(ctx, AuditDocumentoAssinatura, docID.String(), map[string]string{
		"name": name, "type": docType, "unidade_id": unidadeID.String(),
	})
	s.logger.Info("documento assinado",
		slog.String("documento_id", docID.String()),
		slog.String("unidade_id", unidadeID.String()),
	)
	return toDocumentoAssinadoDTO(rec), nil
}

func (s *DocumentoAssinadoService) Verificar(ctx context.Context, id uuid.UUID) (*VerifyAssinaturaResult, error) {
	rec, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if rec == nil {
		return nil, domainerrors.NewNotFoundError("documento_assinado", id.String())
	}
	f, err := s.store.OpenRelative(rec.OriginalPath)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	pdf, err := io.ReadAll(f)
	if err != nil {
		return nil, err
	}
	valid, msg, err := crypto.VerifySignedPDF(pdf, rec.DocumentHash, rec.Signature, rec.Certificate)
	if err != nil {
		return nil, err
	}
	s.recordDocAudit(ctx, AuditDocumentoAssinaturaVerif, id.String(), map[string]bool{"valid": valid})
	return &VerifyAssinaturaResult{Valid: valid, Message: msg}, nil
}

func (s *DocumentoAssinadoService) OpenSignedDownload(ctx context.Context, id uuid.UUID) (string, *os.File, error) {
	rec, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return "", nil, err
	}
	if rec == nil {
		return "", nil, domainerrors.NewNotFoundError("documento_assinado", id.String())
	}
	s.recordDocAudit(ctx, AuditDocumentoAssinaturaDownload, id.String(), nil)
	path := rec.SignedPath
	if path == "" {
		path = rec.OriginalPath
	}
	f, err := s.store.OpenRelative(path)
	if err != nil {
		return "", nil, err
	}
	filename := sanitizeFilename(rec.Name) + "_assinado.pdf"
	return filename, f, nil
}

func toDocumentoAssinadoDTO(rec *repository.DocumentoAssinadoRecord) *DocumentoAssinadoDTO {
	return &DocumentoAssinadoDTO{
		ID:               rec.ID,
		Name:             rec.Name,
		Type:             rec.Type,
		DocumentHash:     rec.DocumentHash,
		SignedAt:         rec.SignedAt,
		Algorithm:        rec.Algorithm,
		SignerCommonName: rec.SignerCommonName,
		SignerOrg:        rec.SignerOrg,
		CertValidTo:      rec.CertValidTo,
		CertIssuer:       rec.CertIssuer,
		UnidadeID:        rec.UnidadeID,
	}
}

func (s *DocumentoAssinadoService) recordDocAudit(ctx context.Context, action, entityID string, diff any) {
	idStr, name, role := requestcontext.ActorFromContext(ctx)
	actorID, _ := uuid.Parse(idStr)
	var raw json.RawMessage
	if diff != nil {
		raw, _ = json.Marshal(diff)
	}
	_ = RecordAuditHelper(ctx, s.audit, AuditLogInput{
		ActorID: actorID, ActorName: name, ActorRole: role,
		Acao: action, Entidade: AuditEntidadeDocumentoAssinado, EntidadeID: entityID, Diff: raw,
	})
}

func sanitizeFilename(name string) string {
	name = strings.TrimSpace(name)
	name = strings.ReplaceAll(name, "/", "_")
	name = strings.ReplaceAll(name, "\\", "_")
	if name == "" {
		return "documento"
	}
	return filepath.Base(name)
}
