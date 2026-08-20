package repository

import (
	"context"

	"espaco-terapia-os/backend/internal/domain/entity"

	"github.com/google/uuid"
)

type PacienteListFilter struct {
	UnidadeID      *uuid.UUID
	Query          string
	CPF            string
	Status         string
	Page           int
	PageSize       int
	IncludeDeleted bool
	// Escopo anti-IDOR (preenchido pelo DataScopeService)
	OnlyPacienteID          *uuid.UUID
	TherapistProfissionalID *uuid.UUID
	AllowedUnidadeIDs       []uuid.UUID
	// Enriquecimento da listagem para carteira do terapeuta
	EnrichTherapistCarteira bool
	OrderByProximaConsulta  bool
}

type PacienteRepository interface {
	Save(ctx context.Context, p *entity.Paciente) error
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Paciente, error)
	FindByIDUnscoped(ctx context.Context, id uuid.UUID) (*entity.Paciente, error)
	Update(ctx context.Context, p *entity.Paciente) error
	// MarkDeleted define status inativo e preenche deleted_at (soft delete).
	MarkDeleted(ctx context.Context, id uuid.UUID) error
	Restore(ctx context.Context, id uuid.UUID) error
	ExistsCPF(ctx context.Context, cpf string, excludeID *uuid.UUID) (bool, error)
	List(ctx context.Context, filter PacienteListFilter) ([]*entity.Paciente, int64, error)
	SetUnidades(ctx context.Context, pacienteID uuid.UUID, unidades []entity.PacienteUnidadeLink) error
	GetUnidades(ctx context.Context, pacienteID uuid.UUID) ([]entity.PacienteUnidadeLink, error)
}
