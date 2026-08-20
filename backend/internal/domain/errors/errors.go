package errors

import "fmt"

type ErrorCode string

const (
	ErrorCodeValidation    ErrorCode = "VALIDATION_ERROR"
	ErrorCodeRequiredField ErrorCode = "REQUIRED_FIELD"
	ErrorCodeInvalidFormat ErrorCode = "INVALID_FORMAT"
	ErrorCodeInvalidValue  ErrorCode = "INVALID_VALUE"
	ErrorCodeInvalidSala   ErrorCode = "INVALID_SALA"
	ErrorCodeBusinessRule  ErrorCode = "BUSINESS_RULE_VIOLATION"
	ErrorCodeNotFound      ErrorCode = "NOT_FOUND"
	ErrorCodeConflict      ErrorCode = "CONFLICT"
	ErrorCodeDatabaseError ErrorCode = "DATABASE_ERROR"
	ErrorCodeInternal      ErrorCode = "INTERNAL_ERROR"
	ErrorCodeUnauthorized  ErrorCode = "UNAUTHORIZED"
	ErrorCodeForbidden       ErrorCode = "FORBIDDEN"
	ErrorCodeTooManyRequests ErrorCode = "TOO_MANY_REQUESTS"
	ErrorCodePasswordChange  ErrorCode = "PASSWORD_CHANGE_REQUIRED"
)

// SalaDeleteBlockedMessage é retornada quando há consultas referenciando a sala.
const SalaDeleteBlockedMessage = "Não é possível excluir a sala: existem agendamentos vinculados. Cancele ou altere os agendamentos antes."

// SchemaMigrationConsultaSalaHint orienta dev quando a coluna consultas.sala_id não existe.
const SchemaMigrationConsultaSalaHint = "Banco de dados desatualizado: execute as migrations pendentes (consultas.sala_id)."

type DomainError struct {
	Code    ErrorCode
	Message string
	Details string
	Field   string
	Entity  string
	EntityID string
	Cause   error
}

func (e *DomainError) Error() string {
	if e.Details != "" {
		return fmt.Sprintf("%s: %s - %s", e.Code, e.Message, e.Details)
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

func (e *DomainError) Unwrap() error { return e.Cause }

func IsDomainError(err error) bool {
	_, ok := err.(*DomainError)
	return ok
}

func GetDomainError(err error) *DomainError {
	if err == nil {
		return nil
	}
	if de, ok := err.(*DomainError); ok {
		return de
	}
	return &DomainError{
		Code:    ErrorCodeInternal,
		Message: err.Error(),
		Cause:   err,
	}
}

func NewValidationError(message string) *DomainError {
	return &DomainError{Code: ErrorCodeValidation, Message: message}
}

func NewRequiredFieldError(field string) *DomainError {
	return &DomainError{
		Code:    ErrorCodeRequiredField,
		Message: fmt.Sprintf("Campo obrigatório: %s", field),
		Field:   field,
	}
}

func NewInvalidFormatError(field, message string) *DomainError {
	return &DomainError{
		Code:    ErrorCodeInvalidFormat,
		Message: message,
		Field:   field,
	}
}

func NewNotFoundError(entity, entityID string) *DomainError {
	return &DomainError{
		Code:     ErrorCodeNotFound,
		Message:  fmt.Sprintf("%s não encontrado", entity),
		Entity:   entity,
		EntityID: entityID,
	}
}

func NewConflictError(message string) *DomainError {
	return &DomainError{Code: ErrorCodeConflict, Message: message}
}

func NewDatabaseError(message string, cause error) *DomainError {
	return &DomainError{Code: ErrorCodeDatabaseError, Message: message, Cause: cause}
}

func NewBusinessRuleError(message string) *DomainError {
	return &DomainError{Code: ErrorCodeBusinessRule, Message: message}
}

func NewInvalidSalaError(message string) *DomainError {
	return &DomainError{Code: ErrorCodeInvalidSala, Message: message, Field: "sala_id"}
}

func NewInternalError(message string) *DomainError {
	return &DomainError{Code: ErrorCodeInternal, Message: message}
}

func NewUnauthorizedError(message string) *DomainError {
	return &DomainError{Code: ErrorCodeUnauthorized, Message: message}
}

func NewForbiddenError(message string) *DomainError {
	return &DomainError{Code: ErrorCodeForbidden, Message: message}
}

func NewTooManyRequestsError(message string) *DomainError {
	return &DomainError{Code: ErrorCodeTooManyRequests, Message: message}
}

func NewPasswordChangeRequiredError(message string) *DomainError {
	return &DomainError{Code: ErrorCodePasswordChange, Message: message}
}
