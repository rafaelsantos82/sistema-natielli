package handlers

import (
	"io"
	"net/http"
	"strings"

	"espaco-terapia-os/backend/internal/application"
	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/service"
	httplayer "espaco-terapia-os/backend/internal/interfaces/http"
	"espaco-terapia-os/backend/internal/interfaces/http/dto"
	"espaco-terapia-os/backend/internal/interfaces/http/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ContratoHandler struct {
	app          *application.ContratoApp
	errorHandler *httplayer.ErrorHandler
}

func NewContratoHandler(app *application.ContratoApp, errorHandler *httplayer.ErrorHandler) *ContratoHandler {
	return &ContratoHandler{app: app, errorHandler: errorHandler}
}

func (h *ContratoHandler) List(c *gin.Context) {
	_, f, ok := parseWaveList(c, h.errorHandler)
	if !ok {
		return
	}
	result, err := h.app.List(c.Request.Context(), service.ContratoListFilter{
		Query: f.Query, Status: f.Status, Page: f.Page, PageSize: f.PageSize,
	})
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, result.Items, listMeta(result.Page, result.PageSize, result.Total, result.TotalPages))
}

func (h *ContratoHandler) Create(c *gin.Context) {
	userID := userIDFromContext(c)
	if userID == uuid.Nil {
		h.errorHandler.Handle(c, domainerrors.NewUnauthorizedError("não autenticado"))
		return
	}
	in, fileIn, file, ok := parseContratoMultipart(c, h.errorHandler, userID)
	if !ok {
		return
	}
	defer file.Close()
	out, err := h.app.CreateWithArquivo(c.Request.Context(), in, fileIn, file)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, out, nil)
}

