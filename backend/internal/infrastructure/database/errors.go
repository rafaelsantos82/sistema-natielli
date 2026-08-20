package database

import (
	"errors"
	"strings"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

func findPgError(err error) *pgconn.PgError {
	var pgErr *pgconn.PgError
	for e := err; e != nil; e = errors.Unwrap(e) {
		if errors.As(e, &pgErr) {
			return pgErr
		}
	}
	return nil
}

func findPqError(err error) *pq.Error {
	var pqErr *pq.Error
	for e := err; e != nil; e = errors.Unwrap(e) {
		if errors.As(e, &pqErr) {
			return pqErr
		}
	}
	return nil
}

func mapPostgresCode(code string, constraintName, message string) error {
	switch code {
	case "23503":
		if isSalaDeleteForeignKey(constraintName, message) {
			return domainerrors.NewBusinessRuleError(domainerrors.SalaDeleteBlockedMessage)
		}
		return domainerrors.NewConflictError("Registro em uso e não pode ser removido")
	case "23505":
		if strings.Contains(constraintName, "cpf") {
			return domainerrors.NewConflictError("CPF já cadastrado")
		}
		if strings.Contains(constraintName, "email") {
			return domainerrors.NewConflictError("E-mail já cadastrado")
		}
		return domainerrors.NewConflictError("Registro duplicado")
	case "42703":
		if strings.Contains(message, "sala_id") {
			return domainerrors.NewValidationError(domainerrors.SchemaMigrationConsultaSalaHint)
		}
	}
	return nil
}

func isSalaDeleteForeignKey(constraintName, message string) bool {
	lower := strings.ToLower(constraintName + " " + message)
	return strings.Contains(lower, "sala") &&
		(strings.Contains(lower, "consulta") || strings.Contains(lower, "consultas"))
}

// MapDBError traduz erros do Postgres/GORM para erros de domínio consumidos pelo ErrorHandler.
func MapDBError(err error) error {
	if err == nil {
		return nil
	}
	if pgErr := findPgError(err); pgErr != nil {
		if mapped := mapPostgresCode(pgErr.Code, pgErr.ConstraintName, pgErr.Message); mapped != nil {
			return mapped
		}
	}
	if pqErr := findPqError(err); pqErr != nil {
		if mapped := mapPostgresCode(string(pqErr.Code), pqErr.Constraint, pqErr.Message); mapped != nil {
			return mapped
		}
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return domainerrors.NewNotFoundError("Registro", "")
	}
	return domainerrors.NewDatabaseError("Erro de banco de dados", err)
}
