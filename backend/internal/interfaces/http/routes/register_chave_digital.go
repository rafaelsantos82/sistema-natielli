package routes

import (
	"espaco-terapia-os/backend/internal/interfaces/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterChaveDigitalRoutes(protected *gin.RouterGroup, deps ModuleDeps) {
	read := middleware.RequirePermissionOrRole(deps.AuthorizationService, "api.chave-digital.read", "admin", "gestor")
	write := middleware.RequirePermissionOrRole(deps.AuthorizationService, "api.chave-digital.write", "admin", "gestor")

	g := protected.Group("/unidades/:id/chave-digital")
	g.GET("", read, deps.ChaveDigitalHandler.Get)
	g.POST("", write, deps.ChaveDigitalHandler.Register)
	g.DELETE("", write, deps.ChaveDigitalHandler.Revoke)
}

func RegisterDocumentosAssinadosRoutes(protected *gin.RouterGroup, deps ModuleDeps) {
	read := middleware.RequirePermissionOrRole(
		deps.AuthorizationService,
		"api.documentos-assinados.read",
		"admin", "gestor", "funcionario", "terapeuta",
	)
	write := middleware.RequirePermissionOrRole(
		deps.AuthorizationService,
		"api.documentos-assinados.write",
		"admin", "gestor", "funcionario", "terapeuta",
	)

	g := protected.Group("/documentos-assinados")
	g.GET("", read, deps.DocumentoAssinadoHandler.List)
	g.POST("/assinar", write, deps.DocumentoAssinadoHandler.Assinar)
	g.POST("/:id/verificar", read, deps.DocumentoAssinadoHandler.Verificar)
	g.GET("/:id/download", read, deps.DocumentoAssinadoHandler.Download)
}
