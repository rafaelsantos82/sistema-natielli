package database

import (
	"context"
	"errors"

	"espaco-terapia-os/backend/internal/domain/entity"
	domainerrors "espaco-terapia-os/backend/internal/domain/errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostgresNotificationSettingsRepository struct {
	db *gorm.DB
}

func NewPostgresNotificationSettingsRepository(db *gorm.DB) *PostgresNotificationSettingsRepository {
	return &PostgresNotificationSettingsRepository{db: db}
}

func (r *PostgresNotificationSettingsRepository) FindByUnidadeID(ctx context.Context, unidadeID *uuid.UUID) (*entity.NotificationSettings, error) {
	var model notificationSettingsModel
	q := r.db.WithContext(ctx).Model(&notificationSettingsModel{})
	if unidadeID == nil {
		q = q.Where("unidade_id IS NULL")
	} else {
		q = q.Where("unidade_id = ?", *unidadeID)
	}
	err := q.First(&model).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, mapNotificationDBError(err)
	}
	return notificationModelToEntity(&model), nil
}

func (r *PostgresNotificationSettingsRepository) Upsert(ctx context.Context, s *entity.NotificationSettings) error {
	model := notificationEntityToModel(s)
	existing, err := r.FindByUnidadeID(ctx, s.UnidadeID)
	if err != nil {
		return err
	}
	if existing == nil {
		if err := r.db.WithContext(ctx).Create(&model).Error; err != nil {
			return mapNotificationDBError(err)
		}
		return nil
	}
	s.ID = existing.ID
	s.CreatedAt = existing.CreatedAt
	model.ID = existing.ID
	model.CreatedAt = existing.CreatedAt
	if err := r.db.WithContext(ctx).Model(&notificationSettingsModel{}).Where("id = ?", existing.ID).Updates(&model).Error; err != nil {
		return mapNotificationDBError(err)
	}
	return nil
}

func notificationEntityToModel(s *entity.NotificationSettings) *notificationSettingsModel {
	return &notificationSettingsModel{
		ID:                s.ID,
		UnidadeID:         s.UnidadeID,
		EmailEnabled:      s.EmailEnabled,
		SMSEnabled:        s.SMSEnabled,
		HorasAntecedencia: s.HorasAntecedencia,
		CreatedAt:         s.CreatedAt,
		UpdatedAt:         s.UpdatedAt,
	}
}

func notificationModelToEntity(m *notificationSettingsModel) *entity.NotificationSettings {
	return &entity.NotificationSettings{
		ID:                m.ID,
		UnidadeID:         m.UnidadeID,
		EmailEnabled:      m.EmailEnabled,
		SMSEnabled:        m.SMSEnabled,
		HorasAntecedencia: m.HorasAntecedencia,
		CreatedAt:         m.CreatedAt,
		UpdatedAt:         m.UpdatedAt,
	}
}

func mapNotificationDBError(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return domainerrors.NewNotFoundError("NotificationSettings", "")
	}
	return MapDBError(err)
}
