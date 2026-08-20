package entity

import (
	"strings"
	"time"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"

	"github.com/google/uuid"
)

type UnidadeStatus string

const (
	UnidadeAtiva   UnidadeStatus = "ativa"
	UnidadeInativa UnidadeStatus = "inativa"
)

type Unidade struct {
	ID        uuid.UUID
	Nome      string
	Slug      string
	Status    UnidadeStatus
	Endereco  *string
	Telefone  *string
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt *time.Time
}

func (u *Unidade) Validate() error {
	if strings.TrimSpace(u.Nome) == "" {
		return domainerrors.NewRequiredFieldError("nome")
	}
	if strings.TrimSpace(u.Slug) == "" {
		return domainerrors.NewRequiredFieldError("slug")
	}
	if u.Status == "" {
		u.Status = UnidadeAtiva
	}
	return nil
}
