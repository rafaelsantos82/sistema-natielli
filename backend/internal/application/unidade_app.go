package application

import (
	"context"

	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/domain/service"

	"github.com/google/uuid"
)

type UnidadeApp struct {
	svc *service.UnidadeService
}

func NewUnidadeApp(svc *service.UnidadeService) *UnidadeApp {
	return &UnidadeApp{svc: svc}
}

func (a *UnidadeApp) GetByID(ctx context.Context, id uuid.UUID) (*service.UnidadeDTO, error) {
	return a.svc.GetByID(ctx, id)
}

func (a *UnidadeApp) List(ctx context.Context, filter repository.UnidadeListFilter) (*service.ListUnidadesResult, error) {
	return a.svc.List(ctx, filter)
}
