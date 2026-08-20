package database

import (
	"context"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type PostgresLoginProtectionRepository struct {
	db *gorm.DB
}

func NewPostgresLoginProtectionRepository(db *gorm.DB) *PostgresLoginProtectionRepository {
	return &PostgresLoginProtectionRepository{db: db}
}

func (r *PostgresLoginProtectionRepository) IsLocked(ctx context.Context, identifier, identifierType string) (bool, error) {
	var row authLoginAttemptModel
	err := r.db.WithContext(ctx).
		Where("identifier = ? AND identifier_type = ?", identifier, identifierType).
		First(&row).Error
	if err == gorm.ErrRecordNotFound {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	if row.LockedUntil != nil && row.LockedUntil.After(time.Now().UTC()) {
		return true, nil
	}
	return false, nil
}

func (r *PostgresLoginProtectionRepository) RecordFailure(ctx context.Context, identifier, identifierType string, maxAttempts int, lockout time.Duration) error {
	now := time.Now().UTC()
	var locked *time.Time
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var row authLoginAttemptModel
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("identifier = ? AND identifier_type = ?", identifier, identifierType).
			First(&row).Error
		if err == gorm.ErrRecordNotFound {
			row = authLoginAttemptModel{
				Identifier: identifier, IdentifierType: identifierType,
				FailedCount: 1, UpdatedAt: now,
			}
			if row.FailedCount >= maxAttempts {
				t := now.Add(lockout)
				locked = &t
				row.LockedUntil = locked
			}
			return tx.Create(&row).Error
		}
		if err != nil {
			return err
		}
		row.FailedCount++
		row.UpdatedAt = now
		if row.FailedCount >= maxAttempts {
			t := now.Add(lockout)
			locked = &t
			row.LockedUntil = &t
		}
		return tx.Save(&row).Error
	})
}

func (r *PostgresLoginProtectionRepository) Reset(ctx context.Context, identifier, identifierType string) error {
	return r.db.WithContext(ctx).
		Where("identifier = ? AND identifier_type = ?", identifier, identifierType).
		Delete(&authLoginAttemptModel{}).Error
}
