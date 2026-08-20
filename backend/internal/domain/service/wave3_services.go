package service

import (
	"context"
	"log/slog"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/infrastructure/storage"

	"github.com/google/uuid"
)

// genericCRUDService helper embedded pattern for Wave 3 modules.

type FuncionarioCLTService struct {
	store  FuncionarioCLTStore
	logger *slog.Logger
}

func NewFuncionarioCLTService(store FuncionarioCLTStore, logger *slog.Logger) *FuncionarioCLTService {
	return &FuncionarioCLTService{store: store, logger: logger}
}

func (s *FuncionarioCLTService) Create(ctx context.Context, in FuncionarioCLTInput) (*FuncionarioCLTDTO, error) {
	out, err := s.store.Create(ctx, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "funcionario_clt", "create", out.ID)
	return out, nil
}

func (s *FuncionarioCLTService) GetByID(ctx context.Context, id uuid.UUID) (*FuncionarioCLTDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if out == nil {
		return nil, notFound("FuncionarioCLT", id)
	}
	return out, nil
}

func (s *FuncionarioCLTService) Update(ctx context.Context, id uuid.UUID, in FuncionarioCLTInput) (*FuncionarioCLTDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.Update(ctx, id, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "funcionario_clt", "update", id)
	return out, nil
}

func (s *FuncionarioCLTService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := requireID(id); err != nil {
		return err
	}
	if err := s.store.Delete(ctx, id); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "funcionario_clt", "delete", id)
	return nil
}

func (s *FuncionarioCLTService) List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[FuncionarioCLTDTO], error) {
	return s.store.List(ctx, normalizeCRUDFilter(filter))
}

type FuncionarioPJService struct {
	store  FuncionarioPJStore
	logger *slog.Logger
}

func NewFuncionarioPJService(store FuncionarioPJStore, logger *slog.Logger) *FuncionarioPJService {
	return &FuncionarioPJService{store: store, logger: logger}
}

func (s *FuncionarioPJService) Create(ctx context.Context, in FuncionarioPJInput) (*FuncionarioPJDTO, error) {
	out, err := s.store.Create(ctx, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "funcionario_pj", "create", out.ID)
	return out, nil
}

func (s *FuncionarioPJService) GetByID(ctx context.Context, id uuid.UUID) (*FuncionarioPJDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if out == nil {
		return nil, notFound("FuncionarioPJ", id)
	}
	return out, nil
}

func (s *FuncionarioPJService) Update(ctx context.Context, id uuid.UUID, in FuncionarioPJInput) (*FuncionarioPJDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.Update(ctx, id, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "funcionario_pj", "update", id)
	return out, nil
}

func (s *FuncionarioPJService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := requireID(id); err != nil {
		return err
	}
	if err := s.store.Delete(ctx, id); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "funcionario_pj", "delete", id)
	return nil
}

func (s *FuncionarioPJService) List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[FuncionarioPJDTO], error) {
	return s.store.List(ctx, normalizeCRUDFilter(filter))
}

type FolhaCLTService struct {
	store  FolhaCLTStore
	logger *slog.Logger
}

func NewFolhaCLTService(store FolhaCLTStore, logger *slog.Logger) *FolhaCLTService {
	return &FolhaCLTService{store: store, logger: logger}
}

func (s *FolhaCLTService) Create(ctx context.Context, in FolhaCLTInput) (*FolhaCLTDTO, error) {
	out, err := s.store.Create(ctx, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "folha_clt", "create", out.ID)
	return out, nil
}

func (s *FolhaCLTService) GetByID(ctx context.Context, id uuid.UUID) (*FolhaCLTDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if out == nil {
		return nil, notFound("FolhaCLT", id)
	}
	return out, nil
}

func (s *FolhaCLTService) Update(ctx context.Context, id uuid.UUID, in FolhaCLTInput) (*FolhaCLTDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.Update(ctx, id, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "folha_clt", "update", id)
	return out, nil
}

func (s *FolhaCLTService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := requireID(id); err != nil {
		return err
	}
	if err := s.store.Delete(ctx, id); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "folha_clt", "delete", id)
	return nil
}

