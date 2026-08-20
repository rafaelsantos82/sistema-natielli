package database

import (
	"time"

	"github.com/google/uuid"
)

type permissionModel struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey"`
	Code        string    `gorm:"column:code;uniqueIndex;not null"`
	Resource    string    `gorm:"column:resource;not null"`
	Action      string    `gorm:"column:action;not null"`
	Description string    `gorm:"column:description;not null"`
	CreatedAt   time.Time `gorm:"column:created_at"`
	UpdatedAt   time.Time `gorm:"column:updated_at"`
}

func (permissionModel) TableName() string { return "permissions" }

type rolePermissionModel struct {
	Role         string    `gorm:"column:role;primaryKey"`
	PermissionID uuid.UUID `gorm:"column:permission_id;primaryKey"`
	CreatedAt    time.Time `gorm:"column:created_at"`
}

func (rolePermissionModel) TableName() string { return "role_permissions" }
