package routes

import "github.com/gin-gonic/gin"

func RegisterProfissionaisRoutes(protected *gin.RouterGroup, deps ModuleDeps) {
	guards := defaultCRUDGuards(deps, "profissionais")

	profissionais := protected.Group("/profissionais")
	profissionais.GET("/documentos", guards.read, deps.ProfissionalDocumentoHandler.ListAllDocumentos)
	profissionais.GET("/documentos/pendencias", guards.read, deps.ProfissionalDocumentoHandler.PendenciasSummary)
	profissionais.GET("", guards.read, deps.ProfissionalHandler.ListProfissionais)
	profissionais.POST("/:id/restore", guards.write, deps.ProfissionalHandler.RestoreProfissional)
	profissionais.GET("/:id", guards.read, deps.ProfissionalHandler.GetProfissional)
	profissionais.POST("", guards.write, deps.ProfissionalHandler.CreateProfissional)
	profissionais.PUT("/:id", guards.write, deps.ProfissionalHandler.UpdateProfissional)
	profissionais.DELETE("/:id", guards.delete, deps.ProfissionalHandler.DeleteProfissional)


	docs := profissionais.Group("/:id/documentos")
	docs.GET("", guards.read, deps.ProfissionalDocumentoHandler.ListDocumentos)
	docs.POST("", guards.write, deps.ProfissionalDocumentoHandler.UploadDocumento)
	docs.GET("/:docId/download", guards.read, deps.ProfissionalDocumentoHandler.DownloadDocumento)
	docs.DELETE("/:docId", guards.delete, deps.ProfissionalDocumentoHandler.DeleteDocumento)
	conselhos := profissionais.Group("/:id/conselhos")
	conselhos.GET("", guards.read, deps.ProfissionalHandler.ListConselhos)
	conselhos.POST("", guards.write, deps.ProfissionalHandler.CreateConselho)
	conselhos.PUT("/:conselhoId", guards.write, deps.ProfissionalHandler.UpdateConselho)
	conselhos.DELETE("/:conselhoId", guards.delete, deps.ProfissionalHandler.DeleteConselho)
}