func (s *FolhaCLTService) List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[FolhaCLTDTO], error) {
	return s.store.List(ctx, normalizeCRUDFilter(filter))
}

type FolhaPJService struct {
	store  FolhaPJStore
	logger *slog.Logger
}

func NewFolhaPJService(store FolhaPJStore, logger *slog.Logger) *FolhaPJService {
	return &FolhaPJService{store: store, logger: logger}
}

func (s *FolhaPJService) Create(ctx context.Context, in FolhaPJInput) (*FolhaPJDTO, error) {
	out, err := s.store.Create(ctx, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "folha_pj", "create", out.ID)
	return out, nil
}

func (s *FolhaPJService) GetByID(ctx context.Context, id uuid.UUID) (*FolhaPJDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if out == nil {
		return nil, notFound("FolhaPJ", id)
	}
	return out, nil
}

func (s *FolhaPJService) Update(ctx context.Context, id uuid.UUID, in FolhaPJInput) (*FolhaPJDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.Update(ctx, id, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "folha_pj", "update", id)
	return out, nil
}

func (s *FolhaPJService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := requireID(id); err != nil {
		return err
	}
	if err := s.store.Delete(ctx, id); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "folha_pj", "delete", id)
	return nil
}

func (s *FolhaPJService) List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[FolhaPJDTO], error) {
	return s.store.List(ctx, normalizeCRUDFilter(filter))
}

type ItemEstoqueService struct {
	store  ItemEstoqueStore
	logger *slog.Logger
}

func NewItemEstoqueService(store ItemEstoqueStore, logger *slog.Logger) *ItemEstoqueService {
	return &ItemEstoqueService{store: store, logger: logger}
}

func (s *ItemEstoqueService) Create(ctx context.Context, in ItemEstoqueInput) (*ItemEstoqueDTO, error) {
	out, err := s.store.Create(ctx, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "item_estoque", "create", out.ID)
	return out, nil
}

func (s *ItemEstoqueService) GetByID(ctx context.Context, id uuid.UUID) (*ItemEstoqueDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if out == nil {
		return nil, notFound("ItemEstoque", id)
	}
	return out, nil
}

func (s *ItemEstoqueService) Update(ctx context.Context, id uuid.UUID, in ItemEstoqueInput) (*ItemEstoqueDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.Update(ctx, id, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "item_estoque", "update", id)
	return out, nil
}

func (s *ItemEstoqueService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := requireID(id); err != nil {
		return err
	}
	if err := s.store.Delete(ctx, id); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "item_estoque", "delete", id)
	return nil
}

func (s *ItemEstoqueService) List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[ItemEstoqueDTO], error) {
	return s.store.List(ctx, normalizeCRUDFilter(filter))
}

type MovimentacaoEstoqueService struct {
	store  MovimentacaoEstoqueStore
	logger *slog.Logger
}

func NewMovimentacaoEstoqueService(store MovimentacaoEstoqueStore, logger *slog.Logger) *MovimentacaoEstoqueService {
	return &MovimentacaoEstoqueService{store: store, logger: logger}
}

func (s *MovimentacaoEstoqueService) Create(ctx context.Context, in MovimentacaoEstoqueInput) (*MovimentacaoEstoqueDTO, error) {
	out, err := s.store.Create(ctx, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "movimentacao_estoque", "create", out.ID)
	return out, nil
}

func (s *MovimentacaoEstoqueService) GetByID(ctx context.Context, id uuid.UUID) (*MovimentacaoEstoqueDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if out == nil {
		return nil, notFound("MovimentacaoEstoque", id)
	}
	return out, nil
}

func (s *MovimentacaoEstoqueService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := requireID(id); err != nil {
		return err
	}
	if err := s.store.Delete(ctx, id); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "movimentacao_estoque", "delete", id)
	return nil
}

func (s *MovimentacaoEstoqueService) List(ctx context.Context, filter repository.CRUDListFilter, itemID *uuid.UUID) (*ListResult[MovimentacaoEstoqueDTO], error) {
	return s.store.List(ctx, normalizeCRUDFilter(filter), itemID)
}

type InventarioService struct {
	store  InventarioStore
	logger *slog.Logger
}

func NewInventarioService(store InventarioStore, logger *slog.Logger) *InventarioService {
	return &InventarioService{store: store, logger: logger}
}

