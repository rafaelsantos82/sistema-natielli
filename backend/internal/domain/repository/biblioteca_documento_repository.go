package repository

import (
	"context"

	"espaco-terapia-os/backend/internal/domain/entity"

	"github.com/google/uuid"
)

type DocumentoCategoriaListFilter struct {
	IncludeInativas bool
}

type BibliotecaArquivoListFilter struct {
	CategoriaID *uuid.UUID
	Query       string
	Page        int
	PageSize    int
}

type BibliotecaArquivoListResult struct {
	Items      []*entity.BibliotecaArquivo
	Total      int64
	Page       int
	PageSize   int
	TotalPages int
}

type DocumentoCategoriaRepository interface {
	Create(ctx context.Context, cat *entity.BibliotecaCategoria) error
	Update(ctx context.Context, cat *entity.BibliotecaCategoria) error
	FindByID(ctx context.Context, id uuid.UUID) (*entity.BibliotecaCategoria, error)
	List(ctx context.Context, filter DocumentoCategoriaListFilter) ([]*entity.BibliotecaCategoria, error)
	SoftDelete(ctx context.Context, id uuid.UUID) error
	ExistsNome(ctx context.Context, nome string, excludeID *uuid.UUID) (bool, error)
}

type BibliotecaArquivoRepository interface {
	Create(ctx context.Context, arq *entity.BibliotecaArquivo) error
	FindByID(ctx context.Context, id uuid.UUID) (*entity.BibliotecaArquivo, error)
	List(ctx context.Context, filter BibliotecaArquivoListFilter) (*BibliotecaArquivoListResult, error)
	SoftDelete(ctx context.Context, id uuid.UUID) error
	CountActiveByCategoria(ctx context.Context, categoriaID uuid.UUID) (int64, error)
}
