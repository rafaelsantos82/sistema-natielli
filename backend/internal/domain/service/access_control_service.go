package service

import (
	"context"
	"slices"

	"espaco-terapia-os/backend/internal/domain/entity"
	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"
)

type AccessControlService struct {
	repo   repository.AccessControlRepository
	scopes repository.DataScopeRepository
}

func NewAccessControlService(repo repository.AccessControlRepository, scopes repository.DataScopeRepository) *AccessControlService {
	return &AccessControlService{repo: repo, scopes: scopes}
}

func (s *AccessControlService) HasPermission(ctx context.Context, role entity.UserRole, code string) (bool, error) {
	if role == entity.UserRoleAdmin {
		return true, nil
	}
	return s.repo.HasRolePermission(ctx, role, code)
}

func (s *AccessControlService) ListPermissions(ctx context.Context) ([]repository.Permission, error) {
	return s.repo.ListPermissions(ctx)
}

func (s *AccessControlService) ListRolePermissions(ctx context.Context, role entity.UserRole) ([]string, error) {
	if !role.Valid() {
		return nil, domainerrors.NewValidationError("perfil inválido")
	}
	if role == entity.UserRoleAdmin {
		perms, err := s.repo.ListPermissions(ctx)
		if err != nil {
			return nil, err
		}
		codes := make([]string, 0, len(perms))
		for _, p := range perms {
			codes = append(codes, p.Code)
		}
		return codes, nil
	}
	return s.repo.ListRolePermissionCodes(ctx, role)
}

func (s *AccessControlService) ReplaceRolePermissions(ctx context.Context, role entity.UserRole, codes []string) error {
	if !role.Valid() {
		return domainerrors.NewValidationError("perfil inválido")
	}
	if role == entity.UserRoleAdmin {
		return domainerrors.NewValidationError("perfil admin possui acesso total fixo")
	}
	uniq := make([]string, 0, len(codes))
	seen := make(map[string]struct{}, len(codes))
	for _, code := range codes {
		if code == "" {
			continue
		}
		if _, ok := seen[code]; ok {
			continue
		}
		seen[code] = struct{}{}
		uniq = append(uniq, code)
	}
	slices.Sort(uniq)
	return s.repo.ReplaceRolePermissions(ctx, role, uniq)
}

func (s *AccessControlService) ListDataScopes(ctx context.Context) ([]repository.DataScopeCatalogEntry, error) {
	return s.scopes.ListDataScopes(ctx)
}

func (s *AccessControlService) ListRoleResourceScopes(ctx context.Context, role entity.UserRole) ([]repository.RoleResourceScope, error) {
	if !role.Valid() {
		return nil, domainerrors.NewValidationError("perfil inválido")
	}
	if role == entity.UserRoleAdmin {
		out := make([]repository.RoleResourceScope, 0, len(entity.ScopedClinicalResources))
		for _, r := range entity.ScopedClinicalResources {
			out = append(out, repository.RoleResourceScope{Resource: r, ScopeCode: entity.DataScopeAll})
		}
		return out, nil
	}
	return s.scopes.ListRoleResourceScopes(ctx, role)
}

func (s *AccessControlService) ReplaceRoleResourceScopes(ctx context.Context, role entity.UserRole, scopes []repository.RoleResourceScope) error {
	if !role.Valid() {
		return domainerrors.NewValidationError("perfil inválido")
	}
	if role == entity.UserRoleAdmin {
		return domainerrors.NewValidationError("perfil admin possui escopo total fixo")
	}
	filtered := make([]repository.RoleResourceScope, 0, len(scopes))
	for _, item := range scopes {
		if item.Resource == "" || !entity.DataScopeValid(item.ScopeCode) {
			continue
		}
		filtered = append(filtered, item)
	}
	return s.scopes.ReplaceRoleResourceScopes(ctx, role, filtered)
}
