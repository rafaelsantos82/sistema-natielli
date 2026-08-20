package service

import (
	"context"
	"testing"
	"time"

	"espaco-terapia-os/backend/internal/domain/entity"
	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
)

type mockPacienteRepo struct {
	saved         *entity.Paciente
	existsCPF     bool
	findByID      *entity.Paciente
	findUnscoped  *entity.Paciente
	listItems     []*entity.Paciente
	listTotal     int64
	markDeletedID *uuid.UUID
	restoredID    *uuid.UUID
}

func (m *mockPacienteRepo) Save(ctx context.Context, p *entity.Paciente) error {
	m.saved = p
	return nil
}
func (m *mockPacienteRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.Paciente, error) {
	if m.findByID != nil {
		return m.findByID, nil
	}
	return nil, nil
}
func (m *mockPacienteRepo) FindByIDUnscoped(ctx context.Context, id uuid.UUID) (*entity.Paciente, error) {
	if m.findUnscoped != nil {
		return m.findUnscoped, nil
	}
	return m.findByID, nil
}
func (m *mockPacienteRepo) Update(ctx context.Context, p *entity.Paciente) error {
	m.saved = p
	return nil
}
func (m *mockPacienteRepo) MarkDeleted(ctx context.Context, id uuid.UUID) error {
	m.markDeletedID = &id
	return nil
}
func (m *mockPacienteRepo) Restore(ctx context.Context, id uuid.UUID) error {
	m.restoredID = &id
	if m.findUnscoped != nil {
		m.findUnscoped.DeletedAt = nil
		m.findUnscoped.Status = entity.PacienteAtivo
		m.findByID = m.findUnscoped
	}
	return nil
}
func (m *mockPacienteRepo) ExistsCPF(ctx context.Context, cpf string, excludeID *uuid.UUID) (bool, error) {
	return m.existsCPF, nil
}
func (m *mockPacienteRepo) List(ctx context.Context, filter repository.PacienteListFilter) ([]*entity.Paciente, int64, error) {
	items := m.listItems
	if !filter.IncludeDeleted {
		filtered := make([]*entity.Paciente, 0, len(items))
		for _, p := range items {
			if p != nil && p.DeletedAt == nil {
				filtered = append(filtered, p)
			}
		}
		items = filtered
	}
	total := m.listTotal
	if total == 0 {
		total = int64(len(items))
	}
	return items, total, nil
}
func (m *mockPacienteRepo) SetUnidades(ctx context.Context, pacienteID uuid.UUID, unidades []entity.PacienteUnidadeLink) error {
	return nil
}
func (m *mockPacienteRepo) GetUnidades(ctx context.Context, pacienteID uuid.UUID) ([]entity.PacienteUnidadeLink, error) {
	if m.saved != nil {
		return m.saved.Unidades, nil
	}
	return nil, nil
}

func sampleInput(unidadeID uuid.UUID) PacienteInput {
	cpf := "52998224725"
	return PacienteInput{
		NomeCompleto:      "Ana Teste",
		DataNascimento:    time.Now().AddDate(-8, 0, 0),
		SexoBiologico:     entity.SexoFeminino,
		CPF:               &cpf,
		TelPrincipal:      "21988887777",
		UF:                "RJ",
		CEP:               "20000000",
		ResponsavelNome:   "Pai Teste",
		ConsentimentoLGPD: true,
		Status:            entity.PacienteAtivo,
		UnidadeLinks: []UnidadeLinkInput{
			{UnidadeID: unidadeID, Principal: true},
		},
	}
}

func TestPacienteService_CreateComUnidades(t *testing.T) {
	repo := &mockPacienteRepo{}
	svc := NewPacienteService(repo, nil)
	uid := uuid.New()
	dto, err := svc.Create(context.Background(), sampleInput(uid))
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if dto.NomeCompleto != "Ana Teste" {
		t.Fatalf("unexpected name %s", dto.NomeCompleto)
	}
	if len(repo.saved.Unidades) != 1 || !repo.saved.Unidades[0].Principal {
		t.Fatal("expected one principal unidade")
	}
}

func TestPacienteService_CreateCPFDuplicado(t *testing.T) {
	repo := &mockPacienteRepo{existsCPF: true}
	svc := NewPacienteService(repo, nil)
	_, err := svc.Create(context.Background(), sampleInput(uuid.New()))
	if err == nil {
		t.Fatal("expected conflict")
	}
	de := domainerrors.GetDomainError(err)
	if de.Code != domainerrors.ErrorCodeConflict {
		t.Fatalf("got code %s", de.Code)
	}
}

func TestPacienteService_DeleteMarksInactive(t *testing.T) {
	id := uuid.New()
	p := &entity.Paciente{
		ID: id, NomeCompleto: "Ana", Status: entity.PacienteAtivo,
		TelPrincipal: "21999999999", UF: "RJ", CEP: "20000000",
		ResponsavelNome: "Pai", ConsentimentoLGPD: true,
	}
	repo := &mockPacienteRepo{findByID: p}
	svc := NewPacienteService(repo, nil)
	if err := svc.Delete(context.Background(), id); err != nil {
		t.Fatalf("delete: %v", err)
	}
	if repo.markDeletedID == nil || *repo.markDeletedID != id {
		t.Fatal("expected MarkDeleted called")
	}
}

