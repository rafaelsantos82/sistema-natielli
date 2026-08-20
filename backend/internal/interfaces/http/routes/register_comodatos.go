package routes

import "github.com/gin-gonic/gin"

func RegisterComodatosRoutes(protected *gin.RouterGroup, deps ModuleDeps) {
	guards := defaultCRUDGuards(deps, "comodatos")
	h := deps.Wave3Handler

	g := protected.Group("/comodatos")
	g.GET("", guards.read, h.ListComodatos)
	g.GET("/:id", guards.read, h.GetComodato)
	g.POST("", guards.write, h.CreateComodato)
	g.PUT("/:id", guards.write, h.UpdateComodato)
	g.DELETE("/:id", guards.delete, h.DeleteComodato)
}
