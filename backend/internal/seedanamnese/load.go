package seedanamnese

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// LoadTemplates reads canonical *.json from dataDir (skips *.draft.json and reviews/).
func LoadTemplates(dataDir string, onlySlug string) ([]TemplateFile, error) {
	entries, err := os.ReadDir(dataDir)
	if err != nil {
		return nil, fmt.Errorf("read data dir: %w", err)
	}
	var out []TemplateFile
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		name := e.Name()
		if !strings.HasSuffix(name, ".json") || strings.HasSuffix(name, ".draft.json") {
			continue
		}
		slug := strings.TrimSuffix(name, ".json")
		if onlySlug != "" && slug != onlySlug {
			continue
		}
		t, err := LoadTemplateFile(filepath.Join(dataDir, name))
		if err != nil {
			return nil, err
		}
		if t.Slug == "" {
			t.Slug = slug
		}
		out = append(out, t)
	}
	return out, nil
}

// LoadTemplateFile parses one JSON file.
func LoadTemplateFile(path string) (TemplateFile, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return TemplateFile{}, err
	}
	var t TemplateFile
	if err := json.Unmarshal(raw, &t); err != nil {
		return TemplateFile{}, fmt.Errorf("%s: %w", path, err)
	}
	return t, nil
}

// ValidateTemplate checks questionnaire shape before DB write.
func ValidateTemplate(t TemplateFile) error {
	if strings.TrimSpace(t.Anamnese.Nome) == "" {
		return fmt.Errorf("slug %s: nome obrigatório", t.Slug)
	}
	if strings.TrimSpace(t.Anamnese.Versao) == "" {
		return fmt.Errorf("slug %s: versao obrigatória", t.Slug)
	}
	st := t.Anamnese.Status
	if st == "" {
		st = "Ativa"
	}
	if st != "Ativa" && st != "Inativa" {
		return fmt.Errorf("slug %s: status inválido %q", t.Slug, st)
	}
	if len(t.Questionnaire) == 0 {
		return fmt.Errorf("slug %s: questionnaire vazio", t.Slug)
	}
	seen := map[string]struct{}{}
	for i, q := range t.Questionnaire {
		if strings.TrimSpace(q.LinkID) == "" || strings.TrimSpace(q.Text) == "" {
			return fmt.Errorf("slug %s: pergunta %d sem linkId ou text", t.Slug, i+1)
		}
		if _, ok := seen[q.LinkID]; ok {
			return fmt.Errorf("slug %s: linkId duplicado %q", t.Slug, q.LinkID)
		}
		seen[q.LinkID] = struct{}{}
		if q.Type == "" {
			return fmt.Errorf("slug %s: pergunta %s sem type", t.Slug, q.LinkID)
		}
	}
	return nil
}

// WriteTemplateFile saves JSON with indentation.
func WriteTemplateFile(path string, t TemplateFile) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	raw, err := json.MarshalIndent(t, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, append(raw, '\n'), 0o644)
}
