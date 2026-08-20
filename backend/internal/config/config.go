package config

import (
	"fmt"
	"os"
	"strings"
)

type Config struct {
	AppEnv             string
	ServerPort         string
	DatabaseURL        string
	JWTSecret          string
	JWTIssuer          string
	JWTExpirationMin   int
	BootstrapAuth      bool
	BootstrapAuthToken string
	CORSAllowedOrigins []string
	SentryDSN          string
	SentryEnvironment  string
	SentryEnableTrace  bool
	SentryTraceRate    float64
	SwaggerEnabled     bool

	ServiceName        string
	ServiceVersion     string
	LogLevel           string
	LogFormat          string
	LogIncludeCaller   bool
	LogMaskIP          bool

	LoginMaxAttempts     int
	LoginLockoutMinutes  int
	ResendAPIKey         string
	EmailFrom            string
	FrontendPublicURL    string
}

func New() *Config {
	cfg := &Config{
		AppEnv:             getEnv("APP_ENV", "development"),
		ServerPort:         getEnv("SERVER_PORT", "8080"),
		DatabaseURL:        getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/espaco_terapia?sslmode=disable"),
		JWTSecret:          getEnv("JWT_SECRET", ""),
		JWTIssuer:          getEnv("JWT_ISSUER", "espaco-terapia-api"),
		JWTExpirationMin:   getEnvInt("JWT_EXPIRATION_MINUTES", 60),
		BootstrapAuth:      getEnvBool("BOOTSTRAP_AUTH_ENABLED", true),
		BootstrapAuthToken: getEnv("BOOTSTRAP_AUTH_TOKEN", ""),
		CORSAllowedOrigins: splitCSV(getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")),
		SentryDSN:          getEnv("SENTRY_DSN", ""),
		SentryEnvironment:  getEnv("SENTRY_ENVIRONMENT", "development"),
		SentryEnableTrace:  getEnvBool("SENTRY_ENABLE_TRACING", false),
		SentryTraceRate:    getEnvFloat64("SENTRY_TRACES_SAMPLE_RATE", 0.2),
		SwaggerEnabled:     getEnvBool("SWAGGER_ENABLED", false),
		ServiceName:        getEnv("SERVICE_NAME", "espaco-terapia-api"),
		ServiceVersion:     getEnv("SERVICE_VERSION", "v0.0.0"),
		LogLevel:           getEnv("LOG_LEVEL", ""),
		LogFormat:          getEnv("LOG_FORMAT", ""),
		LogIncludeCaller:   getEnvBool("LOG_INCLUDE_CALLER", false),
		LogMaskIP:           resolveLogMaskIP(),
		LoginMaxAttempts:    getEnvInt("LOGIN_MAX_ATTEMPTS", 5),
		LoginLockoutMinutes: getEnvInt("LOGIN_LOCKOUT_MINUTES", 15),
		ResendAPIKey:        getEnv("RESEND_API_KEY", ""),
		EmailFrom:           getEnv("EMAIL_FROM", ""),
		FrontendPublicURL:   getEnv("FRONTEND_PUBLIC_URL", "http://localhost:5173"),
	}
	return cfg
}

func (c *Config) Validate() error {
	if strings.TrimSpace(c.DatabaseURL) == "" {
		return fmt.Errorf("DATABASE_URL is required")
	}

	if strings.TrimSpace(c.ServerPort) == "" {
		return fmt.Errorf("SERVER_PORT is required")
	}

	if c.AppEnv == "production" && strings.TrimSpace(c.JWTSecret) == "" {
		return fmt.Errorf("JWT_SECRET is required in production")
	}

	if c.AppEnv == "production" && c.BootstrapAuth {
		return fmt.Errorf("BOOTSTRAP_AUTH_ENABLED must be false in production")
	}

	if c.BootstrapAuth && strings.TrimSpace(c.BootstrapAuthToken) == "" {
		return fmt.Errorf("BOOTSTRAP_AUTH_TOKEN is required when BOOTSTRAP_AUTH_ENABLED=true")
	}

	return nil
}

func getEnv(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func splitCSV(input string) []string {
	raw := strings.Split(input, ",")
	out := make([]string, 0, len(raw))
	for _, item := range raw {
		trimmed := strings.TrimSpace(item)
		if trimmed != "" {
			out = append(out, trimmed)
		}
	}
	return out
}

func getEnvInt(key string, fallback int) int {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	var parsed int
	if _, err := fmt.Sscanf(value, "%d", &parsed); err != nil {
		return fallback
	}
	return parsed
}

func getEnvFloat64(key string, fallback float64) float64 {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	var parsed float64
	if _, err := fmt.Sscanf(value, "%f", &parsed); err != nil {
		return fallback
	}
	return parsed
}

func resolveLogMaskIP() bool {
	if strings.TrimSpace(os.Getenv("LOG_MASK_IP")) != "" {
		return getEnvBool("LOG_MASK_IP", true)
	}
	env := strings.ToLower(strings.TrimSpace(getEnv("APP_ENV", "development")))
	return env == "production" || env == "staging"
}

func getEnvBool(key string, fallback bool) bool {
	value := strings.TrimSpace(strings.ToLower(os.Getenv(key)))
	if value == "" {
		return fallback
	}
	return value == "1" || value == "true" || value == "yes"
}
