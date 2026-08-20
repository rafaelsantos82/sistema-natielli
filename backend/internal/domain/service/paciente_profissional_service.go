package service

import (
	"context"
	"log/slog"

	"espaco-terapia-os/backend/internal/domain/entity"
	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
)

type PacienteProfissionalService struct {
	repo   repository.PacienteProfissionalRepository
	logger *slog.Logger
}

func NewPacienteProfissionalService(repo repository.PacienteProfissionalRepository, logger *slog.Logger) *PacienteProfissionalService {
	return &PacienteProfissionalService{repo: repo, logger: logger}
}

func (s *PacienteProfissionalService) LinkFromConsulta(ctx context.Context, c *entity.Consulta, origem string) error {
	if c == nil || c.Status == entity.ConsultaCancelada {
		return nil
	}
	if c.PacienteID == uuid.Nil || c.ProfissionalID == uuid.Nil {
		return nil
	}
	consultaID := c.ID
	return s.repo.Upsert(ctx, repository.PacienteProfissionalLink{
		PacienteID:         c.PacienteID,
		ProfissionalID:     c.ProfissionalID,
		Origem:             origem,
		PrimeiraConsultaID: &consultaID,
	})
}

func (s *PacienteProfissionalService) LinkAgendada(ctx context.Context, c *entity.Consulta) error {
	return s.LinkFromConsulta(ctx, c, repository.PacienteProfissionalOrigemConsultaAgendada)
}

func (s *PacienteProfissionalService) LinkRealizada(ctx context.Context, c *entity.Consulta) error {
	return s.LinkFromConsulta(ctx, c, repository.PacienteProfissionalOrigemConsultaRealizada)
}
