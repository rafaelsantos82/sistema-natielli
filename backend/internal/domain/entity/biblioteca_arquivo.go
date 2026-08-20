package entity

import (
	"time"

	"github.com/google/uuid"
)

type BibliotecaArquivo struct {
	ID            uuid.UUID
	CategoriaID   uuid.UUID
	Titulo        string
	NomeArquivo   string
	MimeType      string
	TamanhoBytes  int64
	StoragePath   string
	UploadedBy    uuid.UUID
	UploadedAt    time.Time
	DeletedAt     *time.Time
	CategoriaNome string
	UploadedByNome string
}
