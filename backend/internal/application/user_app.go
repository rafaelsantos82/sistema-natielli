package application

import (
	"context"

	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/domain/service"

	"github.com/google/uuid"
)

type UserApp struct {
	svc *service.UserService
}

func NewUserApp(svc *service.UserService) *UserApp {
	return &UserApp{svc: svc}
}

func (a *UserApp) GetByID(ctx context.Context, id uuid.UUID) (*service.UserDTO, error) {
	return a.svc.GetByID(ctx, id)
}

func (a *UserApp) List(ctx context.Context, filter repository.UserListFilter) (*service.ListUsersResult, error) {
	return a.svc.List(ctx, filter)
}

func (a *UserApp) Create(ctx context.Context, in service.CreateUserInput) (*service.UserDTO, error) {
	return a.svc.Create(ctx, in)
}

func (a *UserApp) Update(ctx context.Context, id uuid.UUID, in service.UpdateUserInput) (*service.UserDTO, error) {
	return a.svc.Update(ctx, id, in)
}

func (a *UserApp) Delete(ctx context.Context, id, actorID uuid.UUID) error {
	return a.svc.Delete(ctx, id, actorID)
}

func (a *UserApp) Restore(ctx context.Context, id uuid.UUID) (*service.UserDTO, error) {
	return a.svc.Restore(ctx, id)
}
