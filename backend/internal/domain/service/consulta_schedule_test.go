package service

import (
	"context"
	"log/slog"
	"testing"
	"time"

	"espaco-terapia-os/backend/internal/domain/entity"
	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
)

type profScheduleStub struct {
	p *entity.Profissional
}

func (s *profScheduleStub) Save(context.Context, *entity.Profissional) error { return nil }
func (s *profScheduleStub) FindByID(_ context.Context, id uuid.UUID) (*entity.Profissional, error) {
	if s.p != nil && s.p.ID == id {
		return s.p, nil
	}
	return nil, nil
}
func (s *profScheduleStub) FindByIDUnscoped(context.Context, uuid.UUID) (*entity.Profissional, error) {
	return nil, nil
}
func (s *profScheduleStub) Update(context.Context, *entity.Profissional) error { return nil }
func (s *profScheduleStub) MarkDeleted(context.Context, uuid.UUID) error { return nil }
func (s *profScheduleStub) Restore(context.Context, uuid.UUID) error     { return nil }
func (s *profScheduleStub) ExistsEmail(context.Context, string, *uuid.UUID) (bool, error) {
	return false, nil
}
func (s *profScheduleStub) GetUnidadeIDs(context.Context, uuid.UUID) ([]uuid.UUID, error) {
	return nil, nil
}
func (s *profScheduleStub) GetEspecialidades(context.Context, uuid.UUID) ([]string, error) {
	return nil, nil
}
func (s *profScheduleStub) ListConselhos(context.Context, uuid.UUID) ([]*entity.ProfissionalConselho, error) {
	return nil, nil
}
func (s *profScheduleStub) FindConselhoByID(context.Context, uuid.UUID, uuid.UUID) (*entity.ProfissionalConselho, error) {
	return nil, nil
}
func (s *profScheduleStub) SaveConselho(context.Context, *entity.ProfissionalConselho) error {
	return nil
}
func (s *profScheduleStub) UpdateConselho(context.Context, *entity.ProfissionalConselho) error {
	return nil
}
func (s *profScheduleStub) SoftDeleteConselho(context.Context, uuid.UUID, uuid.UUID) error {
	return nil
}
func (s *profScheduleStub) List(context.Context, repository.ProfissionalListFilter) ([]*entity.Profissional, int64, error) {
	return nil, 0, nil
}

func TestConsultaService_Create_RejectsWrongWeekday(t *testing.T) {
	profID := uuid.New()
	unidadeID := uuid.New()
	salaID := uuid.New()

	prof := &entity.Profissional{
		ID:              profID,
		Nome:            "Dr.",
		Email:           "d@t.com",
		Status:          entity.ProfissionalAtivo,
		DiasAtendimento: []string{"seg", "ter", "qua", "qui", "sex"},
		HorarioInicio:   strPtr("08:00"),
		HorarioFim:      strPtr("18:00"),
	}
	salaRepo := &salaSvcStubRepo{
		sala: &entity.Sala{ID: salaID, UnidadeID: unidadeID, Status: entity.SalaAtiva},
	}
	svc := NewConsultaServiceWithProfissional(
		&consultaSvcStubRepo{},
		salaRepo,
		&profScheduleStub{p: prof},
		nil,
		slog.Default(),
	)

	loc, _ := time.LoadLocation("America/Sao_Paulo")
	sunday := time.Date(2026, 6, 7, 10, 0, 0, 0, loc)

	_, err := svc.Create(context.Background(), ConsultaInput{
		PacienteID:     uuid.New(),
		ProfissionalID: profID,
		UnidadeID:      &unidadeID,
		SalaID:         salaID,
		DataHora:       sunday,
		Duracao:        60,
		Motivo:         "Consulta teste",
	})
	if err == nil {
		t.Fatal("expected error")
	}
	de := domainerrors.GetDomainError(err)
	if de.Code != domainerrors.ErrorCodeBusinessRule {
		t.Fatalf("expected business rule error, got %v", err)
	}
}
