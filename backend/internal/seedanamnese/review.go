package seedanamnese

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// WriteReviewReport generates backend/data/anamneses/reviews/<slug>.md
func WriteReviewReport(t TemplateFile, sourceRef string, reviewsDir string) error {
	if err := os.MkdirAll(reviewsDir, 0o755); err != nil {
		return err
	}
	var b strings.Builder
	b.WriteString(fmt.Sprintf("# Conferência: %s\n\n", t.Anamnese.Nome))
	b.WriteString(fmt.Sprintf("- **Slug:** `%s`\n", t.Slug))
	b.WriteString(fmt.Sprintf("- **Fonte:** %s\n", sourceRef))
	b.WriteString(fmt.Sprintf("- **Perguntas:** %d\n", len(t.Questionnaire)))
	b.WriteString(fmt.Sprintf("- **Gerado em:** %s\n\n", time.Now().Format("2006-01-02")))
	b.WriteString("| # | linkId | Tipo | Texto extraído | Fonte | Status |\n")
	b.WriteString("|---|--------|------|----------------|-------|--------|\n")
	for i, q := range t.Questionnaire {
		text := strings.ReplaceAll(q.Text, "|", "\\|")
		if len(text) > 120 {
			text = text[:117] + "..."
		}
		b.WriteString(fmt.Sprintf("| %d | %s | %s | %s | %s | PENDENTE |\n",
			i+1, q.LinkID, q.Type, text, sourceRef))
	}
	b.WriteString("\n## Checklist\n\n")
	b.WriteString("- [ ] Contagem conferida (amostra início/meio/fim)\n")
	b.WriteString("- [ ] Sem metadados de paciente como pergunta\n")
	b.WriteString("- [ ] Sem respostas manuscritas no texto\n")
	b.WriteString("- [ ] Preview UI OK\n")
	b.WriteString("- [ ] Revisor: _______________ Data: __________\n")

	path := filepath.Join(reviewsDir, t.Slug+".md")
	return os.WriteFile(path, []byte(b.String()), 0o644)
}
