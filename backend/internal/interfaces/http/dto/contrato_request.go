package dto

import (
	"espaco-terapia-os/backend/internal/domain/service"

	"github.com/google/uuid"
)

type ContratoRequest struct {
	Titulo           string     `json:"titulo" binding:"required"`
	Tipo             string     `json:"tipo" binding:"required"`
	PacienteID       *uuid.UUID `json:"paciente_id"`
	PacienteNome     *string    `json:"paciente_nome"`
	ProfissionalID   *uuid.UUID `json:"profissional_id"`
	ProfissionalNome *string    `json:"profissional_nome"`
	Status           string     `json:"status"`
}

func (r *ContratoRequest) ToServiceInput(criadoPor uuid.UUID) service.ContratoInput {
	return service.ContratoInput{
		Titulo: r.Titulo, Tipo: r.Tipo, PacienteID: r.PacienteID, PacienteNome: r.PacienteNome,
		ProfissionalID: r.ProfissionalID, ProfissionalNome: r.ProfissionalNome,
		Status: r.Status, CriadoPor: criadoPor,
	}
}

type CompartilharContratoRequest struct {
	ExpiracaoHoras int  `json:"expiracao_horas"`
	PodeVisualizar bool `json:"pode_visualizar"`
	PodeBaixar     bool `json:"pode_baixar"`
}

func (r *CompartilharContratoRequest) ToServiceInput() service.CompartilharContratoInput {
	return service.CompartilharContratoInput{
		ExpiracaoHoras: r.ExpiracaoHoras, PodeVisualizar: r.PodeVisualizar, PodeBaixar: r.PodeBaixar,
	}
}

type SignatarioRequest struct {
	Nome       string `json:"nome" binding:"required"`
	Email      string `json:"email" binding:"required,email"`
	Tipo       string `json:"tipo" binding:"required"`
	CPF        string `json:"cpf"`
	Parentesco string `json:"parentesco"`
	Ordem      int    `json:"ordem"`
}

type SolicitarAssinaturaRequest struct {
	Mensagem          string              `json:"mensagem"`
	ExpiraEmHoras     int                 `json:"expira_em_horas"`
	Signatarios       []SignatarioRequest `json:"signatarios" binding:"required,min=1,dive"`
}

func (r *SolicitarAssinaturaRequest) ToServiceInput() service.SolicitarAssinaturaInput {
	sgs := make([]service.SignatarioInput, 0, len(r.Signatarios))
	for _, s := range r.Signatarios {
		sgs = append(sgs, service.SignatarioInput{
			Nome: s.Nome, Email: s.Email, Tipo: s.Tipo, CPF: s.CPF,
			Parentesco: s.Parentesco, Ordem: s.Ordem,
		})
	}
	return service.SolicitarAssinaturaInput{
		Mensagem: r.Mensagem, Signatarios: sgs, ExpiraEmHoras: r.ExpiraEmHoras,
	}
}

type AceitarAssinaturaRequest struct {
	Observacoes string `json:"observacoes"`
}
