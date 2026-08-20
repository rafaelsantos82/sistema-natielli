package routes

import "github.com/gin-gonic/gin"

func RegisterTerapiasRoutes(protected *gin.RouterGroup, deps ModuleDeps) {
	guards := defaultCRUDGuards(deps, "terapias")

	g := protected.Group("/terapias")
	g.GET("", guards.read, deps.TerapiaHandler.List)
	g.GET("/:id", guards.read, deps.TerapiaHandler.Get)
	g.POST("", guards.write, deps.TerapiaHandler.Create)
	g.PUT("/:id", guards.write, deps.TerapiaHandler.Update)
	g.DELETE("/:id", guards.delete, deps.TerapiaHandler.Delete)
}
