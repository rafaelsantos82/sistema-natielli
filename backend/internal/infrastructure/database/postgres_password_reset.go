package database

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostgresPasswordResetRepository struct {
	db *gorm.DB
}

func NewPostgresPasswordResetRepository(db *gorm.DB) *PostgresPasswordResetRepository {
	return &PostgresPasswordResetRepository{db: db}
}

func (r *PostgresPasswordResetRepository) Create(ctx context.Context, userID uuid.UUID, tokenHash string, expiresAt time.Time) error {
	row := passwordResetTokenModel{
		ID:        uuid.New(),
		UserID:    userID,
		TokenHash: tokenHash,
		ExpiresAt: expiresAt.UTC(),
		CreatedAt: time.Now().UTC(),
	}
	return r.db.WithContext(ctx).Create(&row).Error
}

func (r *PostgresPasswordResetRepository) FindValidByHash(ctx context.Context, tokenHash string) (uuid.UUID, error) {
	var row passwordResetTokenModel
	err := r.db.WithContext(ctx).
		Where("token_hash = ? AND used_at IS NULL AND expires_at > NOW()", tokenHash).
		First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return uuid.Nil, nil
	}
	if err != nil {
		return uuid.Nil, err
	}
	return row.UserID, nil
}

func (r *PostgresPasswordResetRepository) MarkUsed(ctx context.Context, tokenHash string) error {
	now := time.Now().UTC()
	return r.db.WithContext(ctx).Model(&passwordResetTokenModel{}).
		Where("token_hash = ?", tokenHash).
		Update("used_at", now).Error
}
