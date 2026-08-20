package handlers

import (
	"net/http"
	"strings"

	"espaco-terapia-os/backend/internal/application"
	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	httplayer "espaco-terapia-os/backend/internal/interfaces/http"
	"espaco-terapia-os/backend/internal/interfaces/http/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ChaveDigitalHandler struct {
	app          *application.ChaveDigitalApp
	errorHandler *httplayer.ErrorHandler
}

func NewChaveDigitalHandler(app *application.ChaveDigitalApp, errorHandler *httplayer.ErrorHandler) *ChaveDigitalHandler {
	return &ChaveDigitalHandler{app: app, errorHandler: errorHandler}
}

func (h *ChaveDigitalHandler) Get(c *gin.Context) {
	unidadeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID da unidade inválido")
		return
	}
	out, err := h.app.GetAtiva(c.Request.Context(), unidadeID)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	if out == nil {
		response.JSONSuccess(c, http.StatusOK, gin.H{"configured": false}, nil)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

func (h *ChaveDigitalHandler) Register(c *gin.Context) {
	unidadeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID da unidade inválido")
		return
	}
	userID := userIDFromContext(c)
	if userID == uuid.Nil {
		h.errorHandler.Handle(c, domainerrors.NewUnauthorizedError("não autenticado"))
		return
	}
	file, err := c.FormFile("pfx")
	if err != nil {
		h.errorHandler.HandleValidationError(c, "envie o arquivo do certificado (.pfx ou .p12)")
		return
	}
	password := strings.TrimSpace(c.PostForm("password"))
	f, err := file.Open()
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	defer f.Close()
	out, err := h.app.Register(c.Request.Context(), unidadeID, userID, f, password)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, out, nil)
}

func (h *ChaveDigitalHandler) Revoke(c *gin.Context) {
	unidadeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID da unidade inválido")
		return
	}
	if err := h.app.Revoke(c.Request.Context(), unidadeID); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, gin.H{"revoked": true}, nil)
}
