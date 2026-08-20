package entity

import (
	"strings"
	"time"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"

	"github.com/google/uuid"
)

type SalaStatus string

const (
	SalaAtiva   SalaStatus = "Ativa"
	SalaInativa SalaStatus = "Inativa"
)

type Sala struct {
	ID             uuid.UUID
	NomeSala       string
	Codigo         *string
	UnidadeID      uuid.UUID
	Capacidade     *int
	Status         SalaStatus
	Especialidades []string
	Recursos       []string
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

func (s *Sala) Validate() error {
	if strings.TrimSpace(s.NomeSala) == "" {
		return domainerrors.NewRequiredFieldError("nome_sala")
	}
	if s.UnidadeID == uuid.Nil {
		return domainerrors.NewRequiredFieldError("unidade_id")
	}
	if s.Status == "" {
		s.Status = SalaAtiva
	}
	return nil
}

type Reserva struct {
	ID               uuid.UUID
	SalaID           uuid.UUID
	DataHoraInicio   time.Time
	Duracao          int
	ProfissionalID   uuid.UUID
	ProfissionalNome string
	ConsultaID       *uuid.UUID
	TipoAtendimento  *string
	Observacoes      *string
	RRule            *string
	CreatedAt        time.Time
}

func (r *Reserva) Validate() error {
	if r.SalaID == uuid.Nil {
		return domainerrors.NewRequiredFieldError("sala_id")
	}
	if r.ProfissionalID == uuid.Nil {
		return domainerrors.NewRequiredFieldError("profissional_id")
	}
	if r.DataHoraInicio.IsZero() {
		return domainerrors.NewRequiredFieldError("data_hora_inicio")
	}
	if r.Duracao < 15 {
		return domainerrors.NewInvalidFormatError("duracao", "Duração mínima é 15 minutos")
	}
	if strings.TrimSpace(r.ProfissionalNome) == "" {
		return domainerrors.NewRequiredFieldError("profissional_nome")
	}
	return nil
}

type NotificationSettings struct {
	ID                uuid.UUID
	UnidadeID         *uuid.UUID
	EmailEnabled      bool
	SMSEnabled        bool
	HorasAntecedencia int
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

func (n *NotificationSettings) Validate() error {
	if n.HorasAntecedencia <= 0 {
		return domainerrors.NewInvalidFormatError("horas_antecedencia", "Deve ser maior que zero")
	}
	return nil
}
