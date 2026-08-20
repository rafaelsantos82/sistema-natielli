package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"io"
	"log/slog"
	"net/mail"
	"strings"
	"time"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/infrastructure/storage"
	"espaco-terapia-os/backend/internal/platform/requestcontext"

	"github.com/google/uuid"
)

type ContratoService struct {
	repo        repository.ContratoRepository
	store       *storage.LocalStorage
	policy      UploadPolicy
	audit       *AuditService
	logger      *slog.Logger
	frontendURL string
}

func NewContratoService(
	repo repository.ContratoRepository,
	store *storage.LocalStorage,
	policy UploadPolicy,
	audit *AuditService,
	logger *slog.Logger,
	frontendURL string,
) *ContratoService {
	frontendURL = strings.TrimRight(strings.TrimSpace(frontendURL), "/")
	return &ContratoService{
		repo: repo, store: store, policy: policy, audit: audit, logger: logger, frontendURL: frontendURL,
	}
}

func (s *ContratoService) List(ctx context.Context, f ContratoListFilter) (*ListResult[ContratoDTO], error) {
	if f.Page < 1 {
		f.Page = 1
	}
	if f.PageSize < 1 {
		f.PageSize = 50
	}
	items, total, err := s.repo.List(ctx, f.Query, f.Status, f.Page, f.PageSize)
	if err != nil {
		return nil, err
	}
	dtos := make([]ContratoDTO, 0, len(items))
	for _, rec := range items {
		if rec.DeletedAt != nil {
			continue
		}
		dtos = append(dtos, toContratoDTO(rec, false))
	}
	totalPages := int(total) / f.PageSize
	if int(total)%f.PageSize != 0 {
		totalPages++
	}
	return &ListResult[ContratoDTO]{
		Items: dtos, Total: total, Page: f.Page, PageSize: f.PageSize, TotalPages: totalPages,
	}, nil
}

func (s *ContratoService) GetByID(ctx context.Context, id uuid.UUID) (*ContratoDTO, error) {
	rec, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if rec == nil || rec.DeletedAt != nil {
		return nil, domainerrors.NewNotFoundError("contrato", id.String())
	}
	dto := toContratoDTO(rec, true)
	return &dto, nil
}

func (s *ContratoService) CreateWithArquivo(
	ctx context.Context,
	in ContratoInput,
	fileIn ContratoArquivoUploadInput,
	reader io.Reader,
) (*ContratoDTO, error) {
	if err := validateContratoMetadata(in); err != nil {
		return nil, err
	}
	if err := s.policy.ValidateUpload(fileIn.OriginalName, fileIn.DeclaredMIME, fileIn.Size); err != nil {
		return nil, domainerrors.NewValidationError(err.Error())
	}
	now := time.Now().UTC()
	status := strings.TrimSpace(in.Status)
	if status == "" {
		status = "Rascunho"
	}
	rec := &repository.ContratoRecord{
		ID: uuid.New(), Titulo: strings.TrimSpace(in.Titulo), Tipo: in.Tipo,
		PacienteID: in.PacienteID, PacienteNome: in.PacienteNome,
		ProfissionalID: in.ProfissionalID, ProfissionalNome: in.ProfissionalNome,
		Status: status, CriadoPor: in.CriadoPor,
		CriadoEm: now, AtualizadoEm: now,
	}
	mime := s.policy.ResolveMIME(fileIn.OriginalName, fileIn.DeclaredMIME)
	safeName := SanitizeOriginalFilename(fileIn.OriginalName)
	rel, written, err := s.store.StoreContratoArquivo(rec.ID, safeName, reader)
	if err != nil {
		return nil, domainerrors.NewDatabaseError("falha ao armazenar arquivo", err)
	}
	rec.ArquivoNome = fileIn.OriginalName
	rec.ArquivoMime = mime
	rec.ArquivoTamanhoBytes = written
	rec.StoragePath = rel
	if err := s.repo.Create(ctx, rec); err != nil {
		_ = s.store.RemoveRelative(rel)
		return nil, err
	}
	s.recordAudit(ctx, AuditContratoCriacao, rec.ID.String(), map[string]string{"titulo": rec.Titulo})
	dto := toContratoDTO(rec, true)
	return &dto, nil
}

