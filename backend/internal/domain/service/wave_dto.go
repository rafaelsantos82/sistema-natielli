package service

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// ListResult resultado paginado genérico Wave 2/3.
type ListResult[T any] struct {
	Items      []T   `json:"items"`
	Total      int64 `json:"-"`
	Page       int   `json:"-"`
	PageSize   int   `json:"-"`
	TotalPages int   `json:"-"`
}

// ── Terapias ──────────────────────────────────────────────────────────────

type ItemRegimeDTO struct {
	ID             uuid.UUID `json:"id,omitempty"`
	Medicamento    string    `json:"medicamento"`
	Via            string    `json:"via"`
	Dose           float64   `json:"dose"`
	DoseUnidade    string    `json:"dose_unidade"`
	Frequencia     string    `json:"frequencia"`
	Horario        *string   `json:"horario,omitempty"`
	Duracao        *int      `json:"duracao,omitempty"`
	DuracaoUnidade *string   `json:"duracao_unidade,omitempty"`
	Orientacoes    *string   `json:"orientacoes,omitempty"`
}

type TerapiaDTO struct {
	ID                       uuid.UUID       `json:"id"`
	NomeTerapia           string          `json:"nome_terapia"`
	ObjetivoTerapeutico      string          `json:"objetivo_terapeutico"`
	DiretrizProtocolar       string          `json:"diretriz_protocolar"`
	CodigosReferencia        []string        `json:"codigos_referencia,omitempty"`
	ItensRegime              []ItemRegimeDTO `json:"itens_regime"`
	RegraAjuste              *string         `json:"regra_ajuste,omitempty"`
	Indicacoes               *string         `json:"indicacoes,omitempty"`
	Contraindicacoes         *string         `json:"contraindicacoes,omitempty"`
	InteracoesRelevantes     *string         `json:"interacoes_relevantes,omitempty"`
	Monitorizacao            *string         `json:"monitorizacao,omitempty"`
	EventosAdversos          *string         `json:"eventos_adversos,omitempty"`
	NecessidadeConsentimento bool            `json:"necessidade_consentimento"`
	TextoConsentimento       *string         `json:"texto_consentimento,omitempty"`
	Status                   string          `json:"status"`
	Versao                   int             `json:"versao"`
	Anexos                   []string        `json:"anexos,omitempty"`
	Tags                     []string        `json:"tags,omitempty"`
	Observacoes              *string         `json:"observacoes,omitempty"`
	CreatedAt                string          `json:"created_at"`
	UpdatedAt                string          `json:"updated_at"`
}

type TerapiaInput struct {
	NomeTerapia           string
	ObjetivoTerapeutico      string
	DiretrizProtocolar       string
	CodigosReferencia        []string
	ItensRegime              []ItemRegimeDTO
	RegraAjuste              *string
	Indicacoes               *string
	Contraindicacoes         *string
	InteracoesRelevantes     *string
	Monitorizacao            *string
	EventosAdversos          *string
	NecessidadeConsentimento bool
	TextoConsentimento       *string
	Status                   string
	Versao                   int
	Anexos                   []string
	Tags                     []string
	Observacoes              *string
}

func formatDate(t time.Time) string {
	if t.IsZero() {
		return ""
	}
	return t.Format("2006-01-02")
}

func formatDateTime(t time.Time) string {
	if t.IsZero() {
		return ""
	}
	return t.UTC().Format(time.RFC3339)
}

func parseDate(s string) (time.Time, error) {
	return time.Parse("2006-01-02", s)
}

