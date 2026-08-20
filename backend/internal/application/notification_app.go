package application

import (
	"context"

	"espaco-terapia-os/backend/internal/domain/service"

	"github.com/google/uuid"
)

type NotificationSettingsApp struct {
	svc *service.NotificationSettingsService
}

func NewNotificationSettingsApp(svc *service.NotificationSettingsService) *NotificationSettingsApp {
	return &NotificationSettingsApp{svc: svc}
}

func (a *NotificationSettingsApp) GetByUnidade(ctx context.Context, unidadeID *uuid.UUID) (*service.NotificationSettingsDTO, error) {
	return a.svc.GetByUnidade(ctx, unidadeID)
}

func (a *NotificationSettingsApp) Upsert(ctx context.Context, in service.NotificationSettingsInput) (*service.NotificationSettingsDTO, error) {
	return a.svc.Upsert(ctx, in)
}
