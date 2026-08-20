package application

import (
	"context"

	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/domain/service"

	"github.com/google/uuid"
)

type TerapiaApp struct{ svc *service.TerapiaService }

func NewTerapiaApp(svc *service.TerapiaService) *TerapiaApp { return &TerapiaApp{svc: svc} }

func (a *TerapiaApp) Create(ctx context.Context, in service.TerapiaInput) (uuid.UUID, error) {
	out, err := a.svc.Create(ctx, in)
	if err != nil {
		return uuid.Nil, err
	}
	return out.ID, nil
}
func (a *TerapiaApp) GetByID(ctx context.Context, id uuid.UUID) (*service.TerapiaDTO, error) {
	return a.svc.GetByID(ctx, id)
}
func (a *TerapiaApp) Update(ctx context.Context, id uuid.UUID, in service.TerapiaInput) (*service.TerapiaDTO, error) {
	return a.svc.Update(ctx, id, in)
}
func (a *TerapiaApp) Delete(ctx context.Context, id uuid.UUID) error { return a.svc.Delete(ctx, id) }
func (a *TerapiaApp) List(ctx context.Context, f repository.CRUDListFilter) (*service.ListResult[service.TerapiaDTO], error) {
	return a.svc.List(ctx, f)
}

type AnamneseApp struct{ svc *service.AnamneseService }

func NewAnamneseApp(svc *service.AnamneseService) *AnamneseApp { return &AnamneseApp{svc: svc} }

func (a *AnamneseApp) Create(ctx context.Context, in service.AnamneseInput) (uuid.UUID, error) {
	out, err := a.svc.Create(ctx, in)
	if err != nil {
		return uuid.Nil, err
	}
	return out.ID, nil
}
func (a *AnamneseApp) GetByID(ctx context.Context, id uuid.UUID) (*service.AnamneseDTO, error) {
	return a.svc.GetByID(ctx, id)
}
func (a *AnamneseApp) Update(ctx context.Context, id uuid.UUID, in service.AnamneseInput) (*service.AnamneseDTO, error) {
	return a.svc.Update(ctx, id, in)
}
func (a *AnamneseApp) Delete(ctx context.Context, id uuid.UUID) error { return a.svc.Delete(ctx, id) }
func (a *AnamneseApp) List(ctx context.Context, f repository.CRUDListFilter) (*service.ListResult[service.AnamneseDTO], error) {
	return a.svc.List(ctx, f)
}

type RespostaAnamneseApp struct{ svc *service.RespostaAnamneseService }

func NewRespostaAnamneseApp(svc *service.RespostaAnamneseService) *RespostaAnamneseApp {
	return &RespostaAnamneseApp{svc: svc}
}
func (a *RespostaAnamneseApp) Create(ctx context.Context, in service.RespostaAnamneseInput) (*service.RespostaAnamneseDTO, error) {
	return a.svc.Create(ctx, in)
}
func (a *RespostaAnamneseApp) List(ctx context.Context, f repository.CRUDListFilter, qid, pid *uuid.UUID) (*service.ListResult[service.RespostaAnamneseDTO], error) {
	return a.svc.List(ctx, f, qid, pid)
}

type CategoriaFinanceiraApp struct{ svc *service.CategoriaFinanceiraService }

func NewCategoriaFinanceiraApp(svc *service.CategoriaFinanceiraService) *CategoriaFinanceiraApp {
	return &CategoriaFinanceiraApp{svc: svc}
}
func (a *CategoriaFinanceiraApp) Create(ctx context.Context, in service.CategoriaFinanceiraInput) (uuid.UUID, error) {
	out, err := a.svc.Create(ctx, in)
	if err != nil {
		return uuid.Nil, err
	}
	return out.ID, nil
}
func (a *CategoriaFinanceiraApp) GetByID(ctx context.Context, id uuid.UUID) (*service.CategoriaFinanceiraDTO, error) {
	return a.svc.GetByID(ctx, id)
}
func (a *CategoriaFinanceiraApp) Update(ctx context.Context, id uuid.UUID, in service.CategoriaFinanceiraInput) (*service.CategoriaFinanceiraDTO, error) {
	return a.svc.Update(ctx, id, in)
}
func (a *CategoriaFinanceiraApp) Delete(ctx context.Context, id uuid.UUID) error { return a.svc.Delete(ctx, id) }
func (a *CategoriaFinanceiraApp) List(ctx context.Context, f repository.CRUDListFilter) (*service.ListResult[service.CategoriaFinanceiraDTO], error) {
	return a.svc.List(ctx, f)
}

