package service

import (
	"context"
	"log/slog"
	"testing"
	"time"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/entity"
	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
)

type stubProfissionalRepo struct {
	prof *entity.Profissional
}

func (s *stubProfissionalRepo) Save(ctx context.Context, p *entity.Profissional) error { return nil }
func (s *stubProfissionalRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.Profissional, error) {
	if s.prof != nil && s.prof.ID == id && s.prof.DeletedAt == nil {
		return s.prof, nil
	}
	return nil, nil
}
func (s *stubProfissionalRepo) FindByIDUnscoped(ctx context.Context, id uuid.UUID) (*entity.Profissional, error) {
	if s.prof != nil && s.prof.ID == id {
		return s.prof, nil
	}
	return nil, nil
}
func (s *stubProfissionalRepo) Update(ctx context.Context, p *entity.Profissional) error { return nil }
func (s *stubProfissionalRepo) MarkDeleted(ctx context.Context, id uuid.UUID) error { return nil }
func (s *stubProfissionalRepo) Restore(ctx context.Context, id uuid.UUID) error {
	if s.prof != nil && s.prof.ID == id {
		s.prof.DeletedAt = nil
		s.prof.Status = entity.ProfissionalAtivo
	}
	return nil
}
func (s *stubProfissionalRepo) ExistsEmail(ctx context.Context, email string, excludeID *uuid.UUID) (bool, error) {
	return false, nil
}
func (s *stubProfissionalRepo) List(ctx context.Context, filter repository.ProfissionalListFilter) ([]*entity.Profissional, int64, error) {
	return nil, 0, nil
}
func (s *stubProfissionalRepo) GetUnidadeIDs(ctx context.Context, profissionalID uuid.UUID) ([]uuid.UUID, error) {
	return nil, nil
}
func (s *stubProfissionalRepo) GetEspecialidades(ctx context.Context, profissionalID uuid.UUID) ([]string, error) {
	return nil, nil
}
func (s *stubProfissionalRepo) ListConselhos(ctx context.Context, profissionalID uuid.UUID) ([]*entity.ProfissionalConselho, error) {
	return nil, nil
}
func (s *stubProfissionalRepo) FindConselhoByID(ctx context.Context, profissionalID, conselhoID uuid.UUID) (*entity.ProfissionalConselho, error) {
	return nil, nil
}
func (s *stubProfissionalRepo) SaveConselho(ctx context.Context, c *entity.ProfissionalConselho) error {
	return nil
}
func (s *stubProfissionalRepo) UpdateConselho(ctx context.Context, c *entity.ProfissionalConselho) error {
	return nil
}
func (s *stubProfissionalRepo) SoftDeleteConselho(ctx context.Context, profissionalID, conselhoID uuid.UUID) error {
	return nil
}

func TestProfissionalService_Restore_Success(t *testing.T) {
	id := uuid.New()
	deleted := time.Now().UTC()
	repo := &stubProfissionalRepo{
		prof: &entity.Profissional{
			ID:        id,
			Nome:      "Dr. Teste",
			Email:     "test@example.com",
			Status:    entity.ProfissionalInativo,
			DeletedAt: &deleted,
			CreatedAt: deleted,
			UpdatedAt: deleted,
		},
	}
	svc := NewProfissionalService(repo, slog.Default())
	out, err := svc.Restore(context.Background(), id)
	if err != nil {
		t.Fatalf("Restore: %v", err)
	}
	if out == nil || out.DeletedAt != nil {
		t.Fatal("expected active professional without deleted_at")
	}
	if repo.prof.DeletedAt != nil {
		t.Fatal("stub should be restored")
	}
}

func TestProfissionalService_Restore_AlreadyActive(t *testing.T) {
	id := uuid.New()
	repo := &stubProfissionalRepo{
		prof: &entity.Profissional{
			ID:     id,
			Email:  "a@b.com",
			Status: entity.ProfissionalAtivo,
		},
	}
	svc := NewProfissionalService(repo, slog.Default())
	_, err := svc.Restore(context.Background(), id)
	if err == nil {
		t.Fatal("expected conflict when already active")
	}
	de := domainerrors.GetDomainError(err)
	if de.Code != domainerrors.ErrorCodeConflict {
		t.Fatalf("expected conflict, got %v", de.Code)
	}
}

func TestProfissionalService_Update_RejectsDeleted(t *testing.T) {
	id := uuid.New()
	deleted := time.Now().UTC()
	repo := &stubProfissionalRepo{
		prof: &entity.Profissional{
			ID:        id,
			Email:     "test@example.com",
			Status:    entity.ProfissionalInativo,
			DeletedAt: &deleted,
		},
	}
	svc := NewProfissionalService(repo, slog.Default())
	_, err := svc.Update(context.Background(), id, ProfissionalInput{
		Nome:  "Novo",
		Email: "test@example.com",
	})
	if err == nil {
		t.Fatal("expected conflict when updating deleted professional")
	}
	de := domainerrors.GetDomainError(err)
	if de.Code != domainerrors.ErrorCodeConflict {
		t.Fatalf("expected conflict, got %v", de.Code)
	}
}
