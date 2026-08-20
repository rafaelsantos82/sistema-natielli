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

type consultaSvcStubRepo struct {
	saved *entity.Consulta
}

func (c *consultaSvcStubRepo) Save(_ context.Context, consulta *entity.Consulta) error {
	c.saved = consulta
	return nil
}
func (c *consultaSvcStubRepo) FindByID(_ context.Context, id uuid.UUID) (*entity.Consulta, error) {
	if c.saved != nil && c.saved.ID == id {
		return c.saved, nil
	}
	return nil, nil
}
func (c *consultaSvcStubRepo) Update(_ context.Context, consulta *entity.Consulta) error {
	c.saved = consulta
	return nil
}
func (c *consultaSvcStubRepo) Delete(context.Context, uuid.UUID) error { return nil }
func (c *consultaSvcStubRepo) List(context.Context, repository.ConsultaListFilter) ([]repository.ConsultaListItem, int64, error) {
	return nil, 0, nil
}
func (c *consultaSvcStubRepo) FindByIDWithNames(_ context.Context, id uuid.UUID) (*repository.ConsultaListItem, error) {
	if c.saved != nil && c.saved.ID == id {
		return &repository.ConsultaListItem{
			Consulta:         c.saved,
			PacienteNome:     "Paciente",
			ProfissionalNome: "Dr. Teste",
			SalaNome:         "Sala 1",
		}, nil
	}
	return nil, nil
}
func (c *consultaSvcStubRepo) PatchAtendimento(context.Context, uuid.UUID, map[string]interface{}) error {
	return nil
}
func (c *consultaSvcStubRepo) ExistsBySalaID(context.Context, uuid.UUID) (bool, error) {
	return false, nil
}

type salaSvcStubRepo struct {
	sala     *entity.Sala
	reserva  *entity.Reserva
	reservas []*entity.Reserva
}

func (s *salaSvcStubRepo) Save(context.Context, *entity.Sala) error { return nil }
func (s *salaSvcStubRepo) FindByID(_ context.Context, id uuid.UUID) (*entity.Sala, error) {
	if s.sala != nil && s.sala.ID == id {
		return s.sala, nil
	}
	return nil, nil
}
func (s *salaSvcStubRepo) Update(context.Context, *entity.Sala) error { return nil }
func (s *salaSvcStubRepo) Delete(context.Context, uuid.UUID) error  { return nil }
func (s *salaSvcStubRepo) List(context.Context, repository.SalaListFilter) ([]*entity.Sala, int64, error) {
	return nil, 0, nil
}
func (s *salaSvcStubRepo) GetEspecialidades(context.Context, uuid.UUID) ([]string, error) {
	return nil, nil
}
func (s *salaSvcStubRepo) GetRecursos(context.Context, uuid.UUID) ([]string, error) { return nil, nil }
func (s *salaSvcStubRepo) ListReservas(context.Context, uuid.UUID) ([]*entity.Reserva, error) {
	return s.reservas, nil
}
func (s *salaSvcStubRepo) FindReservaByConsultaID(_ context.Context, consultaID uuid.UUID) (*entity.Reserva, error) {
	if s.reserva != nil && s.reserva.ConsultaID != nil && *s.reserva.ConsultaID == consultaID {
		return s.reserva, nil
	}
	return nil, nil
}
func (s *salaSvcStubRepo) FindReservaByID(context.Context, uuid.UUID, uuid.UUID) (*entity.Reserva, error) {
	return nil, nil
}
func (s *salaSvcStubRepo) SaveReserva(_ context.Context, r *entity.Reserva) error {
	s.reserva = r
	s.reservas = append(s.reservas, r)
	return nil
}
func (s *salaSvcStubRepo) UpdateReserva(_ context.Context, r *entity.Reserva) error {
	s.reserva = r
	return nil
}
func (s *salaSvcStubRepo) DeleteReserva(context.Context, uuid.UUID, uuid.UUID) error {
	s.reserva = nil
	return nil
}

