package database

import (
	"time"

	"github.com/google/uuid"
)

type evolucaoModel struct {
	ID                  uuid.UUID `gorm:"type:uuid;primaryKey"`
	ConsultaID          uuid.UUID `gorm:"column:consulta_id;type:uuid;not null"`
	PacienteID          uuid.UUID `gorm:"column:paciente_id;type:uuid;not null"`
	Data                time.Time `gorm:"column:data;not null"`
	QueixaPrincipal     string    `gorm:"column:queixa_principal;not null"`
	HistoriaDoenca      string    `gorm:"column:historia_doenca;not null"`
	ExameFisico         string    `gorm:"column:exame_fisico;not null"`
	HipoteseDiagnostica string    `gorm:"column:hipotese_diagnostica;not null"`
	Conduta             string    `gorm:"column:conduta;not null"`
	Observacoes         *string   `gorm:"column:observacoes"`
	CreatedAt           time.Time `gorm:"column:created_at;autoCreateTime"`
}

func (evolucaoModel) TableName() string { return "evolucoes" }

type prescricaoModel struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey"`
	ConsultaID   uuid.UUID `gorm:"column:consulta_id;type:uuid;not null"`
	PacienteID   uuid.UUID `gorm:"column:paciente_id;type:uuid;not null"`
	Data         time.Time `gorm:"column:data;not null"`
	Medicamento  string    `gorm:"column:medicamento;not null"`
	Dosagem      string    `gorm:"column:dosagem;not null"`
	Frequencia   string    `gorm:"column:frequencia;not null"`
	Duracao      string    `gorm:"column:duracao;not null"`
	Orientacoes  *string   `gorm:"column:orientacoes"`
	CreatedAt    time.Time `gorm:"column:created_at;autoCreateTime"`
}

func (prescricaoModel) TableName() string { return "prescricoes" }

type atestadoModel struct {
	ID              uuid.UUID `gorm:"type:uuid;primaryKey"`
	ConsultaID      uuid.UUID `gorm:"column:consulta_id;type:uuid;not null"`
	PacienteID      uuid.UUID `gorm:"column:paciente_id;type:uuid;not null"`
	Data            time.Time `gorm:"column:data;not null"`
	CID             string    `gorm:"column:cid;not null"`
	DiasAfastamento int       `gorm:"column:dias_afastamento;not null"`
	DataInicio      time.Time `gorm:"column:data_inicio;type:date;not null"`
	DataFim         time.Time `gorm:"column:data_fim;type:date;not null"`
	Observacoes     *string   `gorm:"column:observacoes"`
	CreatedAt       time.Time `gorm:"column:created_at;autoCreateTime"`
}

func (atestadoModel) TableName() string { return "atestados" }

type prontuarioDocumentoModel struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey"`
	ConsultaID  uuid.UUID `gorm:"column:consulta_id;type:uuid;not null"`
	PacienteID  uuid.UUID `gorm:"column:paciente_id;type:uuid;not null"`
	Nome        string    `gorm:"column:nome;not null"`
	Tipo        string    `gorm:"column:tipo;not null"`
	Tamanho     int64     `gorm:"column:tamanho;not null"`
	DataUpload  time.Time `gorm:"column:data_upload;not null"`
	URL         string    `gorm:"column:url;not null"`
	CreatedAt   time.Time `gorm:"column:created_at;autoCreateTime"`
}

func (prontuarioDocumentoModel) TableName() string { return "prontuario_documentos" }
