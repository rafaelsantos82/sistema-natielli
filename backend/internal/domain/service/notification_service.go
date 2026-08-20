package service

import (
	"context"
	"log/slog"
	"time"

	"espaco-terapia-os/backend/internal/domain/entity"
	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
)

type NotificationSettingsService struct {
	repo   repository.NotificationSettingsRepository
	logger *slog.Logger
}

func NewNotificationSettingsService(repo repository.NotificationSettingsRepository, logger *slog.Logger) *NotificationSettingsService {
	return &NotificationSettingsService{repo: repo, logger: logger}
}

type NotificationSettingsInput struct {
	UnidadeID         *uuid.UUID
	EmailEnabled      bool
	SMSEnabled        bool
	HorasAntecedencia int
}

const defaultHorasAntecedencia = 24

// GetByUnidade retorna configurações por unidade (ou global se unidade_id nil).
func (s *NotificationSettingsService) GetByUnidade(ctx context.Context, unidadeID *uuid.UUID) (*NotificationSettingsDTO, error) {
	settings, err := s.repo.FindByUnidadeID(ctx, unidadeID)
	if err != nil {
		return nil, err
	}
	if settings == nil {
		return s.defaultDTO(unidadeID), nil
	}
	return ToNotificationSettingsDTO(settings), nil
}

// Upsert cria ou atualiza configurações de notificação.
func (s *NotificationSettingsService) Upsert(ctx context.Context, in NotificationSettingsInput) (*NotificationSettingsDTO, error) {
	horas := in.HorasAntecedencia
	if horas <= 0 {
		horas = defaultHorasAntecedencia
	}
	now := time.Now().UTC()
	settings := &entity.NotificationSettings{
		ID:                uuid.New(),
		UnidadeID:         in.UnidadeID,
		EmailEnabled:      in.EmailEnabled,
		SMSEnabled:        in.SMSEnabled,
		HorasAntecedencia: horas,
		UpdatedAt:         now,
		CreatedAt:         now,
	}
	if err := settings.Validate(); err != nil {
		return nil, err
	}
	if err := s.repo.Upsert(ctx, settings); err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "notification_settings", "upsert", settings.ID)
	result, err := s.repo.FindByUnidadeID(ctx, in.UnidadeID)
	if err != nil {
		return nil, err
	}
	if result == nil {
		return nil, domainerrors.NewDatabaseError("Falha ao recuperar configurações", nil)
	}
	return ToNotificationSettingsDTO(result), nil
}

func (s *NotificationSettingsService) defaultDTO(unidadeID *uuid.UUID) *NotificationSettingsDTO {
	return &NotificationSettingsDTO{
		UnidadeID:         unidadeID,
		EmailEnabled:      true,
		SMSEnabled:        false,
		HorasAntecedencia: defaultHorasAntecedencia,
	}
}
