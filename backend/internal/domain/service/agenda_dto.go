package service

import (
	"time"

	"espaco-terapia-os/backend/internal/domain/entity"
	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
)

type ConsultaDTO struct {
	ID                  uuid.UUID  `json:"id"`
	PacienteID          uuid.UUID  `json:"paciente_id"`
	PacienteNome        string     `json:"paciente_nome"`
	ProfissionalID      uuid.UUID  `json:"profissional_id"`
	ProfissionalNome    string     `json:"profissional_nome"`
	UnidadeID           *uuid.UUID `json:"unidade_id,omitempty"`
	SalaID              *uuid.UUID `json:"sala_id,omitempty"`
	SalaNome            string     `json:"sala_nome,omitempty"`
	DataHora            time.Time  `json:"data_hora"`
	Duracao             int        `json:"duracao"`
	Motivo              string     `json:"motivo"`
	Observacoes         *string    `json:"observacoes,omitempty"`
	ObservacoesAnamnese *string    `json:"observacoes_anamnese,omitempty"`
	Status               string     `json:"status"`
	NotificacaoEnviada   bool       `json:"notificacao_enviada"`
	ConfirmacaoPresenca  bool       `json:"confirmacao_presenca"`
	StatusAtendimento    *string    `json:"status_atendimento,omitempty"`
	ProntuarioEvolucaoID *uuid.UUID `json:"prontuario_evolucao_id,omitempty"`
	AprovadoPor          *uuid.UUID `json:"aprovado_por,omitempty"`
	AprovadoEm           *time.Time `json:"aprovado_em,omitempty"`
	RejeitadoPor         *uuid.UUID `json:"rejeitado_por,omitempty"`
	RejeitadoEm          *time.Time `json:"rejeitado_em,omitempty"`
	MotivoRejeicao       *string    `json:"motivo_rejeicao,omitempty"`
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`
}

func ToConsultaDTO(item repository.ConsultaListItem) *ConsultaDTO {
	c := item.Consulta
	return &ConsultaDTO{
		ID:                  c.ID,
		PacienteID:          c.PacienteID,
		PacienteNome:        item.PacienteNome,
		ProfissionalID:      c.ProfissionalID,
		ProfissionalNome:    item.ProfissionalNome,
		UnidadeID:           c.UnidadeID,
		SalaID:              c.SalaID,
		SalaNome:            item.SalaNome,
		DataHora:            c.DataHora,
		Duracao:             c.Duracao,
		Motivo:              c.Motivo,
		Observacoes:         c.Observacoes,
		ObservacoesAnamnese: c.ObservacoesAnamnese,
		Status:               string(c.Status),
		NotificacaoEnviada:   c.NotificacaoEnviada,
		ConfirmacaoPresenca:  c.ConfirmacaoPresenca,
		StatusAtendimento:    statusAtendimentoStr(c.StatusAtendimento),
		ProntuarioEvolucaoID: c.ProntuarioEvolucaoID,
		AprovadoPor:          c.AprovadoPor,
		AprovadoEm:           c.AprovadoEm,
		RejeitadoPor:         c.RejeitadoPor,
		RejeitadoEm:          c.RejeitadoEm,
		MotivoRejeicao:       c.MotivoRejeicao,
		CreatedAt:            c.CreatedAt,
		UpdatedAt:            c.UpdatedAt,
	}
}

func statusAtendimentoStr(s *entity.StatusAtendimento) *string {
	if s == nil {
		return nil
	}
	v := string(*s)
	return &v
}

type SalaDTO struct {
	ID             uuid.UUID `json:"id"`
	NomeSala       string    `json:"nome_sala"`
	Codigo         *string   `json:"codigo,omitempty"`
	UnidadeID      uuid.UUID `json:"unidade_id"`
	Capacidade     *int      `json:"capacidade,omitempty"`
	Status         string    `json:"status"`
	Especialidades []string  `json:"especialidades,omitempty"`
	Recursos       []string  `json:"recursos,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func ToSalaDTO(s *entity.Sala) *SalaDTO {
	return &SalaDTO{
		ID:             s.ID,
		NomeSala:       s.NomeSala,
		Codigo:         s.Codigo,
		UnidadeID:      s.UnidadeID,
		Capacidade:     s.Capacidade,
		Status:         string(s.Status),
		Especialidades: s.Especialidades,
		Recursos:       s.Recursos,
		CreatedAt:      s.CreatedAt,
		UpdatedAt:      s.UpdatedAt,
	}
}

type ReservaDTO struct {
	ID               uuid.UUID  `json:"id"`
	SalaID           uuid.UUID  `json:"sala_id"`
	DataHoraInicio   time.Time  `json:"data_hora_inicio"`
	Duracao          int        `json:"duracao"`
	ProfissionalID   uuid.UUID  `json:"profissional_id"`
	ProfissionalNome string     `json:"profissional_nome"`
	ConsultaID       *uuid.UUID `json:"consulta_id,omitempty"`
	TipoAtendimento  *string    `json:"tipo_atendimento,omitempty"`
	Observacoes      *string    `json:"observacoes,omitempty"`
	RRule            *string    `json:"rrule,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
}

func ToReservaDTO(r *entity.Reserva) *ReservaDTO {
	return &ReservaDTO{
		ID:               r.ID,
		SalaID:           r.SalaID,
		DataHoraInicio:   r.DataHoraInicio,
		Duracao:          r.Duracao,
		ProfissionalID:   r.ProfissionalID,
		ProfissionalNome: r.ProfissionalNome,
		ConsultaID:       r.ConsultaID,
		TipoAtendimento:  r.TipoAtendimento,
		Observacoes:      r.Observacoes,
		RRule:            r.RRule,
		CreatedAt:        r.CreatedAt,
	}
}

type NotificationSettingsDTO struct {
	ID                uuid.UUID  `json:"id"`
	UnidadeID         *uuid.UUID `json:"unidade_id,omitempty"`
	EmailEnabled      bool       `json:"email_enabled"`
	SMSEnabled        bool       `json:"sms_enabled"`
	HorasAntecedencia int        `json:"horas_antecedencia"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

func ToNotificationSettingsDTO(s *entity.NotificationSettings) *NotificationSettingsDTO {
	return &NotificationSettingsDTO{
		ID:                s.ID,
		UnidadeID:         s.UnidadeID,
		EmailEnabled:      s.EmailEnabled,
		SMSEnabled:        s.SMSEnabled,
		HorasAntecedencia: s.HorasAntecedencia,
		CreatedAt:         s.CreatedAt,
		UpdatedAt:         s.UpdatedAt,
	}
}
