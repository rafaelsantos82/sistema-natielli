package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"espaco-terapia-os/backend/internal/application"
	"espaco-terapia-os/backend/internal/domain/entity"
	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/domain/service"
	"espaco-terapia-os/backend/internal/infrastructure/auth"
	httplayer "espaco-terapia-os/backend/internal/interfaces/http"
	"espaco-terapia-os/backend/internal/interfaces/middleware"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type handlerMockRepo struct {
	existsCPF bool
}

func (m *handlerMockRepo) Save(ctx context.Context, p *entity.Paciente) error { return nil }
func (m *handlerMockRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.Paciente, error) {
	return nil, nil
}
func (m *handlerMockRepo) Update(ctx context.Context, p *entity.Paciente) error { return nil }
func (m *handlerMockRepo) FindByIDUnscoped(ctx context.Context, id uuid.UUID) (*entity.Paciente, error) {
	return nil, nil
}
func (m *handlerMockRepo) MarkDeleted(ctx context.Context, id uuid.UUID) error { return nil }
func (m *handlerMockRepo) Restore(ctx context.Context, id uuid.UUID) error     { return nil }
func (m *handlerMockRepo) ExistsCPF(ctx context.Context, cpf string, excludeID *uuid.UUID) (bool, error) {
	return m.existsCPF, nil
}
func (m *handlerMockRepo) List(ctx context.Context, filter repository.PacienteListFilter) ([]*entity.Paciente, int64, error) {
	return nil, 0, nil
}
func (m *handlerMockRepo) SetUnidades(ctx context.Context, pacienteID uuid.UUID, unidades []entity.PacienteUnidadeLink) error {
	return nil
}
func (m *handlerMockRepo) GetUnidades(ctx context.Context, pacienteID uuid.UUID) ([]entity.PacienteUnidadeLink, error) {
	return nil, nil
}

type handlerScopeRepoStub struct{}

func (handlerScopeRepoStub) GetRoleResourceScope(context.Context, entity.UserRole, string) (string, error) {
	return entity.DataScopeAll, nil
}
func (handlerScopeRepoStub) ListRoleResourceScopes(context.Context, entity.UserRole) ([]repository.RoleResourceScope, error) {
	return nil, nil
}
func (handlerScopeRepoStub) ReplaceRoleResourceScopes(context.Context, entity.UserRole, []repository.RoleResourceScope) error {
	return nil
}
func (handlerScopeRepoStub) ListDataScopes(context.Context) ([]repository.DataScopeCatalogEntry, error) {
	return nil, nil
}
func (handlerScopeRepoStub) PacienteAccessibleByProfissional(context.Context, uuid.UUID, uuid.UUID) (bool, error) {
	return true, nil
}
func (handlerScopeRepoStub) PacienteInUnidades(context.Context, uuid.UUID, []uuid.UUID) (bool, error) {
	return true, nil
}

func setupPacienteRouter(t *testing.T, withAuth bool) (*gin.Engine, *auth.JWTService) {
	t.Helper()
	gin.SetMode(gin.TestMode)
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	jwtSvc := auth.NewJWTService("test-secret-key-32chars-minimum!", "test", 60, nil)
	repo := &handlerMockRepo{}
	svc := service.NewPacienteService(repo, nil)
	app := application.NewPacienteApp(svc)
	scopeSvc := service.NewDataScopeService(&handlerScopeRepoStub{}, nil)
	h := NewPacienteHandler(app, scopeSvc, httplayer.NewErrorHandler(logger), logger)

	r := gin.New()
	api := r.Group("/api/v1")
	protected := api.Group("/")
	if withAuth {
		protected.Use(middleware.RequireConfiguredSecret("test-secret-key-32chars-minimum!"))
		protected.Use(middleware.RequireAuth(jwtSvc))
		protected.Use(middleware.RequireRole("admin"))
	}
	protected.POST("/pacientes", h.CreatePaciente)
	return r, jwtSvc
}

type restoreHandlerRepo struct {
	handlerMockRepo
	id      uuid.UUID
	patient *entity.Paciente
}

func (m *restoreHandlerRepo) FindByIDUnscoped(ctx context.Context, id uuid.UUID) (*entity.Paciente, error) {
	if id == m.id && m.patient != nil {
		cp := *m.patient
		return &cp, nil
	}
	return nil, nil
}

func (m *restoreHandlerRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.Paciente, error) {
	if id == m.id && m.patient != nil && m.patient.DeletedAt == nil {
		cp := *m.patient
		return &cp, nil
	}
	return nil, nil
}

func (m *restoreHandlerRepo) Restore(ctx context.Context, id uuid.UUID) error {
	if id == m.id && m.patient != nil {
		m.patient.DeletedAt = nil
		m.patient.Status = entity.PacienteAtivo
	}
	return nil
}

