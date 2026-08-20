package dto

import (
	"encoding/json"
	"time"

	"espaco-terapia-os/backend/internal/application"
	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/domain/service"

	"github.com/google/uuid"
)

type WaveListQuery struct {
	UnidadeID      string `form:"unidade_id"`
	Query          string `form:"q"`
	Status         string `form:"status"`
	Page           int    `form:"page"`
	PageSize       int    `form:"page_size"`
	QuestionnaireID string `form:"questionnaire_id"`
	PatientID      string `form:"patient_id"`
	ItemID         string `form:"item_id"`
}

type CreateIDData struct {
	ID string `json:"id"`
}

type ItemRegimeRequest struct {
	ID             uuid.UUID `json:"id"`
	Medicamento    string    `json:"medicamento" binding:"required"`
	Via            string    `json:"via" binding:"required"`
	Dose           float64   `json:"dose" binding:"required"`
	DoseUnidade    string    `json:"dose_unidade" binding:"required"`
	Frequencia     string    `json:"frequencia" binding:"required"`
	Horario        *string   `json:"horario"`
	Duracao        *int      `json:"duracao"`
	DuracaoUnidade *string   `json:"duracao_unidade"`
	Orientacoes    *string   `json:"orientacoes"`
}

type TerapiaRequest struct {
	NomeTerapia           string              `json:"nome_terapia" binding:"required"`
	ObjetivoTerapeutico      string              `json:"objetivo_terapeutico" binding:"required"`
	DiretrizProtocolar       string              `json:"diretriz_protocolar" binding:"required"`
	CodigosReferencia        []string            `json:"codigos_referencia"`
	ItensRegime              []ItemRegimeRequest `json:"itens_regime" binding:"required,min=1"`
	RegraAjuste              *string             `json:"regra_ajuste"`
	Indicacoes               *string             `json:"indicacoes"`
	Contraindicacoes         *string             `json:"contraindicacoes"`
	InteracoesRelevantes     *string             `json:"interacoes_relevantes"`
	Monitorizacao            *string             `json:"monitorizacao"`
	EventosAdversos          *string             `json:"eventos_adversos"`
	NecessidadeConsentimento bool                `json:"necessidade_consentimento"`
	TextoConsentimento       *string             `json:"texto_consentimento"`
	Status                   string              `json:"status"`
	Versao                   int                 `json:"versao"`
	Anexos                   []string            `json:"anexos"`
	Tags                     []string            `json:"tags"`
	Observacoes              *string             `json:"observacoes"`
}

func (r *TerapiaRequest) ToServiceInput() service.TerapiaInput {
	items := make([]service.ItemRegimeDTO, 0, len(r.ItensRegime))
	for _, it := range r.ItensRegime {
		items = append(items, service.ItemRegimeDTO{
			ID: it.ID, Medicamento: it.Medicamento, Via: it.Via, Dose: it.Dose,
			DoseUnidade: it.DoseUnidade, Frequencia: it.Frequencia, Horario: it.Horario,
			Duracao: it.Duracao, DuracaoUnidade: it.DuracaoUnidade, Orientacoes: it.Orientacoes,
		})
	}
	return service.TerapiaInput{
		NomeTerapia: r.NomeTerapia, ObjetivoTerapeutico: r.ObjetivoTerapeutico,
		DiretrizProtocolar: r.DiretrizProtocolar, CodigosReferencia: r.CodigosReferencia,
		ItensRegime: items, RegraAjuste: r.RegraAjuste, Indicacoes: r.Indicacoes,
		Contraindicacoes: r.Contraindicacoes, InteracoesRelevantes: r.InteracoesRelevantes,
		Monitorizacao: r.Monitorizacao, EventosAdversos: r.EventosAdversos,
		NecessidadeConsentimento: r.NecessidadeConsentimento, TextoConsentimento: r.TextoConsentimento,
		Status: r.Status, Versao: r.Versao, Anexos: r.Anexos, Tags: r.Tags, Observacoes: r.Observacoes,
	}
}

