package service

import (
	"context"
	"encoding/json"

	"espaco-terapia-os/backend/internal/domain/entity"
	"espaco-terapia-os/backend/internal/platform/requestcontext"

	"github.com/google/uuid"
)

const (
	AuditEntidadePaciente      = "paciente"
	AuditPacienteCriacao       = "paciente.criacao"
	AuditPacienteEdicao        = "paciente.edicao"
	AuditPacienteExclusao      = "paciente.exclusao"
	AuditPacienteRestauracao   = "paciente.restauracao"
)

// PacienteAuditSnapshot dados mínimos para trilha (sem CPF completo).
type PacienteAuditSnapshot struct {
	PacienteID          string   `json:"paciente_id"`
	NomeCompleto        string   `json:"nome_completo"`
	Status              string   `json:"status"`
	CPFUltimos4         string   `json:"cpf_ultimos4,omitempty"`
	UnidadeIDs          []string `json:"unidade_ids,omitempty"`
	UnidadePrincipalID  string   `json:"unidade_principal_id,omitempty"`
	DeletedAt           *string  `json:"deleted_at,omitempty"`
}

func PacienteAuditSnapshotFrom(p *entity.Paciente) PacienteAuditSnapshot {
	if p == nil {
		return PacienteAuditSnapshot{}
	}
	ids := make([]string, 0, len(p.Unidades))
	var principal string
	for _, u := range p.Unidades {
		ids = append(ids, u.UnidadeID.String())
		if u.Principal {
			principal = u.UnidadeID.String()
		}
	}
	var deletedAt *string
	if p.DeletedAt != nil {
		s := p.DeletedAt.UTC().Format("2006-01-02T15:04:05Z07:00")
		deletedAt = &s
	}
	return PacienteAuditSnapshot{
		PacienteID:         p.ID.String(),
		NomeCompleto:       p.NomeCompleto,
		Status:             string(p.Status),
		CPFUltimos4:         maskCPFLast4(p.CPF),
		UnidadeIDs:          ids,
		UnidadePrincipalID: principal,
		DeletedAt:          deletedAt,
	}
}

func maskCPFLast4(cpf *string) string {
	if cpf == nil || *cpf == "" {
		return ""
	}
	d := entity.NormalizeCPF(*cpf)
	if len(d) < 4 {
		return ""
	}
	return d[len(d)-4:]
}

func RecordPacienteAudit(
	ctx context.Context,
	audit *AuditService,
	actorID uuid.UUID,
	actorName, actorRole, action, entityID string,
	diff map[string]interface{},
) {
	if audit == nil || actorID == uuid.Nil {
		return
	}
	var raw json.RawMessage
	if diff != nil {
		raw, _ = json.Marshal(diff)
	}
	ip, ua := auditMeta(ctx)
	_ = RecordAuditHelper(ctx, audit, AuditLogInput{
		ActorID: actorID, ActorName: actorName, ActorRole: actorRole,
		Acao: action, Entidade: AuditEntidadePaciente, EntidadeID: entityID,
		Diff: raw, IP: ip, UserAgent: ua,
	})
}

func pacienteActorFromCtx(ctx context.Context) (uuid.UUID, string, string) {
	idStr, name, role := requestcontext.ActorFromContext(ctx)
	id, err := uuid.Parse(idStr)
	if err != nil {
		return uuid.Nil, name, role
	}
	if name == "" {
		name = idStr
	}
	return id, name, role
}

func buildPacienteMutationDiff(
	operacao, metodoHTTP, requestPath string,
	before, after PacienteAuditSnapshot,
) map[string]interface{} {
	return map[string]interface{}{
		"operacao":              operacao,
		"metodo_http":           metodoHTTP,
		"request_path":          requestPath,
		"paciente_id":           before.PacienteID,
		"nome_completo":         before.NomeCompleto,
		"status_antes":          before.Status,
		"status_depois":         after.Status,
		"unidade_ids":           before.UnidadeIDs,
		"unidade_principal_id":  before.UnidadePrincipalID,
		"cpf_ultimos4":          before.CPFUltimos4,
		"deleted_at_antes":      before.DeletedAt,
		"deleted_at_depois":     after.DeletedAt,
	}
}
