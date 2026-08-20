package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"espaco-terapia-os/backend/internal/infrastructure/auth"

	"github.com/gin-gonic/gin"
)

func TestRequireAuthAndRole(t *testing.T) {
	gin.SetMode(gin.TestMode)
	jwtSvc := auth.NewJWTService("secret", "issuer", 60, nil)
	token, err := jwtSvc.Generate("u1", "u1@example.com", "admin", false)
	if err != nil {
		t.Fatalf("generate token: %v", err)
	}

	r := gin.New()
	r.Use(RequireConfiguredSecret("secret"))
	r.Use(RequireAuth(jwtSvc))
	r.Use(RequireRole("admin"))
	r.GET("/secure", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/secure", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
}
