package service

import (
	"context"
	"log/slog"
	"strings"
	"time"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
)

func newListResult[T any](items []T, total int64, page, pageSize int) *ListResult[T] {
	return &ListResult[T]{
		Items:      items,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: TotalPages(total, pageSize),
	}
}

func normalizeCRUDFilter(f repository.CRUDListFilter) repository.CRUDListFilter {
	f.Page, f.PageSize = NormalizePagination(f.Page, f.PageSize)
	f.Query = strings.TrimSpace(f.Query)
	return f
}

func requireID(id uuid.UUID) error {
	if id == uuid.Nil {
		return domainerrors.NewRequiredFieldError("id")
	}
	return nil
}

func notFound(entity string, id uuid.UUID) error {
	return domainerrors.NewNotFoundError(entity, id.String())
}

// ── Terapias ──────────────────────────────────────────────────────────────

type TerapiaService struct {
	store  TerapiaStore
	logger *slog.Logger
}

func NewTerapiaService(store TerapiaStore, logger *slog.Logger) *TerapiaService {
	return &TerapiaService{store: store, logger: logger}
}

// Create cadastra tratamento com itens de regime terapêutico.
func (s *TerapiaService) Create(ctx context.Context, in TerapiaInput) (*TerapiaDTO, error) {
	if len(in.ItensRegime) == 0 {
		return nil, domainerrors.NewValidationError("É necessário pelo menos um item no regime")
	}
	out, err := s.store.Create(ctx, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "terapia", "create", out.ID)
	return out, nil
}

// GetByID retorna tratamento com itens aninhados.
func (s *TerapiaService) GetByID(ctx context.Context, id uuid.UUID) (*TerapiaDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if out == nil {
		return nil, notFound("Terapia", id)
	}
	return out, nil
}

// Update atualiza tratamento e substitui itens de regime.
func (s *TerapiaService) Update(ctx context.Context, id uuid.UUID, in TerapiaInput) (*TerapiaDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.Update(ctx, id, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "terapia", "update", id)
	return out, nil
}

// Delete remove tratamento e itens associados.
func (s *TerapiaService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := requireID(id); err != nil {
		return err
	}
	if err := s.store.Delete(ctx, id); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "terapia", "delete", id)
	return nil
}

// List lista tratamentos paginados.
func (s *TerapiaService) List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[TerapiaDTO], error) {
	return s.store.List(ctx, normalizeCRUDFilter(filter))
}

// ── Anamneses ────────────────────────────────────────────────────────────────

type AnamneseService struct {
	store  AnamneseStore
	logger *slog.Logger
}

func NewAnamneseService(store AnamneseStore, logger *slog.Logger) *AnamneseService {
	return &AnamneseService{store: store, logger: logger}
}

// Create cadastra template de anamnese.
func (s *AnamneseService) Create(ctx context.Context, in AnamneseInput) (*AnamneseDTO, error) {
	out, err := s.store.Create(ctx, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "anamnese", "create", out.ID)
	return out, nil
}

func (s *AnamneseService) GetByID(ctx context.Context, id uuid.UUID) (*AnamneseDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if out == nil {
		return nil, notFound("Anamnese", id)
	}
	return out, nil
}

func (s *AnamneseService) Update(ctx context.Context, id uuid.UUID, in AnamneseInput) (*AnamneseDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.Update(ctx, id, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "anamnese", "update", id)
	return out, nil
}

func (s *AnamneseService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := requireID(id); err != nil {
		return err
	}
	if err := s.store.Delete(ctx, id); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "anamnese", "delete", id)
	return nil
}

func (s *AnamneseService) List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[AnamneseDTO], error) {
	return s.store.List(ctx, normalizeCRUDFilter(filter))
}

// ── Respostas Anamnese ───────────────────────────────────────────────────────

type RespostaAnamneseService struct {
	store  RespostaAnamneseStore
	logger *slog.Logger
}

func NewRespostaAnamneseService(store RespostaAnamneseStore, logger *slog.Logger) *RespostaAnamneseService {
	return &RespostaAnamneseService{store: store, logger: logger}
}

// Create registra resposta preenchida de anamnese.
func (s *RespostaAnamneseService) Create(ctx context.Context, in RespostaAnamneseInput) (*RespostaAnamneseDTO, error) {
	out, err := s.store.Create(ctx, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "resposta_anamnese", "create", out.ID)
	return out, nil
}

// List lista respostas com filtros opcionais.
func (s *RespostaAnamneseService) List(ctx context.Context, filter repository.CRUDListFilter, questionnaireID, patientID *uuid.UUID) (*ListResult[RespostaAnamneseDTO], error) {
	return s.store.List(ctx, normalizeCRUDFilter(filter), questionnaireID, patientID)
}

// ── Financeiro ───────────────────────────────────────────────────────────────

type CategoriaFinanceiraService struct {
	store  CategoriaFinanceiraStore
	logger *slog.Logger
}

func NewCategoriaFinanceiraService(store CategoriaFinanceiraStore, logger *slog.Logger) *CategoriaFinanceiraService {
	return &CategoriaFinanceiraService{store: store, logger: logger}
}

func (s *CategoriaFinanceiraService) Create(ctx context.Context, in CategoriaFinanceiraInput) (*CategoriaFinanceiraDTO, error) {
	out, err := s.store.Create(ctx, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "categoria_financeira", "create", out.ID)
	return out, nil
}

func (s *CategoriaFinanceiraService) GetByID(ctx context.Context, id uuid.UUID) (*CategoriaFinanceiraDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if out == nil {
		return nil, notFound("CategoriaFinanceira", id)
	}
	return out, nil
}

