package handlers

import (
	"log/slog"
	"net/http"

	"espaco-terapia-os/backend/internal/application"
	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/domain/service"
	httplayer "espaco-terapia-os/backend/internal/interfaces/http"
	"espaco-terapia-os/backend/internal/interfaces/http/dto"
	"espaco-terapia-os/backend/internal/interfaces/http/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PacienteHandler struct {
	app          *application.PacienteApp
	scopeSvc     *service.DataScopeService
	errorHandler *httplayer.ErrorHandler
	logger       *slog.Logger
}

func NewPacienteHandler(app *application.PacienteApp, scopeSvc *service.DataScopeService, errorHandler *httplayer.ErrorHandler, logger *slog.Logger) *PacienteHandler {
	return &PacienteHandler{app: app, scopeSvc: scopeSvc, errorHandler: errorHandler, logger: logger}
}

// ListPacientes godoc
//
//	@Summary		Listar pacientes
//	@Description	Lista pacientes com paginação e filtros
//	@Tags			paciente
//	@Produce		json
//	@Security		BearerAuth
//	@Param			unidade_id	query	string	false	"Filtrar por unidade (UUID)"
//	@Param			q			query	string	false	"Busca por nome"
//	@Param			cpf			query	string	false	"CPF (somente dígitos)"
//	@Param			status		query	string	false	"Status: ativo, inativo, falecido"
//	@Param			page		query	int		false	"Página (default 1)"
//	@Param			page_size	query	int		false	"Itens por página (default 20, max 100)"
//	@Success		200			{object}	map[string]interface{}
//	@Failure		400			{object}	map[string]interface{}
//	@Failure		401			{object}	map[string]interface{}
//	@Router			/pacientes [get]
func (h *PacienteHandler) ListPacientes(c *gin.Context) {
	var q dto.ListPacientesQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		h.errorHandler.HandleValidationError(c, "Parâmetros de consulta inválidos")
		return
	}

	includeDeleted := q.IncludeDeleted || c.Query("include_deleted") == "true"
	filter := repository.PacienteListFilter{
		Query:          q.Query,
		CPF:            q.CPF,
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

	actor, err := loadActorFromGin(c, h.scopeSvc)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	if err := h.scopeSvc.ApplyPacienteListScope(c.Request.Context(), actor, &filter); err != nil {
		h.errorHandler.Handle(c, err)
		return
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

// CreatePaciente godoc
//
//	@Summary		Criar paciente
//	@Description	Cadastra paciente pediátrico com vínculos de unidade
//	@Tags			paciente
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body	dto.CreatePacienteRequest	true	"Dados do paciente"
//	@Success		201		{object}	map[string]interface{}
//	@Failure		400		{object}	map[string]interface{}
//	@Failure		401		{object}	map[string]interface{}
//	@Failure		409		{object}	map[string]interface{}
//	@Router			/pacientes [post]
func (h *PacienteHandler) CreatePaciente(c *gin.Context) {
	var req dto.CreatePacienteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "data_nascimento inválida (use YYYY-MM-DD)")
		return
	}

	id, err := h.app.Create(c.Request.Context(), in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, dto.CreatePacienteData{ID: id.String()}, nil)
}

// GetPaciente godoc
//
//	@Summary		Obter paciente
//	@Tags			paciente
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"Paciente ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		404	{object}	map[string]interface{}
//	@Router			/pacientes/{id} [get]
func (h *PacienteHandler) GetPaciente(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	actor, err := loadActorFromGin(c, h.scopeSvc)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	if err := h.scopeSvc.AssertPacienteAccess(c.Request.Context(), actor, id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	p, err := h.app.GetByID(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, p, nil)
}

// UpdatePaciente godoc
//
//	@Summary		Atualizar paciente
//	@Tags			paciente
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id		path	string						true	"Paciente ID"
//	@Param			body	body	dto.UpdatePacienteRequest	true	"Dados atualizados"
//	@Success		200		{object}	map[string]interface{}
//	@Failure		400		{object}	map[string]interface{}
//	@Failure		404		{object}	map[string]interface{}
//	@Router			/pacientes/{id} [put]
func (h *PacienteHandler) UpdatePaciente(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.UpdatePacienteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	actor, err := loadActorFromGin(c, h.scopeSvc)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	if err := h.scopeSvc.AssertPacienteAccess(c.Request.Context(), actor, id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	in, err := req.CreatePacienteRequest.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "data_nascimento inválida (use YYYY-MM-DD)")
		return
	}
	p, err := h.app.Update(c.Request.Context(), id, in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, p, nil)
}

// DeletePaciente godoc
//
//	@Summary		Excluir paciente (soft delete)
//	@Tags			paciente
//	@Security		BearerAuth
//	@Param			id	path	string	true	"Paciente ID"
//	@Success		204
//	@Failure		404	{object}	map[string]interface{}
//	@Router			/pacientes/{id} [delete]
func (h *PacienteHandler) DeletePaciente(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	actor, err := loadActorFromGin(c, h.scopeSvc)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	if err := h.scopeSvc.AssertPacienteAccess(c.Request.Context(), actor, id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	if err := h.app.Delete(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// RestorePaciente godoc
//
//	@Summary		Restaurar paciente excluído
//	@Description	Remove soft delete e reativa o cadastro (status ativo)
//	@Tags			paciente
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"Paciente ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Failure		404	{object}	map[string]interface{}
//	@Failure		409	{object}	map[string]interface{}
//	@Router			/pacientes/{id}/restore [post]
func (h *PacienteHandler) RestorePaciente(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	actor, err := loadActorFromGin(c, h.scopeSvc)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	if err := h.scopeSvc.AssertPacienteAccess(c.Request.Context(), actor, id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	out, err := h.app.Restore(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
