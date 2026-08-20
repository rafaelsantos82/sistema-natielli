package service

import (
	"context"
	"log/slog"
	"strings"
	"time"

	"espaco-terapia-os/backend/internal/domain/entity"
	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
)

type SalaService struct {
	repo         repository.SalaRepository
	consultaRepo repository.ConsultaRepository
	logger       *slog.Logger
}

func NewSalaService(repo repository.SalaRepository, consultaRepo repository.ConsultaRepository, logger *slog.Logger) *SalaService {
	return &SalaService{repo: repo, consultaRepo: consultaRepo, logger: logger}
}

type SalaInput struct {
	NomeSala       string
	Codigo         *string
	UnidadeID      uuid.UUID
	Capacidade     *int
	Status         entity.SalaStatus
	Especialidades []string
	Recursos       []string
}

type ReservaInput struct {
	DataHoraInicio   time.Time
	Duracao          int
	ProfissionalID   uuid.UUID
	ProfissionalNome string
	ConsultaID       *uuid.UUID
	TipoAtendimento  *string
	Observacoes      *string
	RRule            *string
}

type ListSalasResult struct {
	Items      []*SalaDTO
	Total      int64
	Page       int
	PageSize   int
	TotalPages int
}

// Create cadastra sala com especialidades e recursos.
func (s *SalaService) Create(ctx context.Context, in SalaInput) (*SalaDTO, error) {
	sala, err := s.buildSala(uuid.New(), in, true)
	if err != nil {
		return nil, err
	}
	if err := s.repo.Save(ctx, sala); err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "sala", "create", sala.ID)
	return s.enrichSalaDTO(ctx, sala)
}

// GetByID retorna sala com especialidades e recursos.
func (s *SalaService) GetByID(ctx context.Context, id uuid.UUID) (*SalaDTO, error) {
	if id == uuid.Nil {
		return nil, domainerrors.NewRequiredFieldError("id")
	}
	sala, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if sala == nil {
		return nil, domainerrors.NewNotFoundError("Sala", id.String())
	}
	return s.enrichSalaDTO(ctx, sala)
}

// Update atualiza sala.
func (s *SalaService) Update(ctx context.Context, id uuid.UUID, in SalaInput) (*SalaDTO, error) {
	if id == uuid.Nil {
		return nil, domainerrors.NewRequiredFieldError("id")
	}
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, domainerrors.NewNotFoundError("Sala", id.String())
	}
	sala, err := s.buildSala(id, in, false)
	if err != nil {
		return nil, err
	}
	sala.CreatedAt = existing.CreatedAt
	if err := s.repo.Update(ctx, sala); err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "sala", "update", sala.ID)
	return s.enrichSalaDTO(ctx, sala)
}

// Delete remove sala.
func (s *SalaService) Delete(ctx context.Context, id uuid.UUID) error {
	if id == uuid.Nil {
		return domainerrors.NewRequiredFieldError("id")
	}
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if existing == nil {
		return domainerrors.NewNotFoundError("Sala", id.String())
	}
	if s.consultaRepo != nil {
		linked, err := s.consultaRepo.ExistsBySalaID(ctx, id)
		if err != nil {
			return err
		}
		if linked {
			return domainerrors.NewBusinessRuleError(domainerrors.SalaDeleteBlockedMessage)
		}
	}
	if err := s.repo.Delete(ctx, id); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "sala", "delete", id)
	return nil
}

// List retorna salas paginadas.
func (s *SalaService) List(ctx context.Context, filter repository.SalaListFilter) (*ListSalasResult, error) {
	filter.Page, filter.PageSize = NormalizePagination(filter.Page, filter.PageSize)
	items, total, err := s.repo.List(ctx, filter)
	if err != nil {
		return nil, err
	}
	dtos := make([]*SalaDTO, 0, len(items))
	for _, sala := range items {
		dto, err := s.enrichSalaDTO(ctx, sala)
		if err != nil {
			return nil, err
		}
		dtos = append(dtos, dto)
	}
	return &ListSalasResult{
		Items:      dtos,
		Total:      total,
		Page:       filter.Page,
		PageSize:   filter.PageSize,
		TotalPages: TotalPages(total, filter.PageSize),
	}, nil
}

// ListReservas lista reservas da sala.
func (s *SalaService) ListReservas(ctx context.Context, salaID uuid.UUID) ([]*ReservaDTO, error) {
	if err := s.ensureSalaExists(ctx, salaID); err != nil {
		return nil, err
	}
	items, err := s.repo.ListReservas(ctx, salaID)
	if err != nil {
		return nil, err
	}
	dtos := make([]*ReservaDTO, 0, len(items))
	for _, r := range items {
		dtos = append(dtos, ToReservaDTO(r))
	}
	return dtos, nil
}

