package service

import (
	"time"

	"github.com/google/uuid"
)

type EvolucaoDTO struct {
	ID                  uuid.UUID `json:"id"`
	ConsultaID          uuid.UUID `json:"consulta_id"`
	PacienteID          uuid.UUID `json:"paciente_id"`
	Data                time.Time `json:"data"`
	QueixaPrincipal     string    `json:"queixa_principal"`
	HistoriaDoenca      string    `json:"historia_doenca"`
	ExameFisico         string    `json:"exame_fisico"`
	HipoteseDiagnostica string    `json:"hipotese_diagnostica"`
	Conduta             string    `json:"conduta"`
	Observacoes         *string   `json:"observacoes,omitempty"`
	CreatedAt           time.Time `json:"created_at"`
}

type EvolucaoInput struct {
	ConsultaID          uuid.UUID
	PacienteID          uuid.UUID
	QueixaPrincipal     string
	HistoriaDoenca      string
	ExameFisico         string
	HipoteseDiagnostica string
	Conduta             string
	Observacoes         *string
}

type PrescricaoDTO struct {
	ID          uuid.UUID `json:"id"`
	ConsultaID  uuid.UUID `json:"consulta_id"`
	PacienteID  uuid.UUID `json:"paciente_id"`
	Data        time.Time `json:"data"`
	Medicamento string    `json:"medicamento"`
	Dosagem     string    `json:"dosagem"`
	Frequencia  string    `json:"frequencia"`
	Duracao     string    `json:"duracao"`
	Orientacoes *string   `json:"orientacoes,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type PrescricaoInput struct {
	ConsultaID  uuid.UUID
	PacienteID  uuid.UUID
	Medicamento string
	Dosagem     string
	Frequencia  string
	Duracao     string
	Orientacoes *string
}

type AtestadoDTO struct {
	ID              uuid.UUID `json:"id"`
	ConsultaID      uuid.UUID `json:"consulta_id"`
	PacienteID      uuid.UUID `json:"paciente_id"`
	Data            time.Time `json:"data"`
	CID             string    `json:"cid"`
	DiasAfastamento int       `json:"dias_afastamento"`
	DataInicio      string    `json:"data_inicio"`
	DataFim         string    `json:"data_fim"`
	Observacoes     *string   `json:"observacoes,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
}

type AtestadoInput struct {
	ConsultaID      uuid.UUID
	PacienteID      uuid.UUID
	CID             string
	DiasAfastamento int
	DataInicio      string
	DataFim         string
	Observacoes     *string
}

type ProntuarioDocumentoDTO struct {
	ID         uuid.UUID `json:"id"`
	ConsultaID uuid.UUID `json:"consulta_id"`
	PacienteID uuid.UUID `json:"paciente_id"`
	Nome       string    `json:"nome"`
	Tipo       string    `json:"tipo"`
	Tamanho    int64     `json:"tamanho"`
	DataUpload time.Time `json:"data_upload"`
	URL        string    `json:"url"`
	CreatedAt  time.Time `json:"created_at"`
}

type ProntuarioDocumentoInput struct {
	ConsultaID uuid.UUID
	PacienteID uuid.UUID
	Nome       string
	Tipo       string
	Tamanho    int64
	URL        string
}

type ProntuarioPacienteDTO struct {
	PacienteID   uuid.UUID               `json:"paciente_id"`
	Evolucoes    []EvolucaoDTO           `json:"evolucoes"`
	Prescricoes  []PrescricaoDTO         `json:"prescricoes"`
	Atestados    []AtestadoDTO           `json:"atestados"`
	Documentos   []ProntuarioDocumentoDTO `json:"documentos"`
}
