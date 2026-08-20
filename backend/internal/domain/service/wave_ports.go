package service

import (
	"context"

	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
)

// TerapiaStore persiste tratamentos e itens de regime.
type TerapiaStore interface {
	Create(ctx context.Context, in TerapiaInput) (*TerapiaDTO, error)
	GetByID(ctx context.Context, id uuid.UUID) (*TerapiaDTO, error)
	Update(ctx context.Context, id uuid.UUID, in TerapiaInput) (*TerapiaDTO, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[TerapiaDTO], error)
}

// AnamneseStore templates de anamnese.
type AnamneseStore interface {
	Create(ctx context.Context, in AnamneseInput) (*AnamneseDTO, error)
	GetByID(ctx context.Context, id uuid.UUID) (*AnamneseDTO, error)
	Update(ctx context.Context, id uuid.UUID, in AnamneseInput) (*AnamneseDTO, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[AnamneseDTO], error)
}

// RespostaAnamneseStore respostas preenchidas.
type RespostaAnamneseStore interface {
	Create(ctx context.Context, in RespostaAnamneseInput) (*RespostaAnamneseDTO, error)
	List(ctx context.Context, filter repository.CRUDListFilter, questionnaireID, patientID *uuid.UUID) (*ListResult[RespostaAnamneseDTO], error)
}

// CategoriaFinanceiraStore categorias financeiras.
type CategoriaFinanceiraStore interface {
	Create(ctx context.Context, in CategoriaFinanceiraInput) (*CategoriaFinanceiraDTO, error)
	GetByID(ctx context.Context, id uuid.UUID) (*CategoriaFinanceiraDTO, error)
	Update(ctx context.Context, id uuid.UUID, in CategoriaFinanceiraInput) (*CategoriaFinanceiraDTO, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[CategoriaFinanceiraDTO], error)
}

// CentroCustoStore centros de custo.
type CentroCustoStore interface {
	Create(ctx context.Context, in CentroCustoInput) (*CentroCustoDTO, error)
	GetByID(ctx context.Context, id uuid.UUID) (*CentroCustoDTO, error)
	Update(ctx context.Context, id uuid.UUID, in CentroCustoInput) (*CentroCustoDTO, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[CentroCustoDTO], error)
}

// LancamentoStore lançamentos financeiros.
type LancamentoStore interface {
	Create(ctx context.Context, in LancamentoInput) (*LancamentoDTO, error)
	GetByID(ctx context.Context, id uuid.UUID) (*LancamentoDTO, error)
	Update(ctx context.Context, id uuid.UUID, in LancamentoInput) (*LancamentoDTO, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[LancamentoDTO], error)
}

// RelatorioOperacionalStore relatórios operacionais.
type RelatorioOperacionalStore interface {
	Create(ctx context.Context, in RelatorioOperacionalInput) (*RelatorioOperacionalDTO, error)
	GetByID(ctx context.Context, id uuid.UUID) (*RelatorioOperacionalDTO, error)
	Update(ctx context.Context, id uuid.UUID, in RelatorioOperacionalInput) (*RelatorioOperacionalDTO, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[RelatorioOperacionalDTO], error)
}

// FuncionarioCLTStore funcionários CLT.
type FuncionarioCLTStore interface {
	Create(ctx context.Context, in FuncionarioCLTInput) (*FuncionarioCLTDTO, error)
	GetByID(ctx context.Context, id uuid.UUID) (*FuncionarioCLTDTO, error)
	Update(ctx context.Context, id uuid.UUID, in FuncionarioCLTInput) (*FuncionarioCLTDTO, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[FuncionarioCLTDTO], error)
}

// FuncionarioPJStore funcionários PJ.
type FuncionarioPJStore interface {
	Create(ctx context.Context, in FuncionarioPJInput) (*FuncionarioPJDTO, error)
	GetByID(ctx context.Context, id uuid.UUID) (*FuncionarioPJDTO, error)
	Update(ctx context.Context, id uuid.UUID, in FuncionarioPJInput) (*FuncionarioPJDTO, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[FuncionarioPJDTO], error)
}

// FolhaCLTStore folhas CLT.
type FolhaCLTStore interface {
	Create(ctx context.Context, in FolhaCLTInput) (*FolhaCLTDTO, error)
	GetByID(ctx context.Context, id uuid.UUID) (*FolhaCLTDTO, error)
	Update(ctx context.Context, id uuid.UUID, in FolhaCLTInput) (*FolhaCLTDTO, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[FolhaCLTDTO], error)
}

// FolhaPJStore folhas PJ.
type FolhaPJStore interface {
	Create(ctx context.Context, in FolhaPJInput) (*FolhaPJDTO, error)
	GetByID(ctx context.Context, id uuid.UUID) (*FolhaPJDTO, error)
	Update(ctx context.Context, id uuid.UUID, in FolhaPJInput) (*FolhaPJDTO, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[FolhaPJDTO], error)
}

