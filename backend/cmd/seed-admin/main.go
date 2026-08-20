// seed-admin cria ou atualiza um usuário administrador com senha bcrypt (uso local/dev).
package main

import (
	"context"
	"fmt"
	"log"
	"log/slog"
	"os"
	"strings"

	"espaco-terapia-os/backend/internal/config"
	"espaco-terapia-os/backend/internal/database"
	"espaco-terapia-os/backend/internal/domain/entity"
	"espaco-terapia-os/backend/internal/domain/service"
	infradb "espaco-terapia-os/backend/internal/infrastructure/database"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load(".env")
	_ = godotenv.Load(".env.local")

	email := strings.TrimSpace(os.Getenv("ADMIN_EMAIL"))
	password := os.Getenv("ADMIN_PASSWORD")
	name := strings.TrimSpace(os.Getenv("ADMIN_NAME"))
	if name == "" {
		name = "Administrador"
	}

	if email == "" || password == "" {
		log.Fatal("ADMIN_EMAIL e ADMIN_PASSWORD são obrigatórios")
	}
	if len(password) < 8 {
		log.Fatal("ADMIN_PASSWORD deve ter no mínimo 8 caracteres")
	}

	cfg := config.New()
	if err := cfg.Validate(); err != nil {
		log.Fatalf("config: %v", err)
	}

	logger := slog.New(slog.NewTextHandler(os.Stderr, nil))
	db, err := database.NewPostgres(cfg, logger)
	if err != nil {
		log.Fatalf("db: %v", err)
	}

	hash, err := service.HashPassword(password)
	if err != nil {
		log.Fatalf("hash: %v", err)
	}

	repo := infradb.NewPostgresUserRepository(db)
	ctx := context.Background()

	existing, err := repo.FindByEmail(ctx, email)
	if err != nil {
		log.Fatalf("find: %v", err)
	}

	if existing != nil {
		existing.Name = name
		existing.PasswordHash = hash
		existing.Role = entity.UserRoleAdmin
		if err := repo.Update(ctx, existing); err != nil {
			log.Fatalf("update: %v", err)
		}
		fmt.Printf("Admin atualizado: %s (%s)\n", existing.Name, existing.Email)
		return
	}

	u := &entity.User{
		ID:           uuid.New(),
		Name:         name,
		Email:        strings.ToLower(email),
		PasswordHash: hash,
		Role:         entity.UserRoleAdmin,
	}
	if err := repo.Create(ctx, u); err != nil {
		log.Fatalf("create: %v", err)
	}
	fmt.Printf("Admin criado: %s (%s) id=%s\n", u.Name, u.Email, u.ID)
}
