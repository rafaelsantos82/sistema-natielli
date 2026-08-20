package seedanamnese

import (
	"context"
	"encoding/json"
	"fmt"

	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/domain/service"
	infradb "espaco-terapia-os/backend/internal/infrastructure/database"

	"gorm.io/gorm"
)

// UpsertResult counts seed operations.
type UpsertResult struct {
	Created int
	Updated int
	Skipped int
}

// UpsertTemplates applies templates idempotently by (nome, versao).
func UpsertTemplates(ctx context.Context, db *gorm.DB, templates []TemplateFile, dryRun bool) (UpsertResult, error) {
	store := infradb.NewWaveStores(db).Anamnese
	var res UpsertResult

	existing, err := store.List(ctx, repository.CRUDListFilter{Page: 1, PageSize: 500})
	if err != nil {
		return res, fmt.Errorf("list anamneses: %w", err)
	}
	byKey := map[string]service.AnamneseDTO{}
	for _, a := range existing.Items {
		byKey[key(a.Nome, a.Versao)] = a
	}

	for _, t := range templates {
		if err := ValidateTemplate(t); err != nil {
			return res, err
		}
		qRaw, err := json.Marshal(t.Questionnaire)
		if err != nil {
			return res, fmt.Errorf("marshal questionnaire %s: %w", t.Slug, err)
		}
		status := t.Anamnese.Status
		if status == "" {
			status = "Ativa"
		}
		in := service.AnamneseInput{
			Nome:          t.Anamnese.Nome,
			Especialidade: t.Anamnese.Especialidade,
			Versao:        t.Anamnese.Versao,
			Status:        status,
			Questionnaire: qRaw,
			Observacoes:   t.Anamnese.Observacoes,
		}
		k := key(in.Nome, in.Versao)
		if cur, ok := byKey[k]; ok {
			if dryRun {
				res.Updated++
				continue
			}
			if _, err := store.Update(ctx, cur.ID, in); err != nil {
				return res, fmt.Errorf("update %s: %w", t.Slug, err)
			}
			res.Updated++
			continue
		}
		if dryRun {
			res.Created++
			continue
		}
		if _, err := store.Create(ctx, in); err != nil {
			return res, fmt.Errorf("create %s: %w", t.Slug, err)
		}
		res.Created++
	}
	return res, nil
}

func key(nome, versao string) string {
	return nome + "\x00" + versao
}
