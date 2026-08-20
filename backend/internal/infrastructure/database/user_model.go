package database

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type userModel struct {
	ID                   uuid.UUID      `gorm:"type:uuid;primaryKey"`
	Name                 string         `gorm:"column:name;not null"`
	Email                string         `gorm:"column:email;not null;uniqueIndex"`
	PasswordHash         string         `gorm:"column:password_hash;not null"`
	Role                 string         `gorm:"column:role;not null"`
	PacienteID           *uuid.UUID     `gorm:"column:paciente_id;type:uuid"`
	ProfissionalID       *uuid.UUID     `gorm:"column:profissional_id;type:uuid"`
	MustChangePassword   bool           `gorm:"column:must_change_password;not null"`
	CreatedAt    time.Time      `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt    time.Time      `gorm:"column:updated_at;autoUpdateTime"`
	DeletedAt    gorm.DeletedAt `gorm:"column:deleted_at;index"`
}

func (userModel) TableName() string { return "users" }

type userUnidadeModel struct {
	UserID    uuid.UUID `gorm:"column:user_id;primaryKey"`
	UnidadeID uuid.UUID `gorm:"column:unidade_id;primaryKey"`
}

func (userUnidadeModel) TableName() string { return "user_unidades" }