func (s *ContratoService) Update(ctx context.Context, id uuid.UUID, in ContratoInput) (*ContratoDTO, error) {
	rec, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if rec == nil || rec.DeletedAt != nil {
		return nil, domainerrors.NewNotFoundError("contrato", id.String())
	}
	if !canEditContrato(rec.Status) {
		return nil, domainerrors.NewBusinessRuleError("Somente contratos em Rascunho ou Recusado podem ser editados")
	}
	if err := validateContratoMetadata(in); err != nil {
		return nil, err
	}
	rec.Titulo = strings.TrimSpace(in.Titulo)
	rec.Tipo = in.Tipo
	rec.PacienteID = in.PacienteID
	rec.PacienteNome = in.PacienteNome
	rec.ProfissionalID = in.ProfissionalID
	rec.ProfissionalNome = in.ProfissionalNome
	if st := strings.TrimSpace(in.Status); st != "" && canEditContrato(st) {
		rec.Status = st
	}
	rec.AtualizadoEm = time.Now().UTC()
	if err := s.repo.Update(ctx, rec); err != nil {
		return nil, err
	}
	s.recordAudit(ctx, AuditContratoAtualizacao, rec.ID.String(), map[string]string{"titulo": rec.Titulo})
	dto := toContratoDTO(rec, true)
	return &dto, nil
}

func (s *ContratoService) ReplaceArquivo(
	ctx context.Context,
	id uuid.UUID,
	fileIn ContratoArquivoUploadInput,
	reader io.Reader,
) (*ContratoDTO, error) {
	rec, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if rec == nil || rec.DeletedAt != nil {
		return nil, domainerrors.NewNotFoundError("contrato", id.String())
	}
	if !canEditContrato(rec.Status) {
		return nil, domainerrors.NewBusinessRuleError("Somente contratos em Rascunho ou Recusado podem ter o arquivo substituído")
	}
	if err := s.policy.ValidateUpload(fileIn.OriginalName, fileIn.DeclaredMIME, fileIn.Size); err != nil {
		return nil, domainerrors.NewValidationError(err.Error())
	}
	oldPath := rec.StoragePath
	mime := s.policy.ResolveMIME(fileIn.OriginalName, fileIn.DeclaredMIME)
	safeName := SanitizeOriginalFilename(fileIn.OriginalName)
	rel, written, err := s.store.StoreContratoArquivo(rec.ID, safeName, reader)
	if err != nil {
		return nil, domainerrors.NewDatabaseError("falha ao armazenar arquivo", err)
	}
	rec.ArquivoNome = fileIn.OriginalName
	rec.ArquivoMime = mime
	rec.ArquivoTamanhoBytes = written
	rec.StoragePath = rel
	rec.AtualizadoEm = time.Now().UTC()
	if err := s.repo.Update(ctx, rec); err != nil {
		_ = s.store.RemoveRelative(rel)
		return nil, err
	}
	if oldPath != "" && oldPath != rel {
		_ = s.store.RemoveRelative(oldPath)
	}
	s.recordAudit(ctx, AuditContratoAtualizacao, rec.ID.String(), map[string]string{"arquivo": "substituido"})
	dto := toContratoDTO(rec, true)
	return &dto, nil
}

func (s *ContratoService) OpenDownload(ctx context.Context, id uuid.UUID) (*ContratoArquivoMeta, io.ReadCloser, error) {
	rec, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, nil, err
	}
	if rec == nil || rec.DeletedAt != nil {
		return nil, nil, domainerrors.NewNotFoundError("contrato", id.String())
	}
	return s.openRecordFile(rec)
}

