package routes

import "github.com/gin-gonic/gin"

func RegisterPlanosRoutes(protected *gin.RouterGroup, deps ModuleDeps) {
	guards := defaultCRUDGuards(deps, "planos")
	concGuards := defaultCRUDGuards(deps, "conciliacao")
	h := deps.Wave3Handler

	planos := protected.Group("/planos-saude")
	planos.GET("", guards.read, h.ListPlanosSaude)
	planos.GET("/:id", guards.read, h.GetPlanoSaude)
	planos.POST("", guards.write, h.CreatePlanoSaude)
	planos.PUT("/:id", guards.write, h.UpdatePlanoSaude)
	planos.DELETE("/:id", guards.delete, h.DeletePlanoSaude)

	acoes := protected.Group("/acoes-judiciais")
	acoes.GET("/conciliacao-resumo", concGuards.read, h.ListConciliacaoResumo)
	acoes.GET("", guards.read, h.ListAcoesJudiciais)
	acoes.GET("/:id/conciliacao", concGuards.read, h.GetConciliacaoAcao)
	acoes.GET("/:id", guards.read, h.GetAcaoJudicial)
	acoes.POST("", guards.write, h.CreateAcaoJudicial)
	acoes.PUT("/:id", guards.write, h.UpdateAcaoJudicial)
	acoes.DELETE("/:id", guards.delete, h.DeleteAcaoJudicial)

	nf := protected.Group("/notas-fiscais")
	nf.GET("", guards.read, h.ListNotasFiscais)
	nf.GET("/:id", guards.read, h.GetNotaFiscal)
	nf.POST("", guards.write, h.CreateNotaFiscal)
	nf.POST("/:id/conciliar", concGuards.write, h.ConciliarNotaFiscal)
	nf.PUT("/:id", guards.write, h.UpdateNotaFiscal)
	nf.DELETE("/:id", guards.delete, h.DeleteNotaFiscal)
}
