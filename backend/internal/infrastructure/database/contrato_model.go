package database

import (
	"time"

	"github.com/google/uuid"
)

type contratoEvolutionModel struct {
	ID               uuid.UUID  `gorm:"column:id;primaryKey"`
	Titulo           string     `gorm:"column:titulo"`
	Tipo             string     `gorm:"column:tipo"`
	PacienteID       *uuid.UUID `gorm:"column:paciente_id"`
	PacienteNome     *string    `gorm:"column:paciente_nome"`
	ProfissionalID   *uuid.UUID `gorm:"column:profissional_id"`
	ProfissionalNome *string    `gorm:"column:profissional_nome"`
	Conteudo              *string `gorm:"column:conteudo"`
	ArquivoNome           *string `gorm:"column:arquivo_nome"`
	ArquivoMime           *string `gorm:"column:arquivo_mime"`
	ArquivoTamanhoBytes   *int64  `gorm:"column:arquivo_tamanho_bytes"`
	StoragePath           *string `gorm:"column:storage_path"`
	Status           string     `gorm:"column:status"`
	CriadoPor        uuid.UUID  `gorm:"column:criado_por"`
	CriadoEm         time.Time  `gorm:"column:criado_em"`
	AtualizadoEm     time.Time  `gorm:"column:atualizado_em"`
	DeletedAt        *time.Time `gorm:"column:deleted_at"`
}

func (contratoEvolutionModel) TableName() string { return "contratos" }

type compartilhamentoContratoModel struct {
	ID              uuid.UUID `gorm:"column:id;primaryKey"`
	ContratoID      uuid.UUID `gorm:"column:contrato_id"`
	ContratoTitulo  string    `gorm:"column:contrato_titulo"`
	Token           string    `gorm:"column:token"`
	ExpiraEm        time.Time `gorm:"column:expira_em"`
	PodeVisualizar  bool      `gorm:"column:pode_visualizar"`
	PodeBaixar      bool      `gorm:"column:pode_baixar"`
	CriadoEm        time.Time `gorm:"column:criado_em"`
}

func (compartilhamentoContratoModel) TableName() string { return "compartilhamentos_contrato" }

type compartilhamentoAcessoModel struct {
	ID                uuid.UUID `gorm:"column:id;primaryKey"`
	CompartilhamentoID uuid.UUID `gorm:"column:compartilhamento_id"`
	DataHora          time.Time `gorm:"column:data_hora"`
}

func (compartilhamentoAcessoModel) TableName() string { return "compartilhamento_acessos" }

type solicitacaoAssinaturaModel struct {
	ID                   uuid.UUID  `gorm:"column:id;primaryKey"`
	ContratoID           uuid.UUID  `gorm:"column:contrato_id"`
	ContratoTitulo       string     `gorm:"column:contrato_titulo"`
	EnvelopeID           *string    `gorm:"column:envelope_id"`
	Status               string     `gorm:"column:status"`
	MensagemPersonalizada *string   `gorm:"column:mensagem_personalizada"`
	ExpiraEm             *time.Time `gorm:"column:expira_em"`
	CriadoEm             time.Time  `gorm:"column:criado_em"`
	AtualizadoEm         time.Time  `gorm:"column:atualizado_em"`
}

func (solicitacaoAssinaturaModel) TableName() string { return "solicitacoes_assinatura" }

type signatarioModel struct {
	ID             uuid.UUID  `gorm:"column:id;primaryKey"`
	SolicitacaoID  uuid.UUID  `gorm:"column:solicitacao_id"`
	Nome           string     `gorm:"column:nome"`
	Email          string     `gorm:"column:email"`
	Tipo           string     `gorm:"column:tipo"`
	CPF            *string    `gorm:"column:cpf"`
	Parentesco     *string    `gorm:"column:parentesco"`
	Ordem          int        `gorm:"column:ordem"`
	Status         string     `gorm:"column:status"`
	TokenAcesso    *string    `gorm:"column:token_acesso"`
	ExpiraEm       *time.Time `gorm:"column:expira_em"`
	AssinadoEm     *time.Time `gorm:"column:assinado_em"`
}

func (signatarioModel) TableName() string { return "signatarios" }