type CentroCustoApp struct{ svc *service.CentroCustoService }

func NewCentroCustoApp(svc *service.CentroCustoService) *CentroCustoApp { return &CentroCustoApp{svc: svc} }
func (a *CentroCustoApp) Create(ctx context.Context, in service.CentroCustoInput) (uuid.UUID, error) {
	out, err := a.svc.Create(ctx, in)
	if err != nil {
		return uuid.Nil, err
	}
	return out.ID, nil
}
func (a *CentroCustoApp) GetByID(ctx context.Context, id uuid.UUID) (*service.CentroCustoDTO, error) {
	return a.svc.GetByID(ctx, id)
}
func (a *CentroCustoApp) Update(ctx context.Context, id uuid.UUID, in service.CentroCustoInput) (*service.CentroCustoDTO, error) {
	return a.svc.Update(ctx, id, in)
}
func (a *CentroCustoApp) Delete(ctx context.Context, id uuid.UUID) error { return a.svc.Delete(ctx, id) }
func (a *CentroCustoApp) List(ctx context.Context, f repository.CRUDListFilter) (*service.ListResult[service.CentroCustoDTO], error) {
	return a.svc.List(ctx, f)
}

type LancamentoApp struct{ svc *service.LancamentoService }

func NewLancamentoApp(svc *service.LancamentoService) *LancamentoApp { return &LancamentoApp{svc: svc} }
func (a *LancamentoApp) Create(ctx context.Context, in service.LancamentoInput) (uuid.UUID, error) {
	out, err := a.svc.Create(ctx, in)
	if err != nil {
		return uuid.Nil, err
	}
	return out.ID, nil
}
func (a *LancamentoApp) GetByID(ctx context.Context, id uuid.UUID) (*service.LancamentoDTO, error) {
	return a.svc.GetByID(ctx, id)
}
func (a *LancamentoApp) Update(ctx context.Context, id uuid.UUID, in service.LancamentoInput) (*service.LancamentoDTO, error) {
	return a.svc.Update(ctx, id, in)
}
func (a *LancamentoApp) Delete(ctx context.Context, id uuid.UUID) error { return a.svc.Delete(ctx, id) }
func (a *LancamentoApp) List(ctx context.Context, f repository.CRUDListFilter) (*service.ListResult[service.LancamentoDTO], error) {
	return a.svc.List(ctx, f)
}

type RelatorioOperacionalApp struct{ svc *service.RelatorioOperacionalService }

func NewRelatorioOperacionalApp(svc *service.RelatorioOperacionalService) *RelatorioOperacionalApp {
	return &RelatorioOperacionalApp{svc: svc}
}
func (a *RelatorioOperacionalApp) Create(ctx context.Context, in service.RelatorioOperacionalInput) (uuid.UUID, error) {
	out, err := a.svc.Create(ctx, in)
	if err != nil {
		return uuid.Nil, err
	}
	return out.ID, nil
}
func (a *RelatorioOperacionalApp) GetByID(ctx context.Context, id uuid.UUID) (*service.RelatorioOperacionalDTO, error) {
	return a.svc.GetByID(ctx, id)
}
func (a *RelatorioOperacionalApp) Update(ctx context.Context, id uuid.UUID, in service.RelatorioOperacionalInput) (*service.RelatorioOperacionalDTO, error) {
	return a.svc.Update(ctx, id, in)
}
func (a *RelatorioOperacionalApp) Delete(ctx context.Context, id uuid.UUID) error { return a.svc.Delete(ctx, id) }
func (a *RelatorioOperacionalApp) List(ctx context.Context, f repository.CRUDListFilter) (*service.ListResult[service.RelatorioOperacionalDTO], error) {
	return a.svc.List(ctx, f)
}

