package entity

import (
	"time"

	"github.com/google/uuid"
)

// SystemUserID é o usuário técnico para FKs de auditoria (não editável via CRUD).
var SystemUserID = uuid.MustParse("00000000-0000-4000-8000-000000000099")

type UserRole string

const (
	UserRoleAdmin       UserRole = "admin"
	UserRoleGestor      UserRole = "gestor"
	UserRoleFuncionario UserRole = "funcionario"
	UserRoleTerceiro    UserRole = "terceiro"
	UserRoleTerapeuta   UserRole = "terapeuta"
	UserRoleResponsavel UserRole = "responsavel"
)

func (r UserRole) Valid() bool {
	switch r {
	case UserRoleAdmin, UserRoleGestor, UserRoleFuncionario, UserRoleTerceiro,
		UserRoleTerapeuta, UserRoleResponsavel:
		return true
	default:
		return false
	}
}

type User struct {
	ID                 uuid.UUID
	Name               string
	Email              string
	PasswordHash       string
	Role               UserRole
	// PacienteID obrigatório apenas para UserRoleResponsavel (escopo de dados do paciente).
	PacienteID *uuid.UUID
	// ProfissionalID obrigatório apenas para UserRoleTerapeuta (carteira de pacientes).
	ProfissionalID     *uuid.UUID
	MustChangePassword bool
	UnidadeIDs         []uuid.UUID
	CreatedAt          time.Time
	UpdatedAt          time.Time
	DeletedAt          *time.Time
}

func (u *User) IsSystem() bool {
	return u.ID == SystemUserID
}

func (u *User) CanLogin() bool {
	return u.PasswordHash != "" && u.PasswordHash != "disabled" && u.DeletedAt == nil
}
