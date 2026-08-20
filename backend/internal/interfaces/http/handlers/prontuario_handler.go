package handlers

import (
	"log/slog"
	"net/http"

	"espaco-terapia-os/backend/internal/application"
	"espaco-terapia-os/backend/internal/domain/service"
	httplayer "espaco-terapia-os/backend/internal/interfaces/http"
	"espaco-terapia-os/backend/internal/interfaces/http/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ProntuarioHandler struct {
	app          *application.ProntuarioApp
	scopeSvc     *service.DataScopeService
	errorHandler *httplayer.ErrorHandler
	logger       *slog.Logger
}

func NewProntuarioHandler(app *application.ProntuarioApp, scopeSvc *service.DataScopeService, eh *httplayer.ErrorHandler, logger *slog.Logger) *ProntuarioHandler {
	return &ProntuarioHandler{app: app, scopeSvc: scopeSvc, errorHandler: eh, logger: logger}
}

func (h *ProntuarioHandler) assertProntuarioPaciente(c *gin.Context, pacienteID uuid.UUID) bool {
	actor, err := loadActorFromGin(c, h.scopeSvc)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return false
	}
	if err := h.scopeSvc.AssertScopedPacienteAccess(c.Request.Context(), actor, "prontuario", pacienteID); err != nil {
		h.errorHandler.Handle(c, err)
		return false
	}
	return true
}

// GetPacienteProntuario godoc
//
//	@Summary		Prontuário do paciente
//	@Tags			prontuario
//	@Produce		json
//	@Security		BearerAuth
//	@Param			pacienteId	path	string	true	"ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/prontuario/pacientes/{pacienteId} [get]
func (h *ProntuarioHandler) GetPacienteProntuario(c *gin.Context) {
	pacienteID, err := uuid.Parse(c.Param("pacienteId"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "paciente_id inválido")
		return
	}
	if !h.assertProntuarioPaciente(c, pacienteID) {
		return
	}
	out, err := h.app.GetByPaciente(c.Request.Context(), pacienteID)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, out, nil)
}

type evolucaoRequest struct {
	ConsultaID          uuid.UUID `json:"consulta_id" binding:"required"`
	PacienteID          uuid.UUID `json:"paciente_id" binding:"required"`
	QueixaPrincipal     string    `json:"queixa_principal" binding:"required"`
	HistoriaDoenca      string    `json:"historia_doenca" binding:"required"`
	ExameFisico         string    `json:"exame_fisico" binding:"required"`
	HipoteseDiagnostica string    `json:"hipotese_diagnostica" binding:"required"`
	Conduta             string    `json:"conduta" binding:"required"`
	Observacoes         *string   `json:"observacoes"`
}

// CreateEvolucao godoc
//
//	@Summary		Criar evolução
//	@Tags			prontuario
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/prontuario/evolucoes [post]
func (h *ProntuarioHandler) CreateEvolucao(c *gin.Context) {
	var req evolucaoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	if !h.assertProntuarioPaciente(c, req.PacienteID) {
		return
	}
	out, err := h.app.CreateEvolucao(c.Request.Context(), service.EvolucaoInput{
		ConsultaID: req.ConsultaID, PacienteID: req.PacienteID,
		QueixaPrincipal: req.QueixaPrincipal, HistoriaDoenca: req.HistoriaDoenca,
		ExameFisico: req.ExameFisico, HipoteseDiagnostica: req.HipoteseDiagnostica,
		Conduta: req.Conduta, Observacoes: req.Observacoes,
	})
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, out, nil)
}

