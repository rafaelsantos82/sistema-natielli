package http

import (
	"errors"
	"log/slog"
	"net/http"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	platformlogger "espaco-terapia-os/backend/internal/platform/logger"
	"espaco-terapia-os/backend/internal/interfaces/http/response"

	"github.com/gin-gonic/gin"
)

type ErrorHandler struct {
	logger *slog.Logger
}

func NewErrorHandler(logger *slog.Logger) *ErrorHandler {
	return &ErrorHandler{logger: logger}
}

func (h *ErrorHandler) Handle(c *gin.Context, err error) {
	if errors.Is(err, ErrUnauthorized) {
		response.JSONError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Acesso não autorizado", nil)
		return
	}

	de := domainerrors.GetDomainError(err)
	status := h.httpStatus(de.Code)
	details := []response.ErrorDetail{}
	if de.Field != "" || de.Details != "" {
		msg := de.Details
		if msg == "" {
			msg = de.Message
		}
		details = append(details, response.ErrorDetail{
			Field:   de.Field,
			Message: msg,
		})
	}

	if status >= http.StatusInternalServerError {
		log := platformlogger.FromContext(c.Request.Context(), h.logger)
		path := platformlogger.SanitizePath(c.Request.URL.RequestURI())
		if path == "" {
			path = platformlogger.SanitizePath(c.Request.URL.Path)
		}
		attrs := []any{
			slog.String("code", string(de.Code)),
			slog.Int("status", status),
			slog.String("path", path),
		}
		if de.Cause != nil {
			attrs = append(attrs, slog.String("cause", de.Cause.Error()))
		}
		log.Error("request error", attrs...)
		response.JSONError(c, status, string(de.Code), "Erro interno", nil)
		return
	}

	response.JSONError(c, status, string(de.Code), de.Message, details)
}

func (h *ErrorHandler) HandleValidationError(c *gin.Context, message string) {
	response.JSONError(c, http.StatusBadRequest, string(domainerrors.ErrorCodeValidation), message, nil)
}

func (h *ErrorHandler) httpStatus(code domainerrors.ErrorCode) int {
	switch code {
	case domainerrors.ErrorCodeValidation,
		domainerrors.ErrorCodeRequiredField,
		domainerrors.ErrorCodeInvalidFormat,
		domainerrors.ErrorCodeInvalidValue,
		domainerrors.ErrorCodeInvalidSala,
		domainerrors.ErrorCodeBusinessRule:
		return http.StatusBadRequest
	case domainerrors.ErrorCodeNotFound:
		return http.StatusNotFound
	case domainerrors.ErrorCodeConflict:
		return http.StatusConflict
	case domainerrors.ErrorCodeUnauthorized:
		return http.StatusUnauthorized
	case domainerrors.ErrorCodeForbidden, domainerrors.ErrorCodePasswordChange:
		return http.StatusForbidden
	case domainerrors.ErrorCodeTooManyRequests:
		return http.StatusTooManyRequests
	case domainerrors.ErrorCodeDatabaseError, domainerrors.ErrorCodeInternal:
		return http.StatusInternalServerError
	default:
		return http.StatusInternalServerError
	}
}

var ErrUnauthorized = errors.New("unauthorized")
