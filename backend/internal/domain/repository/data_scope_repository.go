package repository

import (
	"context"

	"espaco-terapia-os/backend/internal/domain/entity"

	"github.com/google/uuid"
)

type RoleResourceScope struct {
	Resource  string `json:"resource"`
	ScopeCode string `json:"scope_code"`
}

type DataScopeCatalogEntry struct {
	Code        string `json:"code" gorm:"column:code"`
	Description string `json:"description" gorm:"column:description"`
}

type DataScopeRepository interface {
	GetRoleResourceScope(ctx context.Context, role entity.UserRole, resource string) (string, error)
	ListRoleResourceScopes(ctx context.Context, role entity.UserRole) ([]RoleResourceScope, error)
	ReplaceRoleResourceScopes(ctx context.Context, role entity.UserRole, scopes []RoleResourceScope) error
	ListDataScopes(ctx context.Context) ([]DataScopeCatalogEntry, error)
	PacienteAccessibleByProfissional(ctx context.Context, profissionalID, pacienteID uuid.UUID) (bool, error)
	PacienteInUnidades(ctx context.Context, pacienteID uuid.UUID, unidadeIDs []uuid.UUID) (bool, error)
}
