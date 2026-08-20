package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/service"
	"espaco-terapia-os/backend/internal/interfaces/http/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func parseFormTags(raw string) []string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil
	}
	if strings.HasPrefix(raw, "[") {
		var tags []string
		if err := json.Unmarshal([]byte(raw), &tags); err == nil {
			return tags
		}
	}
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if t := strings.TrimSpace(p); t != "" {
			out = append(out, t)
		}
	}
	return out
}

func optionalStringForm(c *gin.Context, key string) *string {
	v := strings.TrimSpace(c.PostForm(key))
	if v == "" {
		return nil
	}
	return &v
}

func (h *Wave3Handler) UploadManual(c *gin.Context) {
	userID := userIDFromContext(c)
	if userID == uuid.Nil {
		h.errorHandler.Handle(c, domainerrors.NewUnauthorizedError("não autenticado"))
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

	out, err := h.ManualSvc.Upload(c.Request.Context(), service.ManualUploadInput{
		Titulo:       c.PostForm("titulo"),
		Versao:       c.PostForm("versao"),
		PublicoAlvo:  c.PostForm("publico_alvo"),
		OriginalName: fileHeader.Filename,
		DeclaredMIME: fileHeader.Header.Get("Content-Type"),
		Size:         fileHeader.Size,
		Tags:         parseFormTags(c.PostForm("tags")),
		Status:       c.PostForm("status"),
		Observacoes:  optionalStringForm(c, "observacoes"),
		CreatedBy:    userID,
	}, file)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, out, nil)
}

func (h *Wave3Handler) DownloadManual(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	meta, f, err := h.ManualSvc.OpenDownload(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	defer f.Close()
	c.Header("Content-Type", meta.MimeType)
	c.Header("Content-Disposition", "attachment; filename=\""+meta.ArquivoNome+"\"")
	c.Status(http.StatusOK)
	_, _ = io.Copy(c.Writer, f)
}

func (h *Wave3Handler) UploadMaterial(c *gin.Context) {
	userID := userIDFromContext(c)
	if userID == uuid.Nil {
		h.errorHandler.Handle(c, domainerrors.NewUnauthorizedError("não autenticado"))
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

	var unidadeID *uuid.UUID
	if raw := strings.TrimSpace(c.PostForm("unidade_id")); raw != "" {
		uid, err := uuid.Parse(raw)
		if err != nil {
			h.errorHandler.HandleValidationError(c, "unidade_id inválido")
			return
		}
		unidadeID = &uid
	}

	out, err := h.MaterialSvc.Upload(c.Request.Context(), service.MaterialMarketingUploadInput{
		Titulo:       c.PostForm("titulo"),
		Tipo:         c.PostForm("tipo"),
		OriginalName: fileHeader.Filename,
		DeclaredMIME: fileHeader.Header.Get("Content-Type"),
		Size:         fileHeader.Size,
		Tags:         parseFormTags(c.PostForm("tags")),
		Campanha:     optionalStringForm(c, "campanha"),
		UnidadeID:    unidadeID,
		Status:       c.PostForm("status"),
		Observacoes:  optionalStringForm(c, "observacoes"),
		CreatedBy:    userID,
	}, file)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, out, nil)
}

func (h *Wave3Handler) DownloadMaterial(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	meta, f, err := h.MaterialSvc.OpenDownload(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	defer f.Close()
	c.Header("Content-Type", meta.MimeType)
	c.Header("Content-Disposition", "attachment; filename=\""+meta.ArquivoNome+"\"")
	c.Status(http.StatusOK)
	_, _ = io.Copy(c.Writer, f)
}
