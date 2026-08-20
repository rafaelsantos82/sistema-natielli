package handlers

import (
	"net/http"
	"time"

	"espaco-terapia-os/backend/internal/interfaces/http/response"

	"github.com/gin-gonic/gin"
)

type HealthHandler struct{}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{}
}

// Health godoc
//
//	@Summary		Health check
//	@Tags			health
//	@Produce		json
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/health [get]
func (h *HealthHandler) Health(c *gin.Context) {
	response.JSONSuccess(c, http.StatusOK, gin.H{
		"status":    "ok",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}, gin.H{})
}
