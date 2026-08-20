package routes

import (
	"espaco-terapia-os/backend/internal/interfaces/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterAuditRoutes(protected *gin.RouterGroup, deps ModuleDeps) {
	adminOnly := middleware.RequirePermissionOrRole(deps.AuthorizationService, "api.audit.read", "admin")
	protected.GET("/audit-log", adminOnly, deps.AuditHandler.List)
}