func (s *ContratoService) OpenDownloadCompartilhadoPublic(ctx context.Context, token string) (*ContratoArquivoMeta, io.ReadCloser, error) {
	comp, err := s.repo.FindCompartilhamentoByToken(ctx, token)
	if err != nil {
		return nil, nil, err
	}
	if comp == nil || time.Now().After(comp.ExpiraEm) {
		return nil, nil, domainerrors.NewNotFoundError("compartilhamento", "token")
	}
	rec, err := s.repo.GetByID(ctx, comp.ContratoID)
	if err != nil || rec == nil || rec.DeletedAt != nil {
		return nil, nil, domainerrors.NewNotFoundError("contrato", "")
	}
	return s.openRecordFile(rec)
}

func (s *ContratoService) OpenDownloadAssinaturaPublic(ctx context.Context, token string) (*ContratoArquivoMeta, io.ReadCloser, error) {
	sg, contrato, err := s.repo.FindSignatarioByToken(ctx, token)
	if err != nil {
		return nil, nil, err
	}
	if sg == nil || contrato == nil || contrato.DeletedAt != nil {
		return nil, nil, domainerrors.NewNotFoundError("assinatura", "token")
	}
	if sg.ExpiraEm != nil && time.Now().After(*sg.ExpiraEm) {
		return nil, nil, domainerrors.NewBusinessRuleError("Link de assinatura expirado")
	}
	return s.openRecordFile(contrato)
}

func (s *ContratoService) openRecordFile(rec *repository.ContratoRecord) (*ContratoArquivoMeta, io.ReadCloser, error) {
	if !contratoHasArquivo(rec) {
		return nil, nil, domainerrors.NewNotFoundError("arquivo", rec.ID.String())
	}
	f, err := s.store.OpenRelative(rec.StoragePath)
	if err != nil {
		return nil, nil, domainerrors.NewNotFoundError("arquivo", rec.ID.String())
	}
	return &ContratoArquivoMeta{NomeArquivo: rec.ArquivoNome, MimeType: rec.ArquivoMime}, f, nil
}

func (s *ContratoService) SoftDelete(ctx context.Context, id uuid.UUID) error {
	rec, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if rec == nil || rec.DeletedAt != nil {
		return domainerrors.NewNotFoundError("contrato", id.String())
	}
	now := time.Now().UTC()
	if err := s.repo.SoftDelete(ctx, id, now); err != nil {
		return err
	}
	s.recordAudit(ctx, AuditContratoExclusao, id.String(), map[string]string{"titulo": rec.Titulo})
	return nil
}

func (s *ContratoService) Compartilhar(ctx context.Context, id uuid.UUID, in CompartilharContratoInput) (*CompartilharContratoResult, error) {
	rec, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if rec == nil || rec.DeletedAt != nil {
		return nil, domainerrors.NewNotFoundError("contrato", id.String())
	}
	if rec.Status == "Rascunho" {
		return nil, domainerrors.NewBusinessRuleError("Não é possível compartilhar um contrato em Rascunho")
	}
	if !contratoHasDocumento(rec) {
		return nil, domainerrors.NewBusinessRuleError("Contrato sem documento para compartilhar")
	}
	hours := in.ExpiracaoHoras
	if hours < 1 {
		hours = 72
	}
	if hours > 720 {
		hours = 720
	}
	token, err := secureToken(32)
	if err != nil {
		return nil, err
	}
	exp := time.Now().UTC().Add(time.Duration(hours) * time.Hour)
	comp := &repository.CompartilhamentoRecord{
		ID: uuid.New(), ContratoID: id, ContratoTitulo: rec.Titulo, Token: token, ExpiraEm: exp,
		PodeVisualizar: true, PodeBaixar: true,
	}
	if err := s.repo.CreateCompartilhamento(ctx, comp); err != nil {
		return nil, err
	}
	s.recordAudit(ctx, AuditContratoCompartilhamento, id.String(), map[string]interface{}{"expira_em": exp.Format(time.RFC3339)})
	url := s.publicURL("/contratos/compartilhado/" + token)
	return &CompartilharContratoResult{Token: token, URL: url, ExpiraEm: exp.Format(time.RFC3339)}, nil
}

