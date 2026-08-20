package application

import (
	"context"
	"io"

	"espaco-terapia-os/backend/internal/domain/service"

	"github.com/google/uuid"
)

type ChaveDigitalApp struct {
	svc *service.ChaveDigitalService
}

func NewChaveDigitalApp(svc *service.ChaveDigitalService) *ChaveDigitalApp {
	return &ChaveDigitalApp{svc: svc}
}

func (a *ChaveDigitalApp) GetAtiva(ctx context.Context, unidadeID uuid.UUID) (*service.ChaveDigitalDTO, error) {
	return a.svc.GetAtiva(ctx, unidadeID)
}

func (a *ChaveDigitalApp) Register(ctx context.Context, unidadeID, actorID uuid.UUID, r io.Reader, password string) (*service.ChaveDigitalDTO, error) {
	return a.svc.Register(ctx, unidadeID, actorID, r, password)
}

func (a *ChaveDigitalApp) Revoke(ctx context.Context, unidadeID uuid.UUID) error {
	return a.svc.Revoke(ctx, unidadeID)
}
