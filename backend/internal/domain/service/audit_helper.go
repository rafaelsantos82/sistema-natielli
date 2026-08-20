package service

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
)

// RecordAuditHelper registra evento na trilha de auditoria (uso interno, sem endpoint HTTP).
func RecordAuditHelper(ctx context.Context, audit *AuditService, in AuditLogInput) error {
	if audit == nil {
		return nil
	}
	return audit.Record(ctx, in)
}

// NewAuditInputFromMutation monta entrada de auditoria a partir de mutação de domínio.
func NewAuditInputFromMutation(actorID uuid.UUID, actorName, actorRole, entity, action, entityID string, diff any) AuditLogInput {
	var raw json.RawMessage
	if diff != nil {
		raw, _ = json.Marshal(diff)
	}
	return AuditLogInput{
		ActorID: actorID, ActorName: actorName, ActorRole: actorRole,
		Acao: action, Entidade: entity, EntidadeID: entityID, Diff: raw,
	}
}
