package database

import (
	"time"

	"github.com/google/uuid"
)

type consultaModel struct {
	ID                  uuid.UUID  `gorm:"type:uuid;primaryKey"`
	PacienteID          uuid.UUID  `gorm:"column:paciente_id;type:uuid;not null"`
	ProfissionalID      uuid.UUID  `gorm:"column:profissional_id;type:uuid;not null"`
	UnidadeID           *uuid.UUID `gorm:"column:unidade_id;type:uuid"`
	SalaID              *uuid.UUID `gorm:"column:sala_id;type:uuid"`
	DataHora            time.Time  `gorm:"column:data_hora;not null"`
	Duracao             int        `gorm:"column:duracao;not null"`
	Motivo              string     `gorm:"column:motivo;not null"`
	Observacoes         *string    `gorm:"column:observacoes"`
	ObservacoesAnamnese *string    `gorm:"column:observacoes_anamnese"`
	Status               string     `gorm:"column:status;not null"`
	NotificacaoEnviada   bool       `gorm:"column:notificacao_enviada;not null"`
	ConfirmacaoPresenca  bool       `gorm:"column:confirmacao_presenca;not null"`
	StatusAtendimento    *string    `gorm:"column:status_atendimento"`
	ProntuarioEvolucaoID *uuid.UUID `gorm:"column:prontuario_evolucao_id;type:uuid"`
	AprovadoPor          *uuid.UUID `gorm:"column:aprovado_por;type:uuid"`
	AprovadoEm           *time.Time `gorm:"column:aprovado_em"`
	RejeitadoPor         *uuid.UUID `gorm:"column:rejeitado_por;type:uuid"`
	RejeitadoEm          *time.Time `gorm:"column:rejeitado_em"`
	MotivoRejeicao       *string    `gorm:"column:motivo_rejeicao"`
	CreatedAt            time.Time  `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt            time.Time  `gorm:"column:updated_at;autoUpdateTime"`
}

func (consultaModel) TableName() string { return "consultas" }

type salaModel struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey"`
	NomeSala   string    `gorm:"column:nome_sala;not null"`
	Codigo     *string   `gorm:"column:codigo"`
	UnidadeID  uuid.UUID `gorm:"column:unidade_id;type:uuid;not null"`
	Capacidade *int      `gorm:"column:capacidade"`
	Status     string    `gorm:"column:status;not null"`
	CreatedAt  time.Time `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt  time.Time `gorm:"column:updated_at;autoUpdateTime"`
}

func (salaModel) TableName() string { return "salas" }

type salaEspecialidadeModel struct {
	SalaID        uuid.UUID `gorm:"column:sala_id;type:uuid;primaryKey"`
	Especialidade string    `gorm:"column:especialidade;primaryKey"`
}

func (salaEspecialidadeModel) TableName() string { return "sala_especialidades" }

type salaRecursoModel struct {
	SalaID  uuid.UUID `gorm:"column:sala_id;type:uuid;primaryKey"`
	Recurso string    `gorm:"column:recurso;primaryKey"`
}

func (salaRecursoModel) TableName() string { return "sala_recursos" }

type reservaModel struct {
	ID               uuid.UUID  `gorm:"type:uuid;primaryKey"`
	SalaID           uuid.UUID  `gorm:"column:sala_id;type:uuid;not null"`
	DataHoraInicio   time.Time  `gorm:"column:data_hora_inicio;not null"`
	Duracao          int        `gorm:"column:duracao;not null"`
	ProfissionalID   uuid.UUID  `gorm:"column:profissional_id;type:uuid;not null"`
	ProfissionalNome string     `gorm:"column:profissional_nome;not null"`
	ConsultaID       *uuid.UUID `gorm:"column:consulta_id;type:uuid"`
	TipoAtendimento  *string    `gorm:"column:tipo_atendimento"`
	Observacoes      *string    `gorm:"column:observacoes"`
	RRule            *string    `gorm:"column:rrule"`
	CreatedAt        time.Time  `gorm:"column:created_at;autoCreateTime"`
}

func (reservaModel) TableName() string { return "reservas" }

type notificationSettingsModel struct {
	ID                uuid.UUID  `gorm:"type:uuid;primaryKey"`
	UnidadeID         *uuid.UUID `gorm:"column:unidade_id;type:uuid"`
	EmailEnabled      bool       `gorm:"column:email_enabled;not null"`
	SMSEnabled        bool       `gorm:"column:sms_enabled;not null"`
	HorasAntecedencia int        `gorm:"column:horas_antecedencia;not null"`
	CreatedAt         time.Time  `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt         time.Time  `gorm:"column:updated_at;autoUpdateTime"`
}

func (notificationSettingsModel) TableName() string { return "notification_settings" }
