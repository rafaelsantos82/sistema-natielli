package routes

import "github.com/gin-gonic/gin"

func RegisterRelatoriosOperacionaisRoutes(protected *gin.RouterGroup, deps ModuleDeps) {
	guards := defaultCRUDGuards(deps, "relatorios-operacionais")

	g := protected.Group("/relatorios-operacionais")
	g.GET("", guards.read, deps.RelatorioOperacionalHandler.List)
	g.GET("/:id", guards.read, deps.RelatorioOperacionalHandler.Get)
	g.POST("", guards.write, deps.RelatorioOperacionalHandler.Create)
	g.PUT("/:id", guards.write, deps.RelatorioOperacionalHandler.Update)
	g.DELETE("/:id", guards.delete, deps.RelatorioOperacionalHandler.Delete)
}
