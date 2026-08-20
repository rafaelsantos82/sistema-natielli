package seedanamnese

import (
	"strings"
	"testing"
)

func TestParseMarkdown_skipsHeaderMetadata(t *testing.T) {
	lines := []string{
		"Data da Anamnese: ___ Profissional: ___",
		"A gravidez foi planejada por ambos? Sim ( ) Não ( )",
	}
	qs := ParsePlainText(lines, "to")
	if len(qs) != 1 {
		t.Fatalf("expected 1 question, got %d", len(qs))
	}
	if !strings.Contains(qs[0].Text, "planejada") {
		t.Fatalf("unexpected text: %q", qs[0].Text)
	}
	if qs[0].Type != "boolean" {
		t.Fatalf("expected boolean, got %q", qs[0].Type)
	}
}

func TestValidateTemplate_rejectsEmptyQuestionnaire(t *testing.T) {
	err := ValidateTemplate(TemplateFile{
		Slug: "x",
		Anamnese: AnamneseMeta{
			Nome: "Test", Versao: "1.0", Status: "Ativa",
		},
		Questionnaire: nil,
	})
	if err == nil {
		t.Fatal("expected error for empty questionnaire")
	}
}

func TestStripMarkdownImageData(t *testing.T) {
	in := "line\n[image1]: <data:image/png;base64,abc>"
	out := StripMarkdownImageData(in)
	if strings.Contains(out, "base64") {
		t.Fatal("image data should be stripped")
	}
}
