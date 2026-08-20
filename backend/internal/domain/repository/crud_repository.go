package repository

import (
	"context"

	"github.com/google/uuid"
)

// CRUDListFilter filtros comuns para listagens paginadas Wave 2/3.
type CRUDListFilter struct {
	UnidadeID  *uuid.UUID
	Query      string
	Status     string
	Entidade   string
	EntidadeID string
	Page       int
	PageSize   int
}

// CRUDRepository operações genéricas por entidade UUID.
type CRUDRepository[T any] interface {
	Save(ctx context.Context, entity *T) error
	FindByID(ctx context.Context, id uuid.UUID) (*T, error)
	Update(ctx context.Context, entity *T) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filter CRUDListFilter) ([]*T, int64, error)
}
