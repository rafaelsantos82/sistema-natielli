package database

import (
	"time"

	"github.com/google/uuid"
)

type authLoginAttemptModel struct {
	Identifier     string     `gorm:"column:identifier;primaryKey"`
	IdentifierType string     `gorm:"column:identifier_type;primaryKey"`
	FailedCount    int        `gorm:"column:failed_count"`
	LockedUntil    *time.Time `gorm:"column:locked_until"`
	UpdatedAt      time.Time  `gorm:"column:updated_at"`
}

func (authLoginAttemptModel) TableName() string { return "auth_login_attempts" }

type jwtRevocationModel struct {
	TokenHash  string    `gorm:"column:token_hash;primaryKey"`
	ExpiresAt  time.Time `gorm:"column:expires_at"`
	RevokedAt  time.Time `gorm:"column:revoked_at"`
}

func (jwtRevocationModel) TableName() string { return "jwt_revocations" }

type passwordResetTokenModel struct {
	ID        uuid.UUID  `gorm:"column:id;type:uuid;primaryKey"`
	UserID    uuid.UUID  `gorm:"column:user_id;type:uuid"`
	TokenHash string     `gorm:"column:token_hash"`
	ExpiresAt time.Time  `gorm:"column:expires_at"`
	UsedAt    *time.Time `gorm:"column:used_at"`
	CreatedAt time.Time  `gorm:"column:created_at"`
}

func (passwordResetTokenModel) TableName() string { return "password_reset_tokens" }