// DeleteEvolucao godoc
//
//	@Summary		Excluir evolução
//	@Tags			prontuario
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/prontuario/evolucoes/{id} [delete]
func (h *ProntuarioHandler) DeleteEvolucao(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.app.DeleteEvolucao(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

type prescricaoRequest struct {
	ConsultaID  uuid.UUID `json:"consulta_id" binding:"required"`
	PacienteID  uuid.UUID `json:"paciente_id" binding:"required"`
	Medicamento string    `json:"medicamento" binding:"required"`
	Dosagem     string    `json:"dosagem" binding:"required"`
	Frequencia  string    `json:"frequencia" binding:"required"`
	Duracao     string    `json:"duracao" binding:"required"`
	Orientacoes *string   `json:"orientacoes"`
}

// CreatePrescricao godoc
//
//	@Summary		Criar prescrição
//	@Tags			prontuario
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/prontuario/prescricoes [post]
func (h *ProntuarioHandler) CreatePrescricao(c *gin.Context) {
	var req prescricaoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	if !h.assertProntuarioPaciente(c, req.PacienteID) {
		return
	}
	out, err := h.app.CreatePrescricao(c.Request.Context(), service.PrescricaoInput{
		ConsultaID: req.ConsultaID, PacienteID: req.PacienteID,
		Medicamento: req.Medicamento, Dosagem: req.Dosagem,
		Frequencia: req.Frequencia, Duracao: req.Duracao, Orientacoes: req.Orientacoes,
	})
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, out, nil)
}

// DeletePrescricao godoc
//
//	@Summary		Excluir prescrição
//	@Tags			prontuario
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/prontuario/prescricoes/{id} [delete]
func (h *ProntuarioHandler) DeletePrescricao(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.app.DeletePrescricao(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

type atestadoRequest struct {
	ConsultaID      uuid.UUID `json:"consulta_id" binding:"required"`
	PacienteID      uuid.UUID `json:"paciente_id" binding:"required"`
	CID             string    `json:"cid" binding:"required"`
	DiasAfastamento int       `json:"dias_afastamento" binding:"required"`
	DataInicio      string    `json:"data_inicio" binding:"required"`
	DataFim         string    `json:"data_fim" binding:"required"`
	Observacoes     *string   `json:"observacoes"`
}

// CreateAtestado godoc
//
//	@Summary		Criar atestado
//	@Tags			prontuario
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/prontuario/atestados [post]
func (h *ProntuarioHandler) CreateAtestado(c *gin.Context) {
	var req atestadoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	if !h.assertProntuarioPaciente(c, req.PacienteID) {
		return
	}
	out, err := h.app.CreateAtestado(c.Request.Context(), service.AtestadoInput{
		ConsultaID: req.ConsultaID, PacienteID: req.PacienteID, CID: req.CID,
		DiasAfastamento: req.DiasAfastamento, DataInicio: req.DataInicio,
		DataFim: req.DataFim, Observacoes: req.Observacoes,
	})
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, out, nil)
}

// DeleteAtestado godoc
//
//	@Summary		Excluir atestado
//	@Tags			prontuario
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/prontuario/atestados/{id} [delete]
func (h *ProntuarioHandler) DeleteAtestado(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.app.DeleteAtestado(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

type documentoRequest struct {
	ConsultaID uuid.UUID `json:"consulta_id" binding:"required"`
	PacienteID uuid.UUID `json:"paciente_id" binding:"required"`
	Nome       string    `json:"nome" binding:"required"`
	Tipo       string    `json:"tipo" binding:"required"`
	Tamanho    int64     `json:"tamanho" binding:"required"`
	URL        string    `json:"url" binding:"required"`
}

// CreateDocumento godoc
//
//	@Summary		Criar documento
//	@Tags			prontuario
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		201	{object}	map[string]interface{}
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/prontuario/documentos [post]
func (h *ProntuarioHandler) CreateDocumento(c *gin.Context) {
	var req documentoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Corpo da requisição inválido")
		return
	}
	if !h.assertProntuarioPaciente(c, req.PacienteID) {
		return
	}
	out, err := h.app.CreateDocumento(c.Request.Context(), service.ProntuarioDocumentoInput{
		ConsultaID: req.ConsultaID, PacienteID: req.PacienteID,
		Nome: req.Nome, Tipo: req.Tipo, Tamanho: req.Tamanho, URL: req.URL,
	})
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusCreated, out, nil)
}

// DeleteDocumento godoc
//
//	@Summary		Excluir documento
//	@Tags			prontuario
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"ID"
//	@Success		204
//	@Failure		400	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Router			/prontuario/documentos/{id} [delete]
func (h *ProntuarioHandler) DeleteDocumento(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.errorHandler.HandleValidationError(c, "ID inválido")
		return
	}
	if err := h.app.DeleteDocumento(c.Request.Context(), id); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}