func (s *CategoriaFinanceiraService) Update(ctx context.Context, id uuid.UUID, in CategoriaFinanceiraInput) (*CategoriaFinanceiraDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.Update(ctx, id, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "categoria_financeira", "update", id)
	return out, nil
}

func (s *CategoriaFinanceiraService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := requireID(id); err != nil {
		return err
	}
	if err := s.store.Delete(ctx, id); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "categoria_financeira", "delete", id)
	return nil
}

func (s *CategoriaFinanceiraService) List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[CategoriaFinanceiraDTO], error) {
	return s.store.List(ctx, normalizeCRUDFilter(filter))
}

type CentroCustoService struct {
	store  CentroCustoStore
	logger *slog.Logger
}

func NewCentroCustoService(store CentroCustoStore, logger *slog.Logger) *CentroCustoService {
	return &CentroCustoService{store: store, logger: logger}
}

func (s *CentroCustoService) Create(ctx context.Context, in CentroCustoInput) (*CentroCustoDTO, error) {
	out, err := s.store.Create(ctx, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "centro_custo", "create", out.ID)
	return out, nil
}

func (s *CentroCustoService) GetByID(ctx context.Context, id uuid.UUID) (*CentroCustoDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if out == nil {
		return nil, notFound("CentroCusto", id)
	}
	return out, nil
}

func (s *CentroCustoService) Update(ctx context.Context, id uuid.UUID, in CentroCustoInput) (*CentroCustoDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.Update(ctx, id, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "centro_custo", "update", id)
	return out, nil
}

func (s *CentroCustoService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := requireID(id); err != nil {
		return err
	}
	if err := s.store.Delete(ctx, id); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "centro_custo", "delete", id)
	return nil
}

func (s *CentroCustoService) List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[CentroCustoDTO], error) {
	return s.store.List(ctx, normalizeCRUDFilter(filter))
}

type LancamentoService struct {
	store  LancamentoStore
	logger *slog.Logger
}

func NewLancamentoService(store LancamentoStore, logger *slog.Logger) *LancamentoService {
	return &LancamentoService{store: store, logger: logger}
}

func (s *LancamentoService) Create(ctx context.Context, in LancamentoInput) (*LancamentoDTO, error) {
	out, err := s.store.Create(ctx, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "lancamento", "create", out.ID)
	return out, nil
}

func (s *LancamentoService) GetByID(ctx context.Context, id uuid.UUID) (*LancamentoDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if out == nil {
		return nil, notFound("Lancamento", id)
	}
	return out, nil
}

func (s *LancamentoService) Update(ctx context.Context, id uuid.UUID, in LancamentoInput) (*LancamentoDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.Update(ctx, id, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "lancamento", "update", id)
	return out, nil
}

func (s *LancamentoService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := requireID(id); err != nil {
		return err
	}
	if err := s.store.Delete(ctx, id); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "lancamento", "delete", id)
	return nil
}

func (s *LancamentoService) List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[LancamentoDTO], error) {
	return s.store.List(ctx, normalizeCRUDFilter(filter))
}

type RelatorioOperacionalService struct {
	store  RelatorioOperacionalStore
	logger *slog.Logger
}

func NewRelatorioOperacionalService(store RelatorioOperacionalStore, logger *slog.Logger) *RelatorioOperacionalService {
	return &RelatorioOperacionalService{store: store, logger: logger}
}

func (s *RelatorioOperacionalService) Create(ctx context.Context, in RelatorioOperacionalInput) (*RelatorioOperacionalDTO, error) {
	out, err := s.store.Create(ctx, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "relatorio_operacional", "create", out.ID)
	return out, nil
}

func (s *RelatorioOperacionalService) GetByID(ctx context.Context, id uuid.UUID) (*RelatorioOperacionalDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if out == nil {
		return nil, notFound("RelatorioOperacional", id)
	}
	return out, nil
}

func (s *RelatorioOperacionalService) Update(ctx context.Context, id uuid.UUID, in RelatorioOperacionalInput) (*RelatorioOperacionalDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.Update(ctx, id, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "relatorio_operacional", "update", id)
	return out, nil
}

func (s *RelatorioOperacionalService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := requireID(id); err != nil {
		return err
	}
	if err := s.store.Delete(ctx, id); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "relatorio_operacional", "delete", id)
	return nil
}

func (s *RelatorioOperacionalService) List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[RelatorioOperacionalDTO], error) {
	return s.store.List(ctx, normalizeCRUDFilter(filter))
}

// AuditService expõe leitura admin e helper interno de escrita.
type AuditService struct {
	store  AuditLogStore
	logger *slog.Logger
}

func NewAuditService(store AuditLogStore, logger *slog.Logger) *AuditService {
	return &AuditService{store: store, logger: logger}
}

// Record registra evento de auditoria (somente uso interno).
func (s *AuditService) Record(ctx context.Context, in AuditLogInput) error {
	if in.ActorID == uuid.Nil {
		return domainerrors.NewRequiredFieldError("actor_id")
	}
	if strings.TrimSpace(in.Acao) == "" {
		return domainerrors.NewRequiredFieldError("acao")
	}
	return s.store.Append(ctx, in)
}

// List lista trilha de auditoria (admin).
func (s *AuditService) List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[AuditLogDTO], error) {
	return s.store.List(ctx, normalizeCRUDFilter(filter))
}

// nowUTC helper for stores.
func nowUTC() time.Time { return time.Now().UTC() }
