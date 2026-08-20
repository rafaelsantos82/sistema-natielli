package service

import (
	"context"
	"testing"

	"espaco-terapia-os/backend/internal/domain/entity"
	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"
	infrauth "espaco-terapia-os/backend/internal/infrastructure/auth"

	"github.com/google/uuid"
)

type stubUserRepo struct {
	user      *entity.User
	byEmail   map[string]*entity.User
	updated   *entity.User
}

func (s *stubUserRepo) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	if s.byEmail != nil {
		if u, ok := s.byEmail[email]; ok {
			return u, nil
		}
		return nil, nil
	}
	if s.user != nil && s.user.Email == email {
		return s.user, nil
	}
	return nil, nil
}
func (s *stubUserRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.User, error) {
	if s.user != nil && s.user.ID == id && s.user.DeletedAt == nil {
		return s.user, nil
	}
	return nil, nil
}
func (s *stubUserRepo) FindByIDUnscoped(ctx context.Context, id uuid.UUID) (*entity.User, error) {
	if s.user != nil && s.user.ID == id {
		return s.user, nil
	}
	return nil, nil
}
func (s *stubUserRepo) List(ctx context.Context, filter repository.UserListFilter) ([]*entity.User, int64, error) {
	return nil, 0, nil
}
func (s *stubUserRepo) Create(ctx context.Context, user *entity.User) error { return nil }
func (s *stubUserRepo) Update(ctx context.Context, user *entity.User) error {
	s.updated = user
	s.user = user
	return nil
}
func (s *stubUserRepo) SoftDelete(ctx context.Context, id uuid.UUID) error { return nil }
func (s *stubUserRepo) Restore(ctx context.Context, id uuid.UUID) error {
	if s.user != nil && s.user.ID == id {
		s.user.DeletedAt = nil
	}
	return nil
}
func (s *stubUserRepo) ReplaceUnidades(ctx context.Context, userID uuid.UUID, unidadeIDs []uuid.UUID) error {
	return nil
}
func (s *stubUserRepo) CountActiveAdmins(ctx context.Context, excludeUserID *uuid.UUID) (int64, error) {
	return 1, nil
}

func TestAuthService_LoginSuccess(t *testing.T) {
	hash, err := HashPassword("senha-segura1")
	if err != nil {
		t.Fatal(err)
	}
	repo := &stubUserRepo{user: &entity.User{
		ID:           uuid.New(),
		Email:        "admin@test.com",
		PasswordHash: hash,
		Role:         entity.UserRoleAdmin,
	}}
	jwt := infrauth.NewJWTService("test-secret-key-32-bytes-long!!", "test", 60, nil)
	store := &memLoginProtection{locked: map[string]bool{}, count: map[string]int{}}
	protection := NewLoginProtectionService(store, 5, 15, 10, 60)
	svc := NewAuthService(repo, jwt, protection, nil, nil, nil, nil)

	res, err := svc.Login(context.Background(), "admin@test.com", "senha-segura1", "127.0.0.1")
	if err != nil {
		t.Fatalf("login: %v", err)
	}
	if res.AccessToken == "" {
		t.Fatal("expected token")
	}
}

func TestAuthService_LoginInvalidPassword(t *testing.T) {
	hash, _ := HashPassword("senha-segura1")
	repo := &stubUserRepo{user: &entity.User{
		ID: uuid.New(), Email: "admin@test.com", PasswordHash: hash, Role: entity.UserRoleAdmin,
	}}
	jwt := infrauth.NewJWTService("test-secret-key-32-bytes-long!!", "test", 60, nil)
	svc := NewAuthService(repo, jwt, nil, nil, nil, nil, nil)

	_, err := svc.Login(context.Background(), "admin@test.com", "errada", "")
	if err == nil {
		t.Fatal("expected error")
	}
	de := domainerrors.GetDomainError(err)
	if de.Code != domainerrors.ErrorCodeUnauthorized {
		t.Fatalf("got code %s", de.Code)
	}
}

func TestAuthService_UpdateProfileSuccess(t *testing.T) {
	id := uuid.New()
	repo := &stubUserRepo{user: &entity.User{
		ID: id, Name: "Antigo", Email: "user@test.com", Role: entity.UserRoleGestor,
	}}
	svc := NewAuthService(repo, nil, nil, nil, nil, nil, nil)

	dto, err := svc.UpdateProfile(context.Background(), id, UpdateProfileInput{
		Name:  "Novo Nome",
		Email: "novo@test.com",
	})
	if err != nil {
		t.Fatalf("update profile: %v", err)
	}
	if dto.Name != "Novo Nome" || dto.Email != "novo@test.com" {
		t.Fatalf("unexpected dto: %+v", dto)
	}
}

func TestAuthService_UpdateProfileDuplicateEmail(t *testing.T) {
	id := uuid.New()
	otherID := uuid.New()
	repo := &stubUserRepo{
		user: &entity.User{ID: id, Name: "User", Email: "user@test.com", Role: entity.UserRoleGestor},
		byEmail: map[string]*entity.User{
			"outro@test.com": {ID: otherID, Email: "outro@test.com"},
		},
	}
	svc := NewAuthService(repo, nil, nil, nil, nil, nil, nil)

	_, err := svc.UpdateProfile(context.Background(), id, UpdateProfileInput{
		Name:  "User",
		Email: "outro@test.com",
	})
	if err == nil {
		t.Fatal("expected conflict")
	}
	de := domainerrors.GetDomainError(err)
	if de.Code != domainerrors.ErrorCodeConflict {
		t.Fatalf("got code %s", de.Code)
	}
}

func TestHashPasswordRequiresDigit(t *testing.T) {
	_, err := HashPassword("abcdefgh")
	if err == nil {
		t.Fatal("expected error for password without digit")
	}
	de := domainerrors.GetDomainError(err)
	if de.Code != domainerrors.ErrorCodeValidation {
		t.Fatalf("got code %s", de.Code)
	}
}

func TestHashPasswordAcceptsValidPassword(t *testing.T) {
	hash, err := HashPassword("abcdefg1")
	if err != nil {
		t.Fatalf("hash: %v", err)
	}
	if hash == "" {
		t.Fatal("expected hash")
	}
}

func TestAuthService_UpdateProfileEmptyName(t *testing.T) {
	id := uuid.New()
	repo := &stubUserRepo{user: &entity.User{ID: id, Email: "a@b.com", Role: entity.UserRoleGestor}}
	svc := NewAuthService(repo, nil, nil, nil, nil, nil, nil)

	_, err := svc.UpdateProfile(context.Background(), id, UpdateProfileInput{Name: "  ", Email: "a@b.com"})
	if err == nil {
		t.Fatal("expected validation error")
	}
}
