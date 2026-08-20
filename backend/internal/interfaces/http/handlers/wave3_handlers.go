package handlers

import (
	"net/http"
	"strings"

	"espaco-terapia-os/backend/internal/application"
	"espaco-terapia-os/backend/internal/domain/service"
	httplayer "espaco-terapia-os/backend/internal/interfaces/http"
	"espaco-terapia-os/backend/internal/interfaces/http/dto"
	"espaco-terapia-os/backend/internal/interfaces/http/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Wave3Handler struct {
	Apps           application.Wave3Apps
	ManualSvc      *service.ManualService
	MaterialSvc    *service.MaterialMarketingService
	ConciliacaoSvc *service.ConciliacaoService
	errorHandler   *httplayer.ErrorHandler
}

func NewWave3Handler(
	apps application.Wave3Apps,
	manualSvc *service.ManualService,
	materialSvc *service.MaterialMarketingService,
	conciliacaoSvc *service.ConciliacaoService,
	eh *httplayer.ErrorHandler,
) *Wave3Handler {
	return &Wave3Handler{
		Apps:           apps,
		ManualSvc:      manualSvc,
		MaterialSvc:    materialSvc,
		ConciliacaoSvc: conciliacaoSvc,
		errorHandler:   eh,
	}
}

func userIDFromContext(c *gin.Context) uuid.UUID {
	raw, _ := c.Get("user_id")
	s, _ := raw.(string)
	id, _ := uuid.Parse(s)
	return id
}

