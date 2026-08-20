package service

import (
	"context"
	"log/slog"
	"testing"
	"time"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/entity"

	"github.com/google/uuid"
)

func TestUserService_Restore_Success(t *testing.T) {
	id := uuid.New()
	deleted := time.Now().UTC()
	repo := &stubUserRepo{
		user: &entity.User{
			ID:           id,
			Name:         "Test",
			Email:        "test@example.com",
			Role:         entity.UserRoleFuncionario,
			DeletedAt:    &deleted,
			UnidadeIDs:   nil,
			CreatedAt:    deleted,
			UpdatedAt:    deleted,
			PasswordHash: "hash",
		},
	}
	svc := NewUserService(repo, nil, slog.Default())
	out, err := svc.Restore(context.Background(), id)
	if err != nil {
		t.Fatalf("Restore: %v", err)
	}
	if out == nil || out.DeletedAt != nil {
		t.Fatal("expected active user without deleted_at")
	}
	if repo.user.DeletedAt != nil {
		t.Fatal("stub user should be restored")
	}
}

func TestUserService_Restore_AlreadyActive(t *testing.T) {
	id := uuid.New()
	repo := &stubUserRepo{
		user: &entity.User{
			ID:    id,
			Email: "a@b.com",
			Role:  entity.UserRoleFuncionario,
		},
	}
	svc := NewUserService(repo, nil, slog.Default())
	_, err := svc.Restore(context.Background(), id)
	if err == nil {
		t.Fatal("expected conflict when user already active")
	}
	de := domainerrors.GetDomainError(err)
	if de.Code != domainerrors.ErrorCodeConflict {
		t.Fatalf("expected conflict, got %v", de.Code)
	}
}

func TestUserService_Update_RejectsDeletedUser(t *testing.T) {
	id := uuid.New()
	deleted := time.Now().UTC()
	repo := &stubUserRepo{
		user: &entity.User{
			ID:        id,
			Name:      "Test",
			Email:     "test@example.com",
			Role:      entity.UserRoleFuncionario,
			DeletedAt: &deleted,
		},
	}
	svc := NewUserService(repo, nil, slog.Default())
	_, err := svc.Update(context.Background(), id, UpdateUserInput{
		Name:  "Novo",
		Email: "test@example.com",
		Role:  entity.UserRoleFuncionario,
	})
	if err == nil {
		t.Fatal("expected conflict when updating deleted user")
	}
	de := domainerrors.GetDomainError(err)
	if de.Code != domainerrors.ErrorCodeConflict {
		t.Fatalf("expected conflict, got %v", de.Code)
	}
}