type AnamneseRequest struct {
	Nome          string          `json:"nome" binding:"required"`
	Especialidade string          `json:"especialidade" binding:"required"`
	Versao        string          `json:"versao" binding:"required"`
	Status        string          `json:"status"`
	Questionnaire json.RawMessage `json:"questionnaire"`
	Observacoes   *string         `json:"observacoes"`
}

func (r *AnamneseRequest) ToServiceInput() service.AnamneseInput {
	return service.AnamneseInput{
		Nome: r.Nome, Especialidade: r.Especialidade, Versao: r.Versao,
		Status: r.Status, Questionnaire: r.Questionnaire, Observacoes: r.Observacoes,
	}
}

type RespostaAnamneseRequest struct {
	QuestionnaireID   uuid.UUID       `json:"questionnaire_id" binding:"required"`
	QuestionnaireNome string          `json:"questionnaire_nome" binding:"required"`
	PatientID         uuid.UUID       `json:"patient_id" binding:"required"`
	PatientNome       string          `json:"patient_nome" binding:"required"`
	EncounterID       *uuid.UUID      `json:"encounter_id"`
	Respostas         json.RawMessage `json:"respostas"`
	DataHora          *string         `json:"data_hora"`
}

func (r *RespostaAnamneseRequest) ToServiceInput() (service.RespostaAnamneseInput, error) {
	in := service.RespostaAnamneseInput{
		QuestionnaireID: r.QuestionnaireID, QuestionnaireNome: r.QuestionnaireNome,
		PatientID: r.PatientID, PatientNome: r.PatientNome, EncounterID: r.EncounterID,
		Respostas: r.Respostas,
	}
	if r.DataHora != nil && *r.DataHora != "" {
		t, err := time.Parse(time.RFC3339, *r.DataHora)
		if err != nil {
			return in, err
		}
		in.DataHora = &t
	}
	return in, nil
}

type CategoriaFinanceiraRequest struct {
	Nome      string  `json:"nome" binding:"required"`
	Tipo      string  `json:"tipo" binding:"required"`
	Cor       *string `json:"cor"`
	Descricao *string `json:"descricao"`
}

func (r *CategoriaFinanceiraRequest) ToServiceInput() service.CategoriaFinanceiraInput {
	return service.CategoriaFinanceiraInput{Nome: r.Nome, Tipo: r.Tipo, Cor: r.Cor, Descricao: r.Descricao}
}

type CentroCustoRequest struct {
	Codigo    string  `json:"codigo" binding:"required"`
	Nome      string  `json:"nome" binding:"required"`
	Descricao *string `json:"descricao"`
	Ativo     bool    `json:"ativo"`
}

func (r *CentroCustoRequest) ToServiceInput() service.CentroCustoInput {
	return service.CentroCustoInput{Codigo: r.Codigo, Nome: r.Nome, Descricao: r.Descricao, Ativo: r.Ativo}
}

type LancamentoRequest struct {
	Tipo                  string     `json:"tipo" binding:"required"`
	Descricao             string     `json:"descricao" binding:"required"`
	Valor                 float64    `json:"valor" binding:"required"`
	DataVencimento        string     `json:"data_vencimento" binding:"required"`
	DataPagamento         *string    `json:"data_pagamento"`
	CategoriaID           uuid.UUID  `json:"categoria_id" binding:"required"`
	CategoriaNome         string     `json:"categoria_nome" binding:"required"`
	CentroCustoID         *uuid.UUID `json:"centro_custo_id"`
	CentroCustoNome       *string    `json:"centro_custo_nome"`
	FormaPagamento        *string    `json:"forma_pagamento"`
	Documento             *string    `json:"documento"`
	Observacoes           *string    `json:"observacoes"`
	Status                string     `json:"status"`
	Recorrente            bool       `json:"recorrente"`
	FrequenciaRecorrencia *string    `json:"frequencia_recorrencia"`
	Parcelas              *int       `json:"parcelas"`
	ParcelaAtual          *int       `json:"parcela_atual"`
	AnexoURL              *string    `json:"anexo_url"`
	Conciliado            bool       `json:"conciliado"`
	DataConciliacao       *string    `json:"data_conciliacao"`
	UnidadeID             *uuid.UUID `json:"unidade_id"`
}

