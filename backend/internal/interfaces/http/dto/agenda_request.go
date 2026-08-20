package dto

import (
	"espaco-terapia-os/backend/internal/application"
	"espaco-terapia-os/backend/internal/domain/entity"
	"espaco-terapia-os/backend/internal/domain/service"

	"github.com/google/uuid"
)

type ListConsultasQuery struct {
	UnidadeID      string `form:"unidade_id"`
	ProfissionalID string `form:"profissional_id"`
	DataInicio     string `form:"data_inicio"`
	DataFim        string `form:"data_fim"`
	Page           int    `form:"page"`
	PageSize       int    `form:"page_size"`
}

type ConsultaRequest struct {
	PacienteID          uuid.UUID  `json:"paciente_id" binding:"required"`
	ProfissionalID      uuid.UUID  `json:"profissional_id" binding:"required"`
	UnidadeID           *uuid.UUID `json:"unidade_id"`
	SalaID              uuid.UUID  `json:"sala_id" binding:"required"`
	DataHora            string     `json:"data_hora" binding:"required"`
	Duracao             int        `json:"duracao" binding:"required,min=15"`
	Motivo              string     `json:"motivo" binding:"required"`
	Observacoes         *string    `json:"observacoes"`
	ObservacoesAnamnese *string    `json:"observacoes_anamnese"`
}

type UpdateConsultaRequest struct {
	ConsultaRequest
}

func (r *ConsultaRequest) ToServiceInput() (service.ConsultaInput, error) {
	dataHora, err := application.ParseDateTime(r.DataHora)
	if err != nil {
		return service.ConsultaInput{}, err
	}
	return service.ConsultaInput{
		PacienteID:          r.PacienteID,
		ProfissionalID:      r.ProfissionalID,
		UnidadeID:           r.UnidadeID,
		SalaID:              r.SalaID,
		DataHora:            dataHora,
		Duracao:             r.Duracao,
		Motivo:              r.Motivo,
		Observacoes:         r.Observacoes,
		ObservacoesAnamnese: r.ObservacoesAnamnese,
	}, nil
}

type CreateConsultaData struct {
	ID string `json:"id"`
}

type ListSalasQuery struct {
	UnidadeID string `form:"unidade_id"`
	Query     string `form:"q"`
	Status    string `form:"status"`
	Page      int    `form:"page"`
	PageSize  int    `form:"page_size"`
}

type SalaRequest struct {
	NomeSala       string    `json:"nome_sala" binding:"required"`
	Codigo         *string   `json:"codigo"`
	UnidadeID      uuid.UUID `json:"unidade_id" binding:"required"`
	Capacidade     *int      `json:"capacidade"`
	Status         string    `json:"status"`
	Especialidades []string  `json:"especialidades"`
	Recursos       []string  `json:"recursos"`
}

type UpdateSalaRequest struct {
	SalaRequest
}

func (r *SalaRequest) ToServiceInput() service.SalaInput {
	return service.SalaInput{
		NomeSala:       r.NomeSala,
		Codigo:         r.Codigo,
		UnidadeID:      r.UnidadeID,
		Capacidade:     r.Capacidade,
		Status:         entitySalaStatus(r.Status),
		Especialidades: r.Especialidades,
		Recursos:       r.Recursos,
	}
}

func entitySalaStatus(s string) entity.SalaStatus {
	if s == "" {
		return entity.SalaAtiva
	}
	return entity.SalaStatus(s)
}

type ReservaRequest struct {
	DataHoraInicio   string     `json:"data_hora_inicio" binding:"required"`
	Duracao          int        `json:"duracao" binding:"required,min=15"`
	ProfissionalID   uuid.UUID  `json:"profissional_id" binding:"required"`
	ProfissionalNome string     `json:"profissional_nome" binding:"required"`
	ConsultaID       *uuid.UUID `json:"consulta_id"`
	TipoAtendimento  *string    `json:"tipo_atendimento"`
	Observacoes      *string    `json:"observacoes"`
	RRule            *string    `json:"rrule"`
}

func (r *ReservaRequest) ToServiceInput() (service.ReservaInput, error) {
	dataHora, err := application.ParseDateTime(r.DataHoraInicio)
	if err != nil {
		return service.ReservaInput{}, err
	}
	return service.ReservaInput{
		DataHoraInicio:   dataHora,
		Duracao:          r.Duracao,
		ProfissionalID:   r.ProfissionalID,
		ProfissionalNome: r.ProfissionalNome,
		ConsultaID:       r.ConsultaID,
		TipoAtendimento:  r.TipoAtendimento,
		Observacoes:      r.Observacoes,
		RRule:            r.RRule,
	}, nil
}

type CreateSalaData struct {
	ID string `json:"id"`
}

type CreateReservaData struct {
	ID string `json:"id"`
}

type VincularProntuarioRequest struct {
	EvolucaoID uuid.UUID `json:"evolucao_id" binding:"required"`
}

type RejeitarAtendimentoRequest struct {
	Motivo string `json:"motivo" binding:"required"`
}

type NotificationSettingsQuery struct {
	UnidadeID string `form:"unidade_id"`
}

type NotificationSettingsRequest struct {
	EmailEnabled      bool `json:"email_enabled"`
	SMSEnabled        bool `json:"sms_enabled"`
	HorasAntecedencia int  `json:"horas_antecedencia"`
}

func (r *NotificationSettingsRequest) ToServiceInput(unidadeID *uuid.UUID) service.NotificationSettingsInput {
	return service.NotificationSettingsInput{
		UnidadeID:         unidadeID,
		EmailEnabled:      r.EmailEnabled,
		SMSEnabled:        r.SMSEnabled,
		HorasAntecedencia: r.HorasAntecedencia,
	}
}
