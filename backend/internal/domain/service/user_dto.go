package service

import (
	"time"

	"espaco-terapia-os/backend/internal/domain/entity"

	"github.com/google/uuid"
)

type UserDTO struct {
	ID                 string   `json:"id"`
	Name               string   `json:"name"`
	Email              string   `json:"email"`
	Role               string   `json:"role"`
	PacienteID         *string  `json:"paciente_id,omitempty"`
	ProfissionalID     *string  `json:"profissional_id,omitempty"`
	UnidadeIDs         []string `json:"unidade_ids"`
	Permissions        []string `json:"permissions,omitempty"`
	MustChangePassword bool     `json:"must_change_password"`
	CreatedAt          string   `json:"created_at,omitempty"`
	UpdatedAt          string   `json:"updated_at,omitempty"`
	DeletedAt          *string  `json:"deleted_at,omitempty"`
}

func ToUserDTO(u *entity.User) *UserDTO {
	ids := make([]string, 0, len(u.UnidadeIDs))
	for _, id := range u.UnidadeIDs {
		ids = append(ids, id.String())
	}
	dto := &UserDTO{
		ID:                 u.ID.String(),
		Name:               u.Name,
		Email:              u.Email,
		Role:               string(u.Role),
		UnidadeIDs:         ids,
		MustChangePassword: u.MustChangePassword,
		CreatedAt:          u.CreatedAt.UTC().Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:          u.UpdatedAt.UTC().Format("2006-01-02T15:04:05Z07:00"),
	}
	if u.PacienteID != nil {
		s := u.PacienteID.String()
		dto.PacienteID = &s
	}
	if u.ProfissionalID != nil {
		s := u.ProfissionalID.String()
		dto.ProfissionalID = &s
	}
	if u.DeletedAt != nil {
		s := u.DeletedAt.UTC().Format(time.RFC3339)
		dto.DeletedAt = &s
	}
	return dto
}

type LoginResult struct {
	AccessToken string   `json:"access_token"`
	TokenType   string   `json:"token_type"`
	ExpiresIn   string   `json:"expires_in"`
	User        *UserDTO `json:"user"`
}

type ListUsersResult struct {
	Items      []*UserDTO
	Total      int64
	Page       int
	PageSize   int
	TotalPages int
}

type CreateUserInput struct {
	Name       string
	Email      string
	Password   string
	Role       entity.UserRole
	PacienteID     *uuid.UUID
	ProfissionalID *uuid.UUID
	UnidadeIDs     []uuid.UUID
}

type UpdateProfileInput struct {
	Name  string
	Email string
}

type UpdateUserInput struct {
	Name               string
	Email              string
	Password           string // empty = keep
	Role               entity.UserRole
	PacienteID         *uuid.UUID
	ProfissionalID     *uuid.UUID
	UnidadeIDs         []uuid.UUID
	MustChangePassword *bool
}
