package dto

import "espaco-terapia-os/backend/internal/domain/service"

type DocumentoCategoriaRequest struct {
	Nome      string `json:"nome" binding:"required"`
	Descricao string `json:"descricao"`
	Ordem     int    `json:"ordem"`
	Ativo     *bool  `json:"ativo"`
}

func (r DocumentoCategoriaRequest) ToCreateInput() service.CreateDocumentoCategoriaInput {
	ativo := true
	if r.Ativo != nil {
		ativo = *r.Ativo
	}
	return service.CreateDocumentoCategoriaInput{
		Nome:      r.Nome,
		Descricao: r.Descricao,
		Ordem:     r.Ordem,
		Ativo:     ativo,
	}
}

func (r DocumentoCategoriaRequest) ToUpdateInput() service.UpdateDocumentoCategoriaInput {
	ativo := true
	if r.Ativo != nil {
		ativo = *r.Ativo
	}
	return service.UpdateDocumentoCategoriaInput{
		Nome:      r.Nome,
		Descricao: r.Descricao,
		Ordem:     r.Ordem,
		Ativo:     ativo,
	}
}

type ListBibliotecaArquivosQuery struct {
	CategoriaID string `form:"categoria_id"`
	Q           string `form:"q"`
	Page        int    `form:"page"`
	PageSize    int    `form:"page_size"`
}

type ListDocumentoCategoriasQuery struct {
	IncludeInativas bool `form:"include_inativas"`
}
