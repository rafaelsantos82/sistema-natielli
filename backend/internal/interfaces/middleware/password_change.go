package middleware

import (
	"net/http"
	"strings"

	"espaco-terapia-os/backend/internal/interfaces/http/response"

	"github.com/gin-gonic/gin"
)

func passwordChangeRouteAllowed(method, path string) bool {
	switch method {
	case http.MethodGet:
		return strings.HasSuffix(path, "/auth/me")
	case http.MethodPost:
		return strings.HasSuffix(path, "/auth/logout")
	case http.MethodPut:
		return strings.HasSuffix(path, "/auth/me/password")
	default:
		return false
	}
}

// RequirePasswordChanged bloqueia rotas quando o JWT exige troca de senha.
func RequirePasswordChanged() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.GetBool("must_change_password") {
			if !passwordChangeRouteAllowed(c.Request.Method, c.Request.URL.Path) {
				response.JSONError(c, http.StatusForbidden, "PASSWORD_CHANGE_REQUIRED",
					"É necessário alterar a senha antes de continuar", nil)
				c.Abort()
				return
			}
		}
		c.Next()
	}
}