func (h *ContratoHandler) Get(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	out, err := h.app.GetByID(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

func (h *ContratoHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.ContratoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	userID := userIDFromContext(c)
	out, err := h.app.Update(c.Request.Context(), id, req.ToServiceInput(userID))
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

func (h *ContratoHandler) ReplaceArquivo(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
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
	fileIn := service.ContratoArquivoUploadInput{
		OriginalName: fileHeader.Filename,
		DeclaredMIME: fileHeader.Header.Get("Content-Type"),
		Size:         fileHeader.Size,
	}
	out, err := h.app.ReplaceArquivo(c.Request.Context(), id, fileIn, file)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

func (h *ContratoHandler) DownloadArquivo(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	streamContratoFile(c, h, func() (*service.ContratoArquivoMeta, io.ReadCloser, error) {
		return h.app.OpenDownload(c.Request.Context(), id)
	})
}

func (h *ContratoHandler) DownloadCompartilhadoPublic(c *gin.Context) {
	token := c.Param("token")
	streamContratoFile(c, h, func() (*service.ContratoArquivoMeta, io.ReadCloser, error) {
		return h.app.OpenDownloadCompartilhadoPublic(c.Request.Context(), token)
	})
}

func (h *ContratoHandler) DownloadAssinaturaPublic(c *gin.Context) {
	token := c.Param("token")
	streamContratoFile(c, h, func() (*service.ContratoArquivoMeta, io.ReadCloser, error) {
		return h.app.OpenDownloadAssinaturaPublic(c.Request.Context(), token)
	})
}

func (h *ContratoHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.app.SoftDelete(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *ContratoHandler) Compartilhar(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.CompartilharContratoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	out, err := h.app.Compartilhar(c.Request.Context(), id, req.ToServiceInput())
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, out, nil)
}

func (h *ContratoHandler) SolicitarAssinatura(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.SolicitarAssinaturaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	out, err := h.app.SolicitarAssinatura(c.Request.Context(), id, req.ToServiceInput())
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, out, nil)
}

func (h *ContratoHandler) GetCompartilhadoPublic(c *gin.Context) {
	token := c.Param("token")
	out, err := h.app.GetCompartilhadoPublic(c.Request.Context(), token)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

func (h *ContratoHandler) RecordAcessoCompartilhado(c *gin.Context) {
	token := c.Param("token")
	ip := c.ClientIP()
	if err := h.app.RecordAcessoCompartilhado(c.Request.Context(), token, ip); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *ContratoHandler) GetAssinaturaPublic(c *gin.Context) {
	token := c.Param("token")
	out, err := h.app.GetAssinaturaPublic(c.Request.Context(), token)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

func (h *ContratoHandler) AceitarAssinatura(c *gin.Context) {
	token := c.Param("token")
	var req dto.AceitarAssinaturaRequest
	_ = c.ShouldBindJSON(&req)
	ip := c.ClientIP()
	if err := h.app.AceitarAssinatura(c.Request.Context(), token, req.Observacoes, ip); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, gin.H{"accepted": true}, nil)
}

func parseContratoMultipart(c *gin.Context, eh *httplayer.ErrorHandler, userID uuid.UUID) (service.ContratoInput, service.ContratoArquivoUploadInput, io.ReadCloser, bool) {
	ct := strings.ToLower(strings.TrimSpace(c.GetHeader("Content-Type")))
	if ct == "" || !strings.HasPrefix(ct, "multipart/form-data") {
		eh.HandleValidationError(c, "Envie multipart/form-data com campos titulo, tipo e file")
		return service.ContratoInput{}, service.ContratoArquivoUploadInput{}, nil, false
	}
	titulo := strings.TrimSpace(c.PostForm("titulo"))
	tipo := strings.TrimSpace(c.PostForm("tipo"))
	if titulo == "" || tipo == "" {
		eh.HandleValidationError(c, "título e tipo são obrigatórios")
		return service.ContratoInput{}, service.ContratoArquivoUploadInput{}, nil, false
	}
	var pacienteID, profissionalID *uuid.UUID
	if raw := strings.TrimSpace(c.PostForm("paciente_id")); raw != "" {
		id, err := uuid.Parse(raw)
		if err != nil {
			eh.HandleValidationError(c, "paciente_id inválido")
			return service.ContratoInput{}, service.ContratoArquivoUploadInput{}, nil, false
		}
		pacienteID = &id
	}
	if raw := strings.TrimSpace(c.PostForm("profissional_id")); raw != "" {
		id, err := uuid.Parse(raw)
		if err != nil {
			eh.HandleValidationError(c, "profissional_id inválido")
			return service.ContratoInput{}, service.ContratoArquivoUploadInput{}, nil, false
		}
		profissionalID = &id
	}
	var pacienteNome, profissionalNome *string
	if v := strings.TrimSpace(c.PostForm("paciente_nome")); v != "" {
		pacienteNome = &v
	}
	if v := strings.TrimSpace(c.PostForm("profissional_nome")); v != "" {
		profissionalNome = &v
	}
	in := service.ContratoInput{
		Titulo: titulo, Tipo: tipo, PacienteID: pacienteID, PacienteNome: pacienteNome,
		ProfissionalID: profissionalID, ProfissionalNome: profissionalNome,
		Status: strings.TrimSpace(c.PostForm("status")), CriadoPor: userID,
	}
	fileHeader, err := c.FormFile("file")
	if err != nil {
		eh.HandleValidationError(c, "arquivo é obrigatório")
		return service.ContratoInput{}, service.ContratoArquivoUploadInput{}, nil, false
	}
	file, err := fileHeader.Open()
	if err != nil {
		eh.Handle(c, err)
		return service.ContratoInput{}, service.ContratoArquivoUploadInput{}, nil, false
	}
	fileIn := service.ContratoArquivoUploadInput{
		OriginalName: fileHeader.Filename,
		DeclaredMIME: fileHeader.Header.Get("Content-Type"),
		Size:         fileHeader.Size,
	}
	return in, fileIn, file, true
}

func streamContratoFile(c *gin.Context, h *ContratoHandler, open func() (*service.ContratoArquivoMeta, io.ReadCloser, error)) {
	meta, f, err := open()
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	defer f.Close()
	if meta.MimeType != "" {
		c.Header("Content-Type", meta.MimeType)
	} else {
		c.Header("Content-Type", "application/octet-stream")
	}
	c.Header("Content-Disposition", "inline; filename=\""+meta.NomeArquivo+"\"")
	c.Status(http.StatusOK)
	_, _ = io.Copy(c.Writer, f)
}
