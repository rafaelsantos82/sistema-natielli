package routes

import "github.com/gin-gonic/gin"

func RegisterRHRoutes(protected *gin.RouterGroup, deps ModuleDeps) {
	guards := defaultCRUDGuards(deps, "rh")
	h := deps.Wave3Handler

	clt := protected.Group("/rh/funcionarios-clt")
	clt.GET("", guards.read, h.ListFuncionariosCLT)
	clt.GET("/:id", guards.read, h.GetFuncionarioCLT)
	clt.POST("", guards.write, h.CreateFuncionarioCLT)
	clt.PUT("/:id", guards.write, h.UpdateFuncionarioCLT)
	clt.DELETE("/:id", guards.delete, h.DeleteFuncionarioCLT)

	pj := protected.Group("/rh/funcionarios-pj")
	pj.GET("", guards.read, h.ListFuncionariosPJ)
	pj.GET("/:id", guards.read, h.GetFuncionarioPJ)
	pj.POST("", guards.write, h.CreateFuncionarioPJ)
	pj.PUT("/:id", guards.write, h.UpdateFuncionarioPJ)
	pj.DELETE("/:id", guards.delete, h.DeleteFuncionarioPJ)

	fclt := protected.Group("/rh/folhas-clt")
	fclt.GET("", guards.read, h.ListFolhasCLT)
	fclt.GET("/:id", guards.read, h.GetFolhaCLT)
	fclt.POST("", guards.write, h.CreateFolhaCLT)
	fclt.PUT("/:id", guards.write, h.UpdateFolhaCLT)
	fclt.DELETE("/:id", guards.delete, h.DeleteFolhaCLT)

	fpj := protected.Group("/rh/folhas-pj")
	fpj.GET("", guards.read, h.ListFolhasPJ)
	fpj.GET("/:id", guards.read, h.GetFolhaPJ)
	fpj.POST("", guards.write, h.CreateFolhaPJ)
	fpj.PUT("/:id", guards.write, h.UpdateFolhaPJ)
	fpj.DELETE("/:id", guards.delete, h.DeleteFolhaPJ)
}
