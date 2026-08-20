package handlers

import (
	"log/slog"
	"net/http"
	"strings"

	"espaco-terapia-os/backend/internal/application"
	"espaco-terapia-os/backend/internal/domain/entity"
	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/domain/service"
	httplayer "espaco-terapia-os/backend/internal/interfaces/http"
	"espaco-terapia-os/backend/internal/interfaces/http/dto"
	"espaco-terapia-os/backend/internal/interfaces/http/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UserHandler struct {
	app          *application.UserApp
	errorHandler *httplayer.ErrorHandler
	logger       *slog.Logger
}

func NewUserHandler(app *application.UserApp, errorHandler *httplayer.ErrorHandler, logger *slog.Logger) *UserHandler {
	return &UserHandler{app: app, errorHandler: errorHandler, logger: logger}
}

// ListUsers godoc
//
//	@Summary		Listar usuários de acesso
//	@Tags			users
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Failure		403	{object}	map[string]interface{}
//	@Router			/users [get]
func (h *UserHandler) ListUsers(c *gin.Context) {
	var q dto.ListUsersQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		h.errorHandler.HandleValidationError(c, "Parâmetros de consulta inválidos")
		return
	}
	includeDeleted := q.IncludeDeleted || c.Query("include_deleted") == "true"
	filter := repository.UserListFilter{
		Query:          q.Query,
		Page:           q.Page,
		PageSize:       q.PageSize,
		IncludeDeleted: includeDeleted,
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

// GetUser godoc
//
//	@Summary		Obter usuário
//	@Tags			users
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Failure		403	{object}	map[string]interface{}
//	@Router			/users/{id} [get]
func (h *UserHandler) GetUser(c *gin.Context) {
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

// CreateUser godoc
//
//	@Summary		Criar usuário de acesso
//	@Tags			users
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Failure		403	{object}	map[string]interface{}
//	@Router			/users [post]
func (h *UserHandler) CreateUser(c *gin.Context) {
	var req dto.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Dados inválidos")
		return
	}
	unidadeIDs, err := parseUnidadeIDs(req.UnidadeIDs)
	if err != nil {
		h.errorHandler.HandleValidationError(c, "unidade_ids inválido")
		return
	}
	pacienteID, err := parsePacienteID(req.PacienteID)
	if err != nil {
		h.errorHandler.HandleValidationError(c, "paciente_id inválido")
		return
	}
	profissionalID, err := parseProfissionalID(req.ProfissionalID)
	if err != nil {
		h.errorHandler.HandleValidationError(c, "profissional_id inválido")
		return
	}
	u, err := h.app.Create(c.Request.Context(), service.CreateUserInput{
		Name:           req.Name,
		Email:          req.Email,
		Password:       req.Password,
		Role:           entity.UserRole(req.Role),
		PacienteID:     pacienteID,
		ProfissionalID: profissionalID,
		UnidadeIDs:     unidadeIDs,
	})
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, u, nil)
}

// UpdateUser godoc
//
//	@Summary		Atualizar usuário
//	@Tags			users
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Failure		403	{object}	map[string]interface{}
//	@Router			/users/{id} [put]
func (h *UserHandler) UpdateUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Dados inválidos")
		return
	}
	unidadeIDs, err := parseUnidadeIDs(req.UnidadeIDs)
	if err != nil {
		h.errorHandler.HandleValidationError(c, "unidade_ids inválido")
		return
	}
	pacienteID, err := parsePacienteID(req.PacienteID)
	if err != nil {
		h.errorHandler.HandleValidationError(c, "paciente_id inválido")
		return
	}
	profissionalID, err := parseProfissionalID(req.ProfissionalID)
	if err != nil {
		h.errorHandler.HandleValidationError(c, "profissional_id inválido")
		return
	}
	u, err := h.app.Update(c.Request.Context(), id, service.UpdateUserInput{
		Name:               req.Name,
		Email:              req.Email,
		Password:           req.Password,
		Role:               entity.UserRole(req.Role),
		PacienteID:         pacienteID,
		ProfissionalID:     profissionalID,
		UnidadeIDs:         unidadeIDs,
		MustChangePassword: req.MustChangePassword,
	})
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, u, nil)
}

// DeleteUser godoc
//
//	@Summary		Excluir usuário (soft delete)
//	@Tags			users
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		204	""
//	@Failure		401	{object}	map[string]interface{}
//	@Failure		403	{object}	map[string]interface{}
//	@Router			/users/{id} [delete]
func (h *UserHandler) DeleteUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	actorID, err := uuid.Parse(c.GetString("user_id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "usuário autenticado inválido")
		return
	}
	if err := h.app.Delete(c.Request.Context(), id, actorID); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// RestoreUser godoc
//
//	@Summary		Restaurar usuário excluído
//	@Description	Remove soft delete e reativa o acesso
//	@Tags			users
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		404	{object}	map[string]interface{}
//	@Failure		409	{object}	map[string]interface{}
//	@Router			/users/{id}/restore [post]
func (h *UserHandler) RestoreUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	u, err := h.app.Restore(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, u, nil)
}

func parseProfissionalID(raw *string) (*uuid.UUID, error) {
	if raw == nil {
		return nil, nil
	}
	s := strings.TrimSpace(*raw)
	if s == "" {
		return nil, nil
	}
	id, err := uuid.Parse(s)
	if err != nil {
		return nil, err
	}
	return &id, nil
}

func parsePacienteID(raw *string) (*uuid.UUID, error) {
	if raw == nil {
		return nil, nil
	}
	s := strings.TrimSpace(*raw)
	if s == "" {
		return nil, nil
	}
	id, err := uuid.Parse(s)
	if err != nil {
		return nil, err
	}
	return &id, nil
}

func parseUnidadeIDs(raw []string) ([]uuid.UUID, error) {
	if len(raw) == 0 {
		return nil, nil
	}
	out := make([]uuid.UUID, 0, len(raw))
	for _, s := range raw {
		if s == "" {
			continue
		}
		id, err := uuid.Parse(s)
		if err != nil {
			return nil, err
		}
		out = append(out, id)
	}
	return out, nil
}
