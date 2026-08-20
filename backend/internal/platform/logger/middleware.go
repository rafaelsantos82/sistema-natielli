package logger

import (
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// MiddlewareOptions configures Gin access logging.
type MiddlewareOptions struct {
	Logger         *slog.Logger
	MaskIP         bool
	LogUserAgent   bool
	QuietPaths     map[string]struct{}
	IncludeSwagger bool
}

// DefaultQuietPaths are excluded from INFO/WARN/ERROR access logs (optional DEBUG).
func DefaultQuietPaths() map[string]struct{} {
	return map[string]struct{}{
		"/api/v1/health":       {},
		"/api/v1/admin/health": {},
		"/metrics":             {},
	}
}

// GinMiddleware returns Gin handler: request ID propagation, context enrichment, access log.
// SECURITY: never logs request/response bodies or sensitive headers.
func GinMiddleware(opts MiddlewareOptions) gin.HandlerFunc {
	base := opts.Logger
	if base == nil {
		base = slog.Default()
	}
	quiet := opts.QuietPaths
	if quiet == nil {
		quiet = DefaultQuietPaths()
	}

	return func(c *gin.Context) {
		start := time.Now()

		requestID := strings.TrimSpace(c.GetHeader(RequestIDHeader))
		if requestID == "" {
			requestID = strings.TrimSpace(c.GetHeader("X-Request-Id"))
		}
		if requestID == "" {
			requestID = uuid.NewString()
		}

		traceID := strings.TrimSpace(c.GetHeader(TraceIDHeader))
		tenantID := strings.TrimSpace(c.GetHeader(TenantIDHeader))

		ctx := c.Request.Context()
		ctx = WithRequestID(ctx, requestID)
		if traceID != "" {
			ctx = WithTraceID(ctx, traceID)
		}
		if tenantID != "" {
			ctx = WithTenantID(ctx, tenantID)
		}

		c.Request = c.Request.WithContext(ctx)
		c.Set("request_id", requestID)
		c.Writer.Header().Set(RequestIDHeader, requestID)

		c.Next()

		if uid := c.GetString("user_id"); uid != "" {
			ctx = WithUserID(c.Request.Context(), uid)
			c.Request = c.Request.WithContext(ctx)
		}

		path := SanitizePath(c.Request.URL.RequestURI())
		if path == "" {
			path = SanitizePath(c.Request.URL.Path)
		}

		status := c.Writer.Status()
		latency := time.Since(start)
		_, isQuiet := quiet[c.Request.URL.Path]

		if isQuiet && !opts.IncludeSwagger {
			if strings.HasPrefix(c.Request.URL.Path, "/api/v1/swagger") {
				isQuiet = true
			}
		}
		if strings.HasPrefix(c.Request.URL.Path, "/api/v1/swagger") && !opts.IncludeSwagger {
			isQuiet = true
		}

		log := FromContext(c.Request.Context(), base)
		attrs := []any{
			slog.String("method", c.Request.Method),
			slog.String("path", path),
			slog.Int("status", status),
			slog.Int64("latency_ms", latency.Milliseconds()),
		}

		clientIP := c.ClientIP()
		if opts.MaskIP {
			clientIP = MaskIP(clientIP)
		}
		if clientIP != "" {
			attrs = append(attrs, slog.String("client_ip", clientIP))
		}

		if opts.LogUserAgent {
			ua := strings.TrimSpace(c.Request.UserAgent())
			if ua != "" && len(ua) <= 256 {
				attrs = append(attrs, slog.String("user_agent", ua))
			}
		}

		if err := c.Errors.Last(); err != nil {
			attrs = append(attrs, slog.String("error", RedactValue("error", err.Error())))
		}

		msg := "request completed"
		level := slog.LevelInfo
		switch {
		case status >= http.StatusInternalServerError:
			level = slog.LevelError
			msg = "request failed"
		case status >= http.StatusBadRequest:
			level = slog.LevelWarn
			msg = "request client error"
		}

		if isQuiet {
			level = slog.LevelDebug
			msg = "request completed (quiet)"
		}

		log.Log(c.Request.Context(), level, msg, attrs...)
	}
}

// GinUserContext copies authenticated user_id into request context after RequireAuth.
func GinUserContext() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		uid := c.GetString("user_id")
		if uid == "" {
			return
		}
		ctx := WithUserID(c.Request.Context(), uid)
		c.Request = c.Request.WithContext(ctx)
	}
}
