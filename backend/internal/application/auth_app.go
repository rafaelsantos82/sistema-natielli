package application

import (
	"context"

	"espaco-terapia-os/backend/internal/domain/service"

	"github.com/google/uuid"
)

type AuthApp struct {
	svc *service.AuthService
}

func NewAuthApp(svc *service.AuthService) *AuthApp {
	return &AuthApp{svc: svc}
}

func (a *AuthApp) Login(ctx context.Context, email, password, clientIP string) (*service.LoginResult, error) {
	return a.svc.Login(ctx, email, password, clientIP)
}

func (a *AuthApp) Logout(ctx context.Context, userID uuid.UUID, rawToken string) error {
	return a.svc.Logout(ctx, userID, rawToken)
}

func (a *AuthApp) GetProfile(ctx context.Context, userID uuid.UUID) (*service.UserDTO, error) {
	return a.svc.GetProfile(ctx, userID)
}

func (a *AuthApp) UpdateProfile(ctx context.Context, userID uuid.UUID, in service.UpdateProfileInput) (*service.UserDTO, error) {
	return a.svc.UpdateProfile(ctx, userID, in)
}

func (a *AuthApp) ForgotPassword(ctx context.Context, email string) error {
	return a.svc.ForgotPassword(ctx, email)
}

func (a *AuthApp) ResetPassword(ctx context.Context, token, password string) error {
	return a.svc.ResetPassword(ctx, token, password)
}

func (a *AuthApp) ChangePassword(ctx context.Context, userID uuid.UUID, current, newPassword string) (*service.LoginResult, error) {
	return a.svc.ChangePassword(ctx, userID, current, newPassword)
}
