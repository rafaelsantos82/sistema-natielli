package database

import (
	"context"
	"time"

	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/domain/service"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

func newAnamneseStore(db *gorm.DB) service.AnamneseStore {
	return &genericUUIDStore[anamneseModel, service.AnamneseDTO, service.AnamneseInput]{
		repo: NewPostgresCRUDRepo[anamneseModel](db, "Anamnese", crudListConfig{
			searchColumns: []string{"nome", "especialidade"},
			statusColumn:  "status",
			orderBy:       "nome ASC",
		}),
		toDTO: func(m *anamneseModel) service.AnamneseDTO { return toAnamneseDTO(m) },
		fromInput: func(id uuid.UUID, in service.AnamneseInput, now time.Time, created time.Time) *anamneseModel {
			status := in.Status
			if status == "" {
				status = "Ativa"
			}
			q, _ := marshalJSON(in.Questionnaire)
			if len(q) == 0 {
				q = JSONB("[]")
			}
			return &anamneseModel{
				ID: id, Nome: in.Nome, Especialidade: in.Especialidade, Versao: in.Versao,
				Status: status, Questionnaire: q, Observacoes: in.Observacoes,
				CreatedAt: created, UpdatedAt: now,
			}
		},
	}
}

func newCategoriaStore(db *gorm.DB) service.CategoriaFinanceiraStore {
	return &genericUUIDStore[categoriaFinanceiraModel, service.CategoriaFinanceiraDTO, service.CategoriaFinanceiraInput]{
		repo: NewPostgresCRUDRepo[categoriaFinanceiraModel](db, "CategoriaFinanceira", crudListConfig{
			searchColumns: []string{"nome"},
			statusColumn:  "tipo",
			orderBy:       "nome ASC",
		}),
		toDTO: func(m *categoriaFinanceiraModel) service.CategoriaFinanceiraDTO { return toCategoriaFinanceiraDTO(m) },
		fromInput: func(id uuid.UUID, in service.CategoriaFinanceiraInput, now, created time.Time) *categoriaFinanceiraModel {
			return &categoriaFinanceiraModel{ID: id, Nome: in.Nome, Tipo: in.Tipo, Cor: in.Cor, Descricao: in.Descricao, CreatedAt: created, UpdatedAt: now}
		},
	}
}

func newCentroCustoStore(db *gorm.DB) service.CentroCustoStore {
	return &genericUUIDStore[centroCustoModel, service.CentroCustoDTO, service.CentroCustoInput]{
		repo: NewPostgresCRUDRepo[centroCustoModel](db, "CentroCusto", crudListConfig{
			searchColumns: []string{"nome", "codigo"},
			orderBy:       "codigo ASC",
		}),
		toDTO: func(m *centroCustoModel) service.CentroCustoDTO { return toCentroCustoDTO(m) },
		fromInput: func(id uuid.UUID, in service.CentroCustoInput, now, created time.Time) *centroCustoModel {
			return &centroCustoModel{ID: id, Codigo: in.Codigo, Nome: in.Nome, Descricao: in.Descricao, Ativo: in.Ativo, CreatedAt: created, UpdatedAt: now}
		},
	}
}

func newLancamentoStore(db *gorm.DB) service.LancamentoStore {
	return &genericUUIDStore[lancamentoModel, service.LancamentoDTO, service.LancamentoInput]{
		repo: NewPostgresCRUDRepo[lancamentoModel](db, "Lancamento", crudListConfig{
			unidadeColumn: "unidade_id",
			searchColumns: []string{"descricao", "categoria_nome"},
			statusColumn:  "status",
			orderBy:       "data_vencimento DESC",
		}),
		toDTO: func(m *lancamentoModel) service.LancamentoDTO { return toLancamentoDTO(m) },
		fromInput: func(id uuid.UUID, in service.LancamentoInput, now, created time.Time) *lancamentoModel {
			status := in.Status
			if status == "" {
				status = "Pendente"
			}
			return &lancamentoModel{
				ID: id, Tipo: in.Tipo, Descricao: in.Descricao, Valor: in.Valor,
				DataVencimento: in.DataVencimento, DataPagamento: in.DataPagamento,
				CategoriaID: in.CategoriaID, CategoriaNome: in.CategoriaNome,
				CentroCustoID: in.CentroCustoID, CentroCustoNome: in.CentroCustoNome,
				FormaPagamento: in.FormaPagamento, Documento: in.Documento, Observacoes: in.Observacoes,
				Status: status, Recorrente: in.Recorrente, FrequenciaRecorrencia: in.FrequenciaRecorrencia,
				Parcelas: in.Parcelas, ParcelaAtual: in.ParcelaAtual, AnexoURL: in.AnexoURL,
				Conciliado: in.Conciliado, DataConciliacao: in.DataConciliacao, UnidadeID: in.UnidadeID,
				CreatedAt: created, UpdatedAt: now,
			}
		},
	}
}

func newRelatorioStore(db *gorm.DB) service.RelatorioOperacionalStore {
	return &genericUUIDStore[relatorioOperacionalModel, service.RelatorioOperacionalDTO, service.RelatorioOperacionalInput]{
		repo: NewPostgresCRUDRepo[relatorioOperacionalModel](db, "RelatorioOperacional", crudListConfig{
			unidadeColumn: "unidade_id",
			searchColumns: []string{"numero", "paciente_nome", "profissional_nome"},
			statusColumn:  "status",
			orderBy:       "created_at DESC",
		}),
		toDTO: func(m *relatorioOperacionalModel) service.RelatorioOperacionalDTO { return toRelatorioOperacionalDTO(m) },
		fromInput: func(id uuid.UUID, in service.RelatorioOperacionalInput, now, created time.Time) *relatorioOperacionalModel {
			status := in.Status
			if status == "" {
				status = "rascunho"
			}
			h, _ := marshalJSON(in.HistoricoVersoes)
			if len(h) == 0 {
				h = JSONB("[]")
			}
			return &relatorioOperacionalModel{
				ID: id, Numero: in.Numero, PacienteNome: in.PacienteNome, ProfissionalNome: in.ProfissionalNome,
				Terapia: in.Terapia, Periodo: in.Periodo, Valor: in.Valor, Status: status,
				UnidadeID: in.UnidadeID, DataSubmissao: in.DataSubmissao, DataAprovacao: in.DataAprovacao,
				AprovadoPor: in.AprovadoPor, Observacoes: in.Observacoes, HistoricoVersoes: h,
				CreatedAt: created, UpdatedAt: now,
			}
		},
	}
}

func newFuncionarioCLTStore(db *gorm.DB) service.FuncionarioCLTStore {
	return &genericUUIDStore[funcionarioCLTModel, service.FuncionarioCLTDTO, service.FuncionarioCLTInput]{
		repo: NewPostgresCRUDRepo[funcionarioCLTModel](db, "FuncionarioCLT", crudListConfig{
			unidadeColumn: "unidade_id",
			searchColumns: []string{"nome", "cpf", "cargo"},
			orderBy:       "nome ASC",
		}),
		toDTO: func(m *funcionarioCLTModel) service.FuncionarioCLTDTO { return toFuncionarioCLTDTO(m) },
		fromInput: func(id uuid.UUID, in service.FuncionarioCLTInput, now, created time.Time) *funcionarioCLTModel {
			return &funcionarioCLTModel{
				ID: id, UnidadeID: in.UnidadeID, Nome: in.Nome, CPF: in.CPF, Cargo: in.Cargo,
				SalarioBase: in.SalarioBase, DataAdmissao: in.DataAdmissao, Ativo: in.Ativo,
				Dependentes: in.Dependentes, ValeTransporte: in.ValeTransporte, ValeAlimentacao: in.ValeAlimentacao,
				CreatedAt: created, UpdatedAt: now,
			}
		},
	}
}

func newFuncionarioPJStore(db *gorm.DB) service.FuncionarioPJStore {
	return &genericUUIDStore[funcionarioPJModel, service.FuncionarioPJDTO, service.FuncionarioPJInput]{
		repo: NewPostgresCRUDRepo[funcionarioPJModel](db, "FuncionarioPJ", crudListConfig{
			unidadeColumn: "unidade_id",
			searchColumns: []string{"nome", "cnpj", "razao_social"},
			orderBy:       "nome ASC",
		}),
		toDTO: func(m *funcionarioPJModel) service.FuncionarioPJDTO { return toFuncionarioPJDTO(m) },
		fromInput: func(id uuid.UUID, in service.FuncionarioPJInput, now, created time.Time) *funcionarioPJModel {
			return &funcionarioPJModel{
				ID: id, UnidadeID: in.UnidadeID, Nome: in.Nome, CNPJ: in.CNPJ,
				RazaoSocial: in.RazaoSocial, Servico: in.Servico, ValorHora: in.ValorHora,
				DataInicio: in.DataInicio, Ativo: in.Ativo, CreatedAt: created, UpdatedAt: now,
			}
		},
	}
}

func newFolhaCLTStore(db *gorm.DB) service.FolhaCLTStore {
	return &genericUUIDStore[folhaCLTModel, service.FolhaCLTDTO, service.FolhaCLTInput]{
		repo: NewPostgresCRUDRepo[folhaCLTModel](db, "FolhaCLT", crudListConfig{
			orderBy: "mes_referencia DESC",
		}),
		toDTO: func(m *folhaCLTModel) service.FolhaCLTDTO { return toFolhaCLTDTO(m) },
		fromInput: func(id uuid.UUID, in service.FolhaCLTInput, now, created time.Time) *folhaCLTModel {
			status := in.Status
			if status == "" {
				status = "pendente"
			}
			return &folhaCLTModel{
				ID: id, FuncionarioID: in.FuncionarioID, MesReferencia: in.MesReferencia,
				SalarioBase: in.SalarioBase, HorasExtras: in.HorasExtras, AdicionalNoturno: in.AdicionalNoturno,
				OutrosProventos: in.OutrosProventos, ValeTransporte: in.ValeTransporte, ValeAlimentacao: in.ValeAlimentacao,
				INSS: in.INSS, FGTS: in.FGTS, IRRF: in.IRRF, OutrosDescontos: in.OutrosDescontos,
				SalarioLiquido: in.SalarioLiquido, DataPagamento: in.DataPagamento, Status: status,
				CreatedAt: created, UpdatedAt: now,
			}
		},
	}
}

func newFolhaPJStore(db *gorm.DB) service.FolhaPJStore {
	return &genericUUIDStore[folhaPJModel, service.FolhaPJDTO, service.FolhaPJInput]{
		repo: NewPostgresCRUDRepo[folhaPJModel](db, "FolhaPJ", crudListConfig{
			orderBy: "mes_referencia DESC",
		}),
		toDTO: func(m *folhaPJModel) service.FolhaPJDTO { return toFolhaPJDTO(m) },
		fromInput: func(id uuid.UUID, in service.FolhaPJInput, now, created time.Time) *folhaPJModel {
			status := in.Status
			if status == "" {
				status = "pendente"
			}
			return &folhaPJModel{
				ID: id, FuncionarioID: in.FuncionarioID, MesReferencia: in.MesReferencia,
				HorasTrabalhadas: in.HorasTrabalhadas, ValorHora: in.ValorHora, ValorTotal: in.ValorTotal,
				RetencaoISS: in.RetencaoISS, RetencaoIR: in.RetencaoIR, ValorLiquido: in.ValorLiquido,
				DataPagamento: in.DataPagamento, Status: status, DescricaoServicos: in.DescricaoServicos,
				CreatedAt: created, UpdatedAt: now,
			}
		},
	}
}

func newItemEstoqueStore(db *gorm.DB) service.ItemEstoqueStore {
	return &genericUUIDStore[itemEstoqueModel, service.ItemEstoqueDTO, service.ItemEstoqueInput]{
		repo: NewPostgresCRUDRepo[itemEstoqueModel](db, "ItemEstoque", crudListConfig{
			unidadeColumn: "unidade_id",
			searchColumns: []string{"nome", "codigo", "categoria"},
			statusColumn:  "status",
			orderBy:       "nome ASC",
		}),
		toDTO: func(m *itemEstoqueModel) service.ItemEstoqueDTO { return toItemEstoqueDTO(m) },
		fromInput: func(id uuid.UUID, in service.ItemEstoqueInput, now, created time.Time) *itemEstoqueModel {
			status := in.Status
			if status == "" {
				status = "Ativo"
			}
			return &itemEstoqueModel{
				ID: id, UnidadeID: in.UnidadeID, Codigo: in.Codigo, Nome: in.Nome, Categoria: in.Categoria,
				UnidadeMedida: in.UnidadeMedida, EstoqueAtual: in.EstoqueAtual, EstoqueMinimo: in.EstoqueMinimo,
				Localizacao: in.Localizacao, Status: status, CreatedAt: created, UpdatedAt: now,
			}
		},
	}
}

func newComodatoStore(db *gorm.DB) service.ComodatoStore {
	return &genericUUIDStore[comodatoModel, service.ComodatoDTO, service.ComodatoInput]{
		repo: NewPostgresCRUDRepo[comodatoModel](db, "Comodato", crudListConfig{
			searchColumns: []string{"item_nome", "paciente_nome"},
			statusColumn:  "status",
			orderBy:       "created_at DESC",
		}),
		toDTO: func(m *comodatoModel) service.ComodatoDTO { return toComodatoDTO(m) },
		fromInput: func(id uuid.UUID, in service.ComodatoInput, now, created time.Time) *comodatoModel {
			status := in.Status
			if status == "" {
				status = "Emprestado"
			}
			qty := in.Quantidade
			if qty < 1 {
				qty = 1
			}
			return &comodatoModel{
				ID: id, ItemID: in.ItemID, ItemNome: in.ItemNome, Descricao: in.Descricao,
				PacienteID: in.PacienteID, PacienteNome: in.PacienteNome,
				DataEmprestimo: in.DataEmprestimo, DataDevolucaoPrevista: in.DataDevolucaoPrevista,
				DataDevolucaoReal: in.DataDevolucaoReal, Status: status,
				CondicaoEntrega: in.CondicaoEntrega, CondicaoDevolucao: in.CondicaoDevolucao,
				Observacoes: in.Observacoes, ResponsavelID: in.ResponsavelID, ResponsavelNome: in.ResponsavelNome,
				NumeroSerie: in.NumeroSerie, Quantidade: qty, CreatedAt: created, UpdatedAt: now,
			}
		},
	}
}

func newPlanoSaudeStore(db *gorm.DB) service.PlanoSaudeStore {
	return &genericUUIDStore[planoSaudeModel, service.PlanoSaudeDTO, service.PlanoSaudeInput]{
		repo: NewPostgresCRUDRepo[planoSaudeModel](db, "PlanoSaude", crudListConfig{
			searchColumns: []string{"nome", "cnpj"},
			orderBy:       "nome ASC",
		}),
		toDTO: func(m *planoSaudeModel) service.PlanoSaudeDTO { return toPlanoSaudeDTO(m) },
		fromInput: func(id uuid.UUID, in service.PlanoSaudeInput, now, created time.Time) *planoSaudeModel {
			return &planoSaudeModel{
				ID: id, Nome: in.Nome, CNPJ: in.CNPJ, RegistroANS: in.RegistroANS,
				Telefone: in.Telefone, Email: in.Email, Endereco: in.Endereco,
				Ativo: in.Ativo, Observacoes: in.Observacoes, CreatedAt: created, UpdatedAt: now,
			}
		},
	}
}

func newAcaoJudicialStore(db *gorm.DB) service.AcaoJudicialStore {
	return &genericUUIDStore[acaoJudicialModel, service.AcaoJudicialDTO, service.AcaoJudicialInput]{
		repo: NewPostgresCRUDRepo[acaoJudicialModel](db, "AcaoJudicial", crudListConfig{
			searchColumns: []string{"numero_processo", "plano_saude_nome"},
			statusColumn:  "status",
			orderBy:       "data_entrada DESC",
		}),
		toDTO: func(m *acaoJudicialModel) service.AcaoJudicialDTO { return toAcaoJudicialDTO(m) },
		fromInput: func(id uuid.UUID, in service.AcaoJudicialInput, now, created time.Time) *acaoJudicialModel {
			status := in.Status
			if status == "" {
				status = "Em Andamento"
			}
			return &acaoJudicialModel{
				ID: id, NumeroProcesso: in.NumeroProcesso, PlanoSaudeID: in.PlanoSaudeID,
				PlanoSaudeNome: in.PlanoSaudeNome, ValorAcao: in.ValorAcao, DataEntrada: in.DataEntrada,
				DataSentenca: in.DataSentenca, Status: status, Descricao: in.Descricao, Observacoes: in.Observacoes,
				CreatedAt: created, UpdatedAt: now,
			}
		},
	}
}

func newNotaFiscalStore(db *gorm.DB) service.NotaFiscalStore {
	return &genericUUIDStore[notaFiscalModel, service.NotaFiscalDTO, service.NotaFiscalInput]{
		repo: NewPostgresCRUDRepo[notaFiscalModel](db, "NotaFiscal", crudListConfig{
			searchColumns: []string{"numero_nota", "paciente_nome", "plano_saude_nome"},
			statusColumn:  "status",
			orderBy:       "data_vencimento DESC",
		}),
		toDTO: func(m *notaFiscalModel) service.NotaFiscalDTO { return toNotaFiscalDTO(m) },
		fromInput: func(id uuid.UUID, in service.NotaFiscalInput, now, created time.Time) *notaFiscalModel {
			status := in.Status
			if status == "" {
				status = "Pendente"
			}
			return &notaFiscalModel{
				ID: id, NumeroNota: in.NumeroNota, PlanoSaudeID: in.PlanoSaudeID, PlanoSaudeNome: in.PlanoSaudeNome,
				PacienteNome: in.PacienteNome, DataEmissao: in.DataEmissao, DataVencimento: in.DataVencimento,
				ValorServico: in.ValorServico, ValorPago: in.ValorPago, Status: status,
				AcaoJudicialID: in.AcaoJudicialID, DataConciliacao: in.DataConciliacao,
				Observacoes: in.Observacoes, CreatedAt: created, UpdatedAt: now,
			}
		},
	}
}

func newManualStore(db *gorm.DB) service.ManualStore {
	return &genericUUIDStore[manualModel, service.ManualDTO, service.ManualInput]{
		repo: NewPostgresCRUDRepo[manualModel](db, "Manual", crudListConfig{
			searchColumns: []string{"titulo"},
			statusColumn:  "status",
			orderBy:       "titulo ASC",
		}),
		toDTO: func(m *manualModel) service.ManualDTO { return toManualDTO(m) },
		fromInput: func(id uuid.UUID, in service.ManualInput, now, created time.Time) *manualModel {
			status := in.Status
			if status == "" {
				status = "Rascunho"
			}
			return &manualModel{
				ID: id, Titulo: in.Titulo, Versao: in.Versao, PublicoAlvo: in.PublicoAlvo,
				ArquivoURL: in.ArquivoURL, ArquivoNome: in.ArquivoNome, Tags: pq.StringArray(in.Tags),
				Status: status, Observacoes: in.Observacoes, CreatedBy: in.CreatedBy,
				CreatedAt: created, UpdatedAt: now,
			}
		},
	}
}

func newMaterialMarketingStore(db *gorm.DB) service.MaterialMarketingStore {
	return &genericUUIDStore[materialMarketingModel, service.MaterialMarketingDTO, service.MaterialMarketingInput]{
		repo: NewPostgresCRUDRepo[materialMarketingModel](db, "MaterialMarketing", crudListConfig{
			unidadeColumn: "unidade_id",
			searchColumns: []string{"titulo", "tipo", "campanha"},
			statusColumn:  "status",
			orderBy:       "titulo ASC",
		}),
		toDTO: func(m *materialMarketingModel) service.MaterialMarketingDTO { return toMaterialMarketingDTO(m) },
		fromInput: func(id uuid.UUID, in service.MaterialMarketingInput, now, created time.Time) *materialMarketingModel {
			status := in.Status
			if status == "" {
				status = "Rascunho"
			}
			return &materialMarketingModel{
				ID: id, Titulo: in.Titulo, Tipo: in.Tipo, ArquivoURL: in.ArquivoURL, ArquivoNome: in.ArquivoNome,
				Tags: pq.StringArray(in.Tags), Campanha: in.Campanha, UnidadeID: in.UnidadeID,
				Status: status, Observacoes: in.Observacoes, CreatedBy: in.CreatedBy,
				CreatedAt: created, UpdatedAt: now,
			}
		},
	}
}

func newLancamentoContabilStore(db *gorm.DB) service.LancamentoContabilStore {
	return &genericUUIDStore[lancamentoContabilModel, service.LancamentoContabilDTO, service.LancamentoContabilInput]{
		repo: NewPostgresCRUDRepo[lancamentoContabilModel](db, "LancamentoContabil", crudListConfig{
			unidadeColumn: "unidade_id",
			searchColumns: []string{"historico", "conta_nome", "documento"},
			orderBy:       "data DESC",
		}),
		toDTO: func(m *lancamentoContabilModel) service.LancamentoContabilDTO { return toLancamentoContabilDTO(m) },
		fromInput: func(id uuid.UUID, in service.LancamentoContabilInput, now, created time.Time) *lancamentoContabilModel {
			return &lancamentoContabilModel{
				ID: id, Data: in.Data, ContaCodigo: in.ContaCodigo, ContaNome: in.ContaNome,
				Debito: in.Debito, Credito: in.Credito, Historico: in.Historico, CentroCusto: in.CentroCusto,
				UnidadeID: in.UnidadeID, ProfissionalID: in.ProfissionalID, Convenio: in.Convenio,
				Documento: in.Documento, CreatedAt: created,
			}
		},
	}
}

// genericUUIDStore implementa CRUD padrão para entidades UUID.
type genericUUIDStore[M any, D any, I any] struct {
	repo      *PostgresCRUDRepo[M]
	toDTO     func(*M) D
	fromInput func(id uuid.UUID, in I, now, created time.Time) *M
}

func (s *genericUUIDStore[M, D, I]) Create(ctx context.Context, in I) (*D, error) {
	return s.CreateWithID(ctx, uuid.New(), in)
}

func (s *genericUUIDStore[M, D, I]) CreateWithID(ctx context.Context, id uuid.UUID, in I) (*D, error) {
	now := time.Now().UTC()
	m := s.fromInput(id, in, now, now)
	if err := s.repo.Save(ctx, m); err != nil {
		return nil, err
	}
	dto := s.toDTO(m)
	return &dto, nil
}

func (s *genericUUIDStore[M, D, I]) GetByID(ctx context.Context, id uuid.UUID) (*D, error) {
	m, err := s.repo.FindByID(ctx, id)
	if err != nil || m == nil {
		return nil, err
	}
	dto := s.toDTO(m)
	return &dto, nil
}

func (s *genericUUIDStore[M, D, I]) Update(ctx context.Context, id uuid.UUID, in I) (*D, error) {
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, nil
	}
	now := time.Now().UTC()
	created := extractCreatedAtGeneric(existing)
	m := s.fromInput(id, in, now, created)
	if err := s.repo.Update(ctx, m); err != nil {
		return nil, err
	}
	dto := s.toDTO(m)
	return &dto, nil
}

