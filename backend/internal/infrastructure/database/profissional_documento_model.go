package database

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type profissionalDocumentoModel struct {
	ID             uuid.UUID      `gorm:"column:id;type:uuid;primaryKey"`
	ProfissionalID uuid.UUID      `gorm:"column:profissional_id;type:uuid;not null"`
	Categoria      string         `gorm:"column:categoria;type:documento_categoria;not null"`
	Obrigatorio    bool           `gorm:"column:obrigatorio;not null"`
	NomeArquivo    string         `gorm:"column:nome_arquivo;not null"`
	MimeType       string         `gorm:"column:mime_type;not null"`
	TamanhoBytes   int64          `gorm:"column:tamanho_bytes;not null"`
	URL            string         `gorm:"column:url;not null"`
	Versao         int            `gorm:"column:versao;not null"`
	Substitui      *uuid.UUID     `gorm:"column:substitui;type:uuid"`
	UploadedAt     time.Time      `gorm:"column:uploaded_at;not null"`
	UploadedBy     uuid.UUID      `gorm:"column:uploaded_by;type:uuid;not null"`
	DeletedAt      gorm.DeletedAt `gorm:"column:deleted_at;index"`
}

func (profissionalDocumentoModel) TableName() string { return "profissional_documentos" }
