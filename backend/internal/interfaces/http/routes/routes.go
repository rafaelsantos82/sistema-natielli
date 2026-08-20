package routes

import (
	"context"
	"log/slog"

	"espaco-terapia-os/backend/internal/config"
	"espaco-terapia-os/backend/internal/domain/service"
	"espaco-terapia-os/backend/internal/infrastructure/auth"
	"espaco-terapia-os/backend/internal/infrastructure/database"
	httplayer "espaco-terapia-os/backend/internal/interfaces/http"
	httphandler "espaco-terapia-os/backend/internal/interfaces/http/handlers"
	"espaco-terapia-os/backend/internal/interfaces/middleware"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gorm.io/gorm"

	_ "espaco-terapia-os/backend/docs"
)

func Setup(cfg *config.Config, logger *slog.Logger, db *gorm.DB) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.RequestMeta())
	r.Use(middleware.AccessLog(cfg, logger))
	r.Use(middleware.CORS(cfg.CORSAllowedOrigins))

	revocationRepo := database.NewPostgresJWTRevocationRepository(db)
	go func() {
		_ = revocationRepo.CleanupExpired(context.Background())
	}()

	healthHandler := httphandler.NewHealthHandler()
	errorHandler := httplayer.NewErrorHandler(logger)
	jwtService := auth.NewJWTService(cfg.JWTSecret, cfg.JWTIssuer, cfg.JWTExpirationMin, revocationRepo)
	accessControlRepo := database.NewPostgresAccessControlRepository(db)
	dataScopeRepo := database.NewPostgresDataScopeRepository(db)
	accessControlService := service.NewAccessControlService(accessControlRepo, dataScopeRepo)

	auditSvc := service.NewAuditService(database.NewWaveStores(db).AuditLog, logger)
	authApp, _ := NewAuthStack(db, cfg, jwtService, auditSvc, accessControlService)
	authHandler := httphandler.NewAuthHandler(authApp, errorHandler, jwtService, cfg.BootstrapAuth, cfg.BootstrapAuthToken)

	moduleDeps := NewModuleDeps(db, logger, errorHandler, auditSvc, cfg.FrontendPublicURL)

	api := r.Group("/api/v1")
	{
		api.GET("/health", healthHandler.Health)
		api.HEAD("/health", func(c *gin.Context) { c.Status(200) })
		api.POST("/auth/login", authHandler.Login)
		api.POST("/auth/forgot-password", authHandler.ForgotPassword)
		api.POST("/auth/reset-password", authHandler.ResetPassword)
		api.POST("/auth/token", authHandler.IssueToken)

		RegisterContratosPublicRoutes(api, moduleDeps)

		protected := api.Group("/")
		protected.Use(middleware.RequireConfiguredSecret(cfg.JWTSecret))
		protected.Use(middleware.RequireAuth(jwtService))
		protected.Use(middleware.ActorContext())
		protected.Use(middleware.GinUserContext())
		protected.Use(middleware.RequirePasswordChanged())
		{
			protected.GET("/auth/me", authHandler.Me)
			protected.PATCH("/auth/me", authHandler.UpdateProfile)
			protected.POST("/auth/logout", authHandler.Logout)
			protected.PUT("/auth/me/password", authHandler.ChangePassword)

			RegisterProtectedRoutes(protected, moduleDeps)

			adminOnly := protected.Group("/admin")
			adminOnly.Use(middleware.RequireRole("admin"))
			adminOnly.GET("/health", healthHandler.Health)
		}

		if cfg.SwaggerEnabled {
			api.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
		}
	}

	return r
}