func TestPacienteService_RestoreReactivates(t *testing.T) {
	id := uuid.New()
	deleted := time.Now().UTC()
	p := &entity.Paciente{
		ID: id, NomeCompleto: "Ana", Status: entity.PacienteInativo,
		TelPrincipal: "21999999999", UF: "RJ", CEP: "20000000",
		ResponsavelNome: "Pai", ConsentimentoLGPD: true,
		DeletedAt:       &deleted,
	}
	repo := &mockPacienteRepo{findUnscoped: p, findByID: p}
	svc := NewPacienteService(repo, nil)
	dto, err := svc.Restore(context.Background(), id)
	if err != nil {
		t.Fatalf("restore: %v", err)
	}
	if repo.restoredID == nil {
		t.Fatal("expected Restore called")
	}
	if dto.Status != string(entity.PacienteAtivo) {
		t.Fatalf("status %s", dto.Status)
	}
}

func TestPacienteService_UpdateDeletedConflict(t *testing.T) {
	id := uuid.New()
	deleted := time.Now().UTC()
	p := &entity.Paciente{
		ID: id, NomeCompleto: "Ana", Status: entity.PacienteInativo,
		TelPrincipal: "21999999999", UF: "RJ", CEP: "20000000",
		ResponsavelNome: "Pai", ConsentimentoLGPD: true,
		DeletedAt:       &deleted,
	}
	repo := &mockPacienteRepo{findUnscoped: p}
	svc := NewPacienteService(repo, nil)
	_, err := svc.Update(context.Background(), id, sampleInput(uuid.New()))
	if err == nil {
		t.Fatal("expected conflict")
	}
	de := domainerrors.GetDomainError(err)
	if de.Code != domainerrors.ErrorCodeConflict {
		t.Fatalf("got code %s", de.Code)
	}
}

func TestPacienteService_ListIncludeDeletedExposesDeletedAt(t *testing.T) {
	deleted := time.Now().UTC()
	id := uuid.New()
	p := &entity.Paciente{
		ID: id, NomeCompleto: "Ana Excluida", Status: entity.PacienteInativo,
		TelPrincipal: "21999999999", UF: "RJ", CEP: "20000000",
		ResponsavelNome: "Pai", ConsentimentoLGPD: true,
		DeletedAt:       &deleted,
	}
	repo := &mockPacienteRepo{listItems: []*entity.Paciente{p}}
	svc := NewPacienteService(repo, nil)
	result, err := svc.List(context.Background(), repository.PacienteListFilter{
		IncludeDeleted: true,
		Page:           1,
		PageSize:       20,
	})
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(result.Items) != 1 {
		t.Fatalf("expected 1 item, got %d", len(result.Items))
	}
	dto := result.Items[0]
	if dto.DeletedAt == nil {
		t.Fatal("expected deleted_at in list DTO")
	}
	if dto.Status != string(entity.PacienteInativo) {
		t.Fatalf("status %s", dto.Status)
	}
}

func TestPacienteService_ListWithoutIncludeDeletedOmitsSoftDeleted(t *testing.T) {
	deleted := time.Now().UTC()
	active := &entity.Paciente{
		ID: uuid.New(), NomeCompleto: "Ativo", Status: entity.PacienteAtivo,
		TelPrincipal: "21999999999", UF: "RJ", CEP: "20000000",
		ResponsavelNome: "Pai", ConsentimentoLGPD: true,
	}
	softDeleted := &entity.Paciente{
		ID: uuid.New(), NomeCompleto: "Excluido", Status: entity.PacienteInativo,
		TelPrincipal: "21999999999", UF: "RJ", CEP: "20000000",
		ResponsavelNome: "Pai", ConsentimentoLGPD: true,
		DeletedAt:       &deleted,
	}
	repo := &mockPacienteRepo{listItems: []*entity.Paciente{active, softDeleted}}
	svc := NewPacienteService(repo, nil)
	result, err := svc.List(context.Background(), repository.PacienteListFilter{
		Page:     1,
		PageSize: 20,
	})
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(result.Items) != 1 {
		t.Fatalf("expected 1 active item, got %d", len(result.Items))
	}
	if result.Items[0].NomeCompleto != "Ativo" {
		t.Fatalf("unexpected item %s", result.Items[0].NomeCompleto)
	}
}

func TestPacienteService_GetNotFound(t *testing.T) {
	repo := &mockPacienteRepo{findByID: nil}
	svc := NewPacienteService(repo, nil)
	_, err := svc.GetByID(context.Background(), uuid.New())
	if err == nil {
		t.Fatal("expected not found")
	}
	de := domainerrors.GetDomainError(err)
	if de.Code != domainerrors.ErrorCodeNotFound {
		t.Fatalf("got code %s", de.Code)
	}
}
