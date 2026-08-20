package service

import (
	"context"
	"strings"
	"time"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
)

type LoginProtectionStore interface {
	IsLocked(ctx context.Context, identifier, identifierType string) (bool, error)
	RecordFailure(ctx context.Context, identifier, identifierType string, maxAttempts int, lockout time.Duration) error
	Reset(ctx context.Context, identifier, identifierType string) error
}

type LoginProtectionService struct {
	store              LoginProtectionStore
	maxAttempts        int
	lockoutMinutes     int
	extendedLockAfter  int
	extendedLockMins int
}

func NewLoginProtectionService(store LoginProtectionStore, maxAttempts, lockoutMinutes, extendedAfter, extendedMins int) *LoginProtectionService {
	if maxAttempts < 1 {
		maxAttempts = 5
	}
	if lockoutMinutes < 1 {
		lockoutMinutes = 15
	}
	if extendedAfter < maxAttempts {
		extendedAfter = maxAttempts * 2
	}
	if extendedMins < lockoutMinutes {
		extendedMins = 60
	}
	return &LoginProtectionService{
		store: store, maxAttempts: maxAttempts, lockoutMinutes: lockoutMinutes,
		extendedLockAfter: extendedAfter, extendedLockMins: extendedMins,
	}
}

func (s *LoginProtectionService) CheckAllowed(ctx context.Context, email, clientIP string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	for _, id := range []struct{ val, typ string }{
		{email, "email"},
		{clientIP, "ip"},
	} {
		if id.val == "" {
			continue
		}
		locked, err := s.store.IsLocked(ctx, id.val, id.typ)
		if err != nil {
			return domainerrors.NewDatabaseError("falha ao verificar bloqueio", err)
		}
		if locked {
			return domainerrors.NewTooManyRequestsError("Muitas tentativas. Tente mais tarde.")
		}
	}
	return nil
}

func (s *LoginProtectionService) OnFailure(ctx context.Context, email, clientIP string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	lockout := time.Duration(s.lockoutMinutes) * time.Minute
	for _, id := range []struct{ val, typ string }{
		{email, "email"},
		{clientIP, "ip"},
	} {
		if id.val == "" {
			continue
		}
		if err := s.store.RecordFailure(ctx, id.val, id.typ, s.maxAttempts, lockout); err != nil {
			return err
		}
	}
	return nil
}

func (s *LoginProtectionService) OnSuccess(ctx context.Context, email, clientIP string) {
	email = strings.ToLower(strings.TrimSpace(email))
	_ = s.store.Reset(ctx, email, "email")
	if clientIP != "" {
		_ = s.store.Reset(ctx, clientIP, "ip")
	}
}
