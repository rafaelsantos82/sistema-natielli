package config

import (
	"os"
	"testing"
)

func TestValidate_ProductionRejectsBootstrap(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("DATABASE_URL", "postgres://u:p@db:5432/espaco_terapia?sslmode=disable")
	t.Setenv("JWT_SECRET", "test-secret-min-32-chars-long-enough")
	t.Setenv("BOOTSTRAP_AUTH_ENABLED", "true")
	t.Setenv("BOOTSTRAP_AUTH_TOKEN", "dev-token")

	cfg := New()
	if err := cfg.Validate(); err == nil {
		t.Fatal("expected error when bootstrap enabled in production")
	}
}

func TestValidate_ProductionRequiresJWT(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("DATABASE_URL", "postgres://u:p@db:5432/espaco_terapia?sslmode=disable")
	t.Setenv("JWT_SECRET", "")
	t.Setenv("BOOTSTRAP_AUTH_ENABLED", "false")

	cfg := New()
	if err := cfg.Validate(); err == nil {
		t.Fatal("expected error when JWT_SECRET empty in production")
	}
}

func TestValidate_DevelopmentAllowsBootstrapWithoutTokenWhenDisabled(t *testing.T) {
	os.Unsetenv("BOOTSTRAP_AUTH_ENABLED")
	os.Unsetenv("BOOTSTRAP_AUTH_TOKEN")
	t.Setenv("APP_ENV", "development")
	t.Setenv("DATABASE_URL", "postgres://localhost/db")

	cfg := New()
	cfg.BootstrapAuth = false
	if err := cfg.Validate(); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}
