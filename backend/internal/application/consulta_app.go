package application

import (
	"context"
	"fmt"
	"time"

	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/domain/service"

	"github.com/google/uuid"
)

type ConsultaApp struct {
	svc *service.ConsultaService
}

func NewConsultaApp(svc *service.ConsultaService) *ConsultaApp {
	return &ConsultaApp{svc: svc}
}

func (a *ConsultaApp) Create(ctx context.Context, in service.ConsultaInput) (uuid.UUID, error) {
	dto, err := a.svc.Create(ctx, in)
	if err != nil {
		return uuid.Nil, err
	}
	return dto.ID, nil
}

func (a *ConsultaApp) GetByID(ctx context.Context, id uuid.UUID) (*service.ConsultaDTO, error) {
	return a.svc.GetByID(ctx, id)
}

func (a *ConsultaApp) Update(ctx context.Context, id uuid.UUID, in service.ConsultaInput) (*service.ConsultaDTO, error) {
	return a.svc.Update(ctx, id, in)
}

func (a *ConsultaApp) Delete(ctx context.Context, id uuid.UUID) error {
	return a.svc.Delete(ctx, id)
}

func (a *ConsultaApp) List(ctx context.Context, filter repository.ConsultaListFilter) (*service.ListConsultasResult, error) {
	return a.svc.List(ctx, filter)
}

func (a *ConsultaApp) Confirmar(ctx context.Context, id uuid.UUID) (*service.ConsultaDTO, error) {
	return a.svc.Confirmar(ctx, id)
}

func (a *ConsultaApp) Cancelar(ctx context.Context, id uuid.UUID) (*service.ConsultaDTO, error) {
	return a.svc.Cancelar(ctx, id)
}

func (a *ConsultaApp) Concluir(ctx context.Context, id uuid.UUID) (*service.ConsultaDTO, error) {
	return a.svc.Concluir(ctx, id)
}

func (a *ConsultaApp) VincularProntuario(ctx context.Context, id, evolucaoID uuid.UUID) (*service.ConsultaDTO, error) {
	return a.svc.VincularProntuario(ctx, id, evolucaoID)
}

func (a *ConsultaApp) AprovarAtendimento(ctx context.Context, id, actorID uuid.UUID) (*service.ConsultaDTO, error) {
	return a.svc.AprovarAtendimento(ctx, id, actorID)
}

func (a *ConsultaApp) RejeitarAtendimento(ctx context.Context, id uuid.UUID, motivo string, actorID uuid.UUID) (*service.ConsultaDTO, error) {
	return a.svc.RejeitarAtendimento(ctx, id, motivo, actorID)
}

func ParseDateTime(s string) (time.Time, error) {
	layouts := []string{
		time.RFC3339,
		"2006-01-02T15:04:05Z07:00",
		"2006-01-02T15:04:05",
		"2006-01-02T15:04",
	}
	for _, layout := range layouts {
		if t, err := time.Parse(layout, s); err == nil {
			return t, nil
		}
	}
	return time.Time{}, fmt.Errorf("formato de data/hora inválido")
}