func (s *ContratoService) SolicitarAssinatura(ctx context.Context, id uuid.UUID, in SolicitarAssinaturaInput) (*SolicitarAssinaturaResult, error) {
	rec, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if rec == nil || rec.DeletedAt != nil {
		return nil, domainerrors.NewNotFoundError("contrato", id.String())
	}
	if rec.Status != "Rascunho" && rec.Status != "Recusado" {
		return nil, domainerrors.NewBusinessRuleError("Solicitação de assinatura permitida apenas para Rascunho ou Recusado")
	}
	if !contratoHasDocumento(rec) {
		return nil, domainerrors.NewBusinessRuleError("Envie um arquivo de contrato antes de solicitar assinatura")
	}
	if len(in.Signatarios) == 0 {
		return nil, domainerrors.NewValidationError("informe ao menos um signatário")
	}
	hours := in.ExpiraEmHoras
	if hours < 1 {
		hours = 168
	}
	exp := time.Now().UTC().Add(time.Duration(hours) * time.Hour)
	msg := strings.TrimSpace(in.Mensagem)
	var msgPtr *string
	if msg != "" {
		msgPtr = &msg
	}
	solID := uuid.New()
	sol := &repository.SolicitacaoAssinaturaRecord{
		ID: solID, ContratoID: id, ContratoTitulo: rec.Titulo,
		Status: "Enviado", MensagemPersonalizada: msgPtr, ExpiraEm: &exp,
	}
	if err := s.repo.CreateSolicitacao(ctx, sol); err != nil {
		return nil, err
	}
	links := make([]SignatarioLinkDTO, 0, len(in.Signatarios))
	for _, sg := range in.Signatarios {
		if err := validateSignatario(sg); err != nil {
			return nil, err
		}
		tok, err := secureToken(32)
		if err != nil {
			return nil, err
		}
		sgID := uuid.New()
		var cpf, par *string
		if sg.CPF != "" {
			cpf = &sg.CPF
		}
		if sg.Parentesco != "" {
			par = &sg.Parentesco
		}
		srec := &repository.SignatarioRecord{
			ID: sgID, SolicitacaoID: solID, Nome: sg.Nome, Email: sg.Email, Tipo: sg.Tipo,
			CPF: cpf, Parentesco: par, Ordem: sg.Ordem, Status: "Pendente",
			TokenAcesso: tok, ExpiraEm: &exp,
		}
		if err := s.repo.CreateSignatario(ctx, srec); err != nil {
			return nil, err
		}
		links = append(links, SignatarioLinkDTO{
			ID: sgID, Nome: sg.Nome, Email: sg.Email, Token: tok,
			URL: s.publicURL("/contratos/assinatura/" + tok),
		})
	}
	if err := s.repo.UpdateContratoStatus(ctx, id, "Aguardando Assinatura"); err != nil {
		return nil, err
	}
	s.recordAudit(ctx, AuditContratoSolicitacaoAssinatura, id.String(), map[string]int{"signatarios": len(links)})
	return &SolicitarAssinaturaResult{SolicitacaoID: solID, Signatarios: links}, nil
}

func (s *ContratoService) GetCompartilhadoPublic(ctx context.Context, token string) (*ContratoCompartilhadoPublicDTO, error) {
	comp, err := s.repo.FindCompartilhamentoByToken(ctx, token)
	if err != nil {
		return nil, err
	}
	if comp == nil || time.Now().After(comp.ExpiraEm) {
		return nil, domainerrors.NewNotFoundError("compartilhamento", "token")
	}
	rec, err := s.repo.GetByID(ctx, comp.ContratoID)
	if err != nil || rec == nil || rec.DeletedAt != nil {
		return nil, domainerrors.NewNotFoundError("contrato", "")
	}
	return toCompartilhadoPublicDTO(rec, comp, token), nil
}

