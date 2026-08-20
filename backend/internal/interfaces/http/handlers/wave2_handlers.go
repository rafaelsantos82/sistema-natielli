package handlers

import (
	"log/slog"
	"net/http"

	"espaco-terapia-os/backend/internal/application"
	"espaco-terapia-os/backend/internal/domain/entity"
	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/domain/service"
	httplayer "espaco-terapia-os/backend/internal/interfaces/http"
	"espaco-terapia-os/backend/internal/interfaces/http/dto"
	"espaco-terapia-os/backend/internal/interfaces/http/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func parseWaveList(c *gin.Context, eh *httplayer.ErrorHandler) (dto.WaveListQuery, repository.CRUDListFilter, bool) {
	var q dto.WaveListQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		eh.HandleValidationError(c, "Parâmetros de consulta inválidos")
		return q, repository.CRUDListFilter{}, false
	}
	f, err := dto.WaveListFilterFromQuery(q)
	if err != nil {
		eh.HandleValidationError(c, "unidade_id inválido")
		return q, f, false
	}
	return q, f, true
}

func listMeta(page, pageSize int, total int64, totalPages int) dto.ListMeta {
	return dto.ListMeta{Page: page, PageSize: pageSize, Total: total, TotalPages: totalPages}
}

type TerapiaHandler struct {
	app          *application.TerapiaApp
	errorHandler *httplayer.ErrorHandler
	logger       *slog.Logger
}

func NewTerapiaHandler(app *application.TerapiaApp, eh *httplayer.ErrorHandler, logger *slog.Logger) *TerapiaHandler {
	return &TerapiaHandler{app: app, errorHandler: eh, logger: logger}
}

// List godoc
//
//	@Summary		Listar terapias
//	@Tags			terapia
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/terapias [get]
func (h *TerapiaHandler) List(c *gin.Context) {
	_, f, ok := parseWaveList(c, h.errorHandler)
	if !ok {
		return
	}
	result, err := h.app.List(c.Request.Context(), f)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, result.Items, listMeta(result.Page, result.PageSize, result.Total, result.TotalPages))
}

// Create godoc
//
//	@Summary		Criar terapia
//	@Tags			terapia
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/terapias [post]
func (h *TerapiaHandler) Create(c *gin.Context) {
	var req dto.TerapiaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	id, err := h.app.Create(c.Request.Context(), req.ToServiceInput())
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, dto.CreateIDData{ID: id.String()}, nil)
}