func (r *LancamentoRequest) ToServiceInput() (service.LancamentoInput, error) {
	dv, err := application.ParseDataNascimento(r.DataVencimento)
	if err != nil {
		return service.LancamentoInput{}, err
	}
	dp, err := parseOptionalDateStr(r.DataPagamento)
	if err != nil {
		return service.LancamentoInput{}, err
	}
	dc, err := parseOptionalDateStr(r.DataConciliacao)
	if err != nil {
		return service.LancamentoInput{}, err
	}
	return service.LancamentoInput{
		Tipo: r.Tipo, Descricao: r.Descricao, Valor: r.Valor, DataVencimento: dv,
		DataPagamento: dp, CategoriaID: r.CategoriaID, CategoriaNome: r.CategoriaNome,
		CentroCustoID: r.CentroCustoID, CentroCustoNome: r.CentroCustoNome,
		FormaPagamento: r.FormaPagamento, Documento: r.Documento, Observacoes: r.Observacoes,
		Status: r.Status, Recorrente: r.Recorrente, FrequenciaRecorrencia: r.FrequenciaRecorrencia,
		Parcelas: r.Parcelas, ParcelaAtual: r.ParcelaAtual, AnexoURL: r.AnexoURL,
		Conciliado: r.Conciliado, DataConciliacao: dc, UnidadeID: r.UnidadeID,
	}, nil
}

type RelatorioOperacionalRequest struct {
	Numero           string          `json:"numero" binding:"required"`
	PacienteNome     string          `json:"paciente_nome" binding:"required"`
	ProfissionalNome string          `json:"profissional_nome" binding:"required"`
	Terapia          string          `json:"terapia" binding:"required"`
	Periodo          string          `json:"periodo" binding:"required"`
	Valor            float64         `json:"valor" binding:"required"`
	Status           string          `json:"status"`
	UnidadeID        *uuid.UUID      `json:"unidade_id"`
	DataSubmissao    *string         `json:"data_submissao"`
	DataAprovacao    *string         `json:"data_aprovacao"`
	AprovadoPor      *string         `json:"aprovado_por"`
	Observacoes      *string         `json:"observacoes"`
	HistoricoVersoes json.RawMessage `json:"historico_versoes"`
}

func (r *RelatorioOperacionalRequest) ToServiceInput() (service.RelatorioOperacionalInput, error) {
	ds, err := parseOptionalDateStr(r.DataSubmissao)
	if err != nil {
		return service.RelatorioOperacionalInput{}, err
	}
	da, err := parseOptionalDateStr(r.DataAprovacao)
	if err != nil {
		return service.RelatorioOperacionalInput{}, err
	}
	return service.RelatorioOperacionalInput{
		Numero: r.Numero, PacienteNome: r.PacienteNome, ProfissionalNome: r.ProfissionalNome,
		Terapia: r.Terapia, Periodo: r.Periodo, Valor: r.Valor, Status: r.Status,
		UnidadeID: r.UnidadeID, DataSubmissao: ds, DataAprovacao: da,
		AprovadoPor: r.AprovadoPor, Observacoes: r.Observacoes, HistoricoVersoes: r.HistoricoVersoes,
	}, nil
}

type FuncionarioCLTRequest struct {
	UnidadeID       uuid.UUID `json:"unidade_id" binding:"required"`
	Nome            string    `json:"nome" binding:"required"`
	CPF             string    `json:"cpf" binding:"required"`
	Cargo           string    `json:"cargo" binding:"required"`
	SalarioBase     float64   `json:"salario_base" binding:"required"`
	DataAdmissao    string    `json:"data_admissao" binding:"required"`
	Ativo           bool      `json:"ativo"`
	Dependentes     int       `json:"dependentes"`
	ValeTransporte  bool      `json:"vale_transporte"`
	ValeAlimentacao float64   `json:"vale_alimentacao"`
}

