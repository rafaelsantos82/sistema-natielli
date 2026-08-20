package routes

import (
	"espaco-terapia-os/backend/internal/interfaces/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterDocumentosRoutes(protected *gin.RouterGroup, deps ModuleDeps) {
	read := middleware.RequirePermissionOrRole(deps.AuthorizationService, "api.documentos.read", defaultReadRoles...)
	write := middleware.RequirePermissionOrRole(deps.AuthorizationService, "api.documentos.write", "admin", "gestor")
	del := middleware.RequirePermissionOrRole(deps.AuthorizationService, "api.documentos.delete", "admin", "gestor")

	g := protected.Group("/documentos")
	cat := g.Group("/categorias")
	cat.GET("", read, deps.BibliotecaDocumentoHandler.ListCategorias)
	cat.GET("/:id", read, deps.BibliotecaDocumentoHandler.GetCategoria)
	cat.POST("", write, deps.BibliotecaDocumentoHandler.CreateCategoria)
	cat.PUT("/:id", write, deps.BibliotecaDocumentoHandler.UpdateCategoria)
	cat.DELETE("/:id", del, deps.BibliotecaDocumentoHandler.DeleteCategoria)

	arq := g.Group("/arquivos")
	arq.GET("", read, deps.BibliotecaDocumentoHandler.ListArquivos)
	arq.POST("", write, deps.BibliotecaDocumentoHandler.UploadArquivo)
	arq.GET("/:id/download", read, deps.BibliotecaDocumentoHandler.DownloadArquivo)
	arq.DELETE("/:id", del, deps.BibliotecaDocumentoHandler.DeleteArquivo)
}
