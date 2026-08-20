package database

import (
	"errors"
	"testing"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"github.com/jackc/pgx/v5/pgconn"
)

func TestMapDBError_ForeignKeyWrapped(t *testing.T) {
	pgErr := &pgconn.PgError{
		Code:           "23503",
		ConstraintName: "consultas_sala_id_fkey",
		Message:        "violates foreign key constraint",
	}
	wrapped := errors.Join(errors.New("gorm layer"), pgErr)

	mapped := MapDBError(wrapped)
	de := domainerrors.GetDomainError(mapped)
	if de.Code != domainerrors.ErrorCodeBusinessRule {
		t.Fatalf("expected BUSINESS_RULE_VIOLATION, got %s", de.Code)
	}
	if de.Message != domainerrors.SalaDeleteBlockedMessage {
		t.Fatalf("unexpected message: %q", de.Message)
	}
}

func TestMapDBError_UndefinedColumnSalaID(t *testing.T) {
	pgErr := &pgconn.PgError{
		Code:    "42703",
		Message: `column "sala_id" does not exist`,
	}
	mapped := MapDBError(pgErr)
	de := domainerrors.GetDomainError(mapped)
	if de.Code != domainerrors.ErrorCodeValidation {
		t.Fatalf("expected VALIDATION_ERROR, got %s", de.Code)
	}
}
