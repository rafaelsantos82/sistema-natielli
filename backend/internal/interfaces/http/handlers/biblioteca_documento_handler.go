package handlers

import (
	"io"
	"log/slog"
	"net/http"
	"strings"

	"espaco-terapia-os/backend/internal/application"
	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/domain/service"
	httplayer "espaco-terapia-os/backend/internal/interfaces/http"
	"espaco-terapia-os/backend/internal/interfaces/http/dto"
	"espaco-terapia-os/backend/internal/interfaces/http/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type BibliotecaDocumentoHandler struct {
	app          *application.BibliotecaDocumentoApp
	errorHandler *httplayer.ErrorHandler
	logger       *slog.Logger
}

func NewBibliotecaDocumentoHandler(
	app *application.BibliotecaDocumentoApp,
	errorHandler *httplayer.ErrorHandler,
	logger *slog.Logger,
) *BibliotecaDocumentoHandler {
	return &BibliotecaDocumentoHandler{app: app, errorHandler: errorHandler, logger: logger}
}

func (h *BibliotecaDocumentoHandler) ListCategorias(c *gin.Context) {
	var q dto.ListDocumentoCategoriasQuery
	_ = c.ShouldBindQuery(&q)
	items, err := h.app.ListCategorias(c.Request.Context(), q.IncludeInativas)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, items, nil)
}

func (h *BibliotecaDocumentoHandler) GetCategoria(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	out, err := h.app.GetCategoria(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

func (h *BibliotecaDocumentoHandler) CreateCategoria(c *gin.Context) {
	var req dto.DocumentoCategoriaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	out, err := h.app.CreateCategoria(c.Request.Context(), req.ToCreateInput())
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, out, nil)
}

func (h *BibliotecaDocumentoHandler) UpdateCategoria(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.DocumentoCategoriaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	out, err := h.app.UpdateCategoria(c.Request.Context(), id, req.ToUpdateInput())
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

func (h *BibliotecaDocumentoHandler) DeleteCategoria(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.app.DeleteCategoria(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *BibliotecaDocumentoHandler) ListArquivos(c *gin.Context) {
	var q dto.ListBibliotecaArquivosQuery
	_ = c.ShouldBindQuery(&q)
	filter := repository.BibliotecaArquivoListFilter{
		Query:    strings.TrimSpace(q.Q),
		Page:     q.Page,
		PageSize: q.PageSize,
	}
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PageSize < 1 {
		filter.PageSize = 50
	}
	if raw := strings.TrimSpace(q.CategoriaID); raw != "" {
		cid, err := uuid.Parse(raw)
		if err != nil {
			h.errorHandler.HandleValidationError(c, "categoria_id inválido")
			return
		}
		filter.CategoriaID = &cid
	}
	result, err := h.app.ListArquivos(c.Request.Context(), filter)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	meta := map[string]interface{}{
		"page":        result.Page,
		"page_size":   result.PageSize,
		"total":       result.Total,
		"total_pages": result.TotalPages,
	}
	response.JSONSuccess(c, http.StatusOK, result.Items, meta)
}

func (h *BibliotecaDocumentoHandler) UploadArquivo(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString("user_id"))
	if err != nil {
		h.errorHandler.Handle(c, domainerrors.NewUnauthorizedError("não autenticado"))
		return
	}
	categoriaRaw := strings.TrimSpace(c.PostForm("categoria_id"))
	if categoriaRaw == "" {
		h.errorHandler.HandleValidationError(c, "categoria_id é obrigatório")
		return
	}
	categoriaID, err := uuid.Parse(categoriaRaw)
	if err != nil {
		h.errorHandler.HandleValidationError(c, "categoria_id inválido")
		return
	}
	fileHeader, err := c.FormFile("file")
	if err != nil {
		h.errorHandler.HandleValidationError(c, "arquivo é obrigatório")
		return
	}
	file, err := fileHeader.Open()
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	defer file.Close()

	out, err := h.app.Upload(c.Request.Context(), service.BibliotecaArquivoUploadInput{
		CategoriaID:  categoriaID,
		Titulo:       strings.TrimSpace(c.PostForm("titulo")),
		OriginalName: fileHeader.Filename,
		DeclaredMIME: fileHeader.Header.Get("Content-Type"),
		Size:         fileHeader.Size,
		UploadedBy:   userID,
	}, file)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, out, nil)
}

func (h *BibliotecaDocumentoHandler) DownloadArquivo(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	meta, f, err := h.app.OpenDownload(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	defer f.Close()
	c.Header("Content-Type", meta.MimeType)
	c.Header("Content-Disposition", "attachment; filename=\""+meta.NomeArquivo+"\"")
	c.Status(http.StatusOK)
	_, _ = io.Copy(c.Writer, f)
}

func (h *BibliotecaDocumentoHandler) DeleteArquivo(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.app.DeleteArquivo(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}
