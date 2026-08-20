package routes

import (
	"espaco-terapia-os/backend/internal/interfaces/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterNotificationRoutes(protected *gin.RouterGroup, deps ModuleDeps) {
	readRoles := middleware.RequirePermissionOrRole(deps.AuthorizationService, "api.notification-settings.read", "admin", "gestor", "funcionario", "terapeuta")
	writeRoles := middleware.RequirePermissionOrRole(deps.AuthorizationService, "api.notification-settings.write", "admin", "gestor")

	settings := protected.Group("/notification-settings")
	settings.GET("", readRoles, deps.NotificationSettingsHandler.GetNotificationSettings)
	settings.PUT("", writeRoles, deps.NotificationSettingsHandler.PutNotificationSettings)
}
