package handlers

import (
	"context"
	"log/slog"
	"net/http/httptest"
	"testing"

	"espaco-terapia-os/backend/internal/application"
	"espaco-terapia-os/backend/internal/domain/entity"
	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/domain/service"
	httplayer "espaco-terapia-os/backend/internal/interfaces/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type consultaListStubRepo struct {
	lastFilter repository.ConsultaListFilter
}

func (c *consultaListStubRepo) Save(context.Context, *entity.Consulta) error { return nil }
func (c *consultaListStubRepo) FindByID(context.Context, uuid.UUID) (*entity.Consulta, error) {
	return nil, nil
}
func (c *consultaListStubRepo) Update(context.Context, *entity.Consulta) error { return nil }
func (c *consultaListStubRepo) Delete(context.Context, uuid.UUID) error { return nil }
func (c *consultaListStubRepo) List(_ context.Context, filter repository.ConsultaListFilter) ([]repository.ConsultaListItem, int64, error) {
	c.lastFilter = filter
	return nil, 0, nil
}
func (c *consultaListStubRepo) FindByIDWithNames(context.Context, uuid.UUID) (*repository.ConsultaListItem, error) {
	return nil, nil
}
func (c *consultaListStubRepo) PatchAtendimento(context.Context, uuid.UUID, map[string]interface{}) error {
	return nil
}
func (c *consultaListStubRepo) ExistsBySalaID(context.Context, uuid.UUID) (bool, error) {
	return false, nil
}

type userByIDStub struct {
	u *entity.User
}

func (s *userByIDStub) FindByEmail(context.Context, string) (*entity.User, error) { return nil, nil }
func (s *userByIDStub) FindByID(context.Context, uuid.UUID) (*entity.User, error) { return s.u, nil }
func (s *userByIDStub) FindByIDUnscoped(context.Context, uuid.UUID) (*entity.User, error) {
	return s.u, nil
}
func (s *userByIDStub) Restore(context.Context, uuid.UUID) error { return nil }
func (s *userByIDStub) List(context.Context, repository.UserListFilter) ([]*entity.User, int64, error) {
	return nil, 0, nil
}
func (s *userByIDStub) Create(context.Context, *entity.User) error { return nil }
func (s *userByIDStub) Update(context.Context, *entity.User) error { return nil }
func (s *userByIDStub) SoftDelete(context.Context, uuid.UUID) error { return nil }
func (s *userByIDStub) ReplaceUnidades(context.Context, uuid.UUID, []uuid.UUID) error { return nil }
func (s *userByIDStub) CountActiveAdmins(context.Context, *uuid.UUID) (int64, error) { return 1, nil }

type scopeRepoHandlerStub struct {
	scopes map[string]string
}

func (s *scopeRepoHandlerStub) GetRoleResourceScope(_ context.Context, _ entity.UserRole, resource string) (string, error) {
	if code, ok := s.scopes[resource]; ok {
		return code, nil
	}
	return entity.DataScopeAll, nil
}
func (s *scopeRepoHandlerStub) ListRoleResourceScopes(context.Context, entity.UserRole) ([]repository.RoleResourceScope, error) {
	return nil, nil
}
func (s *scopeRepoHandlerStub) ReplaceRoleResourceScopes(context.Context, entity.UserRole, []repository.RoleResourceScope) error {
	return nil
}
func (s *scopeRepoHandlerStub) ListDataScopes(context.Context) ([]repository.DataScopeCatalogEntry, error) {
	return nil, nil
}
func (s *scopeRepoHandlerStub) PacienteAccessibleByProfissional(context.Context, uuid.UUID, uuid.UUID) (bool, error) {
	return true, nil
}
func (s *scopeRepoHandlerStub) PacienteInUnidades(context.Context, uuid.UUID, []uuid.UUID) (bool, error) {
	return true, nil
}

func TestConsultaHandler_ListConsultas_AppliesPacienteScopeForResponsavel(t *testing.T) {
	gin.SetMode(gin.TestMode)
	listRepo := &consultaListStubRepo{}
	pid := uuid.New()
	actor := uuid.New()
	userRepo := &userByIDStub{u: &entity.User{
		ID: actor, Role: entity.UserRoleResponsavel, PacienteID: &pid,
	}}
	scopeRepo := &scopeRepoHandlerStub{scopes: map[string]string{"consultas": entity.DataScopeSelfPatient}}
	scopeSvc := service.NewDataScopeService(scopeRepo, userRepo)
	svc := service.NewConsultaService(listRepo, nil, nil, slog.Default())
	app := application.NewConsultaApp(svc)
	handler := NewConsultaHandler(app, scopeSvc, httplayer.NewErrorHandler(slog.Default()), slog.Default())

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest("GET", "/consultas", nil)
	c.Set("role", string(entity.UserRoleResponsavel))
	c.Set("user_id", actor.String())
	handler.ListConsultas(c)

	if w.Code != 200 {
		t.Fatalf("unexpected status %d body %s", w.Code, w.Body.String())
	}
	if listRepo.lastFilter.PacienteID == nil || *listRepo.lastFilter.PacienteID != pid {
		t.Fatalf("expected paciente scope on list filter, got %+v", listRepo.lastFilter.PacienteID)
	}
}
