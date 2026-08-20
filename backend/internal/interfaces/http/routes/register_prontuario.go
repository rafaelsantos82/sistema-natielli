package routes

import "github.com/gin-gonic/gin"

func RegisterProntuarioRoutes(protected *gin.RouterGroup, deps ModuleDeps) {
	guards := defaultCRUDGuards(deps, "prontuario")

	p := protected.Group("/prontuario")
	pacientes := p.Group("/pacientes")
	pacientes.GET("/:pacienteId", guards.read, deps.ProntuarioHandler.GetPacienteProntuario)

	evolucoes := p.Group("/evolucoes")
	evolucoes.POST("", guards.write, deps.ProntuarioHandler.CreateEvolucao)
	evolucoes.DELETE("/:id", guards.delete, deps.ProntuarioHandler.DeleteEvolucao)

	prescricoes := p.Group("/prescricoes")
	prescricoes.POST("", guards.write, deps.ProntuarioHandler.CreatePrescricao)
	prescricoes.DELETE("/:id", guards.delete, deps.ProntuarioHandler.DeletePrescricao)

	atestados := p.Group("/atestados")
	atestados.POST("", guards.write, deps.ProntuarioHandler.CreateAtestado)
	atestados.DELETE("/:id", guards.delete, deps.ProntuarioHandler.DeleteAtestado)

	documentos := p.Group("/documentos")
	documentos.POST("", guards.write, deps.ProntuarioHandler.CreateDocumento)
	documentos.DELETE("/:id", guards.delete, deps.ProntuarioHandler.DeleteDocumento)
}
