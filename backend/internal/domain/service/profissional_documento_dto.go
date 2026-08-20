package service

import (
	"time"

	"github.com/google/uuid"
)

type ProfissionalDocumentoDTO struct {
	ID             uuid.UUID  `json:"id"`
	ProfissionalID uuid.UUID  `json:"profissional_id"`
	Categoria      string     `json:"categoria"`
	Obrigatorio    bool       `json:"obrigatorio"`
	NomeArquivo    string     `json:"nome_arquivo"`
	MimeType       string     `json:"mime_type"`
	TamanhoBytes   int64      `json:"tamanho_bytes"`
	Versao         int         `json:"versao"`
	Substitui      *uuid.UUID `json:"substitui,omitempty"`
	UploadedAt     time.Time  `json:"uploaded_at"`
	UploadedBy     uuid.UUID  `json:"uploaded_by"`
}

type ProfissionalDocumentoUploadInput struct {
	ProfissionalID uuid.UUID
	Categoria      string
	Obrigatorio    bool
	OriginalName   string
	DeclaredMIME   string
	Size           int64
	UploadedBy     uuid.UUID
	Substitui      *uuid.UUID
}
