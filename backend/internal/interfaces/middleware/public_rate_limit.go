package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type ipWindow struct {
	count int
	start time.Time
}

// PublicRateLimit limita requisições por IP em rotas públicas (janela fixa).
func PublicRateLimit(maxPerMinute int) gin.HandlerFunc {
	var mu sync.Mutex
	windows := map[string]*ipWindow{}

	return func(c *gin.Context) {
		ip := c.ClientIP()
		now := time.Now()
		mu.Lock()
		w, ok := windows[ip]
		if !ok || now.Sub(w.start) > time.Minute {
			windows[ip] = &ipWindow{count: 1, start: now}
			mu.Unlock()
			c.Next()
			return
		}
		w.count++
		if w.count > maxPerMinute {
			mu.Unlock()
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": gin.H{"code": "RATE_LIMIT", "message": "Muitas requisições. Tente novamente em instantes."},
			})
			return
		}
		mu.Unlock()
		c.Next()
	}
}
