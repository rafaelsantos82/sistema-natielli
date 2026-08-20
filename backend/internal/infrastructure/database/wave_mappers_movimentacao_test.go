package database

import (
	"errors"
	"testing"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
)

func TestSaidaSaldoInsuficienteBusinessRule(t *testing.T) {
	t.Parallel()
	err := domainerrors.NewBusinessRuleError("saldo insuficiente para saída")
	var domErr *domainerrors.DomainError
	if !errors.As(err, &domErr) {
		t.Fatal("expected DomainError")
	}
	if domErr.Code != domainerrors.ErrorCodeBusinessRule {
		t.Fatalf("got code %q", domErr.Code)
	}
}
