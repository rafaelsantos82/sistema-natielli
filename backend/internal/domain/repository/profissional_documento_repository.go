package repository

import (
	"context"

	"espaco-terapia-os/backend/internal/domain/entity"

	"github.com/google/uuid"
)

type ProfissionalDocumentoListFilter struct {
	ProfissionalID uuid.UUID
	Categoria      *entity.DocumentoCategoria
}

type ProfissionalDocumentoRepository interface {
	Create(ctx context.Context, doc *entity.ProfissionalDocumento) error
	FindByID(ctx context.Context, id uuid.UUID) (*entity.ProfissionalDocumento, error)
	List(ctx context.Context, filter ProfissionalDocumentoListFilter) ([]*entity.ProfissionalDocumento, error)
	SoftDelete(ctx context.Context, id uuid.UUID) error
	ListAllActive(ctx context.Context) ([]*entity.ProfissionalDocumento, error)
}
