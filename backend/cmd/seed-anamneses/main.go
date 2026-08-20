// seed-anamneses carrega templates de anamnese (JSON) no PostgreSQL de forma idempotente.
package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"log/slog"
	"os"
	"path/filepath"

	"espaco-terapia-os/backend/internal/config"
	"espaco-terapia-os/backend/internal/database"
	"espaco-terapia-os/backend/internal/seedanamnese"

	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load(".env")
	_ = godotenv.Load(".env.local")

	dataDir := flag.String("data-dir", "data/anamneses", "diretório com *.json canônicos")
	only := flag.String("only", "", "processar apenas este slug")
	dryRun := flag.Bool("dry-run", false, "validar sem gravar no banco")
	flag.Parse()

	cfg := config.New()
	if err := cfg.Validate(); err != nil {
		log.Fatalf("config: %v", err)
	}

	logger := slog.New(slog.NewTextHandler(os.Stderr, nil))
	db, err := database.NewPostgres(cfg, logger)
	if err != nil {
		log.Fatalf("db: %v", err)
	}

	absDir, _ := filepath.Abs(*dataDir)
	templates, err := seedanamnese.LoadTemplates(absDir, *only)
	if err != nil {
		log.Fatalf("load: %v", err)
	}
	if len(templates) == 0 {
		log.Fatalf("nenhum template em %s", absDir)
	}

	res, err := seedanamnese.UpsertTemplates(context.Background(), db, templates, *dryRun)
	if err != nil {
		log.Fatalf("seed: %v", err)
	}

	mode := "applied"
	if *dryRun {
		mode = "dry-run"
	}
	fmt.Printf("seed-anamneses (%s): created=%d updated=%d skipped=%d (files=%d)\n",
		mode, res.Created, res.Updated, res.Skipped, len(templates))
}
