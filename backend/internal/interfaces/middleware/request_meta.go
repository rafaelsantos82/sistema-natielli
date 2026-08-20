package middleware

import (
	"espaco-terapia-os/backend/internal/platform/requestcontext"

	"github.com/gin-gonic/gin"
)

// RequestMeta injeta IP e User-Agent no contexto da requisição.
func RequestMeta() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := requestcontext.WithClientIP(c.Request.Context(), c.ClientIP())
		ctx = requestcontext.WithUserAgent(ctx, c.Request.UserAgent())
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}

// ActorContext injeta ator autenticado (após RequireAuth).
func ActorContext() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := requestcontext.WithActor(c.Request.Context(), c.GetString("user_id"), "", c.GetString("role"))
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}
