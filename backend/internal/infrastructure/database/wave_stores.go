
package database

import (
	"context"
	"time"

	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/domain/service"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WaveStores agrupa implementações de persistência Wave 2/3.
type WaveStores struct {
	Terapia             service.TerapiaStore
	Anamnese            service.AnamneseStore
	RespostaAnamnese    service.RespostaAnamneseStore
	CategoriaFinanceira service.CategoriaFinanceiraStore
	CentroCusto         service.CentroCustoStore
	Lancamento          service.LancamentoStore
	RelatorioOperacional service.RelatorioOperacionalStore
	FuncionarioCLT      service.FuncionarioCLTStore
	FuncionarioPJ       service.FuncionarioPJStore
	FolhaCLT            service.FolhaCLTStore
	FolhaPJ             service.FolhaPJStore
	ItemEstoque         service.ItemEstoqueStore
	MovimentacaoEstoque service.MovimentacaoEstoqueStore
	Inventario          service.InventarioStore
	Comodato            service.ComodatoStore
	PlanoSaude          service.PlanoSaudeStore
	AcaoJudicial        service.AcaoJudicialStore
	NotaFiscal          service.NotaFiscalStore
	Manual              service.ManualStore
	MaterialMarketing   service.MaterialMarketingStore
	ContaContabil       service.ContaContabilStore
	LancamentoContabil  service.LancamentoContabilStore
	AuditLog            service.AuditLogStore
}

func NewWaveStores(db *gorm.DB) WaveStores {
	return WaveStores{
		Terapia:              &terapiaStore{repo: NewPostgresTerapiaRepository(db)},
		Anamnese:             newAnamneseStore(db),
		RespostaAnamnese:     &respostaAnamneseStore{repo: NewPostgresRespostaAnamneseRepository(db)},
		CategoriaFinanceira:  newCategoriaStore(db),
		CentroCusto:          newCentroCustoStore(db),
		Lancamento:           newLancamentoStore(db),
		RelatorioOperacional: newRelatorioStore(db),
		FuncionarioCLT:       newFuncionarioCLTStore(db),
		FuncionarioPJ:        newFuncionarioPJStore(db),
		FolhaCLT:             newFolhaCLTStore(db),
		FolhaPJ:              newFolhaPJStore(db),
		ItemEstoque:          newItemEstoqueStore(db),
		MovimentacaoEstoque:  &movimentacaoStore{repo: NewPostgresMovimentacaoEstoqueRepository(db)},
		Inventario:           &inventarioStore{repo: NewPostgresInventarioRepository(db)},
		Comodato:             newComodatoStore(db),
		PlanoSaude:           newPlanoSaudeStore(db),
		AcaoJudicial:         newAcaoJudicialStore(db),
		NotaFiscal:           newNotaFiscalStore(db),
		Manual:               newManualStore(db),
		MaterialMarketing:    newMaterialMarketingStore(db),
		ContaContabil:        &contaContabilStore{repo: NewPostgresCodigoRepo(db)},
		LancamentoContabil:   newLancamentoContabilStore(db),
		AuditLog:             &auditLogStore{repo: NewPostgresAuditRepo(db)},
	}
}

func buildListResult[T any](items []T, total int64, filter repository.CRUDListFilter) *service.ListResult[T] {
	return &service.ListResult[T]{
		Items: items, Total: total, Page: filter.Page, PageSize: filter.PageSize,
		TotalPages: service.TotalPages(total, filter.PageSize),
	}
}

type terapiaStore struct{ repo *PostgresTerapiaRepository }

func (s *terapiaStore) Create(ctx context.Context, in service.TerapiaInput) (*service.TerapiaDTO, error) {
	now := time.Now().UTC()
	id := uuid.New()
	m, itens := buildTerapiaModel(id, in, now)
	if err := s.repo.Save(ctx, m, itens); err != nil { return nil, err }
	dto := toTerapiaDTO(m, itens)
	return &dto, nil
}
func (s *terapiaStore) GetByID(ctx context.Context, id uuid.UUID) (*service.TerapiaDTO, error) {
	m, itens, err := s.repo.FindByID(ctx, id)
	if err != nil || m == nil { return nil, err }
	dto := toTerapiaDTO(m, itens)
	return &dto, nil
}
func (s *terapiaStore) Update(ctx context.Context, id uuid.UUID, in service.TerapiaInput) (*service.TerapiaDTO, error) {
	existing, _, err := s.repo.FindByID(ctx, id)
	if err != nil { return nil, err }
	if existing == nil { return nil, nil }
	now := time.Now().UTC()
	m, itens := buildTerapiaModel(id, in, now)
	m.CreatedAt = existing.CreatedAt
	if err := s.repo.Update(ctx, m, itens); err != nil { return nil, err }
	dto := toTerapiaDTO(m, itens)
	return &dto, nil
}
func (s *terapiaStore) Delete(ctx context.Context, id uuid.UUID) error { return s.repo.Delete(ctx, id) }
func (s *terapiaStore) List(ctx context.Context, filter repository.CRUDListFilter) (*service.ListResult[service.TerapiaDTO], error) {
	models, total, err := s.repo.List(ctx, filter)
	if err != nil { return nil, err }
	items := make([]service.TerapiaDTO, 0, len(models))
	for _, m := range models {
		itens, _ := s.repo.ListItens(ctx, m.ID)
		items = append(items, toTerapiaDTO(m, itens))
	}
	return buildListResult(items, total, filter), nil
}

type respostaAnamneseStore struct{ repo *PostgresRespostaAnamneseRepository }

func (s *respostaAnamneseStore) Create(ctx context.Context, in service.RespostaAnamneseInput) (*service.RespostaAnamneseDTO, error) {
	now := time.Now().UTC()
	dh := now
	if in.DataHora != nil { dh = *in.DataHora }
	respostas, _ := marshalJSON(in.Respostas)
	m := &respostaAnamneseModel{
		ID: uuid.New(), QuestionnaireID: in.QuestionnaireID, QuestionnaireNome: in.QuestionnaireNome,
		PatientID: in.PatientID, PatientNome: in.PatientNome, EncounterID: in.EncounterID,
		Respostas: respostas, DataHora: dh, CreatedAt: now,
	}
	if err := s.repo.Save(ctx, m); err != nil { return nil, err }
	dto := toRespostaAnamneseDTO(m)
	return &dto, nil
}
func (s *respostaAnamneseStore) List(ctx context.Context, filter repository.CRUDListFilter, qid, pid *uuid.UUID) (*service.ListResult[service.RespostaAnamneseDTO], error) {
	models, total, err := s.repo.List(ctx, filter, qid, pid)
	if err != nil { return nil, err }
	items := make([]service.RespostaAnamneseDTO, 0, len(models))
	for _, m := range models { items = append(items, toRespostaAnamneseDTO(m)) }
	return buildListResult(items, total, filter), nil
}

type inventarioStore struct{ repo *PostgresInventarioRepository }

func (s *inventarioStore) Create(ctx context.Context, in service.InventarioInput) (*service.InventarioDTO, error) {
	now := time.Now().UTC()
	id := uuid.New()
	m := &inventarioModel{ID: id, Data: in.Data, ResponsavelID: in.ResponsavelID, ResponsavelNome: in.ResponsavelNome, Observacoes: in.Observacoes, CreatedAt: now}
	contagens := make([]inventarioContagemModel, 0, len(in.Contagens))
	for _, c := range in.Contagens {
		contagens = append(contagens, inventarioContagemModel{ID: uuid.New(), ItemID: c.ItemID, ItemNome: c.ItemNome, EstoqueSistema: c.EstoqueSistema, ContagemFisica: c.ContagemFisica})
	}
	if err := s.repo.Save(ctx, m, contagens); err != nil { return nil, err }
	dto := toInventarioDTO(m, contagens)
	return &dto, nil
}
func (s *inventarioStore) GetByID(ctx context.Context, id uuid.UUID) (*service.InventarioDTO, error) {
	m, c, err := s.repo.FindByID(ctx, id)
	if err != nil || m == nil { return nil, err }
	dto := toInventarioDTO(m, c)
	return &dto, nil
}
func (s *inventarioStore) Update(ctx context.Context, id uuid.UUID, in service.InventarioInput) (*service.InventarioDTO, error) {
	existing, _, err := s.repo.FindByID(ctx, id)
	if err != nil || existing == nil { return nil, err }
	m := &inventarioModel{ID: id, Data: in.Data, ResponsavelID: in.ResponsavelID, ResponsavelNome: in.ResponsavelNome, Observacoes: in.Observacoes, CreatedAt: existing.CreatedAt}
	contagens := make([]inventarioContagemModel, 0, len(in.Contagens))
	for _, c := range in.Contagens {
		contagens = append(contagens, inventarioContagemModel{ID: uuid.New(), ItemID: c.ItemID, ItemNome: c.ItemNome, EstoqueSistema: c.EstoqueSistema, ContagemFisica: c.ContagemFisica})
	}
	if err := s.repo.Update(ctx, m, contagens); err != nil { return nil, err }
	dto := toInventarioDTO(m, contagens)
	return &dto, nil
}
func (s *inventarioStore) Delete(ctx context.Context, id uuid.UUID) error { return s.repo.Delete(ctx, id) }
func (s *inventarioStore) List(ctx context.Context, filter repository.CRUDListFilter) (*service.ListResult[service.InventarioDTO], error) {
	models, total, err := s.repo.List(ctx, filter)
	if err != nil { return nil, err }
	items := make([]service.InventarioDTO, 0, len(models))
	for _, m := range models {
		_, c, _ := s.repo.FindByID(ctx, m.ID)
		items = append(items, toInventarioDTO(m, c))
	}
	return buildListResult(items, total, filter), nil
}

type movimentacaoStore struct{ repo *PostgresMovimentacaoEstoqueRepository }

func (s *movimentacaoStore) Create(ctx context.Context, in service.MovimentacaoEstoqueInput) (*service.MovimentacaoEstoqueDTO, error) {
	now := time.Now().UTC()
	dh := in.DataHora
	if dh.IsZero() { dh = now }
	m := &movimentacaoEstoqueModel{
		ID: uuid.New(), ItemID: in.ItemID, ItemNome: in.ItemNome, Tipo: in.Tipo, Quantidade: in.Quantidade,
		DataHora: dh, Documento: in.Documento, Motivo: in.Motivo,
		ResponsavelID: in.ResponsavelID, ResponsavelNome: in.ResponsavelNome, CreatedAt: now,
	}
	if in.Tipo == "Ajuste" { m.SaldoAtual = in.Quantidade }
	if err := s.repo.Save(ctx, m); err != nil { return nil, err }
	dto := toMovimentacaoDTO(m)
	return &dto, nil
}
func (s *movimentacaoStore) GetByID(ctx context.Context, id uuid.UUID) (*service.MovimentacaoEstoqueDTO, error) {
	m, err := s.repo.FindByID(ctx, id)
	if err != nil || m == nil { return nil, err }
	dto := toMovimentacaoDTO(m)
	return &dto, nil
}
func (s *movimentacaoStore) Delete(ctx context.Context, id uuid.UUID) error { return s.repo.Delete(ctx, id) }
func (s *movimentacaoStore) List(ctx context.Context, filter repository.CRUDListFilter, itemID *uuid.UUID) (*service.ListResult[service.MovimentacaoEstoqueDTO], error) {
	models, total, err := s.repo.List(ctx, filter, itemID)
	if err != nil { return nil, err }
	items := make([]service.MovimentacaoEstoqueDTO, 0, len(models))
	for _, m := range models { items = append(items, toMovimentacaoDTO(m)) }
	return buildListResult(items, total, filter), nil
}

type auditLogStore struct{ repo *PostgresAuditRepo }

func (s *auditLogStore) Append(ctx context.Context, in service.AuditLogInput) error {
	diff, _ := marshalJSON(in.Diff)
	m := &auditLogModel{
		ID: uuid.New(), ActorID: in.ActorID, ActorName: in.ActorName, ActorRole: in.ActorRole,
		Acao: in.Acao, Entidade: in.Entidade, EntidadeID: in.EntidadeID, Diff: diff,
		IP: in.IP, UserAgent: in.UserAgent, TimestampUTC: time.Now().UTC(),
	}
	return s.repo.Append(ctx, m)
}
func (s *auditLogStore) List(ctx context.Context, filter repository.CRUDListFilter) (*service.ListResult[service.AuditLogDTO], error) {
	models, total, err := s.repo.List(ctx, filter)
	if err != nil { return nil, err }
	items := make([]service.AuditLogDTO, 0, len(models))
	for _, m := range models { items = append(items, toAuditLogDTO(m)) }
	return buildListResult(items, total, filter), nil
}

type contaContabilStore struct{ repo *PostgresCodigoRepo }

func (s *contaContabilStore) Create(ctx context.Context, in service.ContaContabilInput) (*service.ContaContabilDTO, error) {
	m := &contaContabilModel{Codigo: in.Codigo, Nome: in.Nome, Tipo: in.Tipo, Natureza: in.Natureza, Pai: in.Pai}
	if err := s.repo.Save(ctx, m); err != nil { return nil, err }
	dto := toContaContabilDTO(m)
	return &dto, nil
}
func (s *contaContabilStore) GetByCodigo(ctx context.Context, codigo string) (*service.ContaContabilDTO, error) {
	m, err := s.repo.FindByCodigo(ctx, codigo)
	if err != nil || m == nil { return nil, err }
	dto := toContaContabilDTO(m)
	return &dto, nil
}
func (s *contaContabilStore) Update(ctx context.Context, codigo string, in service.ContaContabilInput) (*service.ContaContabilDTO, error) {
	m := &contaContabilModel{Codigo: codigo, Nome: in.Nome, Tipo: in.Tipo, Natureza: in.Natureza, Pai: in.Pai}
	if err := s.repo.Update(ctx, m); err != nil { return nil, err }
	dto := toContaContabilDTO(m)
	return &dto, nil
}
func (s *contaContabilStore) Delete(ctx context.Context, codigo string) error { return s.repo.Delete(ctx, codigo) }
func (s *contaContabilStore) List(ctx context.Context, filter repository.CRUDListFilter) (*service.ListResult[service.ContaContabilDTO], error) {
	models, total, err := s.repo.List(ctx, filter)
	if err != nil { return nil, err }
	items := make([]service.ContaContabilDTO, 0, len(models))
	for _, m := range models { items = append(items, toContaContabilDTO(m)) }
	return buildListResult(items, total, filter), nil
}