func (r *FuncionarioCLTRequest) ToServiceInput() (service.FuncionarioCLTInput, error) {
	d, err := application.ParseDataNascimento(r.DataAdmissao)
	if err != nil {
		return service.FuncionarioCLTInput{}, err
	}
	return service.FuncionarioCLTInput{
		UnidadeID: r.UnidadeID, Nome: r.Nome, CPF: r.CPF, Cargo: r.Cargo,
		SalarioBase: r.SalarioBase, DataAdmissao: d, Ativo: r.Ativo,
		Dependentes: r.Dependentes, ValeTransporte: r.ValeTransporte, ValeAlimentacao: r.ValeAlimentacao,
	}, nil
}

type FuncionarioPJRequest struct {
	UnidadeID   uuid.UUID `json:"unidade_id" binding:"required"`
	Nome        string    `json:"nome" binding:"required"`
	CNPJ        string    `json:"cnpj" binding:"required"`
	RazaoSocial string    `json:"razao_social" binding:"required"`
	Servico     string    `json:"servico" binding:"required"`
	ValorHora   float64   `json:"valor_hora" binding:"required"`
	DataInicio  string    `json:"data_inicio" binding:"required"`
	Ativo       bool      `json:"ativo"`
}

func (r *FuncionarioPJRequest) ToServiceInput() (service.FuncionarioPJInput, error) {
	d, err := application.ParseDataNascimento(r.DataInicio)
	if err != nil {
		return service.FuncionarioPJInput{}, err
	}
	return service.FuncionarioPJInput{
		UnidadeID: r.UnidadeID, Nome: r.Nome, CNPJ: r.CNPJ, RazaoSocial: r.RazaoSocial,
		Servico: r.Servico, ValorHora: r.ValorHora, DataInicio: d, Ativo: r.Ativo,
	}, nil
}

type FolhaCLTRequest struct {
	FuncionarioID    uuid.UUID `json:"funcionario_id" binding:"required"`
	MesReferencia    string    `json:"mes_referencia" binding:"required"`
	SalarioBase      float64   `json:"salario_base" binding:"required"`
	HorasExtras      float64   `json:"horas_extras"`
	AdicionalNoturno float64   `json:"adicional_noturno"`
	OutrosProventos  float64   `json:"outros_proventos"`
	ValeTransporte   float64   `json:"vale_transporte"`
	ValeAlimentacao  float64   `json:"vale_alimentacao"`
	INSS             float64   `json:"inss"`
	FGTS             float64   `json:"fgts"`
	IRRF             float64   `json:"irrf"`
	OutrosDescontos  float64   `json:"outros_descontos"`
	SalarioLiquido   float64   `json:"salario_liquido"`
	DataPagamento    *string   `json:"data_pagamento"`
	Status           string    `json:"status"`
}

func (r *FolhaCLTRequest) ToServiceInput() (service.FolhaCLTInput, error) {
	dp, err := parseOptionalDateStr(r.DataPagamento)
	if err != nil {
		return service.FolhaCLTInput{}, err
	}
	return service.FolhaCLTInput{
		FuncionarioID: r.FuncionarioID, MesReferencia: r.MesReferencia, SalarioBase: r.SalarioBase,
		HorasExtras: r.HorasExtras, AdicionalNoturno: r.AdicionalNoturno, OutrosProventos: r.OutrosProventos,
		ValeTransporte: r.ValeTransporte, ValeAlimentacao: r.ValeAlimentacao,
		INSS: r.INSS, FGTS: r.FGTS, IRRF: r.IRRF, OutrosDescontos: r.OutrosDescontos,
		SalarioLiquido: r.SalarioLiquido, DataPagamento: dp, Status: r.Status,
	}, nil
}

type FolhaPJRequest struct {
	FuncionarioID     uuid.UUID `json:"funcionario_id" binding:"required"`
	MesReferencia     string    `json:"mes_referencia" binding:"required"`
	HorasTrabalhadas  float64   `json:"horas_trabalhadas" binding:"required"`
	ValorHora         float64   `json:"valor_hora" binding:"required"`
	ValorTotal        float64   `json:"valor_total"`
	RetencaoISS       float64   `json:"retencao_iss"`
	RetencaoIR        float64   `json:"retencao_ir"`
	ValorLiquido      float64   `json:"valor_liquido"`
	DataPagamento     *string   `json:"data_pagamento"`
	Status            string    `json:"status"`
	DescricaoServicos *string   `json:"descricao_servicos"`
}

