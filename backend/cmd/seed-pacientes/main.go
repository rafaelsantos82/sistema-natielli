package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"log/slog"
	"os"
	"path/filepath"
	"strings"

	"espaco-terapia-os/backend/internal/config"
	"espaco-terapia-os/backend/internal/database"
	"espaco-terapia-os/backend/internal/seedpacientes"

	"github.com/joho/godotenv"
)

type stringList []string

func (s *stringList) String() string { return strings.Join(*s, ",") }
func (s *stringList) Set(v string) error {
	*s = append(*s, v)
	return nil
}

func main() {
	_ = godotenv.Load(".env")
	_ = godotenv.Load(".env.local")

	var files stringList
	dryRun := flag.Bool("dry-run", false, "validar sem gravar no banco")
	apply := flag.Bool("apply", false, "gravar cadastro no banco")
	pendenciasOut := flag.String("pendencias-out", "data/imports/pendencias-comerciais.json", "JSON de pendências comerciais")
	flag.Var(&files, "xlsx", "planilha .xlsx (repetir a flag para várias; as últimas sobrescrevem WhatsApp igual)")
	flag.Parse()

	if len(files) == 0 {
		log.Fatal("informe ao menos um --xlsx")
	}
	doApply := *apply && !*dryRun

	loaded := make([]struct {
		Path string
		Rows []seedpacientes.RawRow
	}, 0, len(files))
	for _, p := range files {
		rows, err := seedpacientes.LoadXLSX(p)
		if err != nil {
			log.Fatalf("load %s: %v", p, err)
		}
		loaded = append(loaded, struct {
			Path string
			Rows []seedpacientes.RawRow
		}{Path: p, Rows: rows})
		fmt.Printf("lido %s: %d linhas\n", filepath.Base(p), len(rows))
	}

	unified := seedpacientes.Unify(loaded)
	fmt.Printf("unificados: %d\n", len(unified))

	pend := seedpacientes.BuildPendencias(unified)
	if err := seedpacientes.WritePendencias(*pendenciasOut, pend); err != nil {
		log.Fatalf("pendencias: %v", err)
	}
	fmt.Printf("pendencias escritas: %s (records=%d)\n", *pendenciasOut, pend.Counts["records"])

	cfg := config.New()
	if err := cfg.Validate(); err != nil {
		log.Fatalf("config: %v", err)
	}
	logger := slog.New(slog.NewTextHandler(os.Stderr, nil))
	db, err := database.NewPostgres(cfg, logger)
	if err != nil {
		log.Fatalf("db: %v", err)
	}

	mode := "dry-run"
	if doApply {
		mode = "apply"
	}
	rep, err := seedpacientes.ApplyCadastro(context.Background(), db, unified, !doApply)
	if err != nil {
		log.Fatalf("apply: %v", err)
	}
	rep.PendenciasWritten = pend.Counts["records"]
	fmt.Printf("seed-pacientes (%s): created=%d skipped=%d invalid=%d pendencias=%d\n",
		mode, rep.Created, rep.Skipped, rep.Invalid, rep.PendenciasWritten)
	for _, issue := range rep.Issues {
		fmt.Printf("  issue: %s\n", issue)
	}
	if rep.Invalid > 0 && doApply {
		os.Exit(1)
	}
}
