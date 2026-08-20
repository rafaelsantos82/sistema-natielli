package database

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type profissionalModel struct {
	ID                     uuid.UUID      `gorm:"type:uuid;primaryKey"`
	Nome                   string         `gorm:"column:nome;not null"`
	CPF                    *string        `gorm:"column:cpf"`
	RG                     *string        `gorm:"column:rg"`
	DataNascimento         *time.Time     `gorm:"column:data_nascimento;type:date"`
	Email                  string         `gorm:"column:email;not null;uniqueIndex"`
	Telefone               *string        `gorm:"column:telefone"`
	Celular                *string        `gorm:"column:celular"`
	Conselho               *string        `gorm:"column:conselho"`
	NumeroRegistro         *string        `gorm:"column:numero_registro"`
	UFRegistro             *string        `gorm:"column:uf_registro"`
	Foto                   *string        `gorm:"column:foto"`
	CEP                    *string        `gorm:"column:cep"`
	Logradouro             *string        `gorm:"column:logradouro"`
	Numero                 *string        `gorm:"column:numero"`
	Complemento            *string        `gorm:"column:complemento"`
	Bairro                 *string        `gorm:"column:bairro"`
	Cidade                 *string        `gorm:"column:cidade"`
	UF                     *string        `gorm:"column:uf"`
	ModalidadesAtendimento PostgresEnumArray `gorm:"column:modalidades_atendimento;type:modalidade_atendimento[]"`
	LocaisAtendimento      []string          `gorm:"column:locais_atendimento;type:text[]"`
	DuracaoPadraoSessao    *int              `gorm:"column:duracao_padrao_sessao"`
	DiasAtendimento        PostgresEnumArray `gorm:"column:dias_atendimento;type:dia_semana[]"`
	JanelasHorarias        JSONB          `gorm:"column:janelas_horarias;type:jsonb"`
	HorarioInicio          *string        `gorm:"column:horario_inicio;type:time"`
	HorarioFim             *string        `gorm:"column:horario_fim;type:time"`
	DuracaoConsulta        *int           `gorm:"column:duracao_consulta"`
	ConsentimentoLGPD      bool           `gorm:"column:consentimento_lgpd;not null"`
	DataConsentimento      *time.Time     `gorm:"column:data_consentimento"`
	CompartilhamentoDados  bool           `gorm:"column:compartilhamento_dados;not null"`
	FinalidadeDados        *string        `gorm:"column:finalidade_dados"`
	Status                 string         `gorm:"column:status;not null"`
	Observacoes            *string        `gorm:"column:observacoes"`
	DadosComplementares    JSONB          `gorm:"column:dados_complementares;type:jsonb"`
	AnexosContratuais      []string       `gorm:"column:anexos_contratuais;type:text[]"`
	CreatedAt              time.Time      `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt              time.Time      `gorm:"column:updated_at;autoUpdateTime"`
	DeletedAt              gorm.DeletedAt `gorm:"column:deleted_at;index"`
}

func (profissionalModel) TableName() string { return "profissionais" }

type profissionalUnidadeModel struct {
	ProfissionalID uuid.UUID `gorm:"column:profissional_id;type:uuid;primaryKey"`
	UnidadeID      uuid.UUID `gorm:"column:unidade_id;type:uuid;primaryKey"`
}

func (profissionalUnidadeModel) TableName() string { return "profissional_unidades" }

type profissionalEspecialidadeModel struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey"`
	ProfissionalID uuid.UUID `gorm:"column:profissional_id;type:uuid;not null"`
	Especialidade  string    `gorm:"column:especialidade;not null"`
}

func (profissionalEspecialidadeModel) TableName() string { return "profissional_especialidades" }

type profissionalConselhoModel struct {
	ID             uuid.UUID      `gorm:"type:uuid;primaryKey"`
	ProfissionalID uuid.UUID      `gorm:"column:profissional_id;type:uuid;not null"`
	Tipo           string         `gorm:"column:tipo;not null"`
	Numero         string         `gorm:"column:numero;not null"`
	UF             string         `gorm:"column:uf;not null"`
	Validade       *time.Time     `gorm:"column:validade;type:date"`
	Principal      bool           `gorm:"column:principal;not null"`
	CreatedAt      time.Time      `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt      time.Time      `gorm:"column:updated_at;autoUpdateTime"`
	DeletedAt      gorm.DeletedAt `gorm:"column:deleted_at;index"`
}

func (profissionalConselhoModel) TableName() string { return "profissional_conselhos" }
