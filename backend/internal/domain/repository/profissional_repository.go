package repository

import (
	"context"

	"espaco-terapia-os/backend/internal/domain/entity"

	"github.com/google/uuid"
)

type ProfissionalListFilter struct {
	UnidadeID      *uuid.UUID
	Query          string
	Status         string
	Page           int
	PageSize       int
	IncludeDeleted bool
}

type ProfissionalRepository interface {
	Save(ctx context.Context, p *entity.Profissional) error
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Profissional, error)
	FindByIDUnscoped(ctx context.Context, id uuid.UUID) (*entity.Profissional, error)
	Update(ctx context.Context, p *entity.Profissional) error
	MarkDeleted(ctx context.Context, id uuid.UUID) error
	Restore(ctx context.Context, id uuid.UUID) error
	ExistsEmail(ctx context.Context, email string, excludeID *uuid.UUID) (bool, error)
	List(ctx context.Context, filter ProfissionalListFilter) ([]*entity.Profissional, int64, error)
	GetUnidadeIDs(ctx context.Context, profissionalID uuid.UUID) ([]uuid.UUID, error)
	GetEspecialidades(ctx context.Context, profissionalID uuid.UUID) ([]string, error)

	ListConselhos(ctx context.Context, profissionalID uuid.UUID) ([]*entity.ProfissionalConselho, error)
	FindConselhoByID(ctx context.Context, profissionalID, conselhoID uuid.UUID) (*entity.ProfissionalConselho, error)
	SaveConselho(ctx context.Context, c *entity.ProfissionalConselho) error
	UpdateConselho(ctx context.Context, c *entity.ProfissionalConselho) error
	SoftDeleteConselho(ctx context.Context, profissionalID, conselhoID uuid.UUID) error
}