func (r *FolhaPJRequest) ToServiceInput() (service.FolhaPJInput, error) {
	dp, err := parseOptionalDateStr(r.DataPagamento)
	if err != nil {
		return service.FolhaPJInput{}, err
	}
	return service.FolhaPJInput{
		FuncionarioID: r.FuncionarioID, MesReferencia: r.MesReferencia,
		HorasTrabalhadas: r.HorasTrabalhadas, ValorHora: r.ValorHora, ValorTotal: r.ValorTotal,
		RetencaoISS: r.RetencaoISS, RetencaoIR: r.RetencaoIR, ValorLiquido: r.ValorLiquido,
		DataPagamento: dp, Status: r.Status, DescricaoServicos: r.DescricaoServicos,
	}, nil
}

type ItemEstoqueRequest struct {
	UnidadeID     uuid.UUID `json:"unidade_id" binding:"required"`
	Codigo        string    `json:"codigo" binding:"required"`
	Nome          string    `json:"nome" binding:"required"`
	Categoria     string    `json:"categoria" binding:"required"`
	UnidadeMedida string    `json:"unidade_medida" binding:"required"`
	EstoqueAtual  int       `json:"estoque_atual"`
	EstoqueMinimo int       `json:"estoque_minimo"`
	Localizacao   *string   `json:"localizacao"`
	Status        string    `json:"status"`
}

func (r *ItemEstoqueRequest) ToServiceInput() service.ItemEstoqueInput {
	return service.ItemEstoqueInput{
		UnidadeID: r.UnidadeID, Codigo: r.Codigo, Nome: r.Nome, Categoria: r.Categoria,
		UnidadeMedida: r.UnidadeMedida, EstoqueAtual: r.EstoqueAtual, EstoqueMinimo: r.EstoqueMinimo,
		Localizacao: r.Localizacao, Status: r.Status,
	}
}

type MovimentacaoEstoqueRequest struct {
	ItemID          uuid.UUID `json:"item_id" binding:"required"`
	ItemNome        string    `json:"item_nome" binding:"required"`
	Tipo            string    `json:"tipo" binding:"required"`
	Quantidade      int       `json:"quantidade" binding:"required"`
	DataHora        string    `json:"data_hora"`
	Documento       *string   `json:"documento"`
	Motivo          string    `json:"motivo" binding:"required"`
	ResponsavelID   uuid.UUID `json:"responsavel_id" binding:"required"`
	ResponsavelNome string    `json:"responsavel_nome" binding:"required"`
	SaldoAtual      int       `json:"saldo_atual"`
}

func (r *MovimentacaoEstoqueRequest) ToServiceInput() (service.MovimentacaoEstoqueInput, error) {
	var dh time.Time
	var err error
	if r.DataHora != "" {
		dh, err = application.ParseDateTime(r.DataHora)
		if err != nil {
			return service.MovimentacaoEstoqueInput{}, err
		}
	}
	in := service.MovimentacaoEstoqueInput{
		ItemID: r.ItemID, ItemNome: r.ItemNome, Tipo: r.Tipo, Quantidade: r.Quantidade,
		DataHora: dh, Documento: r.Documento, Motivo: r.Motivo,
		ResponsavelID: r.ResponsavelID, ResponsavelNome: r.ResponsavelNome,
	}
	if r.Tipo == "Ajuste" {
		in.Quantidade = r.SaldoAtual
	}
	return in, nil
}

type InventarioContagemRequest struct {
	ItemID         uuid.UUID `json:"item_id" binding:"required"`
	ItemNome       string    `json:"item_nome" binding:"required"`
	EstoqueSistema int       `json:"estoque_sistema" binding:"required"`
	ContagemFisica int       `json:"contagem_fisica" binding:"required"`
}

