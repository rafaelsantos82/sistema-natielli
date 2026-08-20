package service

import (
	"context"
	"testing"
	"time"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
)

type memLoginProtection struct {
	locked map[string]bool
	count  map[string]int
}

func (m *memLoginProtection) key(id, typ string) string { return typ + ":" + id }

func (m *memLoginProtection) IsLocked(ctx context.Context, identifier, identifierType string) (bool, error) {
	return m.locked[m.key(identifier, identifierType)], nil
}

func (m *memLoginProtection) RecordFailure(ctx context.Context, identifier, identifierType string, maxAttempts int, lockout time.Duration) error {
	k := m.key(identifier, identifierType)
	m.count[k]++
	if m.count[k] >= maxAttempts {
		m.locked[k] = true
	}
	return nil
}

func (m *memLoginProtection) Reset(ctx context.Context, identifier, identifierType string) error {
	k := m.key(identifier, identifierType)
	delete(m.locked, k)
	delete(m.count, k)
	return nil
}

func TestLoginProtection_LockAfterFailures(t *testing.T) {
	store := &memLoginProtection{locked: map[string]bool{}, count: map[string]int{}}
	svc := NewLoginProtectionService(store, 3, 15, 6, 60)
	ctx := context.Background()
	email := "user@test.com"

	for i := 0; i < 3; i++ {
		_ = svc.OnFailure(ctx, email, "1.2.3.4")
	}
	err := svc.CheckAllowed(ctx, email, "1.2.3.4")
	if err == nil {
		t.Fatal("expected lock")
	}
	de := domainerrors.GetDomainError(err)
	if de.Code != domainerrors.ErrorCodeTooManyRequests {
		t.Fatalf("code %s", de.Code)
	}
}

func TestLoginProtection_ResetOnSuccess(t *testing.T) {
	store := &memLoginProtection{locked: map[string]bool{}, count: map[string]int{}}
	svc := NewLoginProtectionService(store, 3, 15, 6, 60)
	ctx := context.Background()
	email := "user@test.com"
	_ = svc.OnFailure(ctx, email, "")
	_ = svc.OnFailure(ctx, email, "")
	svc.OnSuccess(ctx, email, "")
	if err := svc.CheckAllowed(ctx, email, ""); err != nil {
		t.Fatalf("expected allowed: %v", err)
	}
}
