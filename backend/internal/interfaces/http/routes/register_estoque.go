package routes

import "github.com/gin-gonic/gin"

func RegisterEstoqueRoutes(protected *gin.RouterGroup, deps ModuleDeps) {
	guards := defaultCRUDGuards(deps, "estoque")
	h := deps.Wave3Handler

	itens := protected.Group("/estoque/itens")
	itens.GET("", guards.read, h.ListItensEstoque)
	itens.GET("/:id", guards.read, h.GetItemEstoque)
	itens.POST("", guards.write, h.CreateItemEstoque)
	itens.PUT("/:id", guards.write, h.UpdateItemEstoque)
	itens.DELETE("/:id", guards.delete, h.DeleteItemEstoque)

	mov := protected.Group("/estoque/movimentacoes")
	mov.GET("", guards.read, h.ListMovimentacoes)
	mov.GET("/:id", guards.read, h.GetMovimentacao)
	mov.POST("", guards.write, h.CreateMovimentacao)
	mov.DELETE("/:id", guards.delete, h.DeleteMovimentacao)

	inv := protected.Group("/estoque/inventarios")
	inv.GET("", guards.read, h.ListInventarios)
	inv.GET("/:id", guards.read, h.GetInventario)
	inv.POST("", guards.write, h.CreateInventario)
	inv.PUT("/:id", guards.write, h.UpdateInventario)
	inv.DELETE("/:id", guards.delete, h.DeleteInventario)
}
