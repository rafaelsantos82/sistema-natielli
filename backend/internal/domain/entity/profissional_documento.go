package entity

import (
	"time"

	"github.com/google/uuid"
)

type DocumentoCategoria string

const (
	DocumentoCategoriaPessoal     DocumentoCategoria = "documento_pessoal"
	DocumentoCategoriaRegistro    DocumentoCategoria = "registro_profissional"
	DocumentoCategoriaComprovante DocumentoCategoria = "comprovante"
	DocumentoCategoriaContrato    DocumentoCategoria = "contrato"
	DocumentoCategoriaOutro       DocumentoCategoria = "outro"
)

func (c DocumentoCategoria) Valid() bool {
	switch c {
	case DocumentoCategoriaPessoal, DocumentoCategoriaRegistro,
		DocumentoCategoriaComprovante, DocumentoCategoriaContrato, DocumentoCategoriaOutro:
		return true
	default:
		return false
	}
}

type ProfissionalDocumento struct {
	ID             uuid.UUID
	ProfissionalID uuid.UUID
	Categoria      DocumentoCategoria
	Obrigatorio    bool
	NomeArquivo    string
	MimeType       string
	TamanhoBytes   int64
	StoragePath    string
	Versao         int
	Substitui      *uuid.UUID
	UploadedAt     time.Time
	UploadedBy     uuid.UUID
	DeletedAt      *time.Time
}
