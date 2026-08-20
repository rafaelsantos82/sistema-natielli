package entity

import (
	"strings"
	"time"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"

	"github.com/google/uuid"
)

type ConsultaStatus string

const (
	ConsultaAgendada   ConsultaStatus = "agendada"
	ConsultaConfirmada ConsultaStatus = "confirmada"
	ConsultaCancelada  ConsultaStatus = "cancelada"
	ConsultaConcluida  ConsultaStatus = "concluida"
)

type StatusAtendimento string

const (
	AtendimentoPendente         StatusAtendimento = "atendimento_pendente"
	AguardandoProntuario        StatusAtendimento = "aguardando_prontuario"
	ProntoParaAprovacao         StatusAtendimento = "pronto_para_aprovacao"
	AtendimentoAprovado         StatusAtendimento = "aprovado"
	AtendimentoRejeitado        StatusAtendimento = "rejeitado"
)

type Consulta struct {
	ID                   uuid.UUID
	PacienteID           uuid.UUID
	ProfissionalID       uuid.UUID
	UnidadeID            *uuid.UUID
	SalaID               *uuid.UUID
	DataHora             time.Time
	Duracao              int
	Motivo               string
	Observacoes          *string
	ObservacoesAnamnese   *string
	Status               ConsultaStatus
	NotificacaoEnviada   bool
	ConfirmacaoPresenca  bool
	StatusAtendimento    *StatusAtendimento
	ProntuarioEvolucaoID *uuid.UUID
	AprovadoPor          *uuid.UUID
	AprovadoEm           *time.Time
	RejeitadoPor         *uuid.UUID
	RejeitadoEm          *time.Time
	MotivoRejeicao       *string
	CreatedAt            time.Time
	UpdatedAt            time.Time
}

func (c *Consulta) Validate() error {
	if c.PacienteID == uuid.Nil {
		return domainerrors.NewRequiredFieldError("paciente_id")
	}
	if c.ProfissionalID == uuid.Nil {
		return domainerrors.NewRequiredFieldError("profissional_id")
	}
	if c.DataHora.IsZero() {
		return domainerrors.NewRequiredFieldError("data_hora")
	}
	if c.Duracao < 15 {
		return domainerrors.NewInvalidFormatError("duracao", "Duração mínima é 15 minutos")
	}
	if strings.TrimSpace(c.Motivo) == "" {
		return domainerrors.NewRequiredFieldError("motivo")
	}
	if c.Status == "" {
		c.Status = ConsultaAgendada
	}
	return nil
}

func (c *Consulta) CanConfirmar() bool {
	return c.Status == ConsultaAgendada
}

func (c *Consulta) CanCancelar() bool {
	return c.Status == ConsultaAgendada || c.Status == ConsultaConfirmada
}

func (c *Consulta) CanConcluir() bool {
	return c.Status == ConsultaConfirmada || c.Status == ConsultaAgendada
}
