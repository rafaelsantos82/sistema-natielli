package logger

import (
	"io"
	"log/slog"
	"os"
	"strings"
)

// Config drives handler selection and default attributes.
type Config struct {
	AppEnv           string
	ServiceName      string
	ServiceVersion   string
	LogLevel         string
	LogFormat        string
	LogIncludeCaller bool
	LogMaskIP        bool
}

const (
	FormatJSON = "json"
	FormatText = "text"
)

// RequestIDHeader is the canonical correlation header.
const RequestIDHeader = "X-Request-ID"

// TraceIDHeader optional distributed trace id.
const TraceIDHeader = "X-Trace-Id"

// TenantIDHeader optional tenant scope.
const TenantIDHeader = "X-Tenant-Id"

// New builds the application logger with sanitization and environment-aware format.
func New(cfg Config) *slog.Logger {
	level := ParseLevel(cfg.LogLevel, cfg.AppEnv)
	format := ResolveFormat(cfg.LogFormat, cfg.AppEnv)

	opts := &slog.HandlerOptions{
		Level:       level,
		AddSource:   cfg.LogIncludeCaller,
		ReplaceAttr: RedactAttr,
	}

	var handler slog.Handler
	switch format {
	case FormatText:
		handler = slog.NewTextHandler(os.Stdout, opts)
	default:
		handler = slog.NewJSONHandler(os.Stdout, opts)
	}

	base := slog.New(handler).With(
		slog.String("service", defaultString(cfg.ServiceName, "espaco-terapia-api")),
		slog.String("env", defaultString(cfg.AppEnv, "development")),
		slog.String("version", defaultString(cfg.ServiceVersion, "v0.0.0")),
	)

	// Store mask IP preference on default logger via custom wrapper is not needed;
	// middleware reads cfg.LogMaskIP directly.
	_ = cfg.LogMaskIP

	return base
}

// NewTestLogger writes sanitized logs to w (text format) for tests.
func NewTestLogger(w io.Writer) *slog.Logger {
	opts := &slog.HandlerOptions{
		Level:       slog.LevelDebug,
		ReplaceAttr: RedactAttr,
	}
	return slog.New(slog.NewTextHandler(w, opts))
}

// ParseLevel maps LOG_LEVEL or derives from APP_ENV.
func ParseLevel(logLevel, appEnv string) slog.Level {
	switch strings.ToLower(strings.TrimSpace(logLevel)) {
	case "debug":
		return slog.LevelDebug
	case "info":
		return slog.LevelInfo
	case "warn", "warning":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		if isProductionLike(appEnv) {
			return slog.LevelInfo
		}
		return slog.LevelDebug
	}
}

// ResolveFormat picks json vs text.
func ResolveFormat(logFormat, appEnv string) string {
	switch strings.ToLower(strings.TrimSpace(logFormat)) {
	case FormatJSON:
		return FormatJSON
	case FormatText:
		return FormatText
	default:
		if isProductionLike(appEnv) {
			return FormatJSON
		}
		return FormatText
	}
}

func isProductionLike(appEnv string) bool {
	switch strings.ToLower(strings.TrimSpace(appEnv)) {
	case "production", "staging":
		return true
	default:
		return false
	}
}

func defaultString(v, fallback string) string {
	if strings.TrimSpace(v) == "" {
		return fallback
	}
	return v
}

// HandlerFormat exposes resolved format for tests.
func HandlerFormat(cfg Config) string {
	return ResolveFormat(cfg.LogFormat, cfg.AppEnv)
}
