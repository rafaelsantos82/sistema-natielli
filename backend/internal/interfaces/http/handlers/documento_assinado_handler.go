package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"espaco-terapia-os/backend/internal/application"
	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	httplayer "espaco-terapia-os/backend/internal/interfaces/http"
	"espaco-terapia-os/backend/internal/interfaces/http/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type DocumentoAssinadoHandler struct {
	app          *application.DocumentoAssinadoApp
	errorHandler *httplayer.ErrorHandler
}

func NewDocumentoAssinadoHandler(app *application.DocumentoAssinadoApp, errorHandler *httplayer.ErrorHandler) *DocumentoAssinadoHandler {
	return &DocumentoAssinadoHandler{app: app, errorHandler: errorHandler}
}

func (h *DocumentoAssinadoHandler) List(c *gin.Context) {
	unidadeID, err := parseUnidadeQuery(c)
	if err != nil {
		h.errorHandler.HandleValidationError(c, err.Error())
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "50"))
	items, total, err := h.app.List(c.Request.Context(), unidadeID, page, pageSize)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, items, gin.H{"total": total, "page": page, "page_size": pageSize})
}

func (h *DocumentoAssinadoHandler) Assinar(c *gin.Context) {
	unidadeID, err := parseUnidadeQuery(c)
	if err != nil {
		h.errorHandler.HandleValidationError(c, err.Error())
		return
	}
	userID := userIDFromContext(c)
	if userID == uuid.Nil {
		h.errorHandler.Handle(c, domainerrors.NewUnauthorizedError("não autenticado"))
		return
	}
	name := strings.TrimSpace(c.PostForm("name"))
	docType := strings.TrimSpace(c.PostForm("type"))
	file, err := c.FormFile("file")
	if err != nil {
		h.errorHandler.HandleValidationError(c, "envie o arquivo PDF")
		return
	}
	f, err := file.Open()
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	defer f.Close()
	out, err := h.app.Assinar(c.Request.Context(), unidadeID, userID, name, docType, f)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, out, nil)
}

func (h *DocumentoAssinadoHandler) Verificar(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	out, err := h.app.Verificar(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

func (h *DocumentoAssinadoHandler) Download(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	filename, f, err := h.app.OpenSignedDownload(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	defer f.Close()
	c.Header("Content-Disposition", "attachment; filename=\""+filename+"\"")
	c.Header("Content-Type", "application/pdf")
	c.File(f.Name())
}

func parseUnidadeQuery(c *gin.Context) (uuid.UUID, error) {
	raw := strings.TrimSpace(c.Query("unidade_id"))
	if raw == "" {
		return uuid.Nil, errInvalid("unidade_id é obrigatório")
	}
	return uuid.Parse(raw)
}

type simpleErr string

func (e simpleErr) Error() string { return string(e) }
func errInvalid(msg string) error { return simpleErr(msg) }
