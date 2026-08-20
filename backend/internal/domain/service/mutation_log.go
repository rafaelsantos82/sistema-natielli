package service

import (
	"context"
	"log/slog"

	platformlogger "espaco-terapia-os/backend/internal/platform/logger"

	"github.com/google/uuid"
)

// LogMutation registra operações de escrita sem PII (apenas IDs e metadados).
func LogMutation(ctx context.Context, logger *slog.Logger, entity, action string, id uuid.UUID, extra ...slog.Attr) {
	if logger == nil {
		return
	}
	log := platformlogger.FromContext(ctx, logger)
	args := []any{
		slog.String("entity", entity),
		slog.String("action", action),
		slog.String("id", id.String()),
	}
	for _, a := range extra {
		args = append(args, a)
	}
	log.Info("domain mutation", args...)
}
