package routes

import "github.com/gin-gonic/gin"

// RegisterProtectedRoutes registra todos os módulos Wave 1–3 no grupo protegido.
func RegisterProtectedRoutes(protected *gin.RouterGroup, deps ModuleDeps) {
	RegisterPacientesRoutes(protected, deps)
	RegisterChaveDigitalRoutes(protected, deps)
	RegisterUnidadesRoutes(protected, deps)
	RegisterProfissionaisRoutes(protected, deps)
	RegisterConsultasRoutes(protected, deps)
	RegisterSalasRoutes(protected, deps)
	RegisterNotificationRoutes(protected, deps)

	RegisterTerapiasRoutes(protected, deps)
	RegisterAnamnesesRoutes(protected, deps)
	RegisterProntuarioRoutes(protected, deps)
	RegisterFinanceiroRoutes(protected, deps)
	RegisterRelatoriosOperacionaisRoutes(protected, deps)

	RegisterRHRoutes(protected, deps)
	RegisterEstoqueRoutes(protected, deps)
	RegisterComodatosRoutes(protected, deps)
	RegisterPlanosRoutes(protected, deps)
	RegisterContratosRoutes(protected, deps)
	RegisterMarketingRoutes(protected, deps)
	RegisterContabilidadeRoutes(protected, deps)
	RegisterAuditRoutes(protected, deps)
	RegisterUsersRoutes(protected, deps)
	RegisterAccessControlRoutes(protected, deps)
	RegisterDocumentosRoutes(protected, deps)
	RegisterDocumentosAssinadosRoutes(protected, deps)
}
