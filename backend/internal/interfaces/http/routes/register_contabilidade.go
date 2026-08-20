package routes

import "github.com/gin-gonic/gin"

func RegisterContabilidadeRoutes(protected *gin.RouterGroup, deps ModuleDeps) {
	guards := defaultCRUDGuards(deps, "contabilidade")
	h := deps.Wave3Handler

	cont := protected.Group("/contabilidade")
	cont.GET("/balancete", guards.read, h.GetBalancete)
	contas := cont.Group("/contas")
	contas.GET("", guards.read, h.ListContasContabeis)
	contas.GET("/:codigo", guards.read, h.GetContaContabil)
	contas.POST("", guards.write, h.CreateContaContabil)
	contas.PUT("/:codigo", guards.write, h.UpdateContaContabil)
	contas.DELETE("/:codigo", guards.delete, h.DeleteContaContabil)

	lanc := cont.Group("/lancamentos")
	lanc.GET("", guards.read, h.ListLancamentosContabeis)
	lanc.GET("/:id", guards.read, h.GetLancamentoContabil)
	lanc.POST("", guards.write, h.CreateLancamentoContabil)
	lanc.PUT("/:id", guards.write, h.UpdateLancamentoContabil)
	lanc.DELETE("/:id", guards.delete, h.DeleteLancamentoContabil)
}