type AuditApp struct{ svc *service.AuditService }

func NewAuditApp(svc *service.AuditService) *AuditApp { return &AuditApp{svc: svc} }
func (a *AuditApp) List(ctx context.Context, f repository.CRUDListFilter) (*service.ListResult[service.AuditLogDTO], error) {
	return a.svc.List(ctx, f)
}
func (a *AuditApp) Record(ctx context.Context, in service.AuditLogInput) error { return a.svc.Record(ctx, in) }

// Wave3Apps agrupa aplicações Wave 3.
type Wave3Apps struct {
	FuncionarioCLT     *GenericUUIDApp[service.FuncionarioCLTInput, service.FuncionarioCLTDTO]
	FuncionarioPJ      *GenericUUIDApp[service.FuncionarioPJInput, service.FuncionarioPJDTO]
	FolhaCLT           *GenericUUIDApp[service.FolhaCLTInput, service.FolhaCLTDTO]
	FolhaPJ            *GenericUUIDApp[service.FolhaPJInput, service.FolhaPJDTO]
	ItemEstoque        *GenericUUIDApp[service.ItemEstoqueInput, service.ItemEstoqueDTO]
	MovimentacaoEstoque *MovimentacaoEstoqueApp
	Inventario         *InventarioApp
	Comodato           *GenericUUIDApp[service.ComodatoInput, service.ComodatoDTO]
	PlanoSaude         *GenericUUIDApp[service.PlanoSaudeInput, service.PlanoSaudeDTO]
	AcaoJudicial       *GenericUUIDApp[service.AcaoJudicialInput, service.AcaoJudicialDTO]
	NotaFiscal         *GenericUUIDApp[service.NotaFiscalInput, service.NotaFiscalDTO]
	Manual             *GenericUUIDApp[service.ManualInput, service.ManualDTO]
	MaterialMarketing  *GenericUUIDApp[service.MaterialMarketingInput, service.MaterialMarketingDTO]
	ContaContabil      *ContaContabilApp
	LancamentoContabil *GenericUUIDApp[service.LancamentoContabilInput, service.LancamentoContabilDTO]
	Balancete          *BalanceteApp
}

type uuidCRUD interface {
	Create(ctx context.Context, in any) (any, error)
}

// GenericUUIDApp wrapper genérico para apps CRUD UUID.
type GenericUUIDApp[I any, D any] struct {
	CreateFn func(context.Context, I) (*D, error)
	GetFn    func(context.Context, uuid.UUID) (*D, error)
	UpdateFn func(context.Context, uuid.UUID, I) (*D, error)
	DeleteFn func(context.Context, uuid.UUID) error
	ListFn   func(context.Context, repository.CRUDListFilter) (*service.ListResult[D], error)
}

func (a *GenericUUIDApp[I, D]) Create(ctx context.Context, in I) (uuid.UUID, error) {
	out, err := a.CreateFn(ctx, in)
	if err != nil {
		return uuid.Nil, err
	}
	return extractID(out), nil
}
func (a *GenericUUIDApp[I, D]) GetByID(ctx context.Context, id uuid.UUID) (*D, error) {
	return a.GetFn(ctx, id)
}
func (a *GenericUUIDApp[I, D]) Update(ctx context.Context, id uuid.UUID, in I) (*D, error) {
	return a.UpdateFn(ctx, id, in)
}
func (a *GenericUUIDApp[I, D]) Delete(ctx context.Context, id uuid.UUID) error { return a.DeleteFn(ctx, id) }
func (a *GenericUUIDApp[I, D]) List(ctx context.Context, f repository.CRUDListFilter) (*service.ListResult[D], error) {
	return a.ListFn(ctx, f)
}

