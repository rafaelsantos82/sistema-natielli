package handlers

import (
	"log/slog"
	"net/http"

	"espaco-terapia-os/backend/internal/application"
	"espaco-terapia-os/backend/internal/domain/repository"
	httplayer "espaco-terapia-os/backend/internal/interfaces/http"
	"espaco-terapia-os/backend/internal/interfaces/http/dto"
	"espaco-terapia-os/backend/internal/interfaces/http/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UnidadeHandler struct {
	app          *application.UnidadeApp
	errorHandler *httplayer.ErrorHandler
	logger       *slog.Logger
}

func NewUnidadeHandler(app *application.UnidadeApp, errorHandler *httplayer.ErrorHandler, logger *slog.Logger) *UnidadeHandler {
	return &UnidadeHandler{app: app, errorHandler: errorHandler, logger: logger}
}

// ListUnidades godoc
//
//	@Summary		Listar unidades
//	@Tags			unidade
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/unidades [get]
func (h *UnidadeHandler) ListUnidades(c *gin.Context) {
	var q dto.ListUnidadesQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		h.errorHandler.HandleValidationError(c, "Parâmetros de consulta inválidos")
		return
	}

	filter := repository.UnidadeListFilter{
		Query:    q.Query,
		Status:   q.Status,
		Page:     q.Page,
		PageSize: q.PageSize,
	}

	result, err := h.app.List(c.Request.Context(), filter)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}

	meta := dto.ListMeta{
		Page:       result.Page,
		PageSize:   result.PageSize,
		Total:      result.Total,
		TotalPages: result.TotalPages,
	}
	response.JSONSuccess(c, http.StatusOK, result.Items, meta)
}

// GetUnidade godoc
//
//	@Summary		Obter unidade
//	@Tags			unidade
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/unidades/{id} [get]
func (h *UnidadeHandler) GetUnidade(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	u, err := h.app.GetByID(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, u, nil)
}
