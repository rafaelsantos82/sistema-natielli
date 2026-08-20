package repository

import (
	"context"

	"espaco-terapia-os/backend/internal/domain/entity"
)

type Permission struct {
	Code        string `json:"code"`
	Resource    string `json:"resource"`
	Action      string `json:"action"`
	Description string `json:"description"`
}

type AccessControlRepository interface {
	HasRolePermission(ctx context.Context, role entity.UserRole, code string) (bool, error)
	ListPermissions(ctx context.Context) ([]Permission, error)
	ListRolePermissionCodes(ctx context.Context, role entity.UserRole) ([]string, error)
	ReplaceRolePermissions(ctx context.Context, role entity.UserRole, codes []string) error
}
