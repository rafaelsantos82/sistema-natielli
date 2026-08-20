package service

import (
	"context"
	"log/slog"
	"testing"

	"espaco-terapia-os/backend/internal/domain/entity"
	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
)

type salaDeleteStubRepo struct {
	salas   map[uuid.UUID]*entity.Sala
	deleted []uuid.UUID
}

func (s *salaDeleteStubRepo) Save(_ context.Context, sala *entity.Sala) error {
	s.salas[sala.ID] = sala
	return nil
}
func (s *salaDeleteStubRepo) FindByID(_ context.Context, id uuid.UUID) (*entity.Sala, error) {
	return s.salas[id], nil
}
func (s *salaDeleteStubRepo) Update(_ context.Context, sala *entity.Sala) error {
	s.salas[sala.ID] = sala
	return nil
}
func (s *salaDeleteStubRepo) Delete(_ context.Context, id uuid.UUID) error {
	delete(s.salas, id)
	s.deleted = append(s.deleted, id)
	return nil
}
func (s *salaDeleteStubRepo) List(context.Context, repository.SalaListFilter) ([]*entity.Sala, int64, error) {
	return nil, 0, nil
}
func (s *salaDeleteStubRepo) GetEspecialidades(context.Context, uuid.UUID) ([]string, error) {
	return nil, nil
}
func (s *salaDeleteStubRepo) GetRecursos(context.Context, uuid.UUID) ([]string, error) {
	return nil, nil
}
func (s *salaDeleteStubRepo) ListReservas(context.Context, uuid.UUID) ([]*entity.Reserva, error) {
	return nil, nil
}
func (s *salaDeleteStubRepo) FindReservaByConsultaID(context.Context, uuid.UUID) (*entity.Reserva, error) {
	return nil, nil
}
func (s *salaDeleteStubRepo) FindReservaByID(context.Context, uuid.UUID, uuid.UUID) (*entity.Reserva, error) {
	return nil, nil
}
func (s *salaDeleteStubRepo) SaveReserva(context.Context, *entity.Reserva) error { return nil }
func (s *salaDeleteStubRepo) UpdateReserva(context.Context, *entity.Reserva) error { return nil }
func (s *salaDeleteStubRepo) DeleteReserva(context.Context, uuid.UUID, uuid.UUID) error {
	return nil
}

type consultaExistsStub struct {
	bySala map[uuid.UUID]bool
}

func (c *consultaExistsStub) Save(context.Context, *entity.Consulta) error { return nil }
func (c *consultaExistsStub) FindByID(context.Context, uuid.UUID) (*entity.Consulta, error) {
	return nil, nil
}
func (c *consultaExistsStub) Update(context.Context, *entity.Consulta) error { return nil }
func (c *consultaExistsStub) Delete(context.Context, uuid.UUID) error { return nil }
func (c *consultaExistsStub) List(context.Context, repository.ConsultaListFilter) ([]repository.ConsultaListItem, int64, error) {
	return nil, 0, nil
}
func (c *consultaExistsStub) FindByIDWithNames(context.Context, uuid.UUID) (*repository.ConsultaListItem, error) {
	return nil, nil
}
func (c *consultaExistsStub) PatchAtendimento(context.Context, uuid.UUID, map[string]interface{}) error {
	return nil
}
func (c *consultaExistsStub) ExistsBySalaID(_ context.Context, salaID uuid.UUID) (bool, error) {
	return c.bySala[salaID], nil
}

func TestSalaService_Delete_BlockedWhenConsultasLinked(t *testing.T) {
	salaID := uuid.New()
	salaRepo := &salaDeleteStubRepo{salas: map[uuid.UUID]*entity.Sala{
		salaID: {ID: salaID, NomeSala: "Sala 1", UnidadeID: uuid.New(), Status: entity.SalaAtiva},
	}}
	consultaRepo := &consultaExistsStub{bySala: map[uuid.UUID]bool{salaID: true}}
	svc := NewSalaService(salaRepo, consultaRepo, slog.Default())

	err := svc.Delete(context.Background(), salaID)
	if err == nil {
		t.Fatal("expected business rule error")
	}
	if de := domainerrors.GetDomainError(err); de.Code != domainerrors.ErrorCodeBusinessRule {
		t.Fatalf("expected BUSINESS_RULE_VIOLATION, got %s", de.Code)
	}
	if len(salaRepo.deleted) != 0 {
		t.Fatal("sala should not be deleted when consultas are linked")
	}
}

func TestSalaService_Delete_BlockedMessage(t *testing.T) {
	salaID := uuid.New()
	salaRepo := &salaDeleteStubRepo{salas: map[uuid.UUID]*entity.Sala{
		salaID: {ID: salaID, NomeSala: "Sala 1", UnidadeID: uuid.New(), Status: entity.SalaAtiva},
	}}
	consultaRepo := &consultaExistsStub{bySala: map[uuid.UUID]bool{salaID: true}}
	svc := NewSalaService(salaRepo, consultaRepo, slog.Default())

	err := svc.Delete(context.Background(), salaID)
	de := domainerrors.GetDomainError(err)
	if de.Message != domainerrors.SalaDeleteBlockedMessage {
		t.Fatalf("message = %q", de.Message)
	}
}

func TestSalaService_Delete_SucceedsWithoutConsultas(t *testing.T) {
	salaID := uuid.New()
	salaRepo := &salaDeleteStubRepo{salas: map[uuid.UUID]*entity.Sala{
		salaID: {ID: salaID, NomeSala: "Sala 1", UnidadeID: uuid.New(), Status: entity.SalaAtiva},
	}}
	consultaRepo := &consultaExistsStub{bySala: map[uuid.UUID]bool{}}
	svc := NewSalaService(salaRepo, consultaRepo, slog.Default())

	if err := svc.Delete(context.Background(), salaID); err != nil {
		t.Fatalf("Delete: %v", err)
	}
	if len(salaRepo.deleted) != 1 || salaRepo.deleted[0] != salaID {
		t.Fatalf("expected sala deleted, got %v", salaRepo.deleted)
	}
}
