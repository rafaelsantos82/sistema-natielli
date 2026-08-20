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

type ConsultaHandler struct {
	app          *application.ConsultaApp
	scopeSvc     *service.DataScopeService
	errorHandler *httplayer.ErrorHandler
	logger       *slog.Logger
}

func NewConsultaHandler(app *application.ConsultaApp, scopeSvc *service.DataScopeService, errorHandler *httplayer.ErrorHandler, logger *slog.Logger) *ConsultaHandler {
	return &ConsultaHandler{app: app, scopeSvc: scopeSvc, errorHandler: errorHandler, logger: logger}
}

func (h *ConsultaHandler) assertConsultaAccess(c *gin.Context, consultaID uuid.UUID) error {
	actor, err := loadActorFromGin(c, h.scopeSvc)
	if err != nil {
		return err
	}
	out, err := h.app.GetByID(c.Request.Context(), consultaID)
	if err != nil {
		return err
	}
	return h.scopeSvc.AssertConsultaPacienteAccess(c.Request.Context(), actor, out.PacienteID)
}

// ListConsultas godoc
//
//	@Summary		Listar consultas
//	@Tags			consulta
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/consultas [get]
func (h *ConsultaHandler) ListConsultas(c *gin.Context) {
	var q dto.ListConsultasQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		h.errorHandler.HandleValidationError(c, "Parâmetros de consulta inválidos")
		return
	}
	filter := repository.ConsultaListFilter{Page: q.Page, PageSize: q.PageSize}
	if q.UnidadeID != "" {
		uid, err := uuid.Parse(q.UnidadeID)
		if err != nil {
			h.errorHandler.HandleValidationError(c, "unidade_id inválido")
			return
		}
		filter.UnidadeID = &uid
	}
	if q.ProfissionalID != "" {
		pid, err := uuid.Parse(q.ProfissionalID)
		if err != nil {
			h.errorHandler.HandleValidationError(c, "profissional_id inválido")
			return
		}
		filter.ProfissionalID = &pid
	}
	if q.DataInicio != "" {
		t, err := application.ParseDateTime(q.DataInicio)
		if err != nil {
			h.errorHandler.HandleValidationError(c, "data_inicio inválida")
			return
		}
		filter.DataInicio = &t
	}
	if q.DataFim != "" {
		t, err := application.ParseDateTime(q.DataFim)
		if err != nil {
			h.errorHandler.HandleValidationError(c, "data_fim inválida")
			return
		}
		filter.DataFim = &t
	}
	actor, err := loadActorFromGin(c, h.scopeSvc)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	if err := h.scopeSvc.ApplyConsultaListScope(c.Request.Context(), actor, &filter); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	result, err := h.app.List(c.Request.Context(), filter)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	meta := dto.ListMeta{Page: result.Page, PageSize: result.PageSize, Total: result.Total, TotalPages: result.TotalPages}
	response.JSONSuccess(c, http.StatusOK, result.Items, meta)
}

// CreateConsulta godoc
//
//	@Summary		Criar consulta
//	@Tags			consulta
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/consultas [post]
func (h *ConsultaHandler) CreateConsulta(c *gin.Context) {
	var req dto.ConsultaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "data_hora inválida (use RFC3339)")
		return
	}
	actor, err := loadActorFromGin(c, h.scopeSvc)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	if err := h.scopeSvc.AssertPacienteAccess(c.Request.Context(), actor, in.PacienteID); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	id, err := h.app.Create(c.Request.Context(), in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, dto.CreateConsultaData{ID: id.String()}, nil)
}

// GetConsulta godoc
//
//	@Summary		Obter consulta
//	@Tags			consulta
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/consultas/{id} [get]
func (h *ConsultaHandler) GetConsulta(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.assertConsultaAccess(c, id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	out, err := h.app.GetByID(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

// UpdateConsulta godoc
//
//	@Summary		Atualizar consulta
//	@Tags			consulta
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/consultas/{id} [put]
func (h *ConsultaHandler) UpdateConsulta(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.UpdateConsultaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	if err := h.assertConsultaAccess(c, id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "data_hora inválida (use RFC3339)")
		return
	}
	actor, err := loadActorFromGin(c, h.scopeSvc)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	if err := h.scopeSvc.AssertPacienteAccess(c.Request.Context(), actor, in.PacienteID); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	out, err := h.app.Update(c.Request.Context(), id, in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

// DeleteConsulta godoc
//
//	@Summary		Excluir consulta
//	@Tags			consulta
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/consultas/{id} [delete]
func (h *ConsultaHandler) DeleteConsulta(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.assertConsultaAccess(c, id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	if err := h.app.Delete(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// ConfirmarConsulta godoc
//
//	@Summary		Confirmar consulta
//	@Tags			consulta
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/consultas/{id}/confirmar [post]
func (h *ConsultaHandler) ConfirmarConsulta(c *gin.Context) {
	h.transitionConsulta(c, "confirmar")
}

// CancelarConsulta godoc
//
//	@Summary		Cancelar consulta
//	@Tags			consulta
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/consultas/{id}/cancelar [post]
func (h *ConsultaHandler) CancelarConsulta(c *gin.Context) {
	h.transitionConsulta(c, "cancelar")
}

// ConcluirConsulta godoc
//
//	@Summary		Concluir consulta
//	@Tags			consulta
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/consultas/{id}/concluir [post]
func (h *ConsultaHandler) ConcluirConsulta(c *gin.Context) {
	h.transitionConsulta(c, "concluir")
}

// VincularProntuario godoc
//
//	@Summary		Vincular prontuário
//	@Tags			consulta
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/consultas/{id}/vincular-prontuario [post]
func (h *ConsultaHandler) VincularProntuario(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.VincularProntuarioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	if err := h.assertConsultaAccess(c, id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	out, err := h.app.VincularProntuario(c.Request.Context(), id, req.EvolucaoID)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

// AprovarAtendimento godoc
//
//	@Summary		Aprovar atendimento
//	@Tags			consulta
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/consultas/{id}/aprovar-atendimento [post]
func (h *ConsultaHandler) AprovarAtendimento(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var actorID uuid.UUID
	if uid, err := uuid.Parse(c.GetString("user_id")); err == nil {
		actorID = uid
	}
	if err := h.assertConsultaAccess(c, id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	out, err := h.app.AprovarAtendimento(c.Request.Context(), id, actorID)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

// RejeitarAtendimento godoc
//
//	@Summary		Rejeitar atendimento
//	@Tags			consulta
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/consultas/{id}/rejeitar-atendimento [post]
func (h *ConsultaHandler) RejeitarAtendimento(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.RejeitarAtendimentoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	var actorID uuid.UUID
	if uid, err := uuid.Parse(c.GetString("user_id")); err == nil {
		actorID = uid
	}
	if err := h.assertConsultaAccess(c, id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	out, err := h.app.RejeitarAtendimento(c.Request.Context(), id, req.Motivo, actorID)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

func (h *ConsultaHandler) transitionConsulta(c *gin.Context, action string) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.assertConsultaAccess(c, id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	var out interface{}
	var opErr error
	switch action {
	case "confirmar":
		out, opErr = h.app.Confirmar(c.Request.Context(), id)
	case "cancelar":
		out, opErr = h.app.Cancelar(c.Request.Context(), id)
	case "concluir":
		out, opErr = h.app.Concluir(c.Request.Context(), id)
	}
	if opErr != nil {
		h.errorHandler.Handle(c, opErr)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
