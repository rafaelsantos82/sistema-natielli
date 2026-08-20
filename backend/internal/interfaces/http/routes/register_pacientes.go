package routes

import "github.com/gin-gonic/gin"

func RegisterPacientesRoutes(protected *gin.RouterGroup, deps ModuleDeps) {
	guards := defaultCRUDGuards(deps, "pacientes")

	pacientes := protected.Group("/pacientes")
	pacientes.GET("", guards.read, deps.PacienteHandler.ListPacientes)
	pacientes.GET("/:id", guards.read, deps.PacienteHandler.GetPaciente)
	pacientes.POST("", guards.write, deps.PacienteHandler.CreatePaciente)
	pacientes.PUT("/:id", guards.write, deps.PacienteHandler.UpdatePaciente)
	pacientes.DELETE("/:id", guards.delete, deps.PacienteHandler.DeletePaciente)
	pacientes.POST("/:id/restore", guards.write, deps.PacienteHandler.RestorePaciente)
}