func TestConsultaService_Create_RequiresSala(t *testing.T) {
	unidadeID := uuid.New()
	salaID := uuid.New()
	salaRepo := &salaSvcStubRepo{
		sala: &entity.Sala{
			ID:        salaID,
			NomeSala:  "Sala 1",
			UnidadeID: unidadeID,
			Status:    entity.SalaAtiva,
		},
	}
	svc := NewConsultaService(&consultaSvcStubRepo{}, salaRepo, nil, slog.Default())

	_, err := svc.Create(context.Background(), ConsultaInput{
		PacienteID:     uuid.New(),
		ProfissionalID: uuid.New(),
		UnidadeID:      &unidadeID,
		SalaID:         uuid.Nil,
		DataHora:       time.Now().UTC().Add(24 * time.Hour),
		Duracao:        60,
		Motivo:         "Avaliação inicial",
	})
	if err == nil {
		t.Fatal("expected error for missing sala_id")
	}
	if de := domainerrors.GetDomainError(err); de.Code != domainerrors.ErrorCodeRequiredField {
		t.Fatalf("expected REQUIRED_FIELD, got %s", de.Code)
	}
}

func TestConsultaService_Create_RejectsSalaFromOtherUnidade(t *testing.T) {
	unidadeConsulta := uuid.New()
	outraUnidade := uuid.New()
	salaID := uuid.New()
	salaRepo := &salaSvcStubRepo{
		sala: &entity.Sala{
			ID:        salaID,
			NomeSala:  "Sala 1",
			UnidadeID: outraUnidade,
			Status:    entity.SalaAtiva,
		},
	}
	svc := NewConsultaService(&consultaSvcStubRepo{}, salaRepo, nil, slog.Default())

	_, err := svc.Create(context.Background(), ConsultaInput{
		PacienteID:     uuid.New(),
		ProfissionalID: uuid.New(),
		UnidadeID:      &unidadeConsulta,
		SalaID:         salaID,
		DataHora:       time.Now().UTC().Add(24 * time.Hour),
		Duracao:        60,
		Motivo:         "Avaliação inicial",
	})
	if err == nil {
		t.Fatal("expected invalid sala error")
	}
	if de := domainerrors.GetDomainError(err); de.Code != domainerrors.ErrorCodeInvalidSala {
		t.Fatalf("expected INVALID_SALA, got %s", de.Code)
	}
}

func TestConsultaService_Create_SyncsReserva(t *testing.T) {
	unidadeID := uuid.New()
	salaID := uuid.New()
	consultaRepo := &consultaSvcStubRepo{}
	salaRepo := &salaSvcStubRepo{
		sala: &entity.Sala{
			ID:        salaID,
			NomeSala:  "Sala 1",
			UnidadeID: unidadeID,
			Status:    entity.SalaAtiva,
		},
	}
	svc := NewConsultaService(consultaRepo, salaRepo, nil, slog.Default())

	dto, err := svc.Create(context.Background(), ConsultaInput{
		PacienteID:     uuid.New(),
		ProfissionalID: uuid.New(),
		UnidadeID:      &unidadeID,
		SalaID:         salaID,
		DataHora:       time.Now().UTC().Add(24 * time.Hour),
		Duracao:        60,
		Motivo:         "Avaliação inicial",
	})
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	if dto.SalaID == nil || *dto.SalaID != salaID {
		t.Fatalf("expected sala_id %s, got %v", salaID, dto.SalaID)
	}
	if salaRepo.reserva == nil {
		t.Fatal("expected reserva to be created")
	}
	if salaRepo.reserva.SalaID != salaID {
		t.Fatalf("reserva sala_id mismatch: %s", salaRepo.reserva.SalaID)
	}
	if salaRepo.reserva.ConsultaID == nil || *salaRepo.reserva.ConsultaID != consultaRepo.saved.ID {
		t.Fatal("reserva should link consulta_id")
	}
}
