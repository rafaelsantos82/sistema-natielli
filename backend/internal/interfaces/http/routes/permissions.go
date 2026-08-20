package routes

import (
	"espaco-terapia-os/backend/internal/interfaces/middleware"

	"github.com/gin-gonic/gin"
)

var (
	defaultReadRoles   = []string{"admin", "gestor", "funcionario", "terceiro", "terapeuta"}
	defaultWriteRoles  = []string{"admin", "gestor", "funcionario", "terapeuta"}
	defaultDeleteRoles = []string{"admin", "gestor"}
)

type crudGuards struct {
	read   gin.HandlerFunc
	write  gin.HandlerFunc
	delete gin.HandlerFunc
}

func defaultCRUDGuards(deps ModuleDeps, module string) crudGuards {
	return crudGuards{
		read:   middleware.RequirePermissionOrRole(deps.AuthorizationService, "api."+module+".read", defaultReadRoles...),
		write:  middleware.RequirePermissionOrRole(deps.AuthorizationService, "api."+module+".write", defaultWriteRoles...),
		delete: middleware.RequirePermissionOrRole(deps.AuthorizationService, "api."+module+".delete", defaultDeleteRoles...),
	}
}
