package routes

import (
	"espaco-terapia-os/backend/internal/interfaces/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterAccessControlRoutes(protected *gin.RouterGroup, deps ModuleDeps) {
	manage := middleware.RequirePermissionOrRole(deps.AuthorizationService, "api.access-control.manage", "admin")
	group := protected.Group("/access-control")
	group.GET("/permissions", manage, deps.AccessControlHandler.ListPermissions)
	group.GET("/data-scopes", manage, deps.AccessControlHandler.ListDataScopes)
	group.GET("/roles/:role", manage, deps.AccessControlHandler.GetRolePermissions)
	group.PUT("/roles/:role", manage, deps.AccessControlHandler.ReplaceRolePermissions)
}
