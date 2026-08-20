package database

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type documentoCategoriaModel struct {
	ID        uuid.UUID      `gorm:"column:id;type:uuid;primaryKey"`
	Nome      string         `gorm:"column:nome;not null"`
	Descricao *string        `gorm:"column:descricao"`
	Ordem     int            `gorm:"column:ordem;not null;default:0"`
	Ativo     bool           `gorm:"column:ativo;not null;default:true"`
	CreatedAt time.Time      `gorm:"column:created_at;not null"`
	UpdatedAt time.Time      `gorm:"column:updated_at;not null"`
	DeletedAt gorm.DeletedAt `gorm:"column:deleted_at;index"`
}

func (documentoCategoriaModel) TableName() string { return "documento_categorias" }

type bibliotecaArquivoModel struct {
	ID           uuid.UUID      `gorm:"column:id;type:uuid;primaryKey"`
	CategoriaID  uuid.UUID      `gorm:"column:categoria_id;type:uuid;not null"`
	Titulo       *string        `gorm:"column:titulo"`
	NomeArquivo  string         `gorm:"column:nome_arquivo;not null"`
	MimeType     string         `gorm:"column:mime_type;not null"`
	TamanhoBytes int64          `gorm:"column:tamanho_bytes;not null"`
	StoragePath  string         `gorm:"column:storage_path;not null"`
	UploadedBy   uuid.UUID      `gorm:"column:uploaded_by;type:uuid;not null"`
	UploadedAt   time.Time      `gorm:"column:uploaded_at;not null"`
	DeletedAt    gorm.DeletedAt `gorm:"column:deleted_at;index"`
}

func (bibliotecaArquivoModel) TableName() string { return "biblioteca_arquivos" }

// bibliotecaArquivoRow: struct plano para scan com JOIN (evita prefixo ba. em colunas do join).
type bibliotecaArquivoRow struct {
	ID             uuid.UUID      `gorm:"column:id"`
	CategoriaID    uuid.UUID      `gorm:"column:categoria_id"`
	Titulo         *string        `gorm:"column:titulo"`
	NomeArquivo    string         `gorm:"column:nome_arquivo"`
	MimeType       string         `gorm:"column:mime_type"`
	TamanhoBytes   int64          `gorm:"column:tamanho_bytes"`
	StoragePath    string         `gorm:"column:storage_path"`
	UploadedBy     uuid.UUID      `gorm:"column:uploaded_by"`
	UploadedAt     time.Time      `gorm:"column:uploaded_at"`
	DeletedAt      gorm.DeletedAt `gorm:"column:deleted_at"`
	CategoriaNome  string         `gorm:"column:categoria_nome"`
	UploadedByNome string         `gorm:"column:uploaded_by_nome"`
}
