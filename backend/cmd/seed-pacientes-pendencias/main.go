package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"log"
	"log/slog"
	"os"

	"espaco-terapia-os/backend/internal/config"
	"espaco-terapia-os/backend/internal/database"
	"espaco-terapia-os/backend/internal/seedpacientes"

	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load(".env")
	_ = godotenv.Load(".env.local")

	in := flag.String("in", "data/imports/pendencias-comerciais.json", "JSON gerado por seed-pacientes")
	dryRun := flag.Bool("dry-run", false, "somente resolver paciente_id")
	apply := flag.Bool("apply", false, "persistir (bloqueado até existir schema)")
	flag.Parse()

	file, err := seedpacientes.LoadPendencias(*in)
	if err != nil {
		log.Fatalf("load: %v", err)
	}
	fmt.Printf("pendencias: records=%d schema=%d\n", len(file.Records), file.SchemaVersion)

	cfg := config.New()
	if err := cfg.Validate(); err != nil {
		log.Fatalf("config: %v", err)
	}
	logger := slog.New(slog.NewTextHandler(os.Stderr, nil))
	db, err := database.NewPostgres(cfg, logger)
	if err != nil {
		log.Fatalf("db: %v", err)
	}

	ctx := context.Background()
	rep, err := seedpacientes.MatchPendencias(ctx, db, file)
	if err != nil {
		log.Fatalf("match: %v", err)
	}
	fmt.Printf("seed-pacientes-pendencias (dry-run): matched=%d unmatched=%d\n", rep.Matched, rep.Unmatched)
	for _, n := range rep.UnmatchedNames {
		fmt.Printf("  unmatched: %s\n", n)
	}

	if *apply && !*dryRun {
		if err := seedpacientes.PersistPendencias(ctx, db, file); err != nil {
			if errors.Is(err, seedpacientes.ErrSchemaNotReady) {
				fmt.Fprintln(os.Stderr, err.Error())
				os.Exit(2)
			}
			log.Fatalf("apply: %v", err)
		}
	}
}
