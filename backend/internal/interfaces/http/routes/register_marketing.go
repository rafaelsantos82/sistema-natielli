package routes

import "github.com/gin-gonic/gin"

func RegisterMarketingRoutes(protected *gin.RouterGroup, deps ModuleDeps) {
	guards := defaultCRUDGuards(deps, "marketing")
	h := deps.Wave3Handler

	marketing := protected.Group("/marketing")
	manuais := marketing.Group("/manuais")
	manuais.GET("", guards.read, h.ListManuais)
	manuais.POST("/upload", guards.write, h.UploadManual)
	manuais.GET("/:id/download", guards.read, h.DownloadManual)
	manuais.GET("/:id", guards.read, h.GetManual)
	manuais.POST("", guards.write, h.CreateManual)
	manuais.PUT("/:id", guards.write, h.UpdateManual)
	manuais.DELETE("/:id", guards.delete, h.DeleteManual)

	materiais := marketing.Group("/materiais")
	materiais.GET("", guards.read, h.ListMateriais)
	materiais.POST("/upload", guards.write, h.UploadMaterial)
	materiais.GET("/:id/download", guards.read, h.DownloadMaterial)
	materiais.GET("/:id", guards.read, h.GetMaterial)
	materiais.POST("", guards.write, h.CreateMaterial)
	materiais.PUT("/:id", guards.write, h.UpdateMaterial)
	materiais.DELETE("/:id", guards.delete, h.DeleteMaterial)
}
