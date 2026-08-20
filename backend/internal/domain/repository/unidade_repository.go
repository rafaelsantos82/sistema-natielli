package repository

import (
	"context"

	"espaco-terapia-os/backend/internal/domain/entity"

	"github.com/google/uuid"
)

type UnidadeListFilter struct {
	Query    string
	Status   string
	Page     int
	PageSize int
}

type UnidadeRepository interface {
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Unidade, error)
	List(ctx context.Context, filter UnidadeListFilter) ([]*entity.Unidade, int64, error)
}
