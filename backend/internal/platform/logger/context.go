package logger

import (
	"context"
	"log/slog"
)

type contextKey string

const (
	ctxKeyRequestID contextKey = "request_id"
	ctxKeyTraceID   contextKey = "trace_id"
	ctxKeyTenantID  contextKey = "tenant_id"
	ctxKeyUserID    contextKey = "user_id"
)

// WithRequestID stores request ID in context.
func WithRequestID(ctx context.Context, requestID string) context.Context {
	return context.WithValue(ctx, ctxKeyRequestID, requestID)
}

// WithTraceID stores trace ID in context.
func WithTraceID(ctx context.Context, traceID string) context.Context {
	return context.WithValue(ctx, ctxKeyTraceID, traceID)
}

// WithTenantID stores tenant ID in context.
func WithTenantID(ctx context.Context, tenantID string) context.Context {
	return context.WithValue(ctx, ctxKeyTenantID, tenantID)
}

// WithUserID stores user ID in context (never log passwords/tokens alongside).
func WithUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, ctxKeyUserID, userID)
}

// ContextAttrs extracts standard correlation fields from context.
func ContextAttrs(ctx context.Context) []slog.Attr {
	var attrs []slog.Attr
	if v, ok := ctx.Value(ctxKeyRequestID).(string); ok && v != "" {
		attrs = append(attrs, slog.String("request_id", v))
	}
	if v, ok := ctx.Value(ctxKeyTraceID).(string); ok && v != "" {
		attrs = append(attrs, slog.String("trace_id", v))
	}
	if v, ok := ctx.Value(ctxKeyTenantID).(string); ok && v != "" {
		attrs = append(attrs, slog.String("tenant_id", v))
	}
	if v, ok := ctx.Value(ctxKeyUserID).(string); ok && v != "" {
		attrs = append(attrs, slog.String("user_id", v))
	}
	return attrs
}

// FromContext returns a logger enriched with correlation IDs from ctx.
func FromContext(ctx context.Context, base *slog.Logger) *slog.Logger {
	if base == nil {
		base = slog.Default()
	}
	attrs := ContextAttrs(ctx)
	if len(attrs) == 0 {
		return base
	}
	args := make([]any, 0, len(attrs)*2)
	for _, a := range attrs {
		args = append(args, a)
	}
	return base.With(args...)
}
