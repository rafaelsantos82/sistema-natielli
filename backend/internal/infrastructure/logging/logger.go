package logging

import (
	"espaco-terapia-os/backend/internal/config"
	platformlogger "espaco-terapia-os/backend/internal/platform/logger"
	"log/slog"
)

// New builds the application logger via internal/platform/logger (preferred).
// Deprecated: import platform/logger directly in new code.
func New(cfg *config.Config) *slog.Logger {
	if cfg == nil {
		return platformlogger.New(platformlogger.Config{AppEnv: "development"})
	}
	return platformlogger.New(platformlogger.Config{
		AppEnv:           cfg.AppEnv,
		ServiceName:      cfg.ServiceName,
		ServiceVersion:   cfg.ServiceVersion,
		LogLevel:         cfg.LogLevel,
		LogFormat:        cfg.LogFormat,
		LogIncludeCaller: cfg.LogIncludeCaller,
		LogMaskIP:        cfg.LogMaskIP,
	})
}
