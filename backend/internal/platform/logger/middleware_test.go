package logger

import (
	"bytes"
	"context"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestGinMiddleware_RequestID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	var buf bytes.Buffer
	l := NewTestLogger(&buf)

	r := gin.New()
	r.Use(GinMiddleware(MiddlewareOptions{Logger: l}))

	r.GET("/ok", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/ok", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	rid := rec.Header().Get(RequestIDHeader)
	if rid == "" {
		t.Fatal("missing X-Request-ID response header")
	}
	if !strings.Contains(buf.String(), rid) {
		t.Fatalf("log should contain request_id: %s", buf.String())
	}
}

func TestGinMiddleware_PropagatesRequestID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	var buf bytes.Buffer
	l := NewTestLogger(&buf)

	r := gin.New()
	r.Use(GinMiddleware(MiddlewareOptions{Logger: l}))
	r.GET("/ok", func(c *gin.Context) {
		log := FromContext(c.Request.Context(), l)
		log.Info("inside")
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/ok", nil)
	req.Header.Set(RequestIDHeader, "fixed-id-123")
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Header().Get(RequestIDHeader) != "fixed-id-123" {
		t.Fatalf("got %q", rec.Header().Get(RequestIDHeader))
	}
}

func TestGinMiddleware_NoBody(t *testing.T) {
	gin.SetMode(gin.TestMode)
	var buf bytes.Buffer
	l := NewTestLogger(&buf)

	r := gin.New()
	r.Use(GinMiddleware(MiddlewareOptions{Logger: l}))
	r.POST("/api/v1/auth/token", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	body := `{"password":"super-secret","email":"a@b.com"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/token", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	logs := buf.String()
	if strings.Contains(logs, "super-secret") {
		t.Fatalf("password leaked in logs: %s", logs)
	}
	if strings.Contains(logs, body) {
		t.Fatalf("body leaked in logs")
	}
}

func TestGinMiddleware_StatusLevels(t *testing.T) {
	gin.SetMode(gin.TestMode)
	var buf bytes.Buffer
	l := NewTestLogger(&buf)

	r := gin.New()
	r.Use(GinMiddleware(MiddlewareOptions{Logger: l, QuietPaths: map[string]struct{}{}}))
	r.GET("/err", func(c *gin.Context) {
		c.Status(http.StatusInternalServerError)
	})

	req := httptest.NewRequest(http.MethodGet, "/err", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if !strings.Contains(buf.String(), "request failed") {
		t.Fatalf("expected error level message: %s", buf.String())
	}
}

func TestFromContext(t *testing.T) {
	ctx := WithRequestID(context.Background(), "req-1")
	var buf bytes.Buffer
	base := slog.New(slog.NewTextHandler(&buf, &slog.HandlerOptions{ReplaceAttr: RedactAttr}))
	l := FromContext(ctx, base)
	l.Info("x")
	if !strings.Contains(buf.String(), "req-1") {
		t.Fatalf("missing request_id in log: %s", buf.String())
	}
}
