package application

import (
	"context"
	"time"

	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/domain/service"

	"github.com/google/uuid"
)

type ProfissionalApp struct {
	svc *service.ProfissionalService
}

func NewProfissionalApp(svc *service.ProfissionalService) *ProfissionalApp {
	return &ProfissionalApp{svc: svc}
}

func (a *ProfissionalApp) Create(ctx context.Context, in service.ProfissionalInput) (uuid.UUID, error) {
	dto, err := a.svc.Create(ctx, in)
	if err != nil {
		return uuid.Nil, err
	}
	return dto.ID, nil
}

func (a *ProfissionalApp) GetByID(ctx context.Context, id uuid.UUID) (*service.ProfissionalDTO, error) {
	return a.svc.GetByID(ctx, id)
}

func (a *ProfissionalApp) Update(ctx context.Context, id uuid.UUID, in service.ProfissionalInput) (*service.ProfissionalDTO, error) {
	return a.svc.Update(ctx, id, in)
}

func (a *ProfissionalApp) Delete(ctx context.Context, id uuid.UUID) error {
	return a.svc.Delete(ctx, id)
}

func (a *ProfissionalApp) Restore(ctx context.Context, id uuid.UUID) (*service.ProfissionalDTO, error) {
	return a.svc.Restore(ctx, id)
}

func (a *ProfissionalApp) List(ctx context.Context, filter repository.ProfissionalListFilter) (*service.ListProfissionaisResult, error) {
	return a.svc.List(ctx, filter)
}

func (a *ProfissionalApp) ListConselhos(ctx context.Context, profissionalID uuid.UUID) ([]*service.ProfissionalConselhoDTO, error) {
	return a.svc.ListConselhos(ctx, profissionalID)
}

func (a *ProfissionalApp) CreateConselho(ctx context.Context, profissionalID uuid.UUID, in service.ConselhoInput) (*service.ProfissionalConselhoDTO, error) {
	return a.svc.CreateConselho(ctx, profissionalID, in)
}

func (a *ProfissionalApp) UpdateConselho(ctx context.Context, profissionalID, conselhoID uuid.UUID, in service.ConselhoInput) (*service.ProfissionalConselhoDTO, error) {
	return a.svc.UpdateConselho(ctx, profissionalID, conselhoID, in)
}

func (a *ProfissionalApp) DeleteConselho(ctx context.Context, profissionalID, conselhoID uuid.UUID) error {
	return a.svc.DeleteConselho(ctx, profissionalID, conselhoID)
}

func ParseOptionalDate(s *string) (*time.Time, error) {
	if s == nil || *s == "" {
		return nil, nil
	}
	t, err := time.Parse("2006-01-02", *s)
	if err != nil {
		return nil, err
	}
	return &t, nil
}
