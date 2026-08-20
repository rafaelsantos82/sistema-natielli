package handlers

import (
	"io"
	"log/slog"
	"net/http"
	"strings"

	"espaco-terapia-os/backend/internal/application"
	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/service"
	httplayer "espaco-terapia-os/backend/internal/interfaces/http"
	"espaco-terapia-os/backend/internal/interfaces/http/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ProfissionalDocumentoHandler struct {
	app          *application.ProfissionalDocumentoApp
	errorHandler *httplayer.ErrorHandler
	logger       *slog.Logger
}

func NewProfissionalDocumentoHandler(
	app *application.ProfissionalDocumentoApp,
	errorHandler *httplayer.ErrorHandler,
	logger *slog.Logger,
) *ProfissionalDocumentoHandler {
	return &ProfissionalDocumentoHandler{app: app, errorHandler: errorHandler, logger: logger}
}

func (h *ProfissionalDocumentoHandler) ListAllDocumentos(c *gin.Context) {
	items, err := h.app.ListAll(c.Request.Context())
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, items, nil)
}

func (h *ProfissionalDocumentoHandler) PendenciasSummary(c *gin.Context) {
	items, err := h.app.PendenciasSummary(c.Request.Context())
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, items, nil)
}

func (h *ProfissionalDocumentoHandler) ListDocumentos(c *gin.Context) {
	profID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID do profissional inválido")
		return
	}
	var categoria *string
	if cat := strings.TrimSpace(c.Query("categoria")); cat != "" {
		categoria = &cat
	}
	items, err := h.app.List(c.Request.Context(), profID, categoria)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, items, nil)
}

func (h *ProfissionalDocumentoHandler) UploadDocumento(c *gin.Context) {
	profID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID do profissional inválido")
		return
	}
	userID, err := uuid.Parse(c.GetString("user_id"))
	if err != nil {
		h.errorHandler.Handle(c, domainerrors.NewUnauthorizedError("não autenticado"))
		return
	}
	categoria := strings.TrimSpace(c.PostForm("categoria"))
	if categoria == "" {
		h.errorHandler.HandleValidationError(c, "categoria é obrigatória")
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

	var substitui *uuid.UUID
	if raw := strings.TrimSpace(c.PostForm("substitui")); raw != "" {
		sid, err := uuid.Parse(raw)
		if err != nil {
			h.errorHandler.HandleValidationError(c, "substitui inválido")
			return
		}
		substitui = &sid
	}

	out, err := h.app.Upload(c.Request.Context(), service.ProfissionalDocumentoUploadInput{
		ProfissionalID: profID,
		Categoria:      categoria,
		OriginalName:   fileHeader.Filename,
		DeclaredMIME:   fileHeader.Header.Get("Content-Type"),
		Size:           fileHeader.Size,
		UploadedBy:     userID,
		Substitui:      substitui,
	}, file)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, out, nil)
}

func (h *ProfissionalDocumentoHandler) DownloadDocumento(c *gin.Context) {
	profID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID do profissional inválido")
		return
	}
	docID, err := uuid.Parse(c.Param("docId"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID do documento inválido")
		return
	}
	dl, err := h.app.OpenDownload(c.Request.Context(), profID, docID)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	defer dl.File.Close()
	c.Header("Content-Type", dl.Meta.MimeType)
	c.Header("Content-Disposition", "attachment; filename=\""+dl.Meta.NomeArquivo+"\"")
	c.Status(http.StatusOK)
	_, _ = io.Copy(c.Writer, dl.File)
}

func (h *ProfissionalDocumentoHandler) DeleteDocumento(c *gin.Context) {
	profID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID do profissional inválido")
		return
	}
	docID, err := uuid.Parse(c.Param("docId"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID do documento inválido")
		return
	}
	if err := h.app.Delete(c.Request.Context(), profID, docID); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