func parseOptionalDate(s *string) (*time.Time, error) {
	if s == nil || *s == "" {
		return nil, nil
	}
	t, err := parseDate(*s)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func jsonRaw(v any) json.RawMessage {
	b, _ := json.Marshal(v)
	return b
}

// ── Anamneses ────────────────────────────────────────────────────────────────

type AnamneseDTO struct {
	ID            uuid.UUID       `json:"id"`
	Nome          string          `json:"nome"`
	Especialidade string          `json:"especialidade"`
	Versao        string          `json:"versao"`
	Status        string          `json:"status"`
	Questionnaire json.RawMessage `json:"questionnaire"`
	Observacoes   *string         `json:"observacoes,omitempty"`
	CreatedAt     string          `json:"created_at"`
	UpdatedAt     string          `json:"updated_at"`
}

type AnamneseInput struct {
	Nome          string
	Especialidade string
	Versao        string
	Status        string
	Questionnaire json.RawMessage
	Observacoes   *string
}

type RespostaAnamneseDTO struct {
	ID                uuid.UUID       `json:"id"`
	QuestionnaireID   uuid.UUID       `json:"questionnaire_id"`
	QuestionnaireNome string          `json:"questionnaire_nome"`
	PatientID         uuid.UUID       `json:"patient_id"`
	PatientNome       string          `json:"patient_nome"`
	EncounterID       *uuid.UUID      `json:"encounter_id,omitempty"`
	Respostas         json.RawMessage `json:"respostas"`
	DataHora          string          `json:"data_hora"`
	CreatedAt         string          `json:"created_at"`
}

type RespostaAnamneseInput struct {
	QuestionnaireID   uuid.UUID
	QuestionnaireNome string
	PatientID         uuid.UUID
	PatientNome       string
	EncounterID       *uuid.UUID
	Respostas         json.RawMessage
	DataHora          *time.Time
}

// ── Financeiro ───────────────────────────────────────────────────────────────

type CategoriaFinanceiraDTO struct {
	ID        uuid.UUID `json:"id"`
	Nome      string    `json:"nome"`
	Tipo      string    `json:"tipo"`
	Cor       *string   `json:"cor,omitempty"`
	Descricao *string   `json:"descricao,omitempty"`
	CreatedAt string    `json:"created_at"`
	UpdatedAt string    `json:"updated_at"`
}

type CategoriaFinanceiraInput struct {
	Nome      string
	Tipo      string
	Cor       *string
	Descricao *string
}

type CentroCustoDTO struct {
	ID        uuid.UUID `json:"id"`
	Codigo    string    `json:"codigo"`
	Nome      string    `json:"nome"`
	Descricao *string   `json:"descricao,omitempty"`
	Ativo     bool      `json:"ativo"`
	CreatedAt string    `json:"created_at"`
	UpdatedAt string    `json:"updated_at"`
}

type CentroCustoInput struct {
	Codigo    string
	Nome      string
	Descricao *string
	Ativo     bool
}

type LancamentoDTO struct {
	ID                    uuid.UUID  `json:"id"`
	Tipo                  string     `json:"tipo"`
	Descricao             string     `json:"descricao"`
	Valor                 float64    `json:"valor"`
	DataVencimento        string     `json:"data_vencimento"`
	DataPagamento         *string    `json:"data_pagamento,omitempty"`
	CategoriaID           uuid.UUID  `json:"categoria_id"`
	CategoriaNome         string     `json:"categoria_nome"`
	CentroCustoID         *uuid.UUID `json:"centro_custo_id,omitempty"`
	CentroCustoNome       *string    `json:"centro_custo_nome,omitempty"`
	FormaPagamento        *string    `json:"forma_pagamento,omitempty"`
	Documento             *string    `json:"documento,omitempty"`
	Observacoes           *string    `json:"observacoes,omitempty"`
	Status                string     `json:"status"`
	Recorrente            bool       `json:"recorrente"`
	FrequenciaRecorrencia *string    `json:"frequencia_recorrencia,omitempty"`
	Parcelas              *int       `json:"parcelas,omitempty"`
	ParcelaAtual          *int       `json:"parcela_atual,omitempty"`
	AnexoURL              *string    `json:"anexo_url,omitempty"`
	Conciliado            bool       `json:"conciliado"`
	DataConciliacao       *string    `json:"data_conciliacao,omitempty"`
	UnidadeID             *uuid.UUID `json:"unidade_id,omitempty"`
	CreatedAt             string     `json:"created_at"`
	UpdatedAt             string     `json:"updated_at"`
}

type LancamentoInput struct {
	Tipo                  string
	Descricao             string
	Valor                 float64
	DataVencimento        time.Time
	DataPagamento         *time.Time
	CategoriaID           uuid.UUID
	CategoriaNome         string
	CentroCustoID         *uuid.UUID
	CentroCustoNome       *string
	FormaPagamento        *string
	Documento             *string
	Observacoes           *string
	Status                string
	Recorrente            bool
	FrequenciaRecorrencia *string
	Parcelas              *int
	ParcelaAtual          *int
	AnexoURL              *string
	Conciliado            bool
	DataConciliacao       *time.Time
	UnidadeID             *uuid.UUID
}

type RelatorioOperacionalDTO struct {
	ID               uuid.UUID       `json:"id"`
	Numero           string          `json:"numero"`
	PacienteNome     string          `json:"paciente_nome"`
	ProfissionalNome string          `json:"profissional_nome"`
	Terapia          string          `json:"terapia"`
	Periodo          string          `json:"periodo"`
	Valor            float64         `json:"valor"`
	Status           string          `json:"status"`
	UnidadeID        *uuid.UUID      `json:"unidade_id,omitempty"`
	DataSubmissao    *string         `json:"data_submissao,omitempty"`
	DataAprovacao    *string         `json:"data_aprovacao,omitempty"`
	AprovadoPor      *string         `json:"aprovado_por,omitempty"`
	Observacoes      *string         `json:"observacoes,omitempty"`
	HistoricoVersoes json.RawMessage `json:"historico_versoes,omitempty"`
	CreatedAt        string          `json:"created_at"`
	UpdatedAt        string          `json:"updated_at"`
}

type RelatorioOperacionalInput struct {
	Numero           string
	PacienteNome     string
	ProfissionalNome string
	Terapia          string
	Periodo          string
	Valor            float64
	Status           string
	UnidadeID        *uuid.UUID
	DataSubmissao    *time.Time
	DataAprovacao    *time.Time
	AprovadoPor      *string
	Observacoes      *string
	HistoricoVersoes json.RawMessage
}

// ── RH ───────────────────────────────────────────────────────────────────────

type FuncionarioCLTDTO struct {
	ID              uuid.UUID `json:"id"`
	UnidadeID       uuid.UUID `json:"unidade_id"`
	Nome            string    `json:"nome"`
	CPF             string    `json:"cpf"`
	Cargo           string    `json:"cargo"`
	SalarioBase     float64   `json:"salario_base"`
	DataAdmissao    string    `json:"data_admissao"`
	Ativo           bool      `json:"ativo"`
	Dependentes     int       `json:"dependentes"`
	ValeTransporte  bool      `json:"vale_transporte"`
	ValeAlimentacao float64   `json:"vale_alimentacao"`
	CreatedAt       string    `json:"created_at"`
	UpdatedAt       string    `json:"updated_at"`
}

type FuncionarioCLTInput struct {
	UnidadeID       uuid.UUID
	Nome            string
	CPF             string
	Cargo           string
	SalarioBase     float64
	DataAdmissao    time.Time
	Ativo           bool
	Dependentes     int
	ValeTransporte  bool
	ValeAlimentacao float64
}

type FuncionarioPJDTO struct {
	ID          uuid.UUID `json:"id"`
	UnidadeID   uuid.UUID `json:"unidade_id"`
	Nome        string    `json:"nome"`
	CNPJ        string    `json:"cnpj"`
	RazaoSocial string    `json:"razao_social"`
	Servico     string    `json:"servico"`
	ValorHora   float64   `json:"valor_hora"`
	DataInicio  string    `json:"data_inicio"`
	Ativo       bool      `json:"ativo"`
	CreatedAt   string    `json:"created_at"`
	UpdatedAt   string    `json:"updated_at"`
}

type FuncionarioPJInput struct {
	UnidadeID   uuid.UUID
	Nome        string
	CNPJ        string
	RazaoSocial string
	Servico     string
	ValorHora   float64
	DataInicio  time.Time
	Ativo       bool
}

type FolhaCLTDTO struct {
	ID               uuid.UUID `json:"id"`
	FuncionarioID    uuid.UUID `json:"funcionario_id"`
	MesReferencia    string    `json:"mes_referencia"`
	SalarioBase      float64   `json:"salario_base"`
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
	DataPagamento    *string   `json:"data_pagamento,omitempty"`
	Status           string    `json:"status"`
	CreatedAt        string    `json:"created_at"`
	UpdatedAt        string    `json:"updated_at"`
}

type FolhaCLTInput struct {
	FuncionarioID    uuid.UUID
	MesReferencia    string
	SalarioBase      float64
	HorasExtras      float64
	AdicionalNoturno float64
	OutrosProventos  float64
	ValeTransporte   float64
	ValeAlimentacao  float64
	INSS             float64
	FGTS             float64
	IRRF             float64
	OutrosDescontos  float64
	SalarioLiquido   float64
	DataPagamento    *time.Time
	Status           string
}

type FolhaPJDTO struct {
	ID                uuid.UUID `json:"id"`
	FuncionarioID     uuid.UUID `json:"funcionario_id"`
	MesReferencia     string    `json:"mes_referencia"`
	HorasTrabalhadas  float64   `json:"horas_trabalhadas"`
	ValorHora         float64   `json:"valor_hora"`
	ValorTotal        float64   `json:"valor_total"`
	RetencaoISS       float64   `json:"retencao_iss"`
	RetencaoIR        float64   `json:"retencao_ir"`
	ValorLiquido      float64   `json:"valor_liquido"`
	DataPagamento     *string   `json:"data_pagamento,omitempty"`
	Status            string    `json:"status"`
	DescricaoServicos *string   `json:"descricao_servicos,omitempty"`
	CreatedAt         string    `json:"created_at"`
	UpdatedAt         string    `json:"updated_at"`
}

type FolhaPJInput struct {
	FuncionarioID     uuid.UUID
	MesReferencia     string
	HorasTrabalhadas  float64
	ValorHora         float64
	ValorTotal        float64
	RetencaoISS       float64
	RetencaoIR        float64
	ValorLiquido      float64
	DataPagamento     *time.Time
	Status            string
	DescricaoServicos *string
}

// ── Estoque ──────────────────────────────────────────────────────────────────

type ItemEstoqueDTO struct {
	ID            uuid.UUID `json:"id"`
	UnidadeID     uuid.UUID `json:"unidade_id"`
	Codigo        string    `json:"codigo"`
	Nome          string    `json:"nome"`
	Categoria     string    `json:"categoria"`
	UnidadeMedida string    `json:"unidade_medida"`
	EstoqueAtual  int       `json:"estoque_atual"`
	EstoqueMinimo int       `json:"estoque_minimo"`
	Localizacao   *string   `json:"localizacao,omitempty"`
	Status        string    `json:"status"`
	CreatedAt     string    `json:"created_at"`
	UpdatedAt     string    `json:"updated_at"`
}

type ItemEstoqueInput struct {
	UnidadeID     uuid.UUID
	Codigo        string
	Nome          string
	Categoria     string
	UnidadeMedida string
	EstoqueAtual  int
	EstoqueMinimo int
	Localizacao   *string
	Status        string
}

type MovimentacaoEstoqueDTO struct {
	ID              uuid.UUID `json:"id"`
	ItemID          uuid.UUID `json:"item_id"`
	ItemNome        string    `json:"item_nome"`
	Tipo            string    `json:"tipo"`
	Quantidade      int       `json:"quantidade"`
	DataHora        string    `json:"data_hora"`
	Documento       *string   `json:"documento,omitempty"`
	Motivo          string    `json:"motivo"`
	ResponsavelID   uuid.UUID `json:"responsavel_id"`
	ResponsavelNome string    `json:"responsavel_nome"`
	SaldoAnterior   int       `json:"saldo_anterior"`
	SaldoAtual      int       `json:"saldo_atual"`
	CreatedAt       string    `json:"created_at"`
}

type MovimentacaoEstoqueInput struct {
	ItemID          uuid.UUID
	ItemNome        string
	Tipo            string
	Quantidade      int
	DataHora        time.Time
	Documento       *string
	Motivo          string
	ResponsavelID   uuid.UUID
	ResponsavelNome string
}

type InventarioContagemDTO struct {
	ItemID         uuid.UUID `json:"item_id"`
	ItemNome       string    `json:"item_nome"`
	EstoqueSistema int       `json:"estoque_sistema"`
	ContagemFisica int       `json:"contagem_fisica"`
	Divergencia    int       `json:"divergencia"`
}

type InventarioDTO struct {
	ID              uuid.UUID               `json:"id"`
	Data            string                  `json:"data"`
	ResponsavelID   uuid.UUID               `json:"responsavel_id"`
	ResponsavelNome string                  `json:"responsavel_nome"`
	Contagens       []InventarioContagemDTO `json:"contagens"`
	Observacoes     *string                 `json:"observacoes,omitempty"`
	CreatedAt       string                  `json:"created_at"`
}

type InventarioInput struct {
	Data            time.Time
	ResponsavelID   uuid.UUID
	ResponsavelNome string
	Contagens       []InventarioContagemDTO
	Observacoes     *string
}

// ── Comodato ─────────────────────────────────────────────────────────────────

type ComodatoDTO struct {
	ID                    uuid.UUID  `json:"id"`
	ItemID                *uuid.UUID `json:"item_id,omitempty"`
	ItemNome              string     `json:"item_nome"`
	Descricao             *string    `json:"descricao,omitempty"`
	PacienteID            uuid.UUID  `json:"paciente_id"`
	PacienteNome          string     `json:"paciente_nome"`
	DataEmprestimo        string     `json:"data_emprestimo"`
	DataDevolucaoPrevista string     `json:"data_devolucao_prevista"`
	DataDevolucaoReal     *string    `json:"data_devolucao_real,omitempty"`
	Status                string     `json:"status"`
	CondicaoEntrega       string     `json:"condicao_entrega"`
	CondicaoDevolucao     *string    `json:"condicao_devolucao,omitempty"`
	Observacoes           *string    `json:"observacoes,omitempty"`
	ResponsavelID         uuid.UUID  `json:"responsavel_id"`
	ResponsavelNome       string     `json:"responsavel_nome"`
	NumeroSerie           *string    `json:"numero_serie,omitempty"`
	Quantidade            int        `json:"quantidade"`
	CreatedAt             string     `json:"created_at"`
	UpdatedAt             string     `json:"updated_at"`
}

type ComodatoInput struct {
	ItemID                *uuid.UUID
	ItemNome              string
	Descricao             *string
	PacienteID            uuid.UUID
	PacienteNome          string
	DataEmprestimo        time.Time
	DataDevolucaoPrevista time.Time
	DataDevolucaoReal     *time.Time
	Status                string
	CondicaoEntrega       string
	CondicaoDevolucao     *string
	Observacoes           *string
	ResponsavelID         uuid.UUID
	ResponsavelNome       string
	NumeroSerie           *string
	Quantidade            int
}

// ── Planos / Jurídico / NF ───────────────────────────────────────────────────

type PlanoSaudeDTO struct {
	ID          uuid.UUID `json:"id"`
	Nome        string    `json:"nome"`
	CNPJ        string    `json:"cnpj"`
	RegistroANS string    `json:"registro_ans"`
	Telefone    string    `json:"telefone"`
	Email       string    `json:"email"`
	Endereco    string    `json:"endereco"`
	Ativo       bool      `json:"ativo"`
	Observacoes *string   `json:"observacoes,omitempty"`
	CreatedAt   string    `json:"created_at"`
	UpdatedAt   string    `json:"updated_at"`
}

type PlanoSaudeInput struct {
	Nome        string
	CNPJ        string
	RegistroANS string
	Telefone    string
	Email       string
	Endereco    string
	Ativo       bool
	Observacoes *string
}

type AcaoJudicialDTO struct {
	ID             uuid.UUID `json:"id"`
	NumeroProcesso string    `json:"numero_processo"`
	PlanoSaudeID   uuid.UUID `json:"plano_saude_id"`
	PlanoSaudeNome string    `json:"plano_saude_nome"`
	ValorAcao      float64   `json:"valor_acao"`
	DataEntrada    string    `json:"data_entrada"`
	DataSentenca   *string   `json:"data_sentenca,omitempty"`
	Status         string    `json:"status"`
	Descricao      string    `json:"descricao"`
	Observacoes    *string   `json:"observacoes,omitempty"`
	CreatedAt      string    `json:"created_at"`
	UpdatedAt      string    `json:"updated_at"`
}

type AcaoJudicialInput struct {
	NumeroProcesso string
	PlanoSaudeID   uuid.UUID
	PlanoSaudeNome string
	ValorAcao      float64
	DataEntrada    time.Time
	DataSentenca   *time.Time
	Status         string
	Descricao      string
	Observacoes    *string
}

type NotaFiscalDTO struct {
	ID              uuid.UUID  `json:"id"`
	NumeroNota      string     `json:"numero_nota"`
	PlanoSaudeID    uuid.UUID  `json:"plano_saude_id"`
	PlanoSaudeNome  string     `json:"plano_saude_nome"`
	PacienteNome    string     `json:"paciente_nome"`
	DataEmissao     string     `json:"data_emissao"`
	DataVencimento  string     `json:"data_vencimento"`
	ValorServico    float64    `json:"valor_servico"`
	ValorPago       *float64   `json:"valor_pago,omitempty"`
	Status          string     `json:"status"`
	AcaoJudicialID  *uuid.UUID `json:"acao_judicial_id,omitempty"`
	DataConciliacao *string    `json:"data_conciliacao,omitempty"`
	Observacoes     *string    `json:"observacoes,omitempty"`
	CreatedAt       string     `json:"created_at"`
	UpdatedAt       string     `json:"updated_at"`
}

// ConciliacaoAcaoResumoDTO agrega totais de pagamento por ação judicial.
type ConciliacaoAcaoResumoDTO struct {
	AcaoJudicial         AcaoJudicialDTO `json:"acao_judicial"`
	ValorNotasVinculadas float64         `json:"valor_notas_vinculadas"`
	ValorPagoTotal       float64         `json:"valor_pago_total"`
	SaldoEmAberto        float64         `json:"saldo_em_aberto"`
	PercentualPago       float64         `json:"percentual_pago"`
	Quitada              bool            `json:"quitada"`
	QtdNotas             int             `json:"qtd_notas"`
	Notas                []NotaFiscalDTO `json:"notas,omitempty"`
}

// ConciliacaoAcaoResumoItemDTO resumo leve para listagens (sem notas).
type ConciliacaoAcaoResumoItemDTO struct {
	AcaoJudicial         AcaoJudicialDTO `json:"acao_judicial"`
	ValorNotasVinculadas float64         `json:"valor_notas_vinculadas"`
	ValorPagoTotal       float64         `json:"valor_pago_total"`
	SaldoEmAberto        float64         `json:"saldo_em_aberto"`
	PercentualPago       float64         `json:"percentual_pago"`
	Quitada              bool            `json:"quitada"`
	QtdNotas             int             `json:"qtd_notas"`
}

// ConciliarNotaResultDTO retorno da operação de conciliação.
type ConciliarNotaResultDTO struct {
	Nota  NotaFiscalDTO          `json:"nota"`
	Resumo ConciliacaoAcaoResumoDTO `json:"resumo_acao"`
}

type NotaFiscalInput struct {
	NumeroNota      string
	PlanoSaudeID    uuid.UUID
	PlanoSaudeNome  string
	PacienteNome    string
	DataEmissao     time.Time
	DataVencimento  time.Time
	ValorServico    float64
	ValorPago       *float64
	Status          string
	AcaoJudicialID  *uuid.UUID
	DataConciliacao *time.Time
	Observacoes     *string
}

// ── Marketing ────────────────────────────────────────────────────────────────

type ManualDTO struct {
	ID          uuid.UUID `json:"id"`
	Titulo      string    `json:"titulo"`
	Versao      string    `json:"versao"`
	PublicoAlvo string    `json:"publico_alvo"`
	ArquivoURL  string    `json:"arquivo_url"`
	ArquivoNome string    `json:"arquivo_nome"`
	Tags        []string  `json:"tags,omitempty"`
	Status      string    `json:"status"`
	Observacoes *string   `json:"observacoes,omitempty"`
	CreatedBy   uuid.UUID `json:"created_by"`
	CreatedAt   string    `json:"created_at"`
	UpdatedAt   string    `json:"updated_at"`
}

type ManualInput struct {
	Titulo      string
	Versao      string
	PublicoAlvo string
	ArquivoURL  string
	ArquivoNome string
	Tags        []string
	Status      string
	Observacoes *string
	CreatedBy   uuid.UUID
}

type ManualUploadInput struct {
	Titulo       string
	Versao       string
	PublicoAlvo  string
	OriginalName string
	DeclaredMIME string
	Size         int64
	Tags         []string
	Status       string
	Observacoes  *string
	CreatedBy    uuid.UUID
}

type ManualDownloadMeta struct {
	ID          uuid.UUID
	ArquivoNome string
	MimeType    string
}

type MaterialMarketingDTO struct {
	ID          uuid.UUID  `json:"id"`
	Titulo      string     `json:"titulo"`
	Tipo        string     `json:"tipo"`
	ArquivoURL  string     `json:"arquivo_url"`
	ArquivoNome string     `json:"arquivo_nome"`
	Tags        []string   `json:"tags,omitempty"`
	Campanha    *string    `json:"campanha,omitempty"`
	UnidadeID   *uuid.UUID `json:"unidade_id,omitempty"`
	Status      string     `json:"status"`
	Observacoes *string    `json:"observacoes,omitempty"`
	CreatedBy   uuid.UUID  `json:"created_by"`
	CreatedAt   string     `json:"created_at"`
	UpdatedAt   string     `json:"updated_at"`
}

type MaterialMarketingUploadInput struct {
	Titulo       string
	Tipo         string
	OriginalName string
	DeclaredMIME string
	Size         int64
	Tags         []string
	Campanha     *string
	UnidadeID    *uuid.UUID
	Status       string
	Observacoes  *string
	CreatedBy    uuid.UUID
}

type MaterialMarketingDownloadMeta struct {
	ID          uuid.UUID
	ArquivoNome string
	MimeType    string
}

type MaterialMarketingInput struct {
	Titulo      string
	Tipo        string
	ArquivoURL  string
	ArquivoNome string
	Tags        []string
	Campanha    *string
	UnidadeID   *uuid.UUID
	Status      string
	Observacoes *string
	CreatedBy   uuid.UUID
}

// ── Contabilidade ────────────────────────────────────────────────────────────

type ContaContabilDTO struct {
	Codigo   string  `json:"codigo"`
	Nome     string  `json:"nome"`
	Tipo     string  `json:"tipo"`
	Natureza string  `json:"natureza"`
	Pai      *string `json:"pai,omitempty"`
}

type ContaContabilInput struct {
	Codigo   string
	Nome     string
	Tipo     string
	Natureza string
	Pai      *string
}

type LancamentoContabilDTO struct {
	ID             uuid.UUID  `json:"id"`
	Data           string     `json:"data"`
	ContaCodigo    string     `json:"conta_codigo"`
	ContaNome      string     `json:"conta_nome"`
	Debito         float64    `json:"debito"`
	Credito        float64    `json:"credito"`
	Historico      string     `json:"historico"`
	CentroCusto    *string    `json:"centro_custo,omitempty"`
	UnidadeID      *uuid.UUID `json:"unidade_id,omitempty"`
	ProfissionalID *uuid.UUID `json:"profissional_id,omitempty"`
	Convenio       *string    `json:"convenio,omitempty"`
	Documento      *string    `json:"documento,omitempty"`
	CreatedAt      string     `json:"created_at"`
}

type LancamentoContabilInput struct {
	Data           time.Time
	ContaCodigo    string
	ContaNome      string
	Debito         float64
	Credito        float64
	Historico      string
	CentroCusto    *string
	UnidadeID      *uuid.UUID
	ProfissionalID *uuid.UUID
	Convenio       *string
	Documento      *string
}

// ── Audit Log ────────────────────────────────────────────────────────────────

type AuditLogDTO struct {
	ID           uuid.UUID       `json:"id"`
	ActorID      uuid.UUID       `json:"actor_id"`
	ActorName    string          `json:"actor_name"`
	ActorRole    string          `json:"actor_role"`
	Acao         string          `json:"acao"`
	Entidade     string          `json:"entidade"`
	EntidadeID   string          `json:"entidade_id"`
	Diff         json.RawMessage `json:"diff,omitempty"`
	IP           *string         `json:"ip,omitempty"`
	UserAgent    *string         `json:"user_agent,omitempty"`
	TimestampUTC string          `json:"timestamp_utc"`
}

type AuditLogInput struct {
	ActorID     uuid.UUID
	ActorName   string
	ActorRole   string
	Acao        string
	Entidade    string
	EntidadeID  string
	Diff        json.RawMessage
	IP          *string
	UserAgent   *string
}
