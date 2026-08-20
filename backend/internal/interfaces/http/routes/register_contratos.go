package routes

import (
	"espaco-terapia-os/backend/internal/interfaces/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterContratosRoutes(protected *gin.RouterGroup, deps ModuleDeps) {
	read := middleware.RequirePermissionOrRole(deps.AuthorizationService, "api.contratos.read", "admin", "gestor", "funcionario")
	write := middleware.RequirePermissionOrRole(deps.AuthorizationService, "api.contratos.write", "admin", "gestor", "funcionario")
	del := middleware.RequirePermissionOrRole(deps.AuthorizationService, "api.contratos.delete", "admin", "gestor")

	h := deps.ContratoHandler
	g := protected.Group("/contratos")
	g.GET("", read, h.List)
	g.POST("", write, h.Create)
	g.GET("/:id/arquivo", read, h.DownloadArquivo)
	g.PUT("/:id/arquivo", write, h.ReplaceArquivo)
	g.GET("/:id", read, h.Get)
	g.PUT("/:id", write, h.Update)
	g.DELETE("/:id", del, h.Delete)
	g.POST("/:id/compartilhar", write, h.Compartilhar)
	g.POST("/:id/solicitacoes-assinatura", write, h.SolicitarAssinatura)
}

func RegisterContratosPublicRoutes(api *gin.RouterGroup, deps ModuleDeps) {
	limit := middleware.PublicRateLimit(60)
	h := deps.ContratoHandler
	pub := api.Group("/contratos")
	pub.Use(limit)
	pub.GET("/compartilhado/:token/arquivo", h.DownloadCompartilhadoPublic)
	pub.GET("/compartilhado/:token", h.GetCompartilhadoPublic)
	pub.POST("/compartilhado/:token/acesso", h.RecordAcessoCompartilhado)
	pub.GET("/assinatura/:token/arquivo", h.DownloadAssinaturaPublic)
	pub.GET("/assinatura/:token", h.GetAssinaturaPublic)
	pub.POST("/assinatura/:token/aceitar", h.AceitarAssinatura)
}
