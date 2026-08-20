package service

import (
	"context"
	"encoding/json"

	"espaco-terapia-os/backend/internal/domain/entity"

	"github.com/google/uuid"
)

const (
	AuditUsuarioCriacao              = "usuario.criacao"
	AuditUsuarioEdicao               = "usuario.edicao"
	AuditUsuarioExclusao             = "usuario.exclusao"
	AuditUsuarioRestauracao          = "usuario.restauracao"
	AuditUsuarioLogin                = "usuario.login"
	AuditUsuarioLogout               = "usuario.logout"
	AuditUsuarioResetSenhaSolicitado = "usuario.reset_senha_solicitado"
	AuditUsuarioResetSenhaConcluido  = "usuario.reset_senha_concluido"
	AuditUsuarioSenhaAlterada        = "usuario.senha_alterada"
)

const AuditEntidadeUsuario = "usuario"

type UserAuditSnapshot struct {
	ID                 string   `json:"id,omitempty"`
	Name               string   `json:"name,omitempty"`
	Email              string   `json:"email,omitempty"`
	Role               string   `json:"role,omitempty"`
	PacienteID         *string  `json:"paciente_id,omitempty"`
	ProfissionalID     *string  `json:"profissional_id,omitempty"`
	UnidadeIDs         []string `json:"unidade_ids,omitempty"`
	MustChangePassword bool     `json:"must_change_password,omitempty"`
}

func UserAuditSnapshotFrom(u *entity.User) UserAuditSnapshot {
	if u == nil {
		return UserAuditSnapshot{}
	}
	ids := make([]string, 0, len(u.UnidadeIDs))
	for _, id := range u.UnidadeIDs {
		ids = append(ids, id.String())
	}
	var pacienteID *string
	if u.PacienteID != nil {
		s := u.PacienteID.String()
		pacienteID = &s
	}
	var profissionalID *string
	if u.ProfissionalID != nil {
		s := u.ProfissionalID.String()
		profissionalID = &s
	}
	return UserAuditSnapshot{
		ID: u.ID.String(), Name: u.Name, Email: u.Email,
		Role: string(u.Role), PacienteID: pacienteID, ProfissionalID: profissionalID,
		UnidadeIDs: ids, MustChangePassword: u.MustChangePassword,
	}
}

func RecordUserAudit(ctx context.Context, audit *AuditService, actorID uuid.UUID, actorName, actorRole, action, entityID string, diff map[string]interface{}, ip, ua *string) {
	if audit == nil || actorID == uuid.Nil {
		return
	}
	var raw json.RawMessage
	if diff != nil {
		raw, _ = json.Marshal(diff)
	}
	_ = RecordAuditHelper(ctx, audit, AuditLogInput{
		ActorID: actorID, ActorName: actorName, ActorRole: actorRole,
		Acao: action, Entidade: AuditEntidadeUsuario, EntidadeID: entityID,
		Diff: raw, IP: ip, UserAgent: ua,
	})
}