func (s *InventarioService) Create(ctx context.Context, in InventarioInput) (*InventarioDTO, error) {
	out, err := s.store.Create(ctx, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "inventario", "create", out.ID)
	return out, nil
}

func (s *InventarioService) GetByID(ctx context.Context, id uuid.UUID) (*InventarioDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if out == nil {
		return nil, notFound("Inventario", id)
	}
	return out, nil
}

func (s *InventarioService) Update(ctx context.Context, id uuid.UUID, in InventarioInput) (*InventarioDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.Update(ctx, id, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "inventario", "update", id)
	return out, nil
}

func (s *InventarioService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := requireID(id); err != nil {
		return err
	}
	if err := s.store.Delete(ctx, id); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "inventario", "delete", id)
	return nil
}

func (s *InventarioService) List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[InventarioDTO], error) {
	return s.store.List(ctx, normalizeCRUDFilter(filter))
}

type ComodatoService struct {
	store  ComodatoStore
	logger *slog.Logger
}

func NewComodatoService(store ComodatoStore, logger *slog.Logger) *ComodatoService {
	return &ComodatoService{store: store, logger: logger}
}

func (s *ComodatoService) Create(ctx context.Context, in ComodatoInput) (*ComodatoDTO, error) {
	out, err := s.store.Create(ctx, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "comodato", "create", out.ID)
	return out, nil
}

func (s *ComodatoService) GetByID(ctx context.Context, id uuid.UUID) (*ComodatoDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if out == nil {
		return nil, notFound("Comodato", id)
	}
	return out, nil
}

func (s *ComodatoService) Update(ctx context.Context, id uuid.UUID, in ComodatoInput) (*ComodatoDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.Update(ctx, id, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "comodato", "update", id)
	return out, nil
}

func (s *ComodatoService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := requireID(id); err != nil {
		return err
	}
	if err := s.store.Delete(ctx, id); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "comodato", "delete", id)
	return nil
}

func (s *ComodatoService) List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[ComodatoDTO], error) {
	return s.store.List(ctx, normalizeCRUDFilter(filter))
}

type PlanoSaudeService struct {
	store  PlanoSaudeStore
	logger *slog.Logger
}

func NewPlanoSaudeService(store PlanoSaudeStore, logger *slog.Logger) *PlanoSaudeService {
	return &PlanoSaudeService{store: store, logger: logger}
}

func (s *PlanoSaudeService) Create(ctx context.Context, in PlanoSaudeInput) (*PlanoSaudeDTO, error) {
	out, err := s.store.Create(ctx, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "plano_saude", "create", out.ID)
	return out, nil
}

func (s *PlanoSaudeService) GetByID(ctx context.Context, id uuid.UUID) (*PlanoSaudeDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if out == nil {
		return nil, notFound("PlanoSaude", id)
	}
	return out, nil
}

func (s *PlanoSaudeService) Update(ctx context.Context, id uuid.UUID, in PlanoSaudeInput) (*PlanoSaudeDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.Update(ctx, id, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "plano_saude", "update", id)
	return out, nil
}

func (s *PlanoSaudeService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := requireID(id); err != nil {
		return err
	}
	if err := s.store.Delete(ctx, id); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "plano_saude", "delete", id)
	return nil
}

func (s *PlanoSaudeService) List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[PlanoSaudeDTO], error) {
	return s.store.List(ctx, normalizeCRUDFilter(filter))
}

type AcaoJudicialService struct {
	store  AcaoJudicialStore
	logger *slog.Logger
}

func NewAcaoJudicialService(store AcaoJudicialStore, logger *slog.Logger) *AcaoJudicialService {
	return &AcaoJudicialService{store: store, logger: logger}
}

func (s *AcaoJudicialService) Create(ctx context.Context, in AcaoJudicialInput) (*AcaoJudicialDTO, error) {
	out, err := s.store.Create(ctx, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "acao_judicial", "create", out.ID)
	return out, nil
}

func (s *AcaoJudicialService) GetByID(ctx context.Context, id uuid.UUID) (*AcaoJudicialDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if out == nil {
		return nil, notFound("AcaoJudicial", id)
	}
	return out, nil
}