func (s *ContratoService) RecordAcessoCompartilhado(ctx context.Context, token, ip string) error {
	comp, err := s.repo.FindCompartilhamentoByToken(ctx, token)
	if err != nil || comp == nil {
		return domainerrors.NewNotFoundError("compartilhamento", "token")
	}
	if err := s.repo.RecordCompartilhamentoAcesso(ctx, comp.ID, ip); err != nil {
		return err
	}
	s.recordAudit(ctx, AuditContratoAcessoCompartilhado, comp.ContratoID.String(), nil)
	return nil
}

func (s *ContratoService) GetAssinaturaPublic(ctx context.Context, token string) (*ContratoAssinaturaPublicDTO, error) {
	sg, contrato, err := s.repo.FindSignatarioByToken(ctx, token)
	if err != nil {
		return nil, err
	}
	if sg == nil || contrato == nil || contrato.DeletedAt != nil {
		return nil, domainerrors.NewNotFoundError("assinatura", "token")
	}
	if sg.ExpiraEm != nil && time.Now().After(*sg.ExpiraEm) {
		return nil, domainerrors.NewBusinessRuleError("Link de assinatura expirado")
	}
	return toAssinaturaPublicDTO(contrato, sg, token), nil
}

func (s *ContratoService) AceitarAssinatura(ctx context.Context, token, observacoes, ip string) error {
	sg, contrato, err := s.repo.FindSignatarioByToken(ctx, token)
	if err != nil {
		return err
	}
	if sg == nil || contrato == nil || contrato.DeletedAt != nil {
		return domainerrors.NewNotFoundError("assinatura", "token")
	}
	if sg.Status == "Assinado" {
		return domainerrors.NewBusinessRuleError("Este signatário já assinou o documento")
	}
	if sg.ExpiraEm != nil && time.Now().After(*sg.ExpiraEm) {
		return domainerrors.NewBusinessRuleError("Link de assinatura expirado")
	}
	now := time.Now().UTC()
	if err := s.repo.UpdateSignatarioStatus(ctx, sg.ID, "Assinado", now, ip); err != nil {
		return err
	}
	pending, err := s.repo.CountSignatariosPendentes(ctx, sg.SolicitacaoID)
	if err != nil {
		return err
	}
	if pending == 0 {
		_ = s.repo.UpdateContratoStatus(ctx, contrato.ID, "Assinado")
	}
	s.recordAudit(ctx, AuditContratoAssinaturaAceite, contrato.ID.String(), map[string]string{
		"signatario": sg.Nome, "observacoes": strings.TrimSpace(observacoes),
	})
	return nil
}

func toContratoDTO(rec *repository.ContratoRecord, includeLegacyConteudo bool) ContratoDTO {
	dto := ContratoDTO{
		ID: rec.ID, Titulo: rec.Titulo, Tipo: rec.Tipo,
		PacienteID: rec.PacienteID, PacienteNome: rec.PacienteNome,
		ProfissionalID: rec.ProfissionalID, ProfissionalNome: rec.ProfissionalNome,
		Status: rec.Status, CriadoPor: rec.CriadoPor,
		CriadoEm: rec.CriadoEm.UTC().Format(time.RFC3339),
		AtualizadoEm: rec.AtualizadoEm.UTC().Format(time.RFC3339),
		TemArquivo: contratoHasArquivo(rec),
	}
	if contratoHasArquivo(rec) {
		dto.ArquivoNome = rec.ArquivoNome
		dto.ArquivoMime = rec.ArquivoMime
		dto.ArquivoTamanhoBytes = rec.ArquivoTamanhoBytes
	} else if includeLegacyConteudo {
		dto.Conteudo = rec.Conteudo
	}
	return dto
}

