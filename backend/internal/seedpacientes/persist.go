package seedpacientes

import (
	"context"
	"errors"

	"gorm.io/gorm"
)

// ErrSchemaNotReady is returned by --apply until commercial tables exist.
var ErrSchemaNotReady = errors.New("pendências comerciais: schema ainda não implementado (planos comerciais, check-ins, etiquetas)")

type MatchReport struct {
	Matched        int
	Unmatched      int
	UnmatchedNames []string
}

func MatchPendencias(ctx context.Context, db *gorm.DB, file PendenciasFile) (MatchReport, error) {
	idx, err := LoadLookup(ctx, db)
	if err != nil {
		return MatchReport{}, err
	}
	rep := MatchReport{}
	for _, rec := range file.Records {
		if _, ok := idx.Match(rec.Identity); ok {
			rep.Matched++
			continue
		}
		rep.Unmatched++
		if len(rep.UnmatchedNames) < 20 {
			rep.UnmatchedNames = append(rep.UnmatchedNames, redactName(rec.Identity.NomeCompleto))
		}
	}
	return rep, nil
}

// PersistPendencias is the future apply hook. Join is ready; writes are not.
func PersistPendencias(ctx context.Context, db *gorm.DB, file PendenciasFile) error {
	if _, err := MatchPendencias(ctx, db, file); err != nil {
		return err
	}
	return persistPendencias(ctx, db, file)
}

func persistPendencias(_ context.Context, _ *gorm.DB, _ PendenciasFile) error {
	// TODO: INSERT em tabelas de plano comercial / tags / check-ins quando o schema existir.
	// Resolução de paciente_id já está em MatchPendencias / LookupIndex.Match.
	return ErrSchemaNotReady
}
