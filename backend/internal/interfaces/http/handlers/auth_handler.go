package handlers

import (
	"net/http"
	"strings"

	"espaco-terapia-os/backend/internal/application"
	"espaco-terapia-os/backend/internal/domain/service"
	"espaco-terapia-os/backend/internal/infrastructure/auth"
	"espaco-terapia-os/backend/internal/platform/requestcontext"
	httplayer "espaco-terapia-os/backend/internal/interfaces/http"
	"espaco-terapia-os/backend/internal/interfaces/http/dto"
	"espaco-terapia-os/backend/internal/interfaces/http/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AuthHandler struct {
	authApp            *application.AuthApp
	errorHandler       *httplayer.ErrorHandler
	jwtService         *auth.JWTService
	bootstrapEnabled   bool
	bootstrapAuthToken string
}

type IssueTokenRequest struct {
	UserID string `json:"user_id" binding:"required"`
	Email  string `json:"email" binding:"required,email"`
	Role   string `json:"role" binding:"required,oneof=admin gestor funcionario terceiro terapeuta responsavel"`
}

func NewAuthHandler(
	authApp *application.AuthApp,
	errorHandler *httplayer.ErrorHandler,
	jwtService *auth.JWTService,
	bootstrapEnabled bool,
	bootstrapAuthToken string,
) *AuthHandler {
	return &AuthHandler{
		authApp:            authApp,
		errorHandler:       errorHandler,
		jwtService:         jwtService,
		bootstrapEnabled:   bootstrapEnabled,
		bootstrapAuthToken: bootstrapAuthToken,
	}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Dados inválidos")
		return
	}
	ctx := requestcontext.WithClientIP(c.Request.Context(), c.ClientIP())
	result, err := h.authApp.Login(ctx, req.Email, req.Password, c.ClientIP())
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, result, nil)
}

func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Dados inválidos")
		return
	}
	_ = h.authApp.ForgotPassword(c.Request.Context(), req.Email)
	response.JSONSuccess(c, http.StatusOK, gin.H{"message": "Se o e-mail existir, enviaremos instruções de redefinição"}, nil)
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req struct {
		Token    string `json:"token" binding:"required"`
		Password string `json:"password" binding:"required,min=8"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Dados inválidos")
		return
	}
	if err := h.authApp.ResetPassword(c.Request.Context(), req.Token, req.Password); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, gin.H{"message": "Senha redefinida com sucesso"}, nil)
}

func (h *AuthHandler) IssueToken(c *gin.Context) {
	if !h.bootstrapEnabled {
		response.JSONError(c, http.StatusNotFound, "NOT_FOUND", "Recurso não disponível", nil)
		return
	}
	if c.GetHeader("X-Bootstrap-Token") != h.bootstrapAuthToken {
		response.JSONError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Acesso não autorizado", nil)
		return
	}
	var req IssueTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSONError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Dados inválidos", nil)
		return
	}
	token, err := h.jwtService.Generate(req.UserID, req.Email, req.Role, false)
	if err != nil {
		response.JSONError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Erro interno", nil)
		return
	}
	response.JSONSuccess(c, http.StatusOK, gin.H{
		"access_token": token,
		"token_type":   "Bearer",
		"expires_in":   "configured_by_server",
	}, gin.H{})
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString("user_id"))
	if err != nil {
		response.JSONError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Token inválido", nil)
		return
	}
	profile, err := h.authApp.GetProfile(c.Request.Context(), userID)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, profile, nil)
}

func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString("user_id"))
	if err != nil {
		response.JSONError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Token inválido", nil)
		return
	}
	var req dto.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Dados inválidos")
		return
	}
	profile, err := h.authApp.UpdateProfile(c.Request.Context(), userID, service.UpdateProfileInput{
		Name:  req.Name,
		Email: req.Email,
	})
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, profile, nil)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	userID, _ := uuid.Parse(c.GetString("user_id"))
	token := strings.TrimPrefix(c.GetHeader("Authorization"), "Bearer ")
	token = strings.TrimSpace(token)
	_ = h.authApp.Logout(c.Request.Context(), userID, token)
	response.JSONSuccess(c, http.StatusOK, gin.H{"message": "Logout realizado"}, nil)
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString("user_id"))
	if err != nil {
		response.JSONError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Token inválido", nil)
		return
	}
	var req struct {
		CurrentPassword string `json:"current_password" binding:"required"`
		NewPassword     string `json:"new_password" binding:"required,min=8"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Dados inválidos")
		return
	}
	result, err := h.authApp.ChangePassword(c.Request.Context(), userID, req.CurrentPassword, req.NewPassword)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, result, nil)
}
