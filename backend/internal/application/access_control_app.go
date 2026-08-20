package application

import (
	"context"

	"espaco-terapia-os/backend/internal/domain/entity"
	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/domain/service"
)

type AccessControlApp struct {
	svc *service.AccessControlService
}

func NewAccessControlApp(svc *service.AccessControlService) *AccessControlApp {
	return &AccessControlApp{svc: svc}
}

func (a *AccessControlApp) ListPermissions(ctx context.Context) ([]repository.Permission, error) {
	return a.svc.ListPermissions(ctx)
}

func (a *AccessControlApp) ListRolePermissions(ctx context.Context, role entity.UserRole) ([]string, error) {
	return a.svc.ListRolePermissions(ctx, role)
}

func (a *AccessControlApp) ReplaceRolePermissions(ctx context.Context, role entity.UserRole, codes []string) error {
	return a.svc.ReplaceRolePermissions(ctx, role, codes)
}

func (a *AccessControlApp) ListDataScopes(ctx context.Context) ([]repository.DataScopeCatalogEntry, error) {
	return a.svc.ListDataScopes(ctx)
}

func (a *AccessControlApp) ListRoleResourceScopes(ctx context.Context, role entity.UserRole) ([]repository.RoleResourceScope, error) {
	return a.svc.ListRoleResourceScopes(ctx, role)
}

func (a *AccessControlApp) ReplaceRoleResourceScopes(ctx context.Context, role entity.UserRole, scopes []repository.RoleResourceScope) error {
	return a.svc.ReplaceRoleResourceScopes(ctx, role, scopes)
}
