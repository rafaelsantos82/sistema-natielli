package routes

import (
	"espaco-terapia-os/backend/internal/interfaces/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterUsersRoutes(protected *gin.RouterGroup, deps ModuleDeps) {
	admin := middleware.RequirePermissionOrRole(deps.AuthorizationService, "api.users.manage", "admin")
	users := protected.Group("/users")
	users.GET("", admin, deps.UserHandler.ListUsers)
	users.POST("", admin, deps.UserHandler.CreateUser)
	users.POST("/:id/restore", admin, deps.UserHandler.RestoreUser)
	users.GET("/:id", admin, deps.UserHandler.GetUser)
	users.PUT("/:id", admin, deps.UserHandler.UpdateUser)
	users.DELETE("/:id", admin, deps.UserHandler.DeleteUser)
}