type InventarioRequest struct {
	Data            string                      `json:"data" binding:"required"`
	ResponsavelID   uuid.UUID                   `json:"responsavel_id" binding:"required"`
	ResponsavelNome string                      `json:"responsavel_nome" binding:"required"`
	Contagens       []InventarioContagemRequest `json:"contagens"`
	Observacoes     *string                     `json:"observacoes"`
}

func (r *InventarioRequest) ToServiceInput() (service.InventarioInput, error) {
	d, err := application.ParseDataNascimento(r.Data)
	if err != nil {
		return service.InventarioInput{}, err
	}
	contagens := make([]service.InventarioContagemDTO, 0, len(r.Contagens))
	for _, c := range r.Contagens {
		contagens = append(contagens, service.InventarioContagemDTO{
			ItemID: c.ItemID, ItemNome: c.ItemNome,
			EstoqueSistema: c.EstoqueSistema, ContagemFisica: c.ContagemFisica,
			Divergencia: c.ContagemFisica - c.EstoqueSistema,
		})
	}
	return service.InventarioInput{
		Data: d, ResponsavelID: r.ResponsavelID, ResponsavelNome: r.ResponsavelNome,
		Contagens: contagens, Observacoes: r.Observacoes,
	}, nil
}

type ComodatoRequest struct {
	ItemID                *uuid.UUID `json:"item_id"`
	ItemNome              string     `json:"item_nome" binding:"required"`
	Descricao             *string    `json:"descricao"`
	PacienteID            uuid.UUID  `json:"paciente_id" binding:"required"`
	PacienteNome          string     `json:"paciente_nome" binding:"required"`
	DataEmprestimo        string     `json:"data_emprestimo" binding:"required"`
	DataDevolucaoPrevista string     `json:"data_devolucao_prevista" binding:"required"`
	DataDevolucaoReal     *string    `json:"data_devolucao_real"`
	Status                string     `json:"status"`
	CondicaoEntrega       string     `json:"condicao_entrega" binding:"required"`
	CondicaoDevolucao     *string    `json:"condicao_devolucao"`
	Observacoes           *string    `json:"observacoes"`
	ResponsavelID         uuid.UUID  `json:"responsavel_id" binding:"required"`
	ResponsavelNome       string     `json:"responsavel_nome" binding:"required"`
	NumeroSerie           *string    `json:"numero_serie"`
	Quantidade            int        `json:"quantidade"`
}

func (r *ComodatoRequest) ToServiceInput() (service.ComodatoInput, error) {
	de, err := application.ParseDataNascimento(r.DataEmprestimo)
	if err != nil {
		return service.ComodatoInput{}, err
	}
	dp, err := application.ParseDataNascimento(r.DataDevolucaoPrevista)
	if err != nil {
		return service.ComodatoInput{}, err
	}
	dr, err := parseOptionalDateStr(r.DataDevolucaoReal)
	if err != nil {
		return service.ComodatoInput{}, err
	}
	return service.ComodatoInput{
		ItemID: r.ItemID, ItemNome: r.ItemNome, Descricao: r.Descricao,
		PacienteID: r.PacienteID, PacienteNome: r.PacienteNome,
		DataEmprestimo: de, DataDevolucaoPrevista: dp, DataDevolucaoReal: dr, Status: r.Status,
		CondicaoEntrega: r.CondicaoEntrega, CondicaoDevolucao: r.CondicaoDevolucao,
		Observacoes: r.Observacoes, ResponsavelID: r.ResponsavelID, ResponsavelNome: r.ResponsavelNome,
		NumeroSerie: r.NumeroSerie, Quantidade: r.Quantidade,
	}, nil
}

type PlanoSaudeRequest struct {
	Nome        string  `json:"nome" binding:"required"`
	CNPJ        string  `json:"cnpj" binding:"required"`
	RegistroANS string  `json:"registro_ans" binding:"required"`
	Telefone    string  `json:"telefone" binding:"required"`
	Email       string  `json:"email" binding:"required"`
	Endereco    string  `json:"endereco" binding:"required"`
	Ativo       bool    `json:"ativo"`
	Observacoes *string `json:"observacoes"`
}

