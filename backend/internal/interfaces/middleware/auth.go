package middleware

import (
	"net/http"
	"strings"

	"espaco-terapia-os/backend/internal/domain/entity"
	"espaco-terapia-os/backend/internal/domain/service"
	"espaco-terapia-os/backend/internal/infrastructure/auth"
	"espaco-terapia-os/backend/internal/interfaces/http/response"

	"github.com/gin-gonic/gin"
)

func RequireAuth(jwtService *auth.JWTService) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("Authorization")
		if token == "" {
			response.JSONError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Token ausente", nil)
			c.Abort()
			return
		}

		token = strings.TrimPrefix(token, "Bearer ")
		if token == "" {
			response.JSONError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Token inválido", nil)
			c.Abort()
			return
		}

		claims, err := jwtService.ParseWithContext(c.Request.Context(), token)
		if err != nil {
			response.JSONError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Token inválido", nil)
			c.Abort()
			return
		}

		c.Set("user_id", claims.Subject)
		c.Set("role", claims.Role)
		c.Set("must_change_password", claims.MustChangePassword)
		c.Next()
	}
}

func RequireRole(allowedRoles ...string) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(allowedRoles))
	for _, role := range allowedRoles {
		allowed[role] = struct{}{}
	}

	return func(c *gin.Context) {
		role := c.GetString("role")
		if _, ok := allowed[role]; !ok {
			response.JSONError(c, http.StatusForbidden, "FORBIDDEN", "Acesso negado", nil)
			c.Abort()
			return
		}
		c.Next()
	}
}

func RequireConfiguredSecret(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if strings.TrimSpace(jwtSecret) == "" {
			response.JSONError(c, http.StatusServiceUnavailable, "SERVICE_MISCONFIGURED", "Serviço indisponível", nil)
			c.Abort()
			return
		}
		c.Next()
	}
}

func RequirePermissionCode(authz *service.AccessControlService, permissionCode string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role := entity.UserRole(c.GetString("role"))
		if !role.Valid() {
			response.JSONError(c, http.StatusForbidden, "FORBIDDEN", "Acesso negado", nil)
			c.Abort()
			return
		}
		if authz == nil {
			response.JSONError(c, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Serviço indisponível", nil)
			c.Abort()
			return
		}

		allowed, err := authz.HasPermission(c.Request.Context(), role, permissionCode)
		if err != nil {
			response.JSONError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Erro ao validar permissão", nil)
			c.Abort()
			return
		}
		if !allowed {
			response.JSONError(c, http.StatusForbidden, "FORBIDDEN", "Acesso negado", nil)
			c.Abort()
			return
		}
		c.Next()
	}
}

func RequirePermissionOrRole(authz *service.AccessControlService, permissionCode string, fallbackRoles ...string) gin.HandlerFunc {
	byRole := RequireRole(fallbackRoles...)
	return func(c *gin.Context) {
		if authz == nil {
			byRole(c)
			return
		}
		role := entity.UserRole(c.GetString("role"))
		if !role.Valid() {
			response.JSONError(c, http.StatusForbidden, "FORBIDDEN", "Acesso negado", nil)
			c.Abort()
			return
		}
		allowed, err := authz.HasPermission(c.Request.Context(), role, permissionCode)
		if err != nil {
			response.JSONError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Erro ao validar permissão", nil)
			c.Abort()
			return
		}
		if allowed {
			c.Next()
			return
		}
		byRole(c)
	}
}
