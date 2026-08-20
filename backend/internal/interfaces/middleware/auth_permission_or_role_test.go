package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"espaco-terapia-os/backend/internal/domain/entity"
	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/domain/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type permOrRoleAccessRepo struct {
	allowed map[string]bool
}

func (s *permOrRoleAccessRepo) HasRolePermission(_ context.Context, _ entity.UserRole, code string) (bool, error) {
	return s.allowed[code], nil
}

func (s *permOrRoleAccessRepo) ListPermissions(_ context.Context) ([]repository.Permission, error) {
	return nil, nil
}

func (s *permOrRoleAccessRepo) ListRolePermissionCodes(_ context.Context, _ entity.UserRole) ([]string, error) {
	return nil, nil
}

func (s *permOrRoleAccessRepo) ReplaceRolePermissions(_ context.Context, _ entity.UserRole, _ []string) error {
	return nil
}

type permOrRoleScopeRepo struct{}

func (permOrRoleScopeRepo) GetRoleResourceScope(_ context.Context, _ entity.UserRole, _ string) (string, error) {
	return entity.DataScopeAll, nil
}
func (permOrRoleScopeRepo) ListRoleResourceScopes(context.Context, entity.UserRole) ([]repository.RoleResourceScope, error) {
	return nil, nil
}
func (permOrRoleScopeRepo) ReplaceRoleResourceScopes(context.Context, entity.UserRole, []repository.RoleResourceScope) error {
	return nil
}
func (permOrRoleScopeRepo) ListDataScopes(context.Context) ([]repository.DataScopeCatalogEntry, error) {
	return nil, nil
}
func (permOrRoleScopeRepo) PacienteAccessibleByProfissional(context.Context, uuid.UUID, uuid.UUID) (bool, error) {
	return true, nil
}
func (permOrRoleScopeRepo) PacienteInUnidades(context.Context, uuid.UUID, []uuid.UUID) (bool, error) {
	return true, nil
}

func TestRequirePermissionOrRole_AllowsFallbackRoleWithoutPermission(t *testing.T) {
	gin.SetMode(gin.TestMode)
	authz := service.NewAccessControlService(
		&permOrRoleAccessRepo{allowed: map[string]bool{}},
		permOrRoleScopeRepo{},
	)

	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("role", string(entity.UserRoleGestor))
		c.Next()
	})
	r.GET("/x", RequirePermissionOrRole(authz, "api.documentos.write", "admin", "gestor"), func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/x", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 via role fallback, got %d", rec.Code)
	}
}

func TestRequirePermissionOrRole_DeniesWhenNeitherPermissionNorRole(t *testing.T) {
	gin.SetMode(gin.TestMode)
	authz := service.NewAccessControlService(
		&permOrRoleAccessRepo{allowed: map[string]bool{}},
		permOrRoleScopeRepo{},
	)

	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("role", string(entity.UserRoleFuncionario))
		c.Next()
	})
	r.GET("/x", RequirePermissionOrRole(authz, "api.documentos.write", "admin", "gestor"), func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/x", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rec.Code)
	}
}
