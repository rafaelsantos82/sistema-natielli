package middleware

import (
	"espaco-terapia-os/backend/internal/config"
	platformlogger "espaco-terapia-os/backend/internal/platform/logger"
	"log/slog"

	"github.com/gin-gonic/gin"
)

// AccessLog returns Gin middleware for secure structured access logging.
func AccessLog(cfg *config.Config, logger *slog.Logger) gin.HandlerFunc {
	maskIP := true
	if cfg != nil {
		maskIP = cfg.LogMaskIP
	}
	return platformlogger.GinMiddleware(platformlogger.MiddlewareOptions{
		Logger:       logger,
		MaskIP:       maskIP,
		LogUserAgent: false,
	})
}

// GinUserContext enriches request context with user_id after auth middleware.
func GinUserContext() gin.HandlerFunc {
	return platformlogger.GinUserContext()
}
