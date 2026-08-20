package repository

import (
	"context"

	"github.com/google/uuid"
)

const (
	PacienteProfissionalOrigemConsultaAgendada  = "consulta_agendada"
	PacienteProfissionalOrigemConsultaRealizada = "consulta_realizada"
	PacienteProfissionalOrigemBackfill          = "backfill"
)

type PacienteProfissionalLink struct {
	PacienteID         uuid.UUID
	ProfissionalID     uuid.UUID
	Origem             string
	PrimeiraConsultaID *uuid.UUID
}

type PacienteProfissionalRepository interface {
	Upsert(ctx context.Context, link PacienteProfissionalLink) error
	Exists(ctx context.Context, pacienteID, profissionalID uuid.UUID) (bool, error)
}
