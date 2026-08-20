package routes

import (
	"espaco-terapia-os/backend/internal/interfaces/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterUnidadesRoutes(protected *gin.RouterGroup, deps ModuleDeps) {
	readRoles := middleware.RequirePermissionOrRole(deps.AuthorizationService, "api.unidades.read", "admin", "gestor", "funcionario", "terceiro", "terapeuta")

	unidades := protected.Group("/unidades")
	unidades.GET("", readRoles, deps.UnidadeHandler.ListUnidades)
	unidades.GET("/:id", readRoles, deps.UnidadeHandler.GetUnidade)
}