// ItemEstoqueStore itens de estoque.
type ItemEstoqueStore interface {
	Create(ctx context.Context, in ItemEstoqueInput) (*ItemEstoqueDTO, error)
	GetByID(ctx context.Context, id uuid.UUID) (*ItemEstoqueDTO, error)
	Update(ctx context.Context, id uuid.UUID, in ItemEstoqueInput) (*ItemEstoqueDTO, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[ItemEstoqueDTO], error)
}

// MovimentacaoEstoqueStore movimentações de estoque.
type MovimentacaoEstoqueStore interface {
	Create(ctx context.Context, in MovimentacaoEstoqueInput) (*MovimentacaoEstoqueDTO, error)
	GetByID(ctx context.Context, id uuid.UUID) (*MovimentacaoEstoqueDTO, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filter repository.CRUDListFilter, itemID *uuid.UUID) (*ListResult[MovimentacaoEstoqueDTO], error)
}

// InventarioStore inventários físicos.
type InventarioStore interface {
	Create(ctx context.Context, in InventarioInput) (*InventarioDTO, error)
	GetByID(ctx context.Context, id uuid.UUID) (*InventarioDTO, error)
	Update(ctx context.Context, id uuid.UUID, in InventarioInput) (*InventarioDTO, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[InventarioDTO], error)
}

// ComodatoStore empréstimos/comodatos.
type ComodatoStore interface {
	Create(ctx context.Context, in ComodatoInput) (*ComodatoDTO, error)
	GetByID(ctx context.Context, id uuid.UUID) (*ComodatoDTO, error)
	Update(ctx context.Context, id uuid.UUID, in ComodatoInput) (*ComodatoDTO, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[ComodatoDTO], error)
}

// PlanoSaudeStore planos de saúde.
type PlanoSaudeStore interface {
	Create(ctx context.Context, in PlanoSaudeInput) (*PlanoSaudeDTO, error)
	GetByID(ctx context.Context, id uuid.UUID) (*PlanoSaudeDTO, error)
	Update(ctx context.Context, id uuid.UUID, in PlanoSaudeInput) (*PlanoSaudeDTO, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[PlanoSaudeDTO], error)
}

// AcaoJudicialStore ações judiciais.
type AcaoJudicialStore interface {
	Create(ctx context.Context, in AcaoJudicialInput) (*AcaoJudicialDTO, error)
	GetByID(ctx context.Context, id uuid.UUID) (*AcaoJudicialDTO, error)
	Update(ctx context.Context, id uuid.UUID, in AcaoJudicialInput) (*AcaoJudicialDTO, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[AcaoJudicialDTO], error)
}

// NotaFiscalStore notas fiscais.
type NotaFiscalStore interface {
	Create(ctx context.Context, in NotaFiscalInput) (*NotaFiscalDTO, error)
	GetByID(ctx context.Context, id uuid.UUID) (*NotaFiscalDTO, error)
	Update(ctx context.Context, id uuid.UUID, in NotaFiscalInput) (*NotaFiscalDTO, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[NotaFiscalDTO], error)
}

// ManualStore manuais de marketing.
type ManualStore interface {
	Create(ctx context.Context, in ManualInput) (*ManualDTO, error)
	CreateWithID(ctx context.Context, id uuid.UUID, in ManualInput) (*ManualDTO, error)
	GetByID(ctx context.Context, id uuid.UUID) (*ManualDTO, error)
	Update(ctx context.Context, id uuid.UUID, in ManualInput) (*ManualDTO, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[ManualDTO], error)
}

// MaterialMarketingStore materiais de marketing.
type MaterialMarketingStore interface {
	Create(ctx context.Context, in MaterialMarketingInput) (*MaterialMarketingDTO, error)
	CreateWithID(ctx context.Context, id uuid.UUID, in MaterialMarketingInput) (*MaterialMarketingDTO, error)
	GetByID(ctx context.Context, id uuid.UUID) (*MaterialMarketingDTO, error)
	Update(ctx context.Context, id uuid.UUID, in MaterialMarketingInput) (*MaterialMarketingDTO, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[MaterialMarketingDTO], error)
}

// ContaContabilStore plano de contas.
type ContaContabilStore interface {
	Create(ctx context.Context, in ContaContabilInput) (*ContaContabilDTO, error)
	GetByCodigo(ctx context.Context, codigo string) (*ContaContabilDTO, error)
	Update(ctx context.Context, codigo string, in ContaContabilInput) (*ContaContabilDTO, error)
	Delete(ctx context.Context, codigo string) error
	List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[ContaContabilDTO], error)
}

// LancamentoContabilStore lançamentos contábeis.
type LancamentoContabilStore interface {
	Create(ctx context.Context, in LancamentoContabilInput) (*LancamentoContabilDTO, error)
	GetByID(ctx context.Context, id uuid.UUID) (*LancamentoContabilDTO, error)
	Update(ctx context.Context, id uuid.UUID, in LancamentoContabilInput) (*LancamentoContabilDTO, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[LancamentoContabilDTO], error)
}

// AuditLogStore trilha de auditoria append-only.
type AuditLogStore interface {
	Append(ctx context.Context, in AuditLogInput) error
	List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[AuditLogDTO], error)
}