func extractID[D any](dto *D) uuid.UUID {
	switch v := any(dto).(type) {
	case *service.FuncionarioCLTDTO:
		return v.ID
	case *service.FuncionarioPJDTO:
		return v.ID
	case *service.FolhaCLTDTO:
		return v.ID
	case *service.FolhaPJDTO:
		return v.ID
	case *service.ItemEstoqueDTO:
		return v.ID
	case *service.ComodatoDTO:
		return v.ID
	case *service.PlanoSaudeDTO:
		return v.ID
	case *service.AcaoJudicialDTO:
		return v.ID
	case *service.NotaFiscalDTO:
		return v.ID
	case *service.ManualDTO:
		return v.ID
	case *service.MaterialMarketingDTO:
		return v.ID
	case *service.LancamentoContabilDTO:
		return v.ID
	default:
		return uuid.Nil
	}
}

type MovimentacaoEstoqueApp struct{ svc *service.MovimentacaoEstoqueService }

func NewMovimentacaoEstoqueApp(svc *service.MovimentacaoEstoqueService) *MovimentacaoEstoqueApp {
	return &MovimentacaoEstoqueApp{svc: svc}
}
func (a *MovimentacaoEstoqueApp) Create(ctx context.Context, in service.MovimentacaoEstoqueInput) (uuid.UUID, error) {
	out, err := a.svc.Create(ctx, in)
	if err != nil {
		return uuid.Nil, err
	}
	return out.ID, nil
}
func (a *MovimentacaoEstoqueApp) GetByID(ctx context.Context, id uuid.UUID) (*service.MovimentacaoEstoqueDTO, error) {
	return a.svc.GetByID(ctx, id)
}
func (a *MovimentacaoEstoqueApp) Delete(ctx context.Context, id uuid.UUID) error { return a.svc.Delete(ctx, id) }
func (a *MovimentacaoEstoqueApp) List(ctx context.Context, f repository.CRUDListFilter, itemID *uuid.UUID) (*service.ListResult[service.MovimentacaoEstoqueDTO], error) {
	return a.svc.List(ctx, f, itemID)
}

type InventarioApp struct{ svc *service.InventarioService }

func NewInventarioApp(svc *service.InventarioService) *InventarioApp { return &InventarioApp{svc: svc} }
func (a *InventarioApp) Create(ctx context.Context, in service.InventarioInput) (uuid.UUID, error) {
	out, err := a.svc.Create(ctx, in)
	if err != nil {
		return uuid.Nil, err
	}
	return out.ID, nil
}
func (a *InventarioApp) GetByID(ctx context.Context, id uuid.UUID) (*service.InventarioDTO, error) {
	return a.svc.GetByID(ctx, id)
}
func (a *InventarioApp) Update(ctx context.Context, id uuid.UUID, in service.InventarioInput) (*service.InventarioDTO, error) {
	return a.svc.Update(ctx, id, in)
}
func (a *InventarioApp) Delete(ctx context.Context, id uuid.UUID) error { return a.svc.Delete(ctx, id) }
func (a *InventarioApp) List(ctx context.Context, f repository.CRUDListFilter) (*service.ListResult[service.InventarioDTO], error) {
	return a.svc.List(ctx, f)
}

type ContaContabilApp struct{ svc *service.ContaContabilService }

func NewContaContabilApp(svc *service.ContaContabilService) *ContaContabilApp {
	return &ContaContabilApp{svc: svc}
}
func (a *ContaContabilApp) Create(ctx context.Context, in service.ContaContabilInput) (*service.ContaContabilDTO, error) {
	return a.svc.Create(ctx, in)
}
func (a *ContaContabilApp) GetByCodigo(ctx context.Context, codigo string) (*service.ContaContabilDTO, error) {
	return a.svc.GetByCodigo(ctx, codigo)
}
func (a *ContaContabilApp) Update(ctx context.Context, codigo string, in service.ContaContabilInput) (*service.ContaContabilDTO, error) {
	return a.svc.Update(ctx, codigo, in)
}
func (a *ContaContabilApp) Delete(ctx context.Context, codigo string) error { return a.svc.Delete(ctx, codigo) }
func (a *ContaContabilApp) List(ctx context.Context, f repository.CRUDListFilter) (*service.ListResult[service.ContaContabilDTO], error) {
	return a.svc.List(ctx, f)
}

