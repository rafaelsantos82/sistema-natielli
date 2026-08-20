package service

import (
	"context"
	"log/slog"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"

	"github.com/google/uuid"
)

type ProntuarioRepository interface {
	GetPacienteProntuario(ctx context.Context, pacienteID uuid.UUID) (*ProntuarioPacienteDTO, error)
	CreateEvolucao(ctx context.Context, in EvolucaoInput) (*EvolucaoDTO, error)
	DeleteEvolucao(ctx context.Context, id uuid.UUID) error
	CreatePrescricao(ctx context.Context, in PrescricaoInput) (*PrescricaoDTO, error)
	DeletePrescricao(ctx context.Context, id uuid.UUID) error
	CreateAtestado(ctx context.Context, in AtestadoInput) (*AtestadoDTO, error)
	DeleteAtestado(ctx context.Context, id uuid.UUID) error
	CreateDocumento(ctx context.Context, in ProntuarioDocumentoInput) (*ProntuarioDocumentoDTO, error)
	DeleteDocumento(ctx context.Context, id uuid.UUID) error
}

type ProntuarioService struct {
	repo   ProntuarioRepository
	logger *slog.Logger
}

func NewProntuarioService(repo ProntuarioRepository, logger *slog.Logger) *ProntuarioService {
	return &ProntuarioService{repo: repo, logger: logger}
}

func (s *ProntuarioService) GetByPaciente(ctx context.Context, pacienteID uuid.UUID) (*ProntuarioPacienteDTO, error) {
	if pacienteID == uuid.Nil {
		return nil, domainerrors.NewRequiredFieldError("paciente_id")
	}
	return s.repo.GetPacienteProntuario(ctx, pacienteID)
}

func (s *ProntuarioService) CreateEvolucao(ctx context.Context, in EvolucaoInput) (*EvolucaoDTO, error) {
	dto, err := s.repo.CreateEvolucao(ctx, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "evolucao", "create", dto.ID)
	return dto, nil
}

func (s *ProntuarioService) DeleteEvolucao(ctx context.Context, id uuid.UUID) error {
	if err := s.repo.DeleteEvolucao(ctx, id); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "evolucao", "delete", id)
	return nil
}

func (s *ProntuarioService) CreatePrescricao(ctx context.Context, in PrescricaoInput) (*PrescricaoDTO, error) {
	dto, err := s.repo.CreatePrescricao(ctx, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "prescricao", "create", dto.ID)
	return dto, nil
}

func (s *ProntuarioService) DeletePrescricao(ctx context.Context, id uuid.UUID) error {
	if err := s.repo.DeletePrescricao(ctx, id); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "prescricao", "delete", id)
	return nil
}

func (s *ProntuarioService) CreateAtestado(ctx context.Context, in AtestadoInput) (*AtestadoDTO, error) {
	dto, err := s.repo.CreateAtestado(ctx, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "atestado", "create", dto.ID)
	return dto, nil
}

func (s *ProntuarioService) DeleteAtestado(ctx context.Context, id uuid.UUID) error {
	if err := s.repo.DeleteAtestado(ctx, id); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "atestado", "delete", id)
	return nil
}

func (s *ProntuarioService) CreateDocumento(ctx context.Context, in ProntuarioDocumentoInput) (*ProntuarioDocumentoDTO, error) {
	dto, err := s.repo.CreateDocumento(ctx, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "prontuario_documento", "create", dto.ID)
	return dto, nil
}

func (s *ProntuarioService) DeleteDocumento(ctx context.Context, id uuid.UUID) error {
	if err := s.repo.DeleteDocumento(ctx, id); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "prontuario_documento", "delete", id)
	return nil
}