func toCompartilhadoPublicDTO(rec *repository.ContratoRecord, comp *repository.CompartilhamentoRecord, token string) *ContratoCompartilhadoPublicDTO {
	paciente := ""
	if rec.PacienteNome != nil {
		paciente = *rec.PacienteNome
	}
	dto := &ContratoCompartilhadoPublicDTO{
		Titulo: rec.Titulo, Tipo: rec.Tipo, Status: rec.Status,
		PacienteNome: paciente, PodeVisualizar: comp.PodeVisualizar, PodeBaixar: comp.PodeBaixar,
		ExpiraEm: comp.ExpiraEm.Format(time.RFC3339),
		TemArquivo: contratoHasArquivo(rec),
	}
	if contratoHasArquivo(rec) {
		dto.ArquivoNome = rec.ArquivoNome
		dto.ArquivoMime = rec.ArquivoMime
		dto.DownloadURL = "/contratos/compartilhado/" + token + "/arquivo"
	} else {
		dto.Conteudo = rec.Conteudo
	}
	return dto
}

func toAssinaturaPublicDTO(rec *repository.ContratoRecord, sg *repository.SignatarioRecord, token string) *ContratoAssinaturaPublicDTO {
	dto := &ContratoAssinaturaPublicDTO{
		SignatarioNome: sg.Nome, SignatarioEmail: sg.Email, SignatarioTipo: sg.Tipo,
		ContratoTitulo: rec.Titulo, ContratoTipo: rec.Tipo,
		StatusSignatario: sg.Status, JaAssinado: sg.Status == "Assinado",
		TemArquivo: contratoHasArquivo(rec),
	}
	if contratoHasArquivo(rec) {
		dto.ArquivoNome = rec.ArquivoNome
		dto.ArquivoMime = rec.ArquivoMime
		dto.DownloadURL = "/contratos/assinatura/" + token + "/arquivo"
	} else {
		dto.Conteudo = rec.Conteudo
	}
	return dto
}

func contratoHasArquivo(rec *repository.ContratoRecord) bool {
	return strings.TrimSpace(rec.StoragePath) != ""
}

func contratoHasDocumento(rec *repository.ContratoRecord) bool {
	return contratoHasArquivo(rec) || strings.TrimSpace(rec.Conteudo) != ""
}

func canEditContrato(status string) bool {
	return status == "Rascunho" || status == "Recusado"
}

func validateContratoMetadata(in ContratoInput) error {
	if strings.TrimSpace(in.Titulo) == "" {
		return domainerrors.NewValidationError("título é obrigatório")
	}
	allowed := map[string]bool{
		"Atendimento": true, "Prestação de Serviço": true, "Termo de Responsabilidade": true, "Outros": true,
	}
	if !allowed[in.Tipo] {
		return domainerrors.NewValidationError("tipo de contrato inválido")
	}
	return nil
}

func validateSignatario(sg SignatarioInput) error {
	if strings.TrimSpace(sg.Nome) == "" {
		return domainerrors.NewValidationError("nome do signatário é obrigatório")
	}
	if _, err := mail.ParseAddress(sg.Email); err != nil {
		return domainerrors.NewValidationError("e-mail do signatário inválido")
	}
	allowed := map[string]bool{"Paciente": true, "Responsável Legal": true, "Profissional": true, "Testemunha": true}
	if !allowed[sg.Tipo] {
		return domainerrors.NewValidationError("tipo de signatário inválido")
	}
	if sg.Tipo == "Responsável Legal" && strings.TrimSpace(sg.Parentesco) == "" {
		return domainerrors.NewValidationError("parentesco é obrigatório para Responsável Legal")
	}
	return nil
}

func secureToken(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func (s *ContratoService) publicURL(path string) string {
	if s.frontendURL == "" {
		return path
	}
	return s.frontendURL + path
}

func (s *ContratoService) recordAudit(ctx context.Context, action, entityID string, diff any) {
	idStr, name, role := requestcontext.ActorFromContext(ctx)
	actorID, _ := uuid.Parse(idStr)
	var raw json.RawMessage
	if diff != nil {
		raw, _ = json.Marshal(diff)
	}
	_ = RecordAuditHelper(ctx, s.audit, AuditLogInput{
		ActorID: actorID, ActorName: name, ActorRole: role,
		Acao: action, Entidade: AuditEntidadeContrato, EntidadeID: entityID, Diff: raw,
	})
}
