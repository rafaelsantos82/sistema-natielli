package application

import (
	"context"

	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/domain/service"

	"github.com/google/uuid"
)

type SalaApp struct {
	svc *service.SalaService
}

func NewSalaApp(svc *service.SalaService) *SalaApp {
	return &SalaApp{svc: svc}
}

func (a *SalaApp) Create(ctx context.Context, in service.SalaInput) (uuid.UUID, error) {
	dto, err := a.svc.Create(ctx, in)
	if err != nil {
		return uuid.Nil, err
	}
	return dto.ID, nil
}

func (a *SalaApp) GetByID(ctx context.Context, id uuid.UUID) (*service.SalaDTO, error) {
	return a.svc.GetByID(ctx, id)
}

func (a *SalaApp) Update(ctx context.Context, id uuid.UUID, in service.SalaInput) (*service.SalaDTO, error) {
	return a.svc.Update(ctx, id, in)
}

func (a *SalaApp) Delete(ctx context.Context, id uuid.UUID) error {
	return a.svc.Delete(ctx, id)
}

func (a *SalaApp) List(ctx context.Context, filter repository.SalaListFilter) (*service.ListSalasResult, error) {
	return a.svc.List(ctx, filter)
}

func (a *SalaApp) ListReservas(ctx context.Context, salaID uuid.UUID) ([]*service.ReservaDTO, error) {
	return a.svc.ListReservas(ctx, salaID)
}

func (a *SalaApp) CreateReserva(ctx context.Context, salaID uuid.UUID, in service.ReservaInput) (*service.ReservaDTO, error) {
	return a.svc.CreateReserva(ctx, salaID, in)
}

func (a *SalaApp) UpdateReserva(ctx context.Context, salaID, reservaID uuid.UUID, in service.ReservaInput) (*service.ReservaDTO, error) {
	return a.svc.UpdateReserva(ctx, salaID, reservaID, in)
}

func (a *SalaApp) DeleteReserva(ctx context.Context, salaID, reservaID uuid.UUID) error {
	return a.svc.DeleteReserva(ctx, salaID, reservaID)
}