func (r *PlanoSaudeRequest) ToServiceInput() service.PlanoSaudeInput {
	return service.PlanoSaudeInput{
		Nome: r.Nome, CNPJ: r.CNPJ, RegistroANS: r.RegistroANS, Telefone: r.Telefone,
		Email: r.Email, Endereco: r.Endereco, Ativo: r.Ativo, Observacoes: r.Observacoes,
	}
}

type AcaoJudicialRequest struct {
	NumeroProcesso string     `json:"numero_processo" binding:"required"`
	PlanoSaudeID   uuid.UUID  `json:"plano_saude_id" binding:"required"`
	PlanoSaudeNome string     `json:"plano_saude_nome" binding:"required"`
	ValorAcao      float64    `json:"valor_acao" binding:"required"`
	DataEntrada    string     `json:"data_entrada" binding:"required"`
	DataSentenca   *string    `json:"data_sentenca"`
	Status         string     `json:"status"`
	Descricao      string     `json:"descricao" binding:"required"`
	Observacoes    *string    `json:"observacoes"`
}

func (r *AcaoJudicialRequest) ToServiceInput() (service.AcaoJudicialInput, error) {
	de, err := application.ParseDataNascimento(r.DataEntrada)
	if err != nil {
		return service.AcaoJudicialInput{}, err
	}
	ds, err := parseOptionalDateStr(r.DataSentenca)
	if err != nil {
		return service.AcaoJudicialInput{}, err
	}
	return service.AcaoJudicialInput{
		NumeroProcesso: r.NumeroProcesso, PlanoSaudeID: r.PlanoSaudeID, PlanoSaudeNome: r.PlanoSaudeNome,
		ValorAcao: r.ValorAcao, DataEntrada: de, DataSentenca: ds, Status: r.Status,
		Descricao: r.Descricao, Observacoes: r.Observacoes,
	}, nil
}

type NotaFiscalRequest struct {
	NumeroNota     string     `json:"numero_nota" binding:"required"`
	PlanoSaudeID   uuid.UUID  `json:"plano_saude_id" binding:"required"`
	PlanoSaudeNome string     `json:"plano_saude_nome" binding:"required"`
	PacienteNome   string     `json:"paciente_nome" binding:"required"`
	DataEmissao    string     `json:"data_emissao" binding:"required"`
	DataVencimento string     `json:"data_vencimento" binding:"required"`
	ValorServico   float64    `json:"valor_servico" binding:"required"`
	ValorPago      *float64   `json:"valor_pago"`
	Status         string     `json:"status"`
	AcaoJudicialID *uuid.UUID `json:"acao_judicial_id"`
	Observacoes    *string    `json:"observacoes"`
}

type ConciliarNotaRequest struct {
	AcaoJudicialID uuid.UUID `json:"acao_judicial_id" binding:"required"`
	ValorPago      float64   `json:"valor_pago"`
}

func (r *NotaFiscalRequest) ToServiceInput() (service.NotaFiscalInput, error) {
	de, err := application.ParseDataNascimento(r.DataEmissao)
	if err != nil {
		return service.NotaFiscalInput{}, err
	}
	dv, err := application.ParseDataNascimento(r.DataVencimento)
	if err != nil {
		return service.NotaFiscalInput{}, err
	}
	return service.NotaFiscalInput{
		NumeroNota: r.NumeroNota, PlanoSaudeID: r.PlanoSaudeID, PlanoSaudeNome: r.PlanoSaudeNome,
		PacienteNome: r.PacienteNome, DataEmissao: de, DataVencimento: dv,
		ValorServico: r.ValorServico, ValorPago: r.ValorPago, Status: r.Status,
		AcaoJudicialID: r.AcaoJudicialID, Observacoes: r.Observacoes,
	}, nil
}

type ManualRequest struct {
	Titulo      string   `json:"titulo" binding:"required"`
	Versao      string   `json:"versao" binding:"required"`
	PublicoAlvo string   `json:"publico_alvo" binding:"required"`
	ArquivoURL  string   `json:"arquivo_url" binding:"required"`
	ArquivoNome string   `json:"arquivo_nome" binding:"required"`
	Tags        []string `json:"tags"`
	Status      string   `json:"status"`
	Observacoes *string  `json:"observacoes"`
}

