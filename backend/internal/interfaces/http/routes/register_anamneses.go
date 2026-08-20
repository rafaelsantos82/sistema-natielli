package routes

import "github.com/gin-gonic/gin"

func RegisterAnamnesesRoutes(protected *gin.RouterGroup, deps ModuleDeps) {
	guards := defaultCRUDGuards(deps, "anamneses")

	anamneses := protected.Group("/anamneses")
	anamneses.GET("", guards.read, deps.AnamneseHandler.List)
	anamneses.GET("/:id", guards.read, deps.AnamneseHandler.Get)
	anamneses.POST("", guards.write, deps.AnamneseHandler.Create)
	anamneses.PUT("/:id", guards.write, deps.AnamneseHandler.Update)
	anamneses.DELETE("/:id", guards.delete, deps.AnamneseHandler.Delete)

	respostas := protected.Group("/respostas-anamnese")
	respostas.GET("", guards.read, deps.RespostaAnamneseHandler.List)
	respostas.POST("", guards.write, deps.RespostaAnamneseHandler.Create)
}
