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

type SalaHandler struct {
	app          *application.SalaApp
	errorHandler *httplayer.ErrorHandler
	logger       *slog.Logger
}

func NewSalaHandler(app *application.SalaApp, errorHandler *httplayer.ErrorHandler, logger *slog.Logger) *SalaHandler {
	return &SalaHandler{app: app, errorHandler: errorHandler, logger: logger}
}

// ListSalas godoc
//
//	@Summary		Listar salas
//	@Tags			sala
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/salas [get]
func (h *SalaHandler) ListSalas(c *gin.Context) {
	var q dto.ListSalasQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		h.errorHandler.HandleValidationError(c, "Parâmetros de consulta inválidos")
		return
	}
	filter := repository.SalaListFilter{Query: q.Query, Status: q.Status, Page: q.Page, PageSize: q.PageSize}
	if q.UnidadeID != "" {
		uid, err := uuid.Parse(q.UnidadeID)
		if err != nil {
			h.errorHandler.HandleValidationError(c, "unidade_id inválido")
			return
		}
		filter.UnidadeID = &uid
	}
	result, err := h.app.List(c.Request.Context(), filter)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	meta := dto.ListMeta{Page: result.Page, PageSize: result.PageSize, Total: result.Total, TotalPages: result.TotalPages}
	response.JSONSuccess(c, http.StatusOK, result.Items, meta)
}

// CreateSala godoc
//
//	@Summary		Criar sala
//	@Tags			sala
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/salas [post]
func (h *SalaHandler) CreateSala(c *gin.Context) {
	var req dto.SalaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	id, err := h.app.Create(c.Request.Context(), req.ToServiceInput())
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, dto.CreateSalaData{ID: id.String()}, nil)
}

// GetSala godoc
//
//	@Summary		Obter sala
//	@Tags			sala
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/salas/{id} [get]
func (h *SalaHandler) GetSala(c *gin.Context) {
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

// UpdateSala godoc
//
//	@Summary		Atualizar sala
//	@Tags			sala
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/salas/{id} [put]
func (h *SalaHandler) UpdateSala(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.UpdateSalaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	out, err := h.app.Update(c.Request.Context(), id, req.ToServiceInput())
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

// DeleteSala godoc
//
//	@Summary		Excluir sala
//	@Tags			sala
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/salas/{id} [delete]
func (h *SalaHandler) DeleteSala(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.app.Delete(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// ListReservas godoc
//
//	@Summary		Listar reservas da sala
//	@Tags			sala
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/salas/{id}/reservas [get]
func (h *SalaHandler) ListReservas(c *gin.Context) {
	salaID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	items, err := h.app.ListReservas(c.Request.Context(), salaID)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, items, nil)
}

// CreateReserva godoc
//
//	@Summary		Criar reserva
//	@Tags			sala
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/salas/{id}/reservas [post]
func (h *SalaHandler) CreateReserva(c *gin.Context) {
	salaID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.ReservaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "data_hora_inicio inválida (use RFC3339)")
		return
	}
	out, err := h.app.CreateReserva(c.Request.Context(), salaID, in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, dto.CreateReservaData{ID: out.ID.String()}, nil)
}

// UpdateReserva godoc
//
//	@Summary		Atualizar reserva
//	@Tags			sala
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			reservaId	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/salas/{id}/reservas/{reservaId} [put]
func (h *SalaHandler) UpdateReserva(c *gin.Context) {
	salaID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	reservaID, err := uuid.Parse(c.Param("reservaId"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "reservaId inválido")
		return
	}
	var req dto.ReservaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "data_hora_inicio inválida (use RFC3339)")
		return
	}
	out, err := h.app.UpdateReserva(c.Request.Context(), salaID, reservaID, in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

// DeleteReserva godoc
//
//	@Summary		Excluir reserva
//	@Tags			sala
//	@Produce		json
//	@Security		BearerAuth
//	@Param			reservaId	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/salas/{id}/reservas/{reservaId} [delete]
func (h *SalaHandler) DeleteReserva(c *gin.Context) {
	salaID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	reservaID, err := uuid.Parse(c.Param("reservaId"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "reservaId inválido")
		return
	}
	if err := h.app.DeleteReserva(c.Request.Context(), salaID, reservaID); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}