// CreateReserva cria reserva na sala.
func (s *SalaService) CreateReserva(ctx context.Context, salaID uuid.UUID, in ReservaInput) (*ReservaDTO, error) {
	if err := s.ensureSalaExists(ctx, salaID); err != nil {
		return nil, err
	}
	r, err := s.buildReserva(uuid.New(), salaID, in, true)
	if err != nil {
		return nil, err
	}
	if err := s.repo.SaveReserva(ctx, r); err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "reserva", "create", r.ID)
	return ToReservaDTO(r), nil
}

// UpdateReserva atualiza reserva da sala.
func (s *SalaService) UpdateReserva(ctx context.Context, salaID, reservaID uuid.UUID, in ReservaInput) (*ReservaDTO, error) {
	if err := s.ensureSalaExists(ctx, salaID); err != nil {
		return nil, err
	}
	existing, err := s.repo.FindReservaByID(ctx, salaID, reservaID)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, domainerrors.NewNotFoundError("Reserva", reservaID.String())
	}
	r, err := s.buildReserva(reservaID, salaID, in, false)
	if err != nil {
		return nil, err
	}
	r.CreatedAt = existing.CreatedAt
	if err := s.repo.UpdateReserva(ctx, r); err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "reserva", "update", r.ID)
	return ToReservaDTO(r), nil
}

// DeleteReserva remove reserva da sala.
func (s *SalaService) DeleteReserva(ctx context.Context, salaID, reservaID uuid.UUID) error {
	if err := s.ensureSalaExists(ctx, salaID); err != nil {
		return err
	}
	existing, err := s.repo.FindReservaByID(ctx, salaID, reservaID)
	if err != nil {
		return err
	}
	if existing == nil {
		return domainerrors.NewNotFoundError("Reserva", reservaID.String())
	}
	if err := s.repo.DeleteReserva(ctx, salaID, reservaID); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "reserva", "delete", reservaID)
	return nil
}

func (s *SalaService) enrichSalaDTO(ctx context.Context, sala *entity.Sala) (*SalaDTO, error) {
	especialidades, err := s.repo.GetEspecialidades(ctx, sala.ID)
	if err != nil {
		return nil, err
	}
	recursos, err := s.repo.GetRecursos(ctx, sala.ID)
	if err != nil {
		return nil, err
	}
	sala.Especialidades = especialidades
	sala.Recursos = recursos
	return ToSalaDTO(sala), nil
}

func (s *SalaService) buildSala(id uuid.UUID, in SalaInput, isNew bool) (*entity.Sala, error) {
	status := in.Status
	if status == "" {
		status = entity.SalaAtiva
	}
	now := time.Now().UTC()
	sala := &entity.Sala{
		ID:             id,
		NomeSala:       strings.TrimSpace(in.NomeSala),
		Codigo:         in.Codigo,
		UnidadeID:      in.UnidadeID,
		Capacidade:     in.Capacidade,
		Status:         status,
		Especialidades: in.Especialidades,
		Recursos:       in.Recursos,
		UpdatedAt:      now,
	}
	if isNew {
		sala.CreatedAt = now
	}
	if err := sala.Validate(); err != nil {
		return nil, err
	}
	return sala, nil
}

func (s *SalaService) buildReserva(id, salaID uuid.UUID, in ReservaInput, isNew bool) (*entity.Reserva, error) {
	now := time.Now().UTC()
	r := &entity.Reserva{
		ID:               id,
		SalaID:           salaID,
		DataHoraInicio:   in.DataHoraInicio,
		Duracao:          in.Duracao,
		ProfissionalID:   in.ProfissionalID,
		ProfissionalNome: strings.TrimSpace(in.ProfissionalNome),
		ConsultaID:       in.ConsultaID,
		TipoAtendimento:  in.TipoAtendimento,
		Observacoes:      in.Observacoes,
		RRule:            in.RRule,
	}
	if isNew {
		r.CreatedAt = now
	}
	if err := r.Validate(); err != nil {
		return nil, err
	}
	return r, nil
}

func (s *SalaService) ensureSalaExists(ctx context.Context, id uuid.UUID) error {
	sala, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if sala == nil {
		return domainerrors.NewNotFoundError("Sala", id.String())
	}
	return nil
}
