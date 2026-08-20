package application

import (
	"context"
	"time"

	"espaco-terapia-os/backend/internal/domain/entity"
	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/domain/service"

	"github.com/google/uuid"
)

type PacienteApp struct {
	svc *service.PacienteService
}

func NewPacienteApp(svc *service.PacienteService) *PacienteApp {
	return &PacienteApp{svc: svc}
}

func (a *PacienteApp) Create(ctx context.Context, in service.PacienteInput) (uuid.UUID, error) {
	dto, err := a.svc.Create(ctx, in)
	if err != nil {
		return uuid.Nil, err
	}
	return dto.ID, nil
}

func (a *PacienteApp) GetByID(ctx context.Context, id uuid.UUID) (*service.PacienteDTO, error) {
	return a.svc.GetByID(ctx, id)
}

func (a *PacienteApp) Update(ctx context.Context, id uuid.UUID, in service.PacienteInput) (*service.PacienteDTO, error) {
	return a.svc.Update(ctx, id, in)
}

func (a *PacienteApp) Delete(ctx context.Context, id uuid.UUID) error {
	return a.svc.Delete(ctx, id)
}

func (a *PacienteApp) Restore(ctx context.Context, id uuid.UUID) (*service.PacienteDTO, error) {
	return a.svc.Restore(ctx, id)
}

func (a *PacienteApp) List(ctx context.Context, filter repository.PacienteListFilter) (*service.ListPacientesResult, error) {
	return a.svc.List(ctx, filter)
}

// ParseDataNascimento parses YYYY-MM-DD for handlers.
func ParseDataNascimento(s string) (time.Time, error) {
	return time.Parse("2006-01-02", s)
}

// ParseSexo maps API string to entity enum.
func ParseSexo(s string) entity.SexoBiologico {
	return entity.SexoBiologico(s)
}

// ParseStatus maps API string to entity enum.
func ParseStatus(s string) entity.PacienteStatus {
	if s == "" {
		return entity.PacienteAtivo
	}
	return entity.PacienteStatus(s)
}
