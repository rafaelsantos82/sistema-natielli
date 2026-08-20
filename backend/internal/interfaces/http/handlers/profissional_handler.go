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

type ProfissionalHandler struct {
	app          *application.ProfissionalApp
	errorHandler *httplayer.ErrorHandler
	logger       *slog.Logger
}

func NewProfissionalHandler(app *application.ProfissionalApp, errorHandler *httplayer.ErrorHandler, logger *slog.Logger) *ProfissionalHandler {
	return &ProfissionalHandler{app: app, errorHandler: errorHandler, logger: logger}
}

// ListProfissionais godoc
//
//	@Summary		Listar profissionais
//	@Tags			profissional
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/profissionais [get]
func (h *ProfissionalHandler) ListProfissionais(c *gin.Context) {
	var q dto.ListProfissionaisQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		h.errorHandler.HandleValidationError(c, "Parâmetros de consulta inválidos")
		return
	}
	includeDeleted := q.IncludeDeleted || c.Query("include_deleted") == "true"
	filter := repository.ProfissionalListFilter{
		Query:          q.Query,
		Status:         q.Status,
		Page:           q.Page,
		PageSize:       q.PageSize,
		IncludeDeleted: includeDeleted,
	}
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

// CreateProfissional godoc
//
//	@Summary		Criar profissional
//	@Tags			profissional
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/profissionais [post]
func (h *ProfissionalHandler) CreateProfissional(c *gin.Context) {
	var req dto.ProfissionalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "Data inválida (use YYYY-MM-DD)")
		return
	}
	id, err := h.app.Create(c.Request.Context(), in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, dto.CreateProfissionalData{ID: id.String()}, nil)
}

// GetProfissional godoc
//
//	@Summary		Obter profissional
//	@Tags			profissional
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/profissionais/{id} [get]
func (h *ProfissionalHandler) GetProfissional(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	p, err := h.app.GetByID(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, p, nil)
}

// UpdateProfissional godoc
//
//	@Summary		Atualizar profissional
//	@Tags			profissional
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/profissionais/{id} [put]
func (h *ProfissionalHandler) UpdateProfissional(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.UpdateProfissionalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "Data inválida (use YYYY-MM-DD)")
		return
	}
	p, err := h.app.Update(c.Request.Context(), id, in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, p, nil)
}

// DeleteProfissional godoc
//
//	@Summary		Excluir profissional
//	@Tags			profissional
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/profissionais/{id} [delete]
func (h *ProfissionalHandler) DeleteProfissional(c *gin.Context) {
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

// RestoreProfissional godoc
//
//	@Summary		Restaurar profissional excluído
//	@Description	Remove soft delete e reativa o cadastro (status ativo)
//	@Tags			profissional
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		404	{object}	map[string]interface{}
//	@Failure		409	{object}	map[string]interface{}
//	@Router			/profissionais/{id}/restore [post]
func (h *ProfissionalHandler) RestoreProfissional(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	p, err := h.app.Restore(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, p, nil)
}

// ListConselhos godoc
//
//	@Summary		Listar conselhos
//	@Tags			profissional
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/profissionais/{id}/conselhos [get]
func (h *ProfissionalHandler) ListConselhos(c *gin.Context) {
	profID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	items, err := h.app.ListConselhos(c.Request.Context(), profID)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, items, nil)
}

// CreateConselho godoc
//
//	@Summary		Criar conselho
//	@Tags			profissional
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/profissionais/{id}/conselhos [post]
func (h *ProfissionalHandler) CreateConselho(c *gin.Context) {
	profID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.ConselhoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "validade inválida (use YYYY-MM-DD)")
		return
	}
	dtoOut, err := h.app.CreateConselho(c.Request.Context(), profID, in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, dto.CreateConselhoData{ID: dtoOut.ID.String()}, nil)
}

// UpdateConselho godoc
//
//	@Summary		Atualizar conselho
//	@Tags			profissional
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			conselhoId	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/profissionais/{id}/conselhos/{conselhoId} [put]
func (h *ProfissionalHandler) UpdateConselho(c *gin.Context) {
	profID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	conselhoID, err := uuid.Parse(c.Param("conselhoId"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "conselhoId inválido")
		return
	}
	var req dto.ConselhoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "validade inválida (use YYYY-MM-DD)")
		return
	}
	out, err := h.app.UpdateConselho(c.Request.Context(), profID, conselhoID, in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

// DeleteConselho godoc
//
//	@Summary		Excluir conselho
//	@Tags			profissional
//	@Produce		json
//	@Security		BearerAuth
//	@Param			conselhoId	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/profissionais/{id}/conselhos/{conselhoId} [delete]
func (h *ProfissionalHandler) DeleteConselho(c *gin.Context) {
	profID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	conselhoID, err := uuid.Parse(c.Param("conselhoId"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "conselhoId inválido")
		return
	}
	if err := h.app.DeleteConselho(c.Request.Context(), profID, conselhoID); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}
