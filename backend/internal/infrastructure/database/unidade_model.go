package database

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type unidadeModel struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey"`
	Nome      string         `gorm:"column:nome;not null"`
	Slug      string         `gorm:"column:slug;not null;uniqueIndex"`
	Status    string         `gorm:"column:status;not null"`
	Endereco  *string        `gorm:"column:endereco"`
	Telefone  *string        `gorm:"column:telefone"`
	CreatedAt time.Time      `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt time.Time      `gorm:"column:updated_at;autoUpdateTime"`
	DeletedAt gorm.DeletedAt `gorm:"column:deleted_at;index"`
}

func (unidadeModel) TableName() string { return "unidades" }
