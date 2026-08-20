package database

import (
	"context"
	"time"

	"gorm.io/gorm"
)

type PostgresJWTRevocationRepository struct {
	db *gorm.DB
}

func NewPostgresJWTRevocationRepository(db *gorm.DB) *PostgresJWTRevocationRepository {
	return &PostgresJWTRevocationRepository{db: db}
}

func (r *PostgresJWTRevocationRepository) Revoke(ctx context.Context, tokenHash string, expiresAt time.Time) error {
	row := jwtRevocationModel{
		TokenHash: tokenHash,
		ExpiresAt: expiresAt.UTC(),
		RevokedAt: time.Now().UTC(),
	}
	return r.db.WithContext(ctx).Create(&row).Error
}

func (r *PostgresJWTRevocationRepository) IsRevoked(ctx context.Context, tokenHash string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&jwtRevocationModel{}).
		Where("token_hash = ? AND expires_at > NOW()", tokenHash).
		Count(&count).Error
	return count > 0, err
}

func (r *PostgresJWTRevocationRepository) CleanupExpired(ctx context.Context) error {
	return r.db.WithContext(ctx).
		Where("expires_at < NOW()").
		Delete(&jwtRevocationModel{}).Error
}
