package dto

type UpdateProfileRequest struct {
	Name  string `json:"name" binding:"required,min=2,max=200"`
	Email string `json:"email" binding:"required,email"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type ListUsersQuery struct {
	Query          string `form:"search"`
	Page           int    `form:"page"`
	PageSize       int    `form:"limit"`
	IncludeDeleted bool   `form:"include_deleted"`
}

type CreateUserRequest struct {
	Name        string   `json:"name" binding:"required,min=2,max=200"`
	Email       string   `json:"email" binding:"required,email"`
	Password    string   `json:"password" binding:"required,min=8"`
	Role        string   `json:"role" binding:"required,oneof=admin gestor funcionario terceiro terapeuta responsavel"`
	PacienteID     *string  `json:"paciente_id" binding:"omitempty,uuid"`
	ProfissionalID *string  `json:"profissional_id" binding:"omitempty,uuid"`
	UnidadeIDs     []string `json:"unidade_ids"`
}

type UpdateUserRequest struct {
	Name                 string   `json:"name" binding:"required,min=2,max=200"`
	Email                string   `json:"email" binding:"required,email"`
	Password             string   `json:"password" binding:"omitempty,min=8"`
	Role                 string   `json:"role" binding:"required,oneof=admin gestor funcionario terceiro terapeuta responsavel"`
	PacienteID           *string  `json:"paciente_id" binding:"omitempty,uuid"`
	ProfissionalID       *string  `json:"profissional_id" binding:"omitempty,uuid"`
	UnidadeIDs           []string `json:"unidade_ids"`
	MustChangePassword   *bool    `json:"must_change_password"`
}