func (r *ManualRequest) ToServiceInput(createdBy uuid.UUID) service.ManualInput {
	return service.ManualInput{
		Titulo: r.Titulo, Versao: r.Versao, PublicoAlvo: r.PublicoAlvo,
		ArquivoURL: r.ArquivoURL, ArquivoNome: r.ArquivoNome, Tags: r.Tags,
		Status: r.Status, Observacoes: r.Observacoes, CreatedBy: createdBy,
	}
}

type MaterialMarketingRequest struct {
	Titulo      string     `json:"titulo" binding:"required"`
	Tipo        string     `json:"tipo" binding:"required"`
	ArquivoURL  string     `json:"arquivo_url" binding:"required"`
	ArquivoNome string     `json:"arquivo_nome" binding:"required"`
	Tags        []string   `json:"tags"`
	Campanha    *string    `json:"campanha"`
	UnidadeID   *uuid.UUID `json:"unidade_id"`
	Status      string     `json:"status"`
	Observacoes *string    `json:"observacoes"`
}

func (r *MaterialMarketingRequest) ToServiceInput(createdBy uuid.UUID) service.MaterialMarketingInput {
	return service.MaterialMarketingInput{
		Titulo: r.Titulo, Tipo: r.Tipo, ArquivoURL: r.ArquivoURL, ArquivoNome: r.ArquivoNome,
		Tags: r.Tags, Campanha: r.Campanha, UnidadeID: r.UnidadeID, Status: r.Status,
		Observacoes: r.Observacoes, CreatedBy: createdBy,
	}
}

type ContaContabilRequest struct {
	Codigo   string  `json:"codigo" binding:"required"`
	Nome     string  `json:"nome" binding:"required"`
	Tipo     string  `json:"tipo" binding:"required"`
	Natureza string  `json:"natureza" binding:"required"`
	Pai      *string `json:"pai"`
}

func (r *ContaContabilRequest) ToServiceInput() service.ContaContabilInput {
	return service.ContaContabilInput{Codigo: r.Codigo, Nome: r.Nome, Tipo: r.Tipo, Natureza: r.Natureza, Pai: r.Pai}
}

type LancamentoContabilRequest struct {
	Data           string     `json:"data" binding:"required"`
	ContaCodigo    string     `json:"conta_codigo" binding:"required"`
	ContaNome      string     `json:"conta_nome" binding:"required"`
	Debito         float64    `json:"debito"`
	Credito        float64    `json:"credito"`
	Historico      string     `json:"historico" binding:"required"`
	CentroCusto    *string    `json:"centro_custo"`
	UnidadeID      *uuid.UUID `json:"unidade_id"`
	ProfissionalID *uuid.UUID `json:"profissional_id"`
	Convenio       *string    `json:"convenio"`
	Documento      *string    `json:"documento"`
}

func (r *LancamentoContabilRequest) ToServiceInput() (service.LancamentoContabilInput, error) {
	d, err := application.ParseDataNascimento(r.Data)
	if err != nil {
		return service.LancamentoContabilInput{}, err
	}
	return service.LancamentoContabilInput{
		Data: d, ContaCodigo: r.ContaCodigo, ContaNome: r.ContaNome,
		Debito: r.Debito, Credito: r.Credito, Historico: r.Historico, CentroCusto: r.CentroCusto,
		UnidadeID: r.UnidadeID, ProfissionalID: r.ProfissionalID, Convenio: r.Convenio, Documento: r.Documento,
	}, nil
}

func parseOptionalDateStr(s *string) (*time.Time, error) {
	if s == nil || *s == "" {
		return nil, nil
	}
	t, err := application.ParseDataNascimento(*s)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func WaveListFilterFromQuery(q WaveListQuery) (repository.CRUDListFilter, error) {
	f := repository.CRUDListFilter{Query: q.Query, Status: q.Status, Page: q.Page, PageSize: q.PageSize}
	if q.UnidadeID != "" {
		uid, err := uuid.Parse(q.UnidadeID)
		if err != nil {
			return f, err
		}
		f.UnidadeID = &uid
	}
	return f, nil
}