// Get godoc
//
//	@Summary		Obter terapia
//	@Tags			terapia
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/terapias/{id} [get]
func (h *TerapiaHandler) Get(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	out, err := h.app.GetByID(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

// Update godoc
//
//	@Summary		Atualizar terapia
//	@Tags			terapia
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/terapias/{id} [put]
func (h *TerapiaHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.TerapiaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	out, err := h.app.Update(c.Request.Context(), id, req.ToServiceInput())
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

// Delete godoc
//
//	@Summary		Excluir terapia
//	@Tags			terapia
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/terapias/{id} [delete]
func (h *TerapiaHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.app.Delete(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

type AnamneseHandler struct {
	app          *application.AnamneseApp
	errorHandler *httplayer.ErrorHandler
}

func NewAnamneseHandler(app *application.AnamneseApp, eh *httplayer.ErrorHandler) *AnamneseHandler {
	return &AnamneseHandler{app: app, errorHandler: eh}
}

// List godoc
//
//	@Summary		Listar anamneses
//	@Tags			anamnese
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/anamneses [get]
func (h *AnamneseHandler) List(c *gin.Context) {
	_, f, ok := parseWaveList(c, h.errorHandler)
	if !ok {
		return
	}
	result, err := h.app.List(c.Request.Context(), f)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, result.Items, listMeta(result.Page, result.PageSize, result.Total, result.TotalPages))
}

// Create godoc
//
//	@Summary		Criar anamnese
//	@Tags			anamnese
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/anamneses [post]
func (h *AnamneseHandler) Create(c *gin.Context) {
	var req dto.AnamneseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	id, err := h.app.Create(c.Request.Context(), req.ToServiceInput())
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, dto.CreateIDData{ID: id.String()}, nil)
}

// Get godoc
//
//	@Summary		Obter anamnese
//	@Tags			anamnese
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/anamneses/{id} [get]
func (h *AnamneseHandler) Get(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	out, err := h.app.GetByID(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

// Update godoc
//
//	@Summary		Atualizar anamnese
//	@Tags			anamnese
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/anamneses/{id} [put]
func (h *AnamneseHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.AnamneseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	out, err := h.app.Update(c.Request.Context(), id, req.ToServiceInput())
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

// Delete godoc
//
//	@Summary		Excluir anamnese
//	@Tags			anamnese
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/anamneses/{id} [delete]
func (h *AnamneseHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.app.Delete(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

type RespostaAnamneseHandler struct {
	app          *application.RespostaAnamneseApp
	scopeSvc     *service.DataScopeService
	errorHandler *httplayer.ErrorHandler
}

func NewRespostaAnamneseHandler(app *application.RespostaAnamneseApp, scopeSvc *service.DataScopeService, eh *httplayer.ErrorHandler) *RespostaAnamneseHandler {
	return &RespostaAnamneseHandler{app: app, scopeSvc: scopeSvc, errorHandler: eh}
}

// List godoc
//
//	@Summary		Listar respostas de anamnese
//	@Tags			anamnese
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/respostas-anamnese [get]
func (h *RespostaAnamneseHandler) List(c *gin.Context) {
	q, f, ok := parseWaveList(c, h.errorHandler)
	if !ok {
		return
	}
	var qid, pid *uuid.UUID
	if q.QuestionnaireID != "" {
		id, err := uuid.Parse(q.QuestionnaireID)
		if err != nil {
			h.errorHandler.HandleValidationError(c, "questionnaire_id inválido")
			return
		}
		qid = &id
	}
	if q.PatientID != "" {
		id, err := uuid.Parse(q.PatientID)
		if err != nil {
			h.errorHandler.HandleValidationError(c, "patient_id inválido")
			return
		}
		pid = &id
	}
	actor, err := loadActorFromGin(c, h.scopeSvc)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	if pid == nil && actor.PacienteID != nil {
		if scope, scopeErr := h.scopeSvc.ResolveScopeForResource(c.Request.Context(), actor, "anamneses"); scopeErr == nil && scope == entity.DataScopeSelfPatient {
			pid = actor.PacienteID
		}
	}
	if pid != nil {
		if err := h.scopeSvc.AssertScopedPacienteAccess(c.Request.Context(), actor, "anamneses", *pid); err != nil {
			h.errorHandler.Handle(c, err)
			return
		}
	}
	result, err := h.app.List(c.Request.Context(), f, qid, pid)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, result.Items, listMeta(result.Page, result.PageSize, result.Total, result.TotalPages))
}

// Create godoc
//
//	@Summary		Criar resposta de anamnese
//	@Tags			anamnese
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/respostas-anamnese [post]
func (h *RespostaAnamneseHandler) Create(c *gin.Context) {
	var req dto.RespostaAnamneseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "data_hora inválida (use RFC3339)")
		return
	}
	actor, err := loadActorFromGin(c, h.scopeSvc)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	if err := h.scopeSvc.AssertScopedPacienteAccess(c.Request.Context(), actor, "anamneses", in.PatientID); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	out, err := h.app.Create(c.Request.Context(), in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, out, nil)
}

type FinanceiroHandler struct {
	Categoria  *application.CategoriaFinanceiraApp
	CentroCusto *application.CentroCustoApp
	Lancamento *application.LancamentoApp
	errorHandler *httplayer.ErrorHandler
}

func NewFinanceiroHandler(cat *application.CategoriaFinanceiraApp, cc *application.CentroCustoApp, l *application.LancamentoApp, eh *httplayer.ErrorHandler) *FinanceiroHandler {
	return &FinanceiroHandler{Categoria: cat, CentroCusto: cc, Lancamento: l, errorHandler: eh}
}

// ListCategorias godoc
//
//	@Summary		Listar categorias
//	@Tags			financeiro
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/financeiro/categorias [get]
func (h *FinanceiroHandler) ListCategorias(c *gin.Context) {
	_, f, ok := parseWaveList(c, h.errorHandler)
	if !ok {
		return
	}
	result, err := h.Categoria.List(c.Request.Context(), f)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, result.Items, listMeta(result.Page, result.PageSize, result.Total, result.TotalPages))
}

// CreateCategoria godoc
//
//	@Summary		Criar categoria
//	@Tags			financeiro
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/financeiro/categorias [post]
func (h *FinanceiroHandler) CreateCategoria(c *gin.Context) {
	var req dto.CategoriaFinanceiraRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	id, err := h.Categoria.Create(c.Request.Context(), req.ToServiceInput())
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, dto.CreateIDData{ID: id.String()}, nil)
}

// GetCategoria godoc
//
//	@Summary		Obter categoria
//	@Tags			financeiro
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/financeiro/categorias/{id} [get]
func (h *FinanceiroHandler) GetCategoria(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	out, err := h.Categoria.GetByID(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

// UpdateCategoria godoc
//
//	@Summary		Atualizar categoria
//	@Tags			financeiro
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/financeiro/categorias/{id} [put]
func (h *FinanceiroHandler) UpdateCategoria(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.CategoriaFinanceiraRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	out, err := h.Categoria.Update(c.Request.Context(), id, req.ToServiceInput())
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

// DeleteCategoria godoc
//
//	@Summary		Excluir categoria
//	@Tags			financeiro
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/financeiro/categorias/{id} [delete]
func (h *FinanceiroHandler) DeleteCategoria(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.Categoria.Delete(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// ListCentrosCusto godoc
//
//	@Summary		Listar centros de custo
//	@Tags			financeiro
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/financeiro/centros-custo [get]
func (h *FinanceiroHandler) ListCentrosCusto(c *gin.Context) {
	_, f, ok := parseWaveList(c, h.errorHandler)
	if !ok {
		return
	}
	result, err := h.CentroCusto.List(c.Request.Context(), f)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, result.Items, listMeta(result.Page, result.PageSize, result.Total, result.TotalPages))
}

// CreateCentroCusto godoc
//
//	@Summary		Criar centro de custo
//	@Tags			financeiro
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/financeiro/centros-custo [post]
func (h *FinanceiroHandler) CreateCentroCusto(c *gin.Context) {
	var req dto.CentroCustoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	id, err := h.CentroCusto.Create(c.Request.Context(), req.ToServiceInput())
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, dto.CreateIDData{ID: id.String()}, nil)
}

// GetCentroCusto godoc
//
//	@Summary		Obter centro de custo
//	@Tags			financeiro
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/financeiro/centros-custo/{id} [get]
func (h *FinanceiroHandler) GetCentroCusto(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	out, err := h.CentroCusto.GetByID(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

// UpdateCentroCusto godoc
//
//	@Summary		Atualizar centro de custo
//	@Tags			financeiro
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/financeiro/centros-custo/{id} [put]
func (h *FinanceiroHandler) UpdateCentroCusto(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.CentroCustoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	out, err := h.CentroCusto.Update(c.Request.Context(), id, req.ToServiceInput())
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

// DeleteCentroCusto godoc
//
//	@Summary		Excluir centro de custo
//	@Tags			financeiro
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/financeiro/centros-custo/{id} [delete]
func (h *FinanceiroHandler) DeleteCentroCusto(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.CentroCusto.Delete(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// ListLancamentos godoc
//
//	@Summary		Listar lançamentos
//	@Tags			financeiro
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/financeiro/lancamentos [get]
func (h *FinanceiroHandler) ListLancamentos(c *gin.Context) {
	_, f, ok := parseWaveList(c, h.errorHandler)
	if !ok {
		return
	}
	result, err := h.Lancamento.List(c.Request.Context(), f)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, result.Items, listMeta(result.Page, result.PageSize, result.Total, result.TotalPages))
}

// CreateLancamento godoc
//
//	@Summary		Criar lançamento
//	@Tags			financeiro
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/financeiro/lancamentos [post]
func (h *FinanceiroHandler) CreateLancamento(c *gin.Context) {
	var req dto.LancamentoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "Data inválida (use YYYY-MM-DD)")
		return
	}
	id, err := h.Lancamento.Create(c.Request.Context(), in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, dto.CreateIDData{ID: id.String()}, nil)
}

// GetLancamento godoc
//
//	@Summary		Obter lançamento
//	@Tags			financeiro
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/financeiro/lancamentos/{id} [get]
func (h *FinanceiroHandler) GetLancamento(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	out, err := h.Lancamento.GetByID(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

// UpdateLancamento godoc
//
//	@Summary		Atualizar lançamento
//	@Tags			financeiro
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/financeiro/lancamentos/{id} [put]
func (h *FinanceiroHandler) UpdateLancamento(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.LancamentoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "Data inválida (use YYYY-MM-DD)")
		return
	}
	out, err := h.Lancamento.Update(c.Request.Context(), id, in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

// DeleteLancamento godoc
//
//	@Summary		Excluir lançamento
//	@Tags			financeiro
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/financeiro/lancamentos/{id} [delete]
func (h *FinanceiroHandler) DeleteLancamento(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.Lancamento.Delete(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

type RelatorioOperacionalHandler struct {
	app          *application.RelatorioOperacionalApp
	errorHandler *httplayer.ErrorHandler
}

func NewRelatorioOperacionalHandler(app *application.RelatorioOperacionalApp, eh *httplayer.ErrorHandler) *RelatorioOperacionalHandler {
	return &RelatorioOperacionalHandler{app: app, errorHandler: eh}
}

// List godoc
//
//	@Summary		Listar relatórios operacionais
//	@Tags			relatorio
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/relatorios-operacionais [get]
func (h *RelatorioOperacionalHandler) List(c *gin.Context) {
	_, f, ok := parseWaveList(c, h.errorHandler)
	if !ok {
		return
	}
	result, err := h.app.List(c.Request.Context(), f)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, result.Items, listMeta(result.Page, result.PageSize, result.Total, result.TotalPages))
}

// Create godoc
//
//	@Summary		Criar relatório operacional
//	@Tags			relatorio
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/relatorios-operacionais [post]
func (h *RelatorioOperacionalHandler) Create(c *gin.Context) {
	var req dto.RelatorioOperacionalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "Data inválida (use YYYY-MM-DD)")
		return
	}
	id, err := h.app.Create(c.Request.Context(), in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, dto.CreateIDData{ID: id.String()}, nil)
}

// Get godoc
//
//	@Summary		Obter relatório operacional
//	@Tags			relatorio
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/relatorios-operacionais/{id} [get]
func (h *RelatorioOperacionalHandler) Get(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	out, err := h.app.GetByID(c.Request.Context(), id)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

// Update godoc
//
//	@Summary		Atualizar relatório operacional
//	@Tags			relatorio
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/relatorios-operacionais/{id} [put]
func (h *RelatorioOperacionalHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	var req dto.RelatorioOperacionalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	in, err := req.ToServiceInput()
	if err != nil {
		h.errorHandler.HandleValidationError(c, "Data inválida (use YYYY-MM-DD)")
		return
	}
	out, err := h.app.Update(c.Request.Context(), id, in)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

// Delete godoc
//
//	@Summary		Excluir relatório operacional
//	@Tags			relatorio
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/relatorios-operacionais/{id} [delete]
func (h *RelatorioOperacionalHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.app.Delete(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

type AuditHandler struct {
	app          *application.AuditApp
	errorHandler *httplayer.ErrorHandler
}

func NewAuditHandler(app *application.AuditApp, eh *httplayer.ErrorHandler) *AuditHandler {
	return &AuditHandler{app: app, errorHandler: eh}
}

// List godoc
//
//	@Summary		Listar audit log
//	@Tags			audit
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/audit-log [get]
func (h *AuditHandler) List(c *gin.Context) {
	_, f, ok := parseWaveList(c, h.errorHandler)
	if !ok {
		return
	}
	if ent := c.Query("entidade"); ent != "" {
		f.Entidade = ent
	}
	if eid := c.Query("entidade_id"); eid != "" {
		f.EntidadeID = eid
	}
	result, err := h.app.List(c.Request.Context(), f)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, result.Items, listMeta(result.Page, result.PageSize, result.Total, result.TotalPages))
}
