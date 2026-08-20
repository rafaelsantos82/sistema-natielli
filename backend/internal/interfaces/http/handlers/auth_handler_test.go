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

	"espaco-terapia-os/backend/internal/application"
	"espaco-terapia-os/backend/internal/domain/entity"
	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/domain/service"
	httplayer "espaco-terapia-os/backend/internal/interfaces/http"
	infrauth "espaco-terapia-os/backend/internal/infrastructure/auth"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type memUserRepo struct {
	byEmail map[string]*entity.User
}

func (m *memUserRepo) FindByEmail(_ context.Context, email string) (*entity.User, error) {
	return m.byEmail[email], nil
}
func (m *memUserRepo) FindByID(_ context.Context, id uuid.UUID) (*entity.User, error) {
	for _, u := range m.byEmail {
		if u.ID == id {
			return u, nil
		}
	}
	return nil, nil
}
func (m *memUserRepo) FindByIDUnscoped(_ context.Context, id uuid.UUID) (*entity.User, error) {
	return m.FindByID(context.Background(), id)
}
func (m *memUserRepo) Restore(_ context.Context, _ uuid.UUID) error { return nil }
func (m *memUserRepo) List(_ context.Context, _ repository.UserListFilter) ([]*entity.User, int64, error) {
	return nil, 0, nil
}
func (m *memUserRepo) Create(_ context.Context, _ *entity.User) error { return nil }
func (m *memUserRepo) Update(_ context.Context, _ *entity.User) error { return nil }
func (m *memUserRepo) SoftDelete(_ context.Context, _ uuid.UUID) error { return nil }
func (m *memUserRepo) ReplaceUnidades(_ context.Context, _ uuid.UUID, _ []uuid.UUID) error {
	return nil
}
func (m *memUserRepo) CountActiveAdmins(_ context.Context, _ *uuid.UUID) (int64, error) {
	return 1, nil
}

func TestAuthHandler_LoginUnauthorized(t *testing.T) {
	gin.SetMode(gin.TestMode)
	hash, _ := service.HashPassword("senha12345")
	id := uuid.New()
	repo := &memUserRepo{byEmail: map[string]*entity.User{
		"user@test.com": {
			ID: id, Email: "user@test.com", PasswordHash: hash, Role: entity.UserRoleAdmin,
		},
	}}
	jwt := infrauth.NewJWTService("test-secret-key-32-bytes-long!!", "test", 60, nil)
	authSvc := service.NewAuthService(repo, jwt, nil, nil, nil, nil, nil)
	authApp := application.NewAuthApp(authSvc)
	logger := slog.New(slog.NewTextHandler(os.Stderr, nil))
	h := NewAuthHandler(authApp, httplayer.NewErrorHandler(logger), jwt, false, "")

	r := gin.New()
	r.POST("/auth/login", h.Login)

	body, _ := json.Marshal(map[string]string{"email": "user@test.com", "password": "errada"})
	req := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("status %d body %s", w.Code, w.Body.String())
	}
}
