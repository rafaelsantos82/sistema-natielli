package service

import "github.com/google/uuid"

type DocumentoCategoriaDTO struct {
	ID        string  `json:"id"`
	Nome      string  `json:"nome"`
	Descricao *string `json:"descricao,omitempty"`
	Ordem     int     `json:"ordem"`
	Ativo     bool    `json:"ativo"`
	CreatedAt string  `json:"created_at"`
	UpdatedAt string  `json:"updated_at"`
}

type BibliotecaArquivoDTO struct {
	ID             string `json:"id"`
	CategoriaID    string `json:"categoria_id"`
	CategoriaNome  string `json:"categoria_nome"`
	Titulo         string `json:"titulo"`
	NomeArquivo    string `json:"nome_arquivo"`
	MimeType       string `json:"mime_type"`
	TamanhoBytes   int64  `json:"tamanho_bytes"`
	UploadedAt     string `json:"uploaded_at"`
	UploadedBy     string `json:"uploaded_by"`
	UploadedByNome string `json:"uploaded_by_nome,omitempty"`
}

type CreateDocumentoCategoriaInput struct {
	Nome      string
	Descricao string
	Ordem     int
	Ativo     bool
}

type UpdateDocumentoCategoriaInput struct {
	Nome      string
	Descricao string
	Ordem     int
	Ativo     bool
}

type BibliotecaArquivoUploadInput struct {
	CategoriaID  uuid.UUID
	Titulo       string
	OriginalName string
	DeclaredMIME string
	Size         int64
	UploadedBy   uuid.UUID
}

type BibliotecaArquivoListOutput struct {
	Items      []*BibliotecaArquivoDTO
	Total      int64
	Page       int
	PageSize   int
	TotalPages int
}
