package routes

import "github.com/gin-gonic/gin"

func RegisterFinanceiroRoutes(protected *gin.RouterGroup, deps ModuleDeps) {
	guards := defaultCRUDGuards(deps, "financeiro")

	fin := protected.Group("/financeiro")
	cat := fin.Group("/categorias")
	cat.GET("", guards.read, deps.FinanceiroHandler.ListCategorias)
	cat.GET("/:id", guards.read, deps.FinanceiroHandler.GetCategoria)
	cat.POST("", guards.write, deps.FinanceiroHandler.CreateCategoria)
	cat.PUT("/:id", guards.write, deps.FinanceiroHandler.UpdateCategoria)
	cat.DELETE("/:id", guards.delete, deps.FinanceiroHandler.DeleteCategoria)

	cc := fin.Group("/centros-custo")
	cc.GET("", guards.read, deps.FinanceiroHandler.ListCentrosCusto)
	cc.GET("/:id", guards.read, deps.FinanceiroHandler.GetCentroCusto)
	cc.POST("", guards.write, deps.FinanceiroHandler.CreateCentroCusto)
	cc.PUT("/:id", guards.write, deps.FinanceiroHandler.UpdateCentroCusto)
	cc.DELETE("/:id", guards.delete, deps.FinanceiroHandler.DeleteCentroCusto)

	lanc := fin.Group("/lancamentos")
	lanc.GET("", guards.read, deps.FinanceiroHandler.ListLancamentos)
	lanc.GET("/:id", guards.read, deps.FinanceiroHandler.GetLancamento)
	lanc.POST("", guards.write, deps.FinanceiroHandler.CreateLancamento)
	lanc.PUT("/:id", guards.write, deps.FinanceiroHandler.UpdateLancamento)
	lanc.DELETE("/:id", guards.delete, deps.FinanceiroHandler.DeleteLancamento)
}
