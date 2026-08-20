package routes

import "github.com/gin-gonic/gin"

func RegisterConsultasRoutes(protected *gin.RouterGroup, deps ModuleDeps) {
	guards := defaultCRUDGuards(deps, "consultas")

	consultas := protected.Group("/consultas")
	consultas.GET("", guards.read, deps.ConsultaHandler.ListConsultas)
	consultas.GET("/:id", guards.read, deps.ConsultaHandler.GetConsulta)
	consultas.POST("", guards.write, deps.ConsultaHandler.CreateConsulta)
	consultas.PUT("/:id", guards.write, deps.ConsultaHandler.UpdateConsulta)
	consultas.DELETE("/:id", guards.delete, deps.ConsultaHandler.DeleteConsulta)
	consultas.POST("/:id/confirmar", guards.write, deps.ConsultaHandler.ConfirmarConsulta)
	consultas.POST("/:id/cancelar", guards.write, deps.ConsultaHandler.CancelarConsulta)
	consultas.POST("/:id/concluir", guards.write, deps.ConsultaHandler.ConcluirConsulta)
	consultas.POST("/:id/vincular-prontuario", guards.write, deps.ConsultaHandler.VincularProntuario)
	consultas.POST("/:id/aprovar-atendimento", guards.write, deps.ConsultaHandler.AprovarAtendimento)
	consultas.POST("/:id/rejeitar-atendimento", guards.write, deps.ConsultaHandler.RejeitarAtendimento)
}
