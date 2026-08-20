package entity

import (
	"time"

	"github.com/google/uuid"
)

// BibliotecaCategoria é categoria dinâmica da biblioteca global de documentos (/documentos).
type BibliotecaCategoria struct {
	ID        uuid.UUID
	Nome      string
	Descricao string
	Ordem     int
	Ativo     bool
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt *time.Time
}
