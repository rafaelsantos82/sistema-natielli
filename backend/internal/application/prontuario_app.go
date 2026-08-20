package application

import (
	"context"

	"espaco-terapia-os/backend/internal/domain/service"

	"github.com/google/uuid"
)

type ProntuarioApp struct {
	svc *service.ProntuarioService
}

func NewProntuarioApp(svc *service.ProntuarioService) *ProntuarioApp {
	return &ProntuarioApp{svc: svc}
}

func (a *ProntuarioApp) GetByPaciente(ctx context.Context, pacienteID uuid.UUID) (*service.ProntuarioPacienteDTO, error) {
	return a.svc.GetByPaciente(ctx, pacienteID)
}

func (a *ProntuarioApp) CreateEvolucao(ctx context.Context, in service.EvolucaoInput) (*service.EvolucaoDTO, error) {
	return a.svc.CreateEvolucao(ctx, in)
}

func (a *ProntuarioApp) DeleteEvolucao(ctx context.Context, id uuid.UUID) error {
	return a.svc.DeleteEvolucao(ctx, id)
}

func (a *ProntuarioApp) CreatePrescricao(ctx context.Context, in service.PrescricaoInput) (*service.PrescricaoDTO, error) {
	return a.svc.CreatePrescricao(ctx, in)
}

func (a *ProntuarioApp) DeletePrescricao(ctx context.Context, id uuid.UUID) error {
	return a.svc.DeletePrescricao(ctx, id)
}

func (a *ProntuarioApp) CreateAtestado(ctx context.Context, in service.AtestadoInput) (*service.AtestadoDTO, error) {
	return a.svc.CreateAtestado(ctx, in)
}

func (a *ProntuarioApp) DeleteAtestado(ctx context.Context, id uuid.UUID) error {
	return a.svc.DeleteAtestado(ctx, id)
}

func (a *ProntuarioApp) CreateDocumento(ctx context.Context, in service.ProntuarioDocumentoInput) (*service.ProntuarioDocumentoDTO, error) {
	return a.svc.CreateDocumento(ctx, in)
}

func (a *ProntuarioApp) DeleteDocumento(ctx context.Context, id uuid.UUID) error {
	return a.svc.DeleteDocumento(ctx, id)
}
