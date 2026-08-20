package service

import (
	"context"
	"time"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/entity"
	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
)

func loadLocationBr() *time.Location {
	loc, err := time.LoadLocation("America/Sao_Paulo")
	if err != nil {
		return time.UTC
	}
	return loc
}

func (s *ConsultaService) validateProfissionalAgenda(
	ctx context.Context,
	profID uuid.UUID,
	dataHora time.Time,
	duracao int,
	excludeConsultaID uuid.UUID,
) error {
	if s.profRepo == nil {
		return nil
	}
	p, err := s.profRepo.FindByID(ctx, profID)
	if err != nil {
		return err
	}
	if p == nil {
		return domainerrors.NewNotFoundError("Profissional", profID.String())
	}

	loc := loadLocationBr()
	startLoc := dataHora.In(loc)
	endLoc := startLoc.Add(time.Duration(duracao) * time.Minute)

	if len(p.DiasAtendimento) == 0 {
		return domainerrors.NewBusinessRuleError("Profissional sem dias de atendimento cadastrados")
	}
	if !profissionalAtendeNoDia(p, startLoc) {
		return domainerrors.NewBusinessRuleError("Profissional não atende neste dia da semana")
	}
	if !profissionalDentroDoExpediente(p, startLoc, endLoc) {
		return domainerrors.NewBusinessRuleError("Horário fora do expediente do profissional")
	}

	if err := s.validateConsultaOverlap(ctx, profID, dataHora, duracao, excludeConsultaID); err != nil {
		return err
	}
	return nil
}

func (s *ConsultaService) validateConsultaOverlap(
	ctx context.Context,
	profID uuid.UUID,
	dataHora time.Time,
	duracao int,
	excludeConsultaID uuid.UUID,
) error {
	if s.repo == nil {
		return nil
	}
	loc := loadLocationBr()
	start := dataHora.In(loc)
	end := start.Add(time.Duration(duracao) * time.Minute)
	dayStart := time.Date(start.Year(), start.Month(), start.Day(), 0, 0, 0, 0, loc)
	dayEnd := dayStart.Add(24 * time.Hour)

	filter := repository.ConsultaListFilter{
		ProfissionalID: &profID,
		DataInicio:     &dayStart,
		DataFim:        &dayEnd,
		Page:           1,
		PageSize:       200,
	}
	items, _, err := s.repo.List(ctx, filter)
	if err != nil {
		return err
	}
	for _, item := range items {
		c := item.Consulta
		if c == nil || c.ID == excludeConsultaID {
			continue
		}
		if c.Status == entity.ConsultaCancelada {
			continue
		}
		otherStart := c.DataHora.In(loc)
		otherEnd := otherStart.Add(time.Duration(c.Duracao) * time.Minute)
		if horariosSobrepostosConsulta(start, end, otherStart, otherEnd) {
			return domainerrors.NewBusinessRuleError("Já existe consulta agendada para este profissional no horário informado")
		}
	}
	return nil
}
