package handlers

import (
	"log/slog"
	"net/http"

	"espaco-terapia-os/backend/internal/application"
	httplayer "espaco-terapia-os/backend/internal/interfaces/http"
	"espaco-terapia-os/backend/internal/interfaces/http/dto"
	"espaco-terapia-os/backend/internal/interfaces/http/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type NotificationSettingsHandler struct {
	app          *application.NotificationSettingsApp
	errorHandler *httplayer.ErrorHandler
	logger       *slog.Logger
}

func NewNotificationSettingsHandler(app *application.NotificationSettingsApp, errorHandler *httplayer.ErrorHandler, logger *slog.Logger) *NotificationSettingsHandler {
	return &NotificationSettingsHandler{app: app, errorHandler: errorHandler, logger: logger}
}

func (h *NotificationSettingsHandler) parseUnidadeID(c *gin.Context) (*uuid.UUID, error) {
	q := c.Query("unidade_id")
	if q == "" {
		return nil, nil
	}
	uid, err := uuid.Parse(q)
	if err != nil {
		return nil, err
	}
	return &uid, nil
}

// GetNotificationSettings godoc
//
//	@Summary		Obter configurações de notificação
//	@Tags			notification
//	@Produce		json
//	@Security		BearerAuth
//	@Param			unidade_id	query	string	false	"Unidade (UUID)"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/notification-settings [get]
func (h *NotificationSettingsHandler) GetNotificationSettings(c *gin.Context) {
	unidadeID, err := h.parseUnidadeID(c)
	if err != nil {
		h.errorHandler.HandleValidationError(c, "unidade_id inválido")
		return
	}
	out, err := h.app.GetByUnidade(c.Request.Context(), unidadeID)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

// PutNotificationSettings godoc
//
//	@Summary		Salvar configurações de notificação
//	@Tags			notification
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			unidade_id	query	string	false	"Unidade (UUID)"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/notification-settings [put]
func (h *NotificationSettingsHandler) PutNotificationSettings(c *gin.Context) {
	unidadeID, err := h.parseUnidadeID(c)
	if err != nil {
		h.errorHandler.HandleValidationError(c, "unidade_id inválido")
		return
	}
	var req dto.NotificationSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	out, err := h.app.Upsert(c.Request.Context(), req.ToServiceInput(unidadeID))
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
