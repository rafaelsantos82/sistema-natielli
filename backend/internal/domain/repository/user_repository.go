package repository

import (
	"context"

	"espaco-terapia-os/backend/internal/domain/entity"

	"github.com/google/uuid"
)

type UserListFilter struct {
	Query          string
	Page           int
	PageSize       int
	IncludeDeleted bool
}

type UserRepository interface {
	FindByEmail(ctx context.Context, email string) (*entity.User, error)
	FindByID(ctx context.Context, id uuid.UUID) (*entity.User, error)
	FindByIDUnscoped(ctx context.Context, id uuid.UUID) (*entity.User, error)
	List(ctx context.Context, filter UserListFilter) ([]*entity.User, int64, error)
	Create(ctx context.Context, user *entity.User) error
	Update(ctx context.Context, user *entity.User) error
	SoftDelete(ctx context.Context, id uuid.UUID) error
	Restore(ctx context.Context, id uuid.UUID) error
	ReplaceUnidades(ctx context.Context, userID uuid.UUID, unidadeIDs []uuid.UUID) error
	CountActiveAdmins(ctx context.Context, excludeUserID *uuid.UUID) (int64, error)
}