func (s *AcaoJudicialService) Update(ctx context.Context, id uuid.UUID, in AcaoJudicialInput) (*AcaoJudicialDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.Update(ctx, id, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "acao_judicial", "update", id)
	return out, nil
}

func (s *AcaoJudicialService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := requireID(id); err != nil {
		return err
	}
	if err := s.store.Delete(ctx, id); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "acao_judicial", "delete", id)
	return nil
}

func (s *AcaoJudicialService) List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[AcaoJudicialDTO], error) {
	return s.store.List(ctx, normalizeCRUDFilter(filter))
}

type NotaFiscalService struct {
	store  NotaFiscalStore
	logger *slog.Logger
}

func NewNotaFiscalService(store NotaFiscalStore, logger *slog.Logger) *NotaFiscalService {
	return &NotaFiscalService{store: store, logger: logger}
}

func (s *NotaFiscalService) Create(ctx context.Context, in NotaFiscalInput) (*NotaFiscalDTO, error) {
	out, err := s.store.Create(ctx, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "nota_fiscal", "create", out.ID)
	return out, nil
}

func (s *NotaFiscalService) GetByID(ctx context.Context, id uuid.UUID) (*NotaFiscalDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if out == nil {
		return nil, notFound("NotaFiscal", id)
	}
	return out, nil
}

func (s *NotaFiscalService) Update(ctx context.Context, id uuid.UUID, in NotaFiscalInput) (*NotaFiscalDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.Update(ctx, id, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "nota_fiscal", "update", id)
	return out, nil
}

func (s *NotaFiscalService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := requireID(id); err != nil {
		return err
	}
	if err := s.store.Delete(ctx, id); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "nota_fiscal", "delete", id)
	return nil
}

func (s *NotaFiscalService) List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[NotaFiscalDTO], error) {
	return s.store.List(ctx, normalizeCRUDFilter(filter))
}

type ManualService struct {
	store     ManualStore
	fileStore *storage.LocalStorage
	policy    UploadPolicy
	logger    *slog.Logger
}

func NewManualService(store ManualStore, fileStore *storage.LocalStorage, policy UploadPolicy, logger *slog.Logger) *ManualService {
	return &ManualService{store: store, fileStore: fileStore, policy: policy, logger: logger}
}

func (s *ManualService) Create(ctx context.Context, in ManualInput) (*ManualDTO, error) {
	out, err := s.store.Create(ctx, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "manual", "create", out.ID)
	return out, nil
}

func (s *ManualService) GetByID(ctx context.Context, id uuid.UUID) (*ManualDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if out == nil {
		return nil, notFound("Manual", id)
	}
	return out, nil
}

func (s *ManualService) Update(ctx context.Context, id uuid.UUID, in ManualInput) (*ManualDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.Update(ctx, id, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "manual", "update", id)
	return out, nil
}

func (s *ManualService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := requireID(id); err != nil {
		return err
	}
	var storagePath string
	if existing, err := s.store.GetByID(ctx, id); err == nil && existing != nil {
		storagePath = existing.ArquivoURL
	}
	if err := s.store.Delete(ctx, id); err != nil {
		return err
	}
	if storagePath != "" && s.fileStore != nil {
		_ = s.fileStore.RemoveRelative(storagePath)
	}
	LogMutation(ctx, s.logger, "manual", "delete", id)
	return nil
}

func (s *ManualService) List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[ManualDTO], error) {
	return s.store.List(ctx, normalizeCRUDFilter(filter))
}

type MaterialMarketingService struct {
	store     MaterialMarketingStore
	fileStore *storage.LocalStorage
	policy    UploadPolicy
	logger    *slog.Logger
}

func NewMaterialMarketingService(store MaterialMarketingStore, fileStore *storage.LocalStorage, policy UploadPolicy, logger *slog.Logger) *MaterialMarketingService {
	return &MaterialMarketingService{store: store, fileStore: fileStore, policy: policy, logger: logger}
}

func (s *MaterialMarketingService) Create(ctx context.Context, in MaterialMarketingInput) (*MaterialMarketingDTO, error) {
	out, err := s.store.Create(ctx, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "material_marketing", "create", out.ID)
	return out, nil
}

