package service

import (
	"context"
	"testing"

	"espaco-terapia-os/backend/internal/domain/entity"
	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
)

type accessRepoStub struct {
	allowed map[string]bool
}

func (s *accessRepoStub) HasRolePermission(_ context.Context, _ entity.UserRole, code string) (bool, error) {
	return s.allowed[code], nil
}

func (s *accessRepoStub) ListPermissions(_ context.Context) ([]repository.Permission, error) {
	return []repository.Permission{{Code: "menu.pacientes.view"}}, nil
}

func (s *accessRepoStub) ListRolePermissionCodes(_ context.Context, _ entity.UserRole) ([]string, error) {
	return []string{"menu.pacientes.view"}, nil
}

func (s *accessRepoStub) ReplaceRolePermissions(_ context.Context, _ entity.UserRole, _ []string) error {
	return nil
}

type dataScopeRepoStub struct{}

func (dataScopeRepoStub) GetRoleResourceScope(_ context.Context, _ entity.UserRole, _ string) (string, error) {
	return entity.DataScopeAll, nil
}
func (dataScopeRepoStub) ListRoleResourceScopes(context.Context, entity.UserRole) ([]repository.RoleResourceScope, error) {
	return nil, nil
}
func (dataScopeRepoStub) ReplaceRoleResourceScopes(context.Context, entity.UserRole, []repository.RoleResourceScope) error {
	return nil
}
func (dataScopeRepoStub) ListDataScopes(context.Context) ([]repository.DataScopeCatalogEntry, error) {
	return nil, nil
}
func (dataScopeRepoStub) PacienteAccessibleByProfissional(context.Context, uuid.UUID, uuid.UUID) (bool, error) {
	return true, nil
}
func (dataScopeRepoStub) PacienteInUnidades(context.Context, uuid.UUID, []uuid.UUID) (bool, error) {
	return true, nil
}

func TestAccessControlService_AdminAlwaysAllowed(t *testing.T) {
	svc := NewAccessControlService(&accessRepoStub{allowed: map[string]bool{}}, dataScopeRepoStub{})
	ok, err := svc.HasPermission(context.Background(), entity.UserRoleAdmin, "any.permission")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Fatalf("expected admin to be always allowed")
	}
}

func TestAccessControlService_UsesRepositoryForNonAdmin(t *testing.T) {
	svc := NewAccessControlService(&accessRepoStub{allowed: map[string]bool{"menu.pacientes.view": true}}, dataScopeRepoStub{})
	ok, err := svc.HasPermission(context.Background(), entity.UserRoleGestor, "menu.pacientes.view")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Fatalf("expected permission allowed for non-admin role")
	}
}
