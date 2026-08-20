package service

import (
	"time"

	"espaco-terapia-os/backend/internal/domain/entity"

	"github.com/google/uuid"
)

type UnidadeDTO struct {
	ID        uuid.UUID `json:"id"`
	Nome      string    `json:"nome"`
	Slug      string    `json:"slug"`
	Status    string    `json:"status"`
	Endereco  *string   `json:"endereco,omitempty"`
	Telefone  *string   `json:"telefone,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func ToUnidadeDTO(u *entity.Unidade) *UnidadeDTO {
	return &UnidadeDTO{
		ID:        u.ID,
		Nome:      u.Nome,
		Slug:      u.Slug,
		Status:    string(u.Status),
		Endereco:  u.Endereco,
		Telefone:  u.Telefone,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}
