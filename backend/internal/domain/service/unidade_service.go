package service

import (
	"context"
	"log/slog"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
)

type UnidadeService struct {
	repo   repository.UnidadeRepository
	logger *slog.Logger
}

func NewUnidadeService(repo repository.UnidadeRepository, logger *slog.Logger) *UnidadeService {
	return &UnidadeService{repo: repo, logger: logger}
}

type ListUnidadesResult struct {
	Items      []*UnidadeDTO
	Total      int64
	Page       int
	PageSize   int
	TotalPages int
}

// GetByID retorna uma unidade pelo identificador.
func (s *UnidadeService) GetByID(ctx context.Context, id uuid.UUID) (*UnidadeDTO, error) {
	if id == uuid.Nil {
		return nil, domainerrors.NewRequiredFieldError("id")
	}
	u, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if u == nil {
		return nil, domainerrors.NewNotFoundError("Unidade", id.String())
	}
	return ToUnidadeDTO(u), nil
}

// List retorna unidades paginadas com filtros opcionais.
func (s *UnidadeService) List(ctx context.Context, filter repository.UnidadeListFilter) (*ListUnidadesResult, error) {
	filter.Page, filter.PageSize = NormalizePagination(filter.Page, filter.PageSize)

	items, total, err := s.repo.List(ctx, filter)
	if err != nil {
		return nil, err
	}

	dtos := make([]*UnidadeDTO, 0, len(items))
	for _, u := range items {
		dtos = append(dtos, ToUnidadeDTO(u))
	}

	return &ListUnidadesResult{
		Items:      dtos,
		Total:      total,
		Page:       filter.Page,
		PageSize:   filter.PageSize,
		TotalPages: TotalPages(total, filter.PageSize),
	}, nil
}