// RH Funcionarios CLT
// ListFuncionariosCLT godoc
//
//	@Summary		Listar funcionários CLT
//	@Tags			rh
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/rh/funcionarios-clt [get]
func (h *Wave3Handler) ListFuncionariosCLT(c *gin.Context) {
	_, f, ok := parseWaveList(c, h.errorHandler)
	if !ok {
		return
	}
	result, err := h.Apps.FuncionarioCLT.List(c.Request.Context(), f)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, result.Items, listMeta(result.Page, result.PageSize, result.Total, result.TotalPages))
}
// CreateFuncionarioCLT godoc
//
//	@Summary		Criar funcionário CLT
//	@Tags			rh
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/rh/funcionarios-clt [post]
func (h *Wave3Handler) CreateFuncionarioCLT(c *gin.Context) {
	var req dto.FuncionarioCLTRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "Data inválida")
		return
	}
	id, err := h.Apps.FuncionarioCLT.Create(c.Request.Context(), in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, dto.CreateIDData{ID: id.String()}, nil)
}
// GetFuncionarioCLT godoc
//
//	@Summary		Obter funcionário CLT
//	@Tags			rh
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/rh/funcionarios-clt/{id} [get]
func (h *Wave3Handler) GetFuncionarioCLT(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	out, err := h.Apps.FuncionarioCLT.GetByID(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
// UpdateFuncionarioCLT godoc
//
//	@Summary		Atualizar funcionário CLT
//	@Tags			rh
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/rh/funcionarios-clt/{id} [put]
func (h *Wave3Handler) UpdateFuncionarioCLT(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.FuncionarioCLTRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "Data inválida")
		return
	}
	out, err := h.Apps.FuncionarioCLT.Update(c.Request.Context(), id, in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
// DeleteFuncionarioCLT godoc
//
//	@Summary		Excluir funcionário CLT
//	@Tags			rh
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/rh/funcionarios-clt/{id} [delete]
func (h *Wave3Handler) DeleteFuncionarioCLT(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.Apps.FuncionarioCLT.Delete(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// RH Funcionarios PJ
// ListFuncionariosPJ godoc
//
//	@Summary		Listar funcionários PJ
//	@Tags			rh
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/rh/funcionarios-pj [get]
func (h *Wave3Handler) ListFuncionariosPJ(c *gin.Context) {
	_, f, ok := parseWaveList(c, h.errorHandler)
	if !ok {
		return
	}
	result, err := h.Apps.FuncionarioPJ.List(c.Request.Context(), f)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, result.Items, listMeta(result.Page, result.PageSize, result.Total, result.TotalPages))
}
// CreateFuncionarioPJ godoc
//
//	@Summary		Criar funcionário PJ
//	@Tags			rh
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/rh/funcionarios-pj [post]
func (h *Wave3Handler) CreateFuncionarioPJ(c *gin.Context) {
	var req dto.FuncionarioPJRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "Data inválida")
		return
	}
	id, err := h.Apps.FuncionarioPJ.Create(c.Request.Context(), in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, dto.CreateIDData{ID: id.String()}, nil)
}
// GetFuncionarioPJ godoc
//
//	@Summary		Obter funcionário PJ
//	@Tags			rh
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/rh/funcionarios-pj/{id} [get]
func (h *Wave3Handler) GetFuncionarioPJ(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	out, err := h.Apps.FuncionarioPJ.GetByID(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
// UpdateFuncionarioPJ godoc
//
//	@Summary		Atualizar funcionário PJ
//	@Tags			rh
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/rh/funcionarios-pj/{id} [put]
func (h *Wave3Handler) UpdateFuncionarioPJ(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.FuncionarioPJRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "Data inválida")
		return
	}
	out, err := h.Apps.FuncionarioPJ.Update(c.Request.Context(), id, in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
// DeleteFuncionarioPJ godoc
//
//	@Summary		Excluir funcionário PJ
//	@Tags			rh
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/rh/funcionarios-pj/{id} [delete]
func (h *Wave3Handler) DeleteFuncionarioPJ(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.Apps.FuncionarioPJ.Delete(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// Folhas CLT
// ListFolhasCLT godoc
//
//	@Summary		Listar folhas CLT
//	@Tags			rh
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/rh/folhas-clt [get]
func (h *Wave3Handler) ListFolhasCLT(c *gin.Context) {
	_, f, ok := parseWaveList(c, h.errorHandler)
	if !ok {
		return
	}
	result, err := h.Apps.FolhaCLT.List(c.Request.Context(), f)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, result.Items, listMeta(result.Page, result.PageSize, result.Total, result.TotalPages))
}
// CreateFolhaCLT godoc
//
//	@Summary		Criar folha CLT
//	@Tags			rh
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/rh/folhas-clt [post]
func (h *Wave3Handler) CreateFolhaCLT(c *gin.Context) {
	var req dto.FolhaCLTRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "Data inválida")
		return
	}
	id, err := h.Apps.FolhaCLT.Create(c.Request.Context(), in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, dto.CreateIDData{ID: id.String()}, nil)
}
// GetFolhaCLT godoc
//
//	@Summary		Obter folha CLT
//	@Tags			rh
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/rh/folhas-clt/{id} [get]
func (h *Wave3Handler) GetFolhaCLT(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	out, err := h.Apps.FolhaCLT.GetByID(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
// UpdateFolhaCLT godoc
//
//	@Summary		Atualizar folha CLT
//	@Tags			rh
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/rh/folhas-clt/{id} [put]
func (h *Wave3Handler) UpdateFolhaCLT(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.FolhaCLTRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "Data inválida")
		return
	}
	out, err := h.Apps.FolhaCLT.Update(c.Request.Context(), id, in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
// DeleteFolhaCLT godoc
//
//	@Summary		Excluir folha CLT
//	@Tags			rh
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/rh/folhas-clt/{id} [delete]
func (h *Wave3Handler) DeleteFolhaCLT(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.Apps.FolhaCLT.Delete(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// Folhas PJ
// ListFolhasPJ godoc
//
//	@Summary		Listar folhas PJ
//	@Tags			rh
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/rh/folhas-pj [get]
func (h *Wave3Handler) ListFolhasPJ(c *gin.Context) {
	_, f, ok := parseWaveList(c, h.errorHandler)
	if !ok {
		return
	}
	result, err := h.Apps.FolhaPJ.List(c.Request.Context(), f)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, result.Items, listMeta(result.Page, result.PageSize, result.Total, result.TotalPages))
}
// CreateFolhaPJ godoc
//
//	@Summary		Criar folha PJ
//	@Tags			rh
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/rh/folhas-pj [post]
func (h *Wave3Handler) CreateFolhaPJ(c *gin.Context) {
	var req dto.FolhaPJRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "Data inválida")
		return
	}
	id, err := h.Apps.FolhaPJ.Create(c.Request.Context(), in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, dto.CreateIDData{ID: id.String()}, nil)
}
// GetFolhaPJ godoc
//
//	@Summary		Obter folha PJ
//	@Tags			rh
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/rh/folhas-pj/{id} [get]
func (h *Wave3Handler) GetFolhaPJ(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	out, err := h.Apps.FolhaPJ.GetByID(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
// UpdateFolhaPJ godoc
//
//	@Summary		Atualizar folha PJ
//	@Tags			rh
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/rh/folhas-pj/{id} [put]
func (h *Wave3Handler) UpdateFolhaPJ(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.FolhaPJRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "Data inválida")
		return
	}
	out, err := h.Apps.FolhaPJ.Update(c.Request.Context(), id, in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
// DeleteFolhaPJ godoc
//
//	@Summary		Excluir folha PJ
//	@Tags			rh
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/rh/folhas-pj/{id} [delete]
func (h *Wave3Handler) DeleteFolhaPJ(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.Apps.FolhaPJ.Delete(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// Estoque Itens
// ListItensEstoque godoc
//
//	@Summary		Listar itens de estoque
//	@Tags			estoque
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/estoque/itens [get]
func (h *Wave3Handler) ListItensEstoque(c *gin.Context) {
	_, f, ok := parseWaveList(c, h.errorHandler)
	if !ok {
		return
	}
	result, err := h.Apps.ItemEstoque.List(c.Request.Context(), f)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, result.Items, listMeta(result.Page, result.PageSize, result.Total, result.TotalPages))
}
// CreateItemEstoque godoc
//
//	@Summary		Criar item de estoque
//	@Tags			estoque
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/estoque/itens [post]
func (h *Wave3Handler) CreateItemEstoque(c *gin.Context) {
	var req dto.ItemEstoqueRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	id, err := h.Apps.ItemEstoque.Create(c.Request.Context(), req.ToServiceInput())
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, dto.CreateIDData{ID: id.String()}, nil)
}
// GetItemEstoque godoc
//
//	@Summary		Obter item de estoque
//	@Tags			estoque
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/estoque/itens/{id} [get]
func (h *Wave3Handler) GetItemEstoque(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	out, err := h.Apps.ItemEstoque.GetByID(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
// UpdateItemEstoque godoc
//
//	@Summary		Atualizar item de estoque
//	@Tags			estoque
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/estoque/itens/{id} [put]
func (h *Wave3Handler) UpdateItemEstoque(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.ItemEstoqueRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	out, err := h.Apps.ItemEstoque.Update(c.Request.Context(), id, req.ToServiceInput())
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
// DeleteItemEstoque godoc
//
//	@Summary		Excluir item de estoque
//	@Tags			estoque
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/estoque/itens/{id} [delete]
func (h *Wave3Handler) DeleteItemEstoque(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.Apps.ItemEstoque.Delete(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// Movimentacoes
// ListMovimentacoes godoc
//
//	@Summary		Listar movimentações
//	@Tags			estoque
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/estoque/movimentacoes [get]
func (h *Wave3Handler) ListMovimentacoes(c *gin.Context) {
	q, f, ok := parseWaveList(c, h.errorHandler)
	if !ok {
		return
	}
	var itemID *uuid.UUID
	if q.ItemID != "" {
		id, err := uuid.Parse(q.ItemID)
		if err != nil {
			h.errorHandler.HandleValidationError(c, "item_id inválido")
			return
		}
		itemID = &id
	}
	result, err := h.Apps.MovimentacaoEstoque.List(c.Request.Context(), f, itemID)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, result.Items, listMeta(result.Page, result.PageSize, result.Total, result.TotalPages))
}
// CreateMovimentacao godoc
//
//	@Summary		Criar movimentação
//	@Tags			estoque
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/estoque/movimentacoes [post]
func (h *Wave3Handler) CreateMovimentacao(c *gin.Context) {
	var req dto.MovimentacaoEstoqueRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "data_hora inválida")
		return
	}
	id, err := h.Apps.MovimentacaoEstoque.Create(c.Request.Context(), in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, dto.CreateIDData{ID: id.String()}, nil)
}
// GetMovimentacao godoc
//
//	@Summary		Obter movimentação
//	@Tags			estoque
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/estoque/movimentacoes/{id} [get]
func (h *Wave3Handler) GetMovimentacao(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	out, err := h.Apps.MovimentacaoEstoque.GetByID(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
// DeleteMovimentacao godoc
//
//	@Summary		Excluir movimentação
//	@Tags			estoque
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/estoque/movimentacoes/{id} [delete]
func (h *Wave3Handler) DeleteMovimentacao(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.Apps.MovimentacaoEstoque.Delete(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// Inventarios
// ListInventarios godoc
//
//	@Summary		Listar inventários
//	@Tags			estoque
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/estoque/inventarios [get]
func (h *Wave3Handler) ListInventarios(c *gin.Context) {
	_, f, ok := parseWaveList(c, h.errorHandler)
	if !ok {
		return
	}
	result, err := h.Apps.Inventario.List(c.Request.Context(), f)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, result.Items, listMeta(result.Page, result.PageSize, result.Total, result.TotalPages))
}
// CreateInventario godoc
//
//	@Summary		Criar inventário
//	@Tags			estoque
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/estoque/inventarios [post]
func (h *Wave3Handler) CreateInventario(c *gin.Context) {
	var req dto.InventarioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "Data inválida")
		return
	}
	id, err := h.Apps.Inventario.Create(c.Request.Context(), in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, dto.CreateIDData{ID: id.String()}, nil)
}
// GetInventario godoc
//
//	@Summary		Obter inventário
//	@Tags			estoque
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/estoque/inventarios/{id} [get]
func (h *Wave3Handler) GetInventario(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	out, err := h.Apps.Inventario.GetByID(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
// UpdateInventario godoc
//
//	@Summary		Atualizar inventário
//	@Tags			estoque
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/estoque/inventarios/{id} [put]
func (h *Wave3Handler) UpdateInventario(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.InventarioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "Data inválida")
		return
	}
	out, err := h.Apps.Inventario.Update(c.Request.Context(), id, in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
// DeleteInventario godoc
//
//	@Summary		Excluir inventário
//	@Tags			estoque
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/estoque/inventarios/{id} [delete]
func (h *Wave3Handler) DeleteInventario(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.Apps.Inventario.Delete(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// Comodatos
// ListComodatos godoc
//
//	@Summary		Listar comodatos
//	@Tags			comodato
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/comodatos [get]
func (h *Wave3Handler) ListComodatos(c *gin.Context) {
	_, f, ok := parseWaveList(c, h.errorHandler)
	if !ok {
		return
	}
	result, err := h.Apps.Comodato.List(c.Request.Context(), f)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, result.Items, listMeta(result.Page, result.PageSize, result.Total, result.TotalPages))
}
// CreateComodato godoc
//
//	@Summary		Criar comodato
//	@Tags			comodato
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/comodatos [post]
func (h *Wave3Handler) CreateComodato(c *gin.Context) {
	var req dto.ComodatoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "Data inválida")
		return
	}
	id, err := h.Apps.Comodato.Create(c.Request.Context(), in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, dto.CreateIDData{ID: id.String()}, nil)
}
// GetComodato godoc
//
//	@Summary		Obter comodato
//	@Tags			comodato
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/comodatos/{id} [get]
func (h *Wave3Handler) GetComodato(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	out, err := h.Apps.Comodato.GetByID(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
// UpdateComodato godoc
//
//	@Summary		Atualizar comodato
//	@Tags			comodato
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/comodatos/{id} [put]
func (h *Wave3Handler) UpdateComodato(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.ComodatoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "Data inválida")
		return
	}
	out, err := h.Apps.Comodato.Update(c.Request.Context(), id, in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
// DeleteComodato godoc
//
//	@Summary		Excluir comodato
//	@Tags			comodato
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/comodatos/{id} [delete]
func (h *Wave3Handler) DeleteComodato(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.Apps.Comodato.Delete(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// Planos Saude
// ListPlanosSaude godoc
//
//	@Summary		Listar planos de saúde
//	@Tags			plano
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/planos-saude [get]
func (h *Wave3Handler) ListPlanosSaude(c *gin.Context) {
	_, f, ok := parseWaveList(c, h.errorHandler)
	if !ok {
		return
	}
	result, err := h.Apps.PlanoSaude.List(c.Request.Context(), f)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, result.Items, listMeta(result.Page, result.PageSize, result.Total, result.TotalPages))
}
// CreatePlanoSaude godoc
//
//	@Summary		Criar plano de saúde
//	@Tags			plano
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/planos-saude [post]
func (h *Wave3Handler) CreatePlanoSaude(c *gin.Context) {
	var req dto.PlanoSaudeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	id, err := h.Apps.PlanoSaude.Create(c.Request.Context(), req.ToServiceInput())
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, dto.CreateIDData{ID: id.String()}, nil)
}
// GetPlanoSaude godoc
//
//	@Summary		Obter plano de saúde
//	@Tags			plano
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/planos-saude/{id} [get]
func (h *Wave3Handler) GetPlanoSaude(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	out, err := h.Apps.PlanoSaude.GetByID(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
// UpdatePlanoSaude godoc
//
//	@Summary		Atualizar plano de saúde
//	@Tags			plano
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/planos-saude/{id} [put]
func (h *Wave3Handler) UpdatePlanoSaude(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.PlanoSaudeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	out, err := h.Apps.PlanoSaude.Update(c.Request.Context(), id, req.ToServiceInput())
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
// DeletePlanoSaude godoc
//
//	@Summary		Excluir plano de saúde
//	@Tags			plano
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/planos-saude/{id} [delete]
func (h *Wave3Handler) DeletePlanoSaude(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.Apps.PlanoSaude.Delete(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// Acoes Judiciais
// ListAcoesJudiciais godoc
//
//	@Summary		Listar ações judiciais
//	@Tags			juridico
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/acoes-judiciais [get]
func (h *Wave3Handler) ListAcoesJudiciais(c *gin.Context) {
	_, f, ok := parseWaveList(c, h.errorHandler)
	if !ok {
		return
	}
	result, err := h.Apps.AcaoJudicial.List(c.Request.Context(), f)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, result.Items, listMeta(result.Page, result.PageSize, result.Total, result.TotalPages))
}
// CreateAcaoJudicial godoc
//
//	@Summary		Criar ação judicial
//	@Tags			juridico
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/acoes-judiciais [post]
func (h *Wave3Handler) CreateAcaoJudicial(c *gin.Context) {
	var req dto.AcaoJudicialRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "Data inválida")
		return
	}
	id, err := h.Apps.AcaoJudicial.Create(c.Request.Context(), in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, dto.CreateIDData{ID: id.String()}, nil)
}
// GetAcaoJudicial godoc
//
//	@Summary		Obter ação judicial
//	@Tags			juridico
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/acoes-judiciais/{id} [get]
func (h *Wave3Handler) GetAcaoJudicial(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	out, err := h.Apps.AcaoJudicial.GetByID(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
// UpdateAcaoJudicial godoc
//
//	@Summary		Atualizar ação judicial
//	@Tags			juridico
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/acoes-judiciais/{id} [put]
func (h *Wave3Handler) UpdateAcaoJudicial(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.AcaoJudicialRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "Data inválida")
		return
	}
	out, err := h.Apps.AcaoJudicial.Update(c.Request.Context(), id, in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
// DeleteAcaoJudicial godoc
//
//	@Summary		Excluir ação judicial
//	@Tags			juridico
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/acoes-judiciais/{id} [delete]
func (h *Wave3Handler) DeleteAcaoJudicial(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.Apps.AcaoJudicial.Delete(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// Notas Fiscais
// ListNotasFiscais godoc
//
//	@Summary		Listar notas fiscais
//	@Tags			fiscal
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/notas-fiscais [get]
func (h *Wave3Handler) ListNotasFiscais(c *gin.Context) {
	_, f, ok := parseWaveList(c, h.errorHandler)
	if !ok {
		return
	}
	result, err := h.Apps.NotaFiscal.List(c.Request.Context(), f)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, result.Items, listMeta(result.Page, result.PageSize, result.Total, result.TotalPages))
}
// CreateNotaFiscal godoc
//
//	@Summary		Criar nota fiscal
//	@Tags			fiscal
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/notas-fiscais [post]
func (h *Wave3Handler) CreateNotaFiscal(c *gin.Context) {
	var req dto.NotaFiscalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "Data inválida")
		return
	}
	id, err := h.Apps.NotaFiscal.Create(c.Request.Context(), in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, dto.CreateIDData{ID: id.String()}, nil)
}
// GetNotaFiscal godoc
//
//	@Summary		Obter nota fiscal
//	@Tags			fiscal
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/notas-fiscais/{id} [get]
func (h *Wave3Handler) GetNotaFiscal(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	out, err := h.Apps.NotaFiscal.GetByID(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
// UpdateNotaFiscal godoc
//
//	@Summary		Atualizar nota fiscal
//	@Tags			fiscal
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/notas-fiscais/{id} [put]
func (h *Wave3Handler) UpdateNotaFiscal(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.NotaFiscalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "Data inválida")
		return
	}
	out, err := h.Apps.NotaFiscal.Update(c.Request.Context(), id, in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
// DeleteNotaFiscal godoc
//
//	@Summary		Excluir nota fiscal
//	@Tags			fiscal
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/notas-fiscais/{id} [delete]
func (h *Wave3Handler) DeleteNotaFiscal(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.Apps.NotaFiscal.Delete(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func parsePlanoSaudeIDQuery(c *gin.Context) *uuid.UUID {
	raw := strings.TrimSpace(c.Query("plano_saude_id"))
	if raw == "" {
		return nil
	}
	id, err := uuid.Parse(raw)
	if err != nil {
		return nil
	}
	return &id
}

// ListConciliacaoResumo godoc
//
//	@Summary		Listar resumo de conciliação por ação judicial
//	@Tags			conciliacao
//	@Produce		json
//	@Security		BearerAuth
//	@Router			/acoes-judiciais/conciliacao-resumo [get]
func (h *Wave3Handler) ListConciliacaoResumo(c *gin.Context) {
	_, f, ok := parseWaveList(c, h.errorHandler)
	if !ok {
		return
	}
	planoID := parsePlanoSaudeIDQuery(c)
	result, err := h.ConciliacaoSvc.ListResumos(c.Request.Context(), f, planoID)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, result.Items, listMeta(result.Page, result.PageSize, result.Total, result.TotalPages))
}

// GetConciliacaoAcao godoc
//
//	@Summary		Obter conciliação de uma ação judicial
//	@Tags			conciliacao
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID da ação"
//	@Router			/acoes-judiciais/{id}/conciliacao [get]
func (h *Wave3Handler) GetConciliacaoAcao(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	out, err := h.ConciliacaoSvc.GetResumoAcao(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

// ConciliarNotaFiscal godoc
//
//	@Summary		Conciliar nota fiscal com ação judicial
//	@Tags			conciliacao
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID da nota"
//	@Router			/notas-fiscais/{id}/conciliar [post]
func (h *Wave3Handler) ConciliarNotaFiscal(c *gin.Context) {
	notaID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.ConciliarNotaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	out, err := h.ConciliacaoSvc.ConciliarNota(c.Request.Context(), notaID, req.AcaoJudicialID, req.ValorPago)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

// Marketing Manuais
// ListManuais godoc
//
//	@Summary		Listar manuais
//	@Tags			marketing
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/marketing/manuais [get]
func (h *Wave3Handler) ListManuais(c *gin.Context) {
	_, f, ok := parseWaveList(c, h.errorHandler)
	if !ok {
		return
	}
	result, err := h.Apps.Manual.List(c.Request.Context(), f)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, result.Items, listMeta(result.Page, result.PageSize, result.Total, result.TotalPages))
}
// CreateManual godoc
//
//	@Summary		Criar manual
//	@Tags			marketing
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/marketing/manuais [post]
func (h *Wave3Handler) CreateManual(c *gin.Context) {
	var req dto.ManualRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	id, err := h.Apps.Manual.Create(c.Request.Context(), req.ToServiceInput(userIDFromContext(c)))
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, dto.CreateIDData{ID: id.String()}, nil)
}
// GetManual godoc
//
//	@Summary		Obter manual
//	@Tags			marketing
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/marketing/manuais/{id} [get]
func (h *Wave3Handler) GetManual(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	out, err := h.Apps.Manual.GetByID(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
// UpdateManual godoc
//
//	@Summary		Atualizar manual
//	@Tags			marketing
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/marketing/manuais/{id} [put]
func (h *Wave3Handler) UpdateManual(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.ManualRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	out, err := h.Apps.Manual.Update(c.Request.Context(), id, req.ToServiceInput(userIDFromContext(c)))
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
// DeleteManual godoc
//
//	@Summary		Excluir manual
//	@Tags			marketing
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/marketing/manuais/{id} [delete]
func (h *Wave3Handler) DeleteManual(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.Apps.Manual.Delete(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// Marketing Materiais
// ListMateriais godoc
//
//	@Summary		Listar materiais
//	@Tags			marketing
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/marketing/materiais [get]
func (h *Wave3Handler) ListMateriais(c *gin.Context) {
	_, f, ok := parseWaveList(c, h.errorHandler)
	if !ok {
		return
	}
	result, err := h.Apps.MaterialMarketing.List(c.Request.Context(), f)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, result.Items, listMeta(result.Page, result.PageSize, result.Total, result.TotalPages))
}
// CreateMaterial godoc
//
//	@Summary		Criar material
//	@Tags			marketing
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/marketing/materiais [post]
func (h *Wave3Handler) CreateMaterial(c *gin.Context) {
	var req dto.MaterialMarketingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	id, err := h.Apps.MaterialMarketing.Create(c.Request.Context(), req.ToServiceInput(userIDFromContext(c)))
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, dto.CreateIDData{ID: id.String()}, nil)
}
// GetMaterial godoc
//
//	@Summary		Obter material
//	@Tags			marketing
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/marketing/materiais/{id} [get]
func (h *Wave3Handler) GetMaterial(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	out, err := h.Apps.MaterialMarketing.GetByID(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
// UpdateMaterial godoc
//
//	@Summary		Atualizar material
//	@Tags			marketing
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/marketing/materiais/{id} [put]
func (h *Wave3Handler) UpdateMaterial(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.MaterialMarketingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	out, err := h.Apps.MaterialMarketing.Update(c.Request.Context(), id, req.ToServiceInput(userIDFromContext(c)))
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
// DeleteMaterial godoc
//
//	@Summary		Excluir material
//	@Tags			marketing
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/marketing/materiais/{id} [delete]
func (h *Wave3Handler) DeleteMaterial(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.Apps.MaterialMarketing.Delete(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// GetBalancete godoc
//
//	@Summary		Gerar balancete de verificação
//	@Tags			contabilidade
//	@Produce		json
//	@Security		BearerAuth
//	@Param			dt_ini	query	string	true	"Data inicial (AAAA-MM-DD)"
//	@Param			dt_fin	query	string	true	"Data final (AAAA-MM-DD)"
//	@Param			unidade_id	query	string	false	"Filtrar por unidade (UUID)"
//	@Param			centro_custo	query	string	false	"Filtrar por centro de custo"
//	@Param			ocultar_zeradas	query	bool	false	"Ocultar contas sem movimento"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/contabilidade/balancete [get]
func (h *Wave3Handler) GetBalancete(c *gin.Context) {
	dtIni := c.Query("dt_ini")
	dtFin := c.Query("dt_fin")
	if dtIni == "" || dtFin == "" {
		h.errorHandler.HandleValidationError(c, "Informe dt_ini e dt_fin no formato AAAA-MM-DD.")
		return
	}
	ini, fim, err := service.ValidateBalanceteDates(dtIni, dtFin)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	uid, err := service.ParseBalanceteUnidadeID(c.Query("unidade_id"))
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	var cc *string
	if v := strings.TrimSpace(c.Query("centro_custo")); v != "" {
		cc = &v
	}
	ocultar := c.Query("ocultar_zeradas") == "true" || c.Query("ocultar_zeradas") == "1"
	out, err := h.Apps.Balancete.Generate(c.Request.Context(), service.BalanceteFiltrosInput{
		DtIni: ini, DtFin: fim, UnidadeID: uid, CentroCusto: cc, OcultarZeradas: ocultar,
	})
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

// Contabilidade Contas
// ListContasContabeis godoc
//
//	@Summary		Listar contas contábeis
//	@Tags			contabilidade
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/contabilidade/contas [get]
func (h *Wave3Handler) ListContasContabeis(c *gin.Context) {
	_, f, ok := parseWaveList(c, h.errorHandler)
	if !ok {
		return
	}
	result, err := h.Apps.ContaContabil.List(c.Request.Context(), f)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, result.Items, listMeta(result.Page, result.PageSize, result.Total, result.TotalPages))
}
// CreateContaContabil godoc
//
//	@Summary		Criar conta contábil
//	@Tags			contabilidade
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/contabilidade/contas [post]
func (h *Wave3Handler) CreateContaContabil(c *gin.Context) {
	var req dto.ContaContabilRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	out, err := h.Apps.ContaContabil.Create(c.Request.Context(), req.ToServiceInput())
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, out, nil)
}
// GetContaContabil godoc
//
//	@Summary		Obter conta contábil
//	@Tags			contabilidade
//	@Produce		json
//	@Security		BearerAuth
//	@Param			codigo	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/contabilidade/contas/{codigo} [get]
func (h *Wave3Handler) GetContaContabil(c *gin.Context) {
	out, err := h.Apps.ContaContabil.GetByCodigo(c.Request.Context(), c.Param("codigo"))
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
// UpdateContaContabil godoc
//
//	@Summary		Atualizar conta contábil
//	@Tags			contabilidade
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			codigo	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/contabilidade/contas/{codigo} [put]
func (h *Wave3Handler) UpdateContaContabil(c *gin.Context) {
	var req dto.ContaContabilRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	out, err := h.Apps.ContaContabil.Update(c.Request.Context(), c.Param("codigo"), req.ToServiceInput())
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
// DeleteContaContabil godoc
//
//	@Summary		Excluir conta contábil
//	@Tags			contabilidade
//	@Produce		json
//	@Security		BearerAuth
//	@Param			codigo	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/contabilidade/contas/{codigo} [delete]
func (h *Wave3Handler) DeleteContaContabil(c *gin.Context) {
	if err := h.Apps.ContaContabil.Delete(c.Request.Context(), c.Param("codigo")); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// Contabilidade Lancamentos
// ListLancamentosContabeis godoc
//
//	@Summary		Listar lançamentos contábeis
//	@Tags			contabilidade
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/contabilidade/lancamentos [get]
func (h *Wave3Handler) ListLancamentosContabeis(c *gin.Context) {
	_, f, ok := parseWaveList(c, h.errorHandler)
	if !ok {
		return
	}
	result, err := h.Apps.LancamentoContabil.List(c.Request.Context(), f)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, result.Items, listMeta(result.Page, result.PageSize, result.Total, result.TotalPages))
}
// CreateLancamentoContabil godoc
//
//	@Summary		Criar lançamento contábil
//	@Tags			contabilidade
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/contabilidade/lancamentos [post]
func (h *Wave3Handler) CreateLancamentoContabil(c *gin.Context) {
	var req dto.LancamentoContabilRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "Data inválida")
		return
	}
	id, err := h.Apps.LancamentoContabil.Create(c.Request.Context(), in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, dto.CreateIDData{ID: id.String()}, nil)
}
// GetLancamentoContabil godoc
//
//	@Summary		Obter lançamento contábil
//	@Tags			contabilidade
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/contabilidade/lancamentos/{id} [get]
func (h *Wave3Handler) GetLancamentoContabil(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	out, err := h.Apps.LancamentoContabil.GetByID(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
// UpdateLancamentoContabil godoc
//
//	@Summary		Atualizar lançamento contábil
//	@Tags			contabilidade
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/contabilidade/lancamentos/{id} [put]
func (h *Wave3Handler) UpdateLancamentoContabil(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.LancamentoContabilRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "Data inválida")
		return
	}
	out, err := h.Apps.LancamentoContabil.Update(c.Request.Context(), id, in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}
// DeleteLancamentoContabil godoc
//
//	@Summary		Excluir lançamento contábil
//	@Tags			contabilidade
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/contabilidade/lancamentos/{id} [delete]
func (h *Wave3Handler) DeleteLancamentoContabil(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.Apps.LancamentoContabil.Delete(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}