func (s *genericUUIDStore[M, D, I]) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *genericUUIDStore[M, D, I]) List(ctx context.Context, filter repository.CRUDListFilter) (*service.ListResult[D], error) {
	models, total, err := s.repo.List(ctx, filter)
	if err != nil {
		return nil, err
	}
	items := make([]D, 0, len(models))
	for _, m := range models {
		items = append(items, s.toDTO(m))
	}
	return buildListResult(items, total, filter), nil
}

func extractCreatedAtGeneric[M any](m *M) time.Time {
	switch v := any(m).(type) {
	case *anamneseModel:
		return v.CreatedAt
	case *categoriaFinanceiraModel:
		return v.CreatedAt
	case *centroCustoModel:
		return v.CreatedAt
	case *lancamentoModel:
		return v.CreatedAt
	case *relatorioOperacionalModel:
		return v.CreatedAt
	case *funcionarioCLTModel:
		return v.CreatedAt
	case *funcionarioPJModel:
		return v.CreatedAt
	case *folhaCLTModel:
		return v.CreatedAt
	case *folhaPJModel:
		return v.CreatedAt
	case *itemEstoqueModel:
		return v.CreatedAt
	case *comodatoModel:
		return v.CreatedAt
	case *planoSaudeModel:
		return v.CreatedAt
	case *acaoJudicialModel:
		return v.CreatedAt
	case *notaFiscalModel:
		return v.CreatedAt
	case *contratoModel:
		return v.CriadoEm
	case *manualModel:
		return v.CreatedAt
	case *materialMarketingModel:
		return v.CreatedAt
	case *lancamentoContabilModel:
		return v.CreatedAt
	default:
		return time.Now().UTC()
	}
}
