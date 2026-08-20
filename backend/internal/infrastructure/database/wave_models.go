package database

import (
	"time"

	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

// ── Wave 2: Terapias ─────────────────────────────────────────────────────────

type terapiaModel struct {
	ID                       uuid.UUID      `gorm:"column:id;primaryKey"`
	NomeTerapia           string         `gorm:"column:nome_terapia"`
	ObjetivoTerapeutico      string         `gorm:"column:objetivo_terapeutico"`
	DiretrizProtocolar       string         `gorm:"column:diretriz_protocolar"`
	CodigosReferencia        pq.StringArray `gorm:"column:codigos_referencia;type:text[]"`
	RegraAjuste              *string        `gorm:"column:regra_ajuste"`
	Indicacoes               *string        `gorm:"column:indicacoes"`
	Contraindicacoes         *string        `gorm:"column:contraindicacoes"`
	InteracoesRelevantes     *string        `gorm:"column:interacoes_relevantes"`
	Monitorizacao            *string        `gorm:"column:monitorizacao"`
	EventosAdversos          *string        `gorm:"column:eventos_adversos"`
	NecessidadeConsentimento bool           `gorm:"column:necessidade_consentimento"`
	TextoConsentimento       *string        `gorm:"column:texto_consentimento"`
	Status                   string         `gorm:"column:status"`
	Versao                   int            `gorm:"column:versao"`
	Anexos                   pq.StringArray `gorm:"column:anexos;type:text[]"`
	Tags                     pq.StringArray `gorm:"column:tags;type:text[]"`
	Observacoes              *string        `gorm:"column:observacoes"`
	CreatedAt                time.Time      `gorm:"column:created_at"`
	UpdatedAt                time.Time      `gorm:"column:updated_at"`
}

func (terapiaModel) TableName() string { return "terapias" }

type terapiaItemRegimeModel struct {
	ID             uuid.UUID `gorm:"column:id;primaryKey"`
	TerapiaID   uuid.UUID `gorm:"column:terapia_id"`
	Medicamento    string    `gorm:"column:medicamento"`
	Via            string    `gorm:"column:via"`
	Dose           float64   `gorm:"column:dose"`
	DoseUnidade    string    `gorm:"column:dose_unidade"`
	Frequencia     string    `gorm:"column:frequencia"`
	Horario        *string   `gorm:"column:horario"`
	Duracao        *int      `gorm:"column:duracao"`
	DuracaoUnidade *string   `gorm:"column:duracao_unidade"`
	Orientacoes    *string   `gorm:"column:orientacoes"`
}

func (terapiaItemRegimeModel) TableName() string { return "terapia_itens_regime" }

// ── Wave 2: Anamneses ────────────────────────────────────────────────────────

type anamneseModel struct {
	ID            uuid.UUID `gorm:"column:id;primaryKey"`
	Nome          string    `gorm:"column:nome"`
	Especialidade string    `gorm:"column:especialidade"`
	Versao        string    `gorm:"column:versao"`
	Status        string    `gorm:"column:status"`
	Questionnaire JSONB     `gorm:"column:questionnaire;type:jsonb"`
	Observacoes   *string   `gorm:"column:observacoes"`
	CreatedAt     time.Time `gorm:"column:created_at"`
	UpdatedAt     time.Time `gorm:"column:updated_at"`
}

func (anamneseModel) TableName() string { return "anamneses" }

type respostaAnamneseModel struct {
	ID                uuid.UUID `gorm:"column:id;primaryKey"`
	QuestionnaireID   uuid.UUID `gorm:"column:questionnaire_id"`
	QuestionnaireNome string    `gorm:"column:questionnaire_nome"`
	PatientID         uuid.UUID `gorm:"column:patient_id"`
	PatientNome       string    `gorm:"column:patient_nome"`
	EncounterID       *uuid.UUID `gorm:"column:encounter_id"`
	Respostas         JSONB     `gorm:"column:respostas;type:jsonb"`
	DataHora          time.Time `gorm:"column:data_hora"`
	CreatedAt         time.Time `gorm:"column:created_at"`
}

func (respostaAnamneseModel) TableName() string { return "respostas_anamnese" }

// ── Wave 2: Financeiro ───────────────────────────────────────────────────────

type categoriaFinanceiraModel struct {
	ID        uuid.UUID `gorm:"column:id;primaryKey"`
	Nome      string    `gorm:"column:nome"`
	Tipo      string    `gorm:"column:tipo"`
	Cor       *string   `gorm:"column:cor"`
	Descricao *string   `gorm:"column:descricao"`
	CreatedAt time.Time `gorm:"column:created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at"`
}

func (categoriaFinanceiraModel) TableName() string { return "categorias_financeiras" }

type centroCustoModel struct {
	ID        uuid.UUID `gorm:"column:id;primaryKey"`
	Codigo    string    `gorm:"column:codigo"`
	Nome      string    `gorm:"column:nome"`
	Descricao *string   `gorm:"column:descricao"`
	Ativo     bool      `gorm:"column:ativo"`
	CreatedAt time.Time `gorm:"column:created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at"`
}

func (centroCustoModel) TableName() string { return "centros_custo" }

type lancamentoModel struct {
	ID                   uuid.UUID  `gorm:"column:id;primaryKey"`
	Tipo                 string     `gorm:"column:tipo"`
	Descricao            string     `gorm:"column:descricao"`
	Valor                float64    `gorm:"column:valor"`
	DataVencimento       time.Time  `gorm:"column:data_vencimento;type:date"`
	DataPagamento        *time.Time `gorm:"column:data_pagamento;type:date"`
	CategoriaID          uuid.UUID  `gorm:"column:categoria_id"`
	CategoriaNome        string     `gorm:"column:categoria_nome"`
	CentroCustoID        *uuid.UUID `gorm:"column:centro_custo_id"`
	CentroCustoNome      *string    `gorm:"column:centro_custo_nome"`
	FormaPagamento       *string    `gorm:"column:forma_pagamento"`
	Documento            *string    `gorm:"column:documento"`
	Observacoes          *string    `gorm:"column:observacoes"`
	Status               string     `gorm:"column:status"`
	Recorrente           bool       `gorm:"column:recorrente"`
	FrequenciaRecorrencia *string   `gorm:"column:frequencia_recorrencia"`
	Parcelas             *int       `gorm:"column:parcelas"`
	ParcelaAtual         *int       `gorm:"column:parcela_atual"`
	AnexoURL             *string    `gorm:"column:anexo_url"`
	Conciliado           bool       `gorm:"column:conciliado"`
	DataConciliacao      *time.Time `gorm:"column:data_conciliacao;type:date"`
	UnidadeID            *uuid.UUID `gorm:"column:unidade_id"`
	CreatedAt            time.Time  `gorm:"column:created_at"`
	UpdatedAt            time.Time  `gorm:"column:updated_at"`
}

func (lancamentoModel) TableName() string { return "lancamentos" }

type relatorioOperacionalModel struct {
	ID                uuid.UUID `gorm:"column:id;primaryKey"`
	Numero            string    `gorm:"column:numero"`
	PacienteNome      string    `gorm:"column:paciente_nome"`
	ProfissionalNome  string    `gorm:"column:profissional_nome"`
	Terapia           string    `gorm:"column:terapia"`
	Periodo           string    `gorm:"column:periodo"`
	Valor             float64   `gorm:"column:valor"`
	Status            string    `gorm:"column:status"`
	UnidadeID         *uuid.UUID `gorm:"column:unidade_id"`
	DataSubmissao     *time.Time `gorm:"column:data_submissao;type:date"`
	DataAprovacao     *time.Time `gorm:"column:data_aprovacao;type:date"`
	AprovadoPor       *string    `gorm:"column:aprovado_por"`
	Observacoes       *string    `gorm:"column:observacoes"`
	HistoricoVersoes  JSONB      `gorm:"column:historico_versoes;type:jsonb"`
	CreatedAt         time.Time  `gorm:"column:created_at"`
	UpdatedAt         time.Time  `gorm:"column:updated_at"`
}

func (relatorioOperacionalModel) TableName() string { return "relatorios_operacionais" }

// ── Wave 3: RH ───────────────────────────────────────────────────────────────

type funcionarioCLTModel struct {
	ID               uuid.UUID `gorm:"column:id;primaryKey"`
	UnidadeID        uuid.UUID `gorm:"column:unidade_id"`
	Nome             string    `gorm:"column:nome"`
	CPF              string    `gorm:"column:cpf"`
	Cargo            string    `gorm:"column:cargo"`
	SalarioBase      float64   `gorm:"column:salario_base"`
	DataAdmissao     time.Time `gorm:"column:data_admissao;type:date"`
	Ativo            bool      `gorm:"column:ativo"`
	Dependentes      int       `gorm:"column:dependentes"`
	ValeTransporte   bool      `gorm:"column:vale_transporte"`
	ValeAlimentacao  float64   `gorm:"column:vale_alimentacao"`
	CreatedAt        time.Time `gorm:"column:created_at"`
	UpdatedAt        time.Time `gorm:"column:updated_at"`
}

func (funcionarioCLTModel) TableName() string { return "funcionarios_clt" }

type funcionarioPJModel struct {
	ID          uuid.UUID `gorm:"column:id;primaryKey"`
	UnidadeID   uuid.UUID `gorm:"column:unidade_id"`
	Nome        string    `gorm:"column:nome"`
	CNPJ        string    `gorm:"column:cnpj"`
	RazaoSocial string    `gorm:"column:razao_social"`
	Servico     string    `gorm:"column:servico"`
	ValorHora   float64   `gorm:"column:valor_hora"`
	DataInicio  time.Time `gorm:"column:data_inicio;type:date"`
	Ativo       bool      `gorm:"column:ativo"`
	CreatedAt   time.Time `gorm:"column:created_at"`
	UpdatedAt   time.Time `gorm:"column:updated_at"`
}

func (funcionarioPJModel) TableName() string { return "funcionarios_pj" }

type folhaCLTModel struct {
	ID               uuid.UUID  `gorm:"column:id;primaryKey"`
	FuncionarioID    uuid.UUID  `gorm:"column:funcionario_id"`
	MesReferencia    string     `gorm:"column:mes_referencia"`
	SalarioBase      float64    `gorm:"column:salario_base"`
	HorasExtras      float64    `gorm:"column:horas_extras"`
	AdicionalNoturno float64    `gorm:"column:adicional_noturno"`
	OutrosProventos  float64    `gorm:"column:outros_proventos"`
	ValeTransporte   float64    `gorm:"column:vale_transporte"`
	ValeAlimentacao  float64    `gorm:"column:vale_alimentacao"`
	INSS             float64    `gorm:"column:inss"`
	FGTS             float64    `gorm:"column:fgts"`
	IRRF             float64    `gorm:"column:irrf"`
	OutrosDescontos  float64    `gorm:"column:outros_descontos"`
	SalarioLiquido   float64    `gorm:"column:salario_liquido"`
	DataPagamento    *time.Time `gorm:"column:data_pagamento;type:date"`
	Status           string     `gorm:"column:status"`
	CreatedAt        time.Time  `gorm:"column:created_at"`
	UpdatedAt        time.Time  `gorm:"column:updated_at"`
}

func (folhaCLTModel) TableName() string { return "folhas_clt" }

type folhaPJModel struct {
	ID                uuid.UUID  `gorm:"column:id;primaryKey"`
	FuncionarioID     uuid.UUID  `gorm:"column:funcionario_id"`
	MesReferencia     string     `gorm:"column:mes_referencia"`
	HorasTrabalhadas  float64    `gorm:"column:horas_trabalhadas"`
	ValorHora         float64    `gorm:"column:valor_hora"`
	ValorTotal        float64    `gorm:"column:valor_total"`
	RetencaoISS       float64    `gorm:"column:retencao_iss"`
	RetencaoIR        float64    `gorm:"column:retencao_ir"`
	ValorLiquido      float64    `gorm:"column:valor_liquido"`
	DataPagamento     *time.Time `gorm:"column:data_pagamento;type:date"`
	Status            string     `gorm:"column:status"`
	DescricaoServicos *string    `gorm:"column:descricao_servicos"`
	CreatedAt         time.Time  `gorm:"column:created_at"`
	UpdatedAt         time.Time  `gorm:"column:updated_at"`
}

func (folhaPJModel) TableName() string { return "folhas_pj" }

// ── Wave 3: Estoque ──────────────────────────────────────────────────────────

type itemEstoqueModel struct {
	ID            uuid.UUID `gorm:"column:id;primaryKey"`
	UnidadeID     uuid.UUID `gorm:"column:unidade_id"`
	Codigo        string    `gorm:"column:codigo"`
	Nome          string    `gorm:"column:nome"`
	Categoria     string    `gorm:"column:categoria"`
	UnidadeMedida string    `gorm:"column:unidade_medida"`
	EstoqueAtual  int       `gorm:"column:estoque_atual"`
	EstoqueMinimo int       `gorm:"column:estoque_minimo"`
	Localizacao   *string   `gorm:"column:localizacao"`
	Status        string    `gorm:"column:status"`
	CreatedAt     time.Time `gorm:"column:created_at"`
	UpdatedAt     time.Time `gorm:"column:updated_at"`
}

func (itemEstoqueModel) TableName() string { return "itens_estoque" }

type movimentacaoEstoqueModel struct {
	ID              uuid.UUID `gorm:"column:id;primaryKey"`
	ItemID          uuid.UUID `gorm:"column:item_id"`
	ItemNome        string    `gorm:"column:item_nome"`
	Tipo            string    `gorm:"column:tipo"`
	Quantidade      int       `gorm:"column:quantidade"`
	DataHora        time.Time `gorm:"column:data_hora"`
	Documento       *string   `gorm:"column:documento"`
	Motivo          string    `gorm:"column:motivo"`
	ResponsavelID   uuid.UUID `gorm:"column:responsavel_id"`
	ResponsavelNome string    `gorm:"column:responsavel_nome"`
	SaldoAnterior   int       `gorm:"column:saldo_anterior"`
	SaldoAtual      int       `gorm:"column:saldo_atual"`
	CreatedAt       time.Time `gorm:"column:created_at"`
}

func (movimentacaoEstoqueModel) TableName() string { return "movimentacoes_estoque" }

type inventarioModel struct {
	ID              uuid.UUID `gorm:"column:id;primaryKey"`
	Data            time.Time `gorm:"column:data;type:date"`
	ResponsavelID   uuid.UUID `gorm:"column:responsavel_id"`
	ResponsavelNome string    `gorm:"column:responsavel_nome"`
	Observacoes     *string   `gorm:"column:observacoes"`
	CreatedAt       time.Time `gorm:"column:created_at"`
}

func (inventarioModel) TableName() string { return "inventarios" }

type inventarioContagemModel struct {
	ID             uuid.UUID `gorm:"column:id;primaryKey"`
	InventarioID   uuid.UUID `gorm:"column:inventario_id"`
	ItemID         uuid.UUID `gorm:"column:item_id"`
	ItemNome       string    `gorm:"column:item_nome"`
	EstoqueSistema int       `gorm:"column:estoque_sistema"`
	ContagemFisica int       `gorm:"column:contagem_fisica"`
}

func (inventarioContagemModel) TableName() string { return "inventario_contagens" }

// ── Wave 3: Comodato ─────────────────────────────────────────────────────────

type comodatoModel struct {
	ID                    uuid.UUID  `gorm:"column:id;primaryKey"`
	ItemID                *uuid.UUID `gorm:"column:item_id"`
	ItemNome              string     `gorm:"column:item_nome"`
	Descricao             *string    `gorm:"column:descricao"`
	PacienteID            uuid.UUID  `gorm:"column:paciente_id"`
	PacienteNome          string     `gorm:"column:paciente_nome"`
	DataEmprestimo        time.Time  `gorm:"column:data_emprestimo;type:date"`
	DataDevolucaoPrevista time.Time  `gorm:"column:data_devolucao_prevista;type:date"`
	DataDevolucaoReal     *time.Time `gorm:"column:data_devolucao_real;type:date"`
	Status                string     `gorm:"column:status"`
	CondicaoEntrega       string     `gorm:"column:condicao_entrega"`
	CondicaoDevolucao     *string    `gorm:"column:condicao_devolucao"`
	Observacoes           *string    `gorm:"column:observacoes"`
	ResponsavelID         uuid.UUID  `gorm:"column:responsavel_id"`
	ResponsavelNome       string     `gorm:"column:responsavel_nome"`
	NumeroSerie           *string    `gorm:"column:numero_serie"`
	Quantidade            int        `gorm:"column:quantidade"`
	CreatedAt             time.Time  `gorm:"column:created_at"`
	UpdatedAt             time.Time  `gorm:"column:updated_at"`
}

func (comodatoModel) TableName() string { return "comodatos" }

// ── Wave 3: Planos / Jurídico / NF ───────────────────────────────────────────

type planoSaudeModel struct {
	ID           uuid.UUID `gorm:"column:id;primaryKey"`
	Nome         string    `gorm:"column:nome"`
	CNPJ         string    `gorm:"column:cnpj"`
	RegistroANS  string    `gorm:"column:registro_ans"`
	Telefone     string    `gorm:"column:telefone"`
	Email        string    `gorm:"column:email"`
	Endereco     string    `gorm:"column:endereco"`
	Ativo        bool      `gorm:"column:ativo"`
	Observacoes  *string   `gorm:"column:observacoes"`
	CreatedAt    time.Time `gorm:"column:created_at"`
	UpdatedAt    time.Time `gorm:"column:updated_at"`
}

func (planoSaudeModel) TableName() string { return "planos_saude" }

type acaoJudicialModel struct {
	ID              uuid.UUID  `gorm:"column:id;primaryKey"`
	NumeroProcesso  string     `gorm:"column:numero_processo"`
	PlanoSaudeID    uuid.UUID  `gorm:"column:plano_saude_id"`
	PlanoSaudeNome  string     `gorm:"column:plano_saude_nome"`
	ValorAcao       float64    `gorm:"column:valor_acao"`
	DataEntrada     time.Time  `gorm:"column:data_entrada;type:date"`
	DataSentenca    *time.Time `gorm:"column:data_sentenca;type:date"`
	Status          string     `gorm:"column:status"`
	Descricao       string     `gorm:"column:descricao"`
	Observacoes     *string    `gorm:"column:observacoes"`
	CreatedAt       time.Time  `gorm:"column:created_at"`
	UpdatedAt       time.Time  `gorm:"column:updated_at"`
}

func (acaoJudicialModel) TableName() string { return "acoes_judiciais" }

type notaFiscalModel struct {
	ID               uuid.UUID  `gorm:"column:id;primaryKey"`
	NumeroNota       string     `gorm:"column:numero_nota"`
	PlanoSaudeID     uuid.UUID  `gorm:"column:plano_saude_id"`
	PlanoSaudeNome   string     `gorm:"column:plano_saude_nome"`
	PacienteNome     string     `gorm:"column:paciente_nome"`
	DataEmissao      time.Time  `gorm:"column:data_emissao;type:date"`
	DataVencimento   time.Time  `gorm:"column:data_vencimento;type:date"`
	ValorServico     float64    `gorm:"column:valor_servico"`
	ValorPago        *float64   `gorm:"column:valor_pago"`
	Status           string     `gorm:"column:status"`
	AcaoJudicialID   *uuid.UUID `gorm:"column:acao_judicial_id"`
	DataConciliacao  *time.Time `gorm:"column:data_conciliacao"`
	Observacoes      *string    `gorm:"column:observacoes"`
	CreatedAt        time.Time  `gorm:"column:created_at"`
	UpdatedAt        time.Time  `gorm:"column:updated_at"`
}

func (notaFiscalModel) TableName() string { return "notas_fiscais" }

// ── Wave 3: Contratos ────────────────────────────────────────────────────────

type contratoModel struct {
	ID               uuid.UUID  `gorm:"column:id;primaryKey"`
	Titulo           string     `gorm:"column:titulo"`
	Tipo             string     `gorm:"column:tipo"`
	PacienteID       *uuid.UUID `gorm:"column:paciente_id"`
	PacienteNome     *string    `gorm:"column:paciente_nome"`
	ProfissionalID   *uuid.UUID `gorm:"column:profissional_id"`
	ProfissionalNome *string    `gorm:"column:profissional_nome"`
	Conteudo         string     `gorm:"column:conteudo"`
	Status           string     `gorm:"column:status"`
	CriadoPor        uuid.UUID  `gorm:"column:criado_por"`
	CriadoEm         time.Time  `gorm:"column:criado_em"`
	AtualizadoEm     time.Time  `gorm:"column:atualizado_em"`
}

func (contratoModel) TableName() string { return "contratos" }

// ── Wave 3: Marketing ────────────────────────────────────────────────────────

type manualModel struct {
	ID           uuid.UUID      `gorm:"column:id;primaryKey"`
	Titulo       string         `gorm:"column:titulo"`
	Versao       string         `gorm:"column:versao"`
	PublicoAlvo  string         `gorm:"column:publico_alvo"`
	ArquivoURL   string         `gorm:"column:arquivo_url"`
	ArquivoNome  string         `gorm:"column:arquivo_nome"`
	Tags         pq.StringArray `gorm:"column:tags;type:text[]"`
	Status       string         `gorm:"column:status"`
	Observacoes  *string        `gorm:"column:observacoes"`
	CreatedBy    uuid.UUID      `gorm:"column:created_by"`
	CreatedAt    time.Time      `gorm:"column:created_at"`
	UpdatedAt    time.Time      `gorm:"column:updated_at"`
}

func (manualModel) TableName() string { return "manuais" }

type materialMarketingModel struct {
	ID          uuid.UUID      `gorm:"column:id;primaryKey"`
	Titulo      string         `gorm:"column:titulo"`
	Tipo        string         `gorm:"column:tipo"`
	ArquivoURL  string         `gorm:"column:arquivo_url"`
	ArquivoNome string         `gorm:"column:arquivo_nome"`
	Tags        pq.StringArray `gorm:"column:tags;type:text[]"`
	Campanha    *string        `gorm:"column:campanha"`
	UnidadeID   *uuid.UUID     `gorm:"column:unidade_id"`
	Status      string         `gorm:"column:status"`
	Observacoes *string        `gorm:"column:observacoes"`
	CreatedBy   uuid.UUID      `gorm:"column:created_by"`
	CreatedAt   time.Time      `gorm:"column:created_at"`
	UpdatedAt   time.Time      `gorm:"column:updated_at"`
}

func (materialMarketingModel) TableName() string { return "materiais_marketing" }

// ── Wave 3: Contabilidade ────────────────────────────────────────────────────

type contaContabilModel struct {
	Codigo   string  `gorm:"column:codigo;primaryKey"`
	Nome     string  `gorm:"column:nome"`
	Tipo     string  `gorm:"column:tipo"`
	Natureza string  `gorm:"column:natureza"`
	Pai      *string `gorm:"column:pai"`
}

func (contaContabilModel) TableName() string { return "contas_contabeis" }

type lancamentoContabilModel struct {
	ID              uuid.UUID  `gorm:"column:id;primaryKey"`
	Data            time.Time  `gorm:"column:data;type:date"`
	ContaCodigo     string     `gorm:"column:conta_codigo"`
	ContaNome       string     `gorm:"column:conta_nome"`
	Debito          float64    `gorm:"column:debito"`
	Credito         float64    `gorm:"column:credito"`
	Historico       string     `gorm:"column:historico"`
	CentroCusto     *string    `gorm:"column:centro_custo"`
	UnidadeID       *uuid.UUID `gorm:"column:unidade_id"`
	ProfissionalID  *uuid.UUID `gorm:"column:profissional_id"`
	Convenio        *string    `gorm:"column:convenio"`
	Documento       *string    `gorm:"column:documento"`
	CreatedAt       time.Time  `gorm:"column:created_at"`
}

func (lancamentoContabilModel) TableName() string { return "lancamentos_contabeis" }

// ── Wave 3: Audit Log ────────────────────────────────────────────────────────

type auditLogModel struct {
	ID          uuid.UUID  `gorm:"column:id;primaryKey"`
	ActorID     uuid.UUID  `gorm:"column:actor_id"`
	ActorName   string     `gorm:"column:actor_name"`
	ActorRole   string     `gorm:"column:actor_role"`
	Acao        string     `gorm:"column:acao"`
	Entidade    string     `gorm:"column:entidade"`
	EntidadeID  string     `gorm:"column:entidade_id"`
	Diff        JSONB      `gorm:"column:diff;type:jsonb"`
	IP          *string    `gorm:"column:ip"`
	UserAgent   *string    `gorm:"column:user_agent"`
	TimestampUTC time.Time `gorm:"column:timestamp_utc"`
}

func (auditLogModel) TableName() string { return "audit_log" }

// crudListConfig configura listagem genérica por tabela.
type crudListConfig struct {
	unidadeColumn string
	searchColumns []string
	statusColumn  string
	orderBy       string
}

func applyCRUDListFilter(db *gorm.DB, filter repository.CRUDListFilter, cfg crudListConfig) *gorm.DB {
	q := db
	if filter.UnidadeID != nil && cfg.unidadeColumn != "" {
		q = q.Where(cfg.unidadeColumn+" = ?", *filter.UnidadeID)
	}
	if filter.Status != "" && cfg.statusColumn != "" {
		q = q.Where(cfg.statusColumn+" = ?", filter.Status)
	}
	if filter.Query != "" && len(cfg.searchColumns) > 0 {
		like := "%" + filter.Query + "%"
		clauses := make([]string, 0, len(cfg.searchColumns))
		args := make([]any, 0, len(cfg.searchColumns))
		for _, col := range cfg.searchColumns {
			clauses = append(clauses, col+" ILIKE ?")
			args = append(args, like)
		}
		q = q.Where("("+joinOr(clauses)+")", args...)
	}
	return q
}

func joinOr(parts []string) string {
	out := ""
	for i, p := range parts {
		if i > 0 {
			out += " OR "
		}
		out += p
	}
	return out
}
