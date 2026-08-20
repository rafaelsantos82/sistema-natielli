// @title			Espaço Terapia API
// @version		1.0
// @description	API REST do Espaço Terapia OS (clínica pediátrica multi-filial)
// @BasePath		/api/v1
// @securityDefinitions.apikey	BearerAuth
// @in				header
// @name			Authorization
package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"espaco-terapia-os/backend/internal/config"
	"espaco-terapia-os/backend/internal/database"
	applog "espaco-terapia-os/backend/internal/infrastructure/logging"
	"espaco-terapia-os/backend/internal/infrastructure/observability"
	httprouter "espaco-terapia-os/backend/internal/interfaces/http/routes"

	"github.com/getsentry/sentry-go"
	sentrygin "github.com/getsentry/sentry-go/gin"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	cfg := config.New()
	logger := applog.New(cfg)
	if err := cfg.Validate(); err != nil {
		logger.Error("invalid configuration", slog.String("error", err.Error()))
		os.Exit(1)
	}

	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	if err := observability.InitSentry(cfg); err != nil {
		logger.Error("sentry init failed", slog.String("error", err.Error()))
	} else if cfg.SentryDSN != "" {
		defer observability.FlushSentry()
		logger.Info("sentry enabled", slog.String("environment", cfg.SentryEnvironment))
	}

	db, err := database.NewPostgres(cfg, logger)
	if err != nil {
		logger.Error("database connection failed", slog.String("error", err.Error()))
		os.Exit(1)
	}

	router := httprouter.Setup(cfg, logger, db)
	if cfg.SentryDSN != "" {
		router.Use(sentrygin.New(sentrygin.Options{
			Repanic:         true,
			WaitForDelivery: false,
			Timeout:         5 * time.Second,
		}))
		router.Use(func(c *gin.Context) {
			if hub := sentry.GetHubFromContext(c.Request.Context()); hub != nil {
				hub.Scope().SetTag("request_id", c.GetString("request_id"))
				if uid := c.GetString("user_id"); uid != "" {
					hub.Scope().SetUser(sentry.User{ID: uid})
				}
			}
			c.Next()
		})
	}

	srv := &http.Server{
		Addr:              ":" + cfg.ServerPort,
		Handler:           router,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	go func() {
		logger.Info("starting api server", slog.String("address", srv.Addr))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("api server stopped with error", slog.String("error", err.Error()))
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("shutting down api server")
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		logger.Error("graceful shutdown failed", slog.String("error", err.Error()))
		os.Exit(1)
	}
	logger.Info("api server stopped")
}