func setupPacienteRestoreRouter(t *testing.T, repo repository.PacienteRepository) (*gin.Engine, *auth.JWTService) {
	t.Helper()
	gin.SetMode(gin.TestMode)
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	jwtSvc := auth.NewJWTService("test-secret-key-32chars-minimum!", "test", 60, nil)
	svc := service.NewPacienteService(repo, nil)
	app := application.NewPacienteApp(svc)
	scopeSvc := service.NewDataScopeService(&handlerScopeRepoStub{}, nil)
	h := NewPacienteHandler(app, scopeSvc, httplayer.NewErrorHandler(logger), logger)

	r := gin.New()
	api := r.Group("/api/v1")
	protected := api.Group("/")
	protected.Use(middleware.RequireConfiguredSecret("test-secret-key-32chars-minimum!"))
	protected.Use(middleware.RequireAuth(jwtSvc))
	protected.Use(middleware.RequireRole("admin"))
	protected.POST("/pacientes/:id/restore", h.RestorePaciente)
	return r, jwtSvc
}

func TestCreatePaciente_UnauthorizedWithoutJWT(t *testing.T) {
	r, _ := setupPacienteRouter(t, true)
	body := bytes.NewBufferString(`{}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/pacientes", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("status %d", w.Code)
	}
}

func TestCreatePaciente_BadRequestInvalidBody(t *testing.T) {
	r, jwtSvc := setupPacienteRouter(t, true)
	token, err := jwtSvc.Generate("user-1", "user@example.com", "admin", false)
	if err != nil {
		t.Fatal(err)
	}
	body := bytes.NewBufferString(`{"nome_completo":""}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/pacientes", body)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("status %d body %s", w.Code, w.Body.String())
	}
}

func TestCreatePaciente_Created(t *testing.T) {
	r, jwtSvc := setupPacienteRouter(t, true)
	token, _ := jwtSvc.Generate("user-1", "user@example.com", "admin", false)
	unidadeID := uuid.New().String()
	payload := map[string]interface{}{
		"nome_completo":     "Pedro Teste",
		"data_nascimento":   time.Now().AddDate(-7, 0, 0).Format("2006-01-02"),
		"sexo_biologico":    "masculino",
		"cpf":               "52998224725",
		"tel_principal":     "21977776666",
		"uf":                "RJ",
		"cep":               "20000000",
		"responsavel_nome":  "Responsável",
		"consentimento_lgpd": true,
		"unidade_ids": []map[string]interface{}{
			{"unidade_id": unidadeID, "principal": true},
		},
	}
	b, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/pacientes", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("status %d body %s", w.Code, w.Body.String())
	}
	var resp struct {
		Data struct {
			ID string `json:"id"`
		} `json:"data"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatal(err)
	}
	if resp.Data.ID == "" {
		t.Fatal("expected id in data")
	}
}

func TestRestorePaciente_UnauthorizedWithoutJWT(t *testing.T) {
	id := uuid.New()
	deleted := time.Now().UTC()
	repo := &restoreHandlerRepo{
		id: id,
		patient: &entity.Paciente{
			ID: id, NomeCompleto: "Ana", Status: entity.PacienteInativo,
			TelPrincipal: "21999999999", UF: "RJ", CEP: "20000000",
			ResponsavelNome: "Pai", ConsentimentoLGPD: true, DeletedAt: &deleted,
		},
	}
	r, _ := setupPacienteRestoreRouter(t, repo)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/pacientes/"+id.String()+"/restore", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("status %d", w.Code)
	}
}

func TestRestorePaciente_NotFound(t *testing.T) {
	r, jwtSvc := setupPacienteRestoreRouter(t, &handlerMockRepo{})
	token, _ := jwtSvc.Generate(uuid.New().String(), "user@example.com", "admin", false)
	missing := uuid.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/pacientes/"+missing.String()+"/restore", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusNotFound {
		t.Fatalf("status %d body %s", w.Code, w.Body.String())
	}
}

func TestRestorePaciente_OK(t *testing.T) {
	id := uuid.New()
	deleted := time.Now().UTC()
	repo := &restoreHandlerRepo{
		id: id,
		patient: &entity.Paciente{
			ID: id, NomeCompleto: "Ana Restaurar", Status: entity.PacienteInativo,
			TelPrincipal: "21999999999", UF: "RJ", CEP: "20000000",
			ResponsavelNome: "Pai", ConsentimentoLGPD: true, DeletedAt: &deleted,
		},
	}
	r, jwtSvc := setupPacienteRestoreRouter(t, repo)
	token, _ := jwtSvc.Generate(uuid.New().String(), "user@example.com", "admin", false)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/pacientes/"+id.String()+"/restore", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("status %d body %s", w.Code, w.Body.String())
	}
	var resp struct {
		Data struct {
			ID     string `json:"id"`
			Status string `json:"status"`
		} `json:"data"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatal(err)
	}
	if resp.Data.ID != id.String() {
		t.Fatalf("id %s", resp.Data.ID)
	}
	if resp.Data.Status != string(entity.PacienteAtivo) {
		t.Fatalf("status %s", resp.Data.Status)
	}
}
