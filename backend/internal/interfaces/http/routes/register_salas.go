package routes

import "github.com/gin-gonic/gin"

func RegisterSalasRoutes(protected *gin.RouterGroup, deps ModuleDeps) {
	guards := defaultCRUDGuards(deps, "salas")

	salas := protected.Group("/salas")
	salas.GET("", guards.read, deps.SalaHandler.ListSalas)
	salas.GET("/:id", guards.read, deps.SalaHandler.GetSala)
	salas.POST("", guards.write, deps.SalaHandler.CreateSala)
	salas.PUT("/:id", guards.write, deps.SalaHandler.UpdateSala)
	salas.DELETE("/:id", guards.delete, deps.SalaHandler.DeleteSala)

	reservas := salas.Group("/:id/reservas")
	reservas.GET("", guards.read, deps.SalaHandler.ListReservas)
	reservas.POST("", guards.write, deps.SalaHandler.CreateReserva)
	reservas.PUT("/:reservaId", guards.write, deps.SalaHandler.UpdateReserva)
	reservas.DELETE("/:reservaId", guards.delete, deps.SalaHandler.DeleteReserva)
}