type BalanceteApp struct{ svc *service.BalanceteService }

func NewBalanceteApp(svc *service.BalanceteService) *BalanceteApp {
	return &BalanceteApp{svc: svc}
}

func (a *BalanceteApp) Generate(ctx context.Context, in service.BalanceteFiltrosInput) (*service.BalanceteResultadoDTO, error) {
	return a.svc.Generate(ctx, in)
}

func NewWave3Apps(services Wave3Services) Wave3Apps {
	return Wave3Apps{
		FuncionarioCLT: &GenericUUIDApp[service.FuncionarioCLTInput, service.FuncionarioCLTDTO]{
			CreateFn: func(ctx context.Context, in service.FuncionarioCLTInput) (*service.FuncionarioCLTDTO, error) {
				return services.FuncionarioCLT.Create(ctx, in)
			},
			GetFn: services.FuncionarioCLT.GetByID, UpdateFn: services.FuncionarioCLT.Update,
			DeleteFn: services.FuncionarioCLT.Delete, ListFn: services.FuncionarioCLT.List,
		},
		FuncionarioPJ: &GenericUUIDApp[service.FuncionarioPJInput, service.FuncionarioPJDTO]{
			CreateFn: func(ctx context.Context, in service.FuncionarioPJInput) (*service.FuncionarioPJDTO, error) {
				return services.FuncionarioPJ.Create(ctx, in)
			},
			GetFn: services.FuncionarioPJ.GetByID, UpdateFn: services.FuncionarioPJ.Update,
			DeleteFn: services.FuncionarioPJ.Delete, ListFn: services.FuncionarioPJ.List,
		},
		FolhaCLT: &GenericUUIDApp[service.FolhaCLTInput, service.FolhaCLTDTO]{
			CreateFn: func(ctx context.Context, in service.FolhaCLTInput) (*service.FolhaCLTDTO, error) {
				return services.FolhaCLT.Create(ctx, in)
			},
			GetFn: services.FolhaCLT.GetByID, UpdateFn: services.FolhaCLT.Update,
			DeleteFn: services.FolhaCLT.Delete, ListFn: services.FolhaCLT.List,
		},
		FolhaPJ: &GenericUUIDApp[service.FolhaPJInput, service.FolhaPJDTO]{
			CreateFn: func(ctx context.Context, in service.FolhaPJInput) (*service.FolhaPJDTO, error) {
				return services.FolhaPJ.Create(ctx, in)
			},
			GetFn: services.FolhaPJ.GetByID, UpdateFn: services.FolhaPJ.Update,
			DeleteFn: services.FolhaPJ.Delete, ListFn: services.FolhaPJ.List,
		},
		ItemEstoque: &GenericUUIDApp[service.ItemEstoqueInput, service.ItemEstoqueDTO]{
			CreateFn: func(ctx context.Context, in service.ItemEstoqueInput) (*service.ItemEstoqueDTO, error) {
				return services.ItemEstoque.Create(ctx, in)
			},
			GetFn: services.ItemEstoque.GetByID, UpdateFn: services.ItemEstoque.Update,
			DeleteFn: services.ItemEstoque.Delete, ListFn: services.ItemEstoque.List,
		},
		MovimentacaoEstoque: NewMovimentacaoEstoqueApp(services.MovimentacaoEstoque),
		Inventario:          NewInventarioApp(services.Inventario),
		Comodato: &GenericUUIDApp[service.ComodatoInput, service.ComodatoDTO]{
			CreateFn: func(ctx context.Context, in service.ComodatoInput) (*service.ComodatoDTO, error) {
				return services.Comodato.Create(ctx, in)
			},
			GetFn: services.Comodato.GetByID, UpdateFn: services.Comodato.Update,
			DeleteFn: services.Comodato.Delete, ListFn: services.Comodato.List,
		},
		PlanoSaude: &GenericUUIDApp[service.PlanoSaudeInput, service.PlanoSaudeDTO]{
			CreateFn: func(ctx context.Context, in service.PlanoSaudeInput) (*service.PlanoSaudeDTO, error) {
				return services.PlanoSaude.Create(ctx, in)
			},
			GetFn: services.PlanoSaude.GetByID, UpdateFn: services.PlanoSaude.Update,
			DeleteFn: services.PlanoSaude.Delete, ListFn: services.PlanoSaude.List,
		},
		AcaoJudicial: &GenericUUIDApp[service.AcaoJudicialInput, service.AcaoJudicialDTO]{
			CreateFn: func(ctx context.Context, in service.AcaoJudicialInput) (*service.AcaoJudicialDTO, error) {
				return services.AcaoJudicial.Create(ctx, in)
			},
			GetFn: services.AcaoJudicial.GetByID, UpdateFn: services.AcaoJudicial.Update,
			DeleteFn: services.AcaoJudicial.Delete, ListFn: services.AcaoJudicial.List,
		},
		NotaFiscal: &GenericUUIDApp[service.NotaFiscalInput, service.NotaFiscalDTO]{
			CreateFn: func(ctx context.Context, in service.NotaFiscalInput) (*service.NotaFiscalDTO, error) {
				return services.NotaFiscal.Create(ctx, in)
			},
			GetFn: services.NotaFiscal.GetByID, UpdateFn: services.NotaFiscal.Update,
			DeleteFn: services.NotaFiscal.Delete, ListFn: services.NotaFiscal.List,
		},
		Manual: &GenericUUIDApp[service.ManualInput, service.ManualDTO]{
			CreateFn: func(ctx context.Context, in service.ManualInput) (*service.ManualDTO, error) {
				return services.Manual.Create(ctx, in)
			},
			GetFn: services.Manual.GetByID, UpdateFn: services.Manual.Update,
			DeleteFn: services.Manual.Delete, ListFn: services.Manual.List,
		},
		MaterialMarketing: &GenericUUIDApp[service.MaterialMarketingInput, service.MaterialMarketingDTO]{
			CreateFn: func(ctx context.Context, in service.MaterialMarketingInput) (*service.MaterialMarketingDTO, error) {
				return services.MaterialMarketing.Create(ctx, in)
			},
			GetFn: services.MaterialMarketing.GetByID, UpdateFn: services.MaterialMarketing.Update,
			DeleteFn: services.MaterialMarketing.Delete, ListFn: services.MaterialMarketing.List,
		},
		ContaContabil: NewContaContabilApp(services.ContaContabil),
		LancamentoContabil: &GenericUUIDApp[service.LancamentoContabilInput, service.LancamentoContabilDTO]{
			CreateFn: func(ctx context.Context, in service.LancamentoContabilInput) (*service.LancamentoContabilDTO, error) {
				return services.LancamentoContabil.Create(ctx, in)
			},
			GetFn: services.LancamentoContabil.GetByID, UpdateFn: services.LancamentoContabil.Update,
			DeleteFn: services.LancamentoContabil.Delete, ListFn: services.LancamentoContabil.List,
		},
		Balancete: NewBalanceteApp(services.Balancete),
	}
}

// Wave3Services agrupa serviços Wave 3 para wiring.
type Wave3Services struct {
	FuncionarioCLT      *service.FuncionarioCLTService
	FuncionarioPJ       *service.FuncionarioPJService
	FolhaCLT            *service.FolhaCLTService
	FolhaPJ             *service.FolhaPJService
	ItemEstoque         *service.ItemEstoqueService
	MovimentacaoEstoque *service.MovimentacaoEstoqueService
	Inventario          *service.InventarioService
	Comodato            *service.ComodatoService
	PlanoSaude          *service.PlanoSaudeService
	AcaoJudicial        *service.AcaoJudicialService
	NotaFiscal          *service.NotaFiscalService
	Conciliacao         *service.ConciliacaoService
	Manual              *service.ManualService
	MaterialMarketing   *service.MaterialMarketingService
	ContaContabil       *service.ContaContabilService
	LancamentoContabil  *service.LancamentoContabilService
	Balancete           *service.BalanceteService
}