func (s *MaterialMarketingService) GetByID(ctx context.Context, id uuid.UUID) (*MaterialMarketingDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if out == nil {
		return nil, notFound("MaterialMarketing", id)
	}
	return out, nil
}

func (s *MaterialMarketingService) Update(ctx context.Context, id uuid.UUID, in MaterialMarketingInput) (*MaterialMarketingDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.Update(ctx, id, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "material_marketing", "update", id)
	return out, nil
}

func (s *MaterialMarketingService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := requireID(id); err != nil {
		return err
	}
	var storagePath string
	if existing, err := s.store.GetByID(ctx, id); err == nil && existing != nil {
		storagePath = existing.ArquivoURL
	}
	if err := s.store.Delete(ctx, id); err != nil {
		return err
	}
	if storagePath != "" && s.fileStore != nil {
		_ = s.fileStore.RemoveRelative(storagePath)
	}
	LogMutation(ctx, s.logger, "material_marketing", "delete", id)
	return nil
}

func (s *MaterialMarketingService) List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[MaterialMarketingDTO], error) {
	return s.store.List(ctx, normalizeCRUDFilter(filter))
}

type ContaContabilService struct {
	store  ContaContabilStore
	logger *slog.Logger
}

func NewContaContabilService(store ContaContabilStore, logger *slog.Logger) *ContaContabilService {
	return &ContaContabilService{store: store, logger: logger}
}

func (s *ContaContabilService) Create(ctx context.Context, in ContaContabilInput) (*ContaContabilDTO, error) {
	out, err := s.store.Create(ctx, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "conta_contabil", "create", uuid.Nil, slog.String("codigo", out.Codigo))
	return out, nil
}

func (s *ContaContabilService) GetByCodigo(ctx context.Context, codigo string) (*ContaContabilDTO, error) {
	out, err := s.store.GetByCodigo(ctx, codigo)
	if err != nil {
		return nil, err
	}
	if out == nil {
		return nil, domainerrors.NewNotFoundError("ContaContabil", codigo)
	}
	return out, nil
}

func (s *ContaContabilService) Update(ctx context.Context, codigo string, in ContaContabilInput) (*ContaContabilDTO, error) {
	out, err := s.store.Update(ctx, codigo, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "conta_contabil", "update", uuid.Nil, slog.String("codigo", codigo))
	return out, nil
}

func (s *ContaContabilService) Delete(ctx context.Context, codigo string) error {
	if err := s.store.Delete(ctx, codigo); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "conta_contabil", "delete", uuid.Nil, slog.String("codigo", codigo))
	return nil
}

func (s *ContaContabilService) List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[ContaContabilDTO], error) {
	return s.store.List(ctx, normalizeCRUDFilter(filter))
}

type LancamentoContabilService struct {
	store  LancamentoContabilStore
	logger *slog.Logger
}

func NewLancamentoContabilService(store LancamentoContabilStore, logger *slog.Logger) *LancamentoContabilService {
	return &LancamentoContabilService{store: store, logger: logger}
}

func (s *LancamentoContabilService) Create(ctx context.Context, in LancamentoContabilInput) (*LancamentoContabilDTO, error) {
	out, err := s.store.Create(ctx, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "lancamento_contabil", "create", out.ID)
	return out, nil
}

func (s *LancamentoContabilService) GetByID(ctx context.Context, id uuid.UUID) (*LancamentoContabilDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if out == nil {
		return nil, notFound("LancamentoContabil", id)
	}
	return out, nil
}

func (s *LancamentoContabilService) Update(ctx context.Context, id uuid.UUID, in LancamentoContabilInput) (*LancamentoContabilDTO, error) {
	if err := requireID(id); err != nil {
		return nil, err
	}
	out, err := s.store.Update(ctx, id, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "lancamento_contabil", "update", id)
	return out, nil
}

func (s *LancamentoContabilService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := requireID(id); err != nil {
		return err
	}
	if err := s.store.Delete(ctx, id); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "lancamento_contabil", "delete", id)
	return nil
}

func (s *LancamentoContabilService) List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[LancamentoContabilDTO], error) {
	return s.store.List(ctx, normalizeCRUDFilter(filter))
}
