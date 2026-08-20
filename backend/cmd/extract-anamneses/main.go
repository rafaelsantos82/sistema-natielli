// extract-anamneses gera *.draft.json e reviews a partir dos arquivos em docs/anamnese.
package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"espaco-terapia-os/backend/internal/seedanamnese"
)

func main() {
	repoRoot := flag.String("repo-root", "..", "raiz do repositório (a partir de backend/)")
	outDir := flag.String("out-dir", "data/anamneses", "saída dos JSON")
	promote := flag.Bool("promote", false, "gravar também como *.json canônico (sem .draft)")
	only := flag.String("only", "", "slug: to-2024 | ficha-clinica-inicial | aba")
	flag.Parse()

	root, _ := filepath.Abs(*repoRoot)
	out, _ := filepath.Abs(*outDir)
	reviewsDir := filepath.Join(out, "reviews")

	if *only == "" || *only == "to-2024" {
		if err := extractTO(root, out, reviewsDir, *promote); err != nil {
			log.Fatalf("to-2024: %v", err)
		}
	}
	if *only == "" || *only == "ficha-clinica-inicial" {
		if err := extractFichaClinica(root, out, reviewsDir, *promote); err != nil {
			log.Fatalf("ficha-clinica: %v", err)
		}
	}
	if *only == "" || *only == "aba" {
		if err := extractABA(root, out, reviewsDir, *promote); err != nil {
			log.Printf("aba (aviso): %v — instale pandoc para extrair .docx", err)
		}
	}
	fmt.Println("extract-anamneses: concluído")
}

func extractTO(root, out, reviewsDir string, promote bool) error {
	src := filepath.Join(root, "backend/docs/anamnese/ANAMNESE ESP TERAPIA 2024.md")
	raw, err := os.ReadFile(src)
	if err != nil {
		return err
	}
	content := string(raw)
	lines := strings.Split(seedanamnese.StripMarkdownImageData(content), "\n")
	used := map[string]int{}
	questions := seedanamnese.ParsePlainText(lines, "to")
	questions = append(questions, seedanamnese.ParseTableRows(lines, used)...)

	obs := "Origem: ANAMNESE ESP TERAPIA 2024.md. Revisão clínica pendente."
	t := seedanamnese.TemplateFile{
		Slug: "to-2024",
		Meta: seedanamnese.TemplateMeta{
			SourceFile:       "backend/docs/anamnese/ANAMNESE ESP TERAPIA 2024.md",
			ExtractedAt:      time.Now().UTC().Format(time.RFC3339),
			ExtractorVersion: "1",
			ReviewStatus:     "draft",
		},
		Anamnese: seedanamnese.AnamneseMeta{
			Nome:          "Anamnese Terapia Ocupacional 2024",
			Especialidade: "Terapia Ocupacional",
			Versao:        "2024.1",
			Status:        "Ativa",
			Observacoes:   &obs,
		},
		Questionnaire: questions,
	}
	return writeOutputs(t, out, reviewsDir, "md:L1-L174", promote)
}

func extractFichaClinica(root, out, reviewsDir string, promote bool) error {
	pdf := filepath.Join(root, "backend/docs/anamnese/Modelo - Anamnese- atualizado.pdf")
	text, err := pdftotext(pdf)
	if err != nil {
		return err
	}
	lines := strings.Split(text, "\n")
	questions := seedanamnese.ParsePlainText(lines, "ficha")
	obs := "Origem: Modelo - Anamnese- atualizado.pdf (ficha clínica inicial)."
	t := seedanamnese.TemplateFile{
		Slug: "ficha-clinica-inicial",
		Meta: seedanamnese.TemplateMeta{
			SourceFile:       "backend/docs/anamnese/Modelo - Anamnese- atualizado.pdf",
			ExtractedAt:      time.Now().UTC().Format(time.RFC3339),
			ExtractorVersion: "1",
			ReviewStatus:     "draft",
		},
		Anamnese: seedanamnese.AnamneseMeta{
			Nome:          "Ficha Clínica Inicial",
			Especialidade: "Pediatria",
			Versao:        "2024.1",
			Status:        "Ativa",
			Observacoes:   &obs,
		},
		Questionnaire: questions,
	}
	return writeOutputs(t, out, reviewsDir, "pdf:ficha-clinica", promote)
}

func extractABA(root, out, reviewsDir string, promote bool) error {
	docx := filepath.Join(root, "backend/docs/anamnese/Anamnese-ABA.docx")
	lines, err := seedanamnese.DocxToLines(docx)
	if err != nil {
		return err
	}
	questions := seedanamnese.ParsePlainText(lines, "aba")
	obs := "Origem: Anamnese-ABA.docx"
	t := seedanamnese.TemplateFile{
		Slug: "aba",
		Meta: seedanamnese.TemplateMeta{
			SourceFile:       "backend/docs/anamnese/Anamnese-ABA.docx",
			ExtractedAt:      time.Now().UTC().Format(time.RFC3339),
			ExtractorVersion: "1",
			ReviewStatus:     "draft",
		},
		Anamnese: seedanamnese.AnamneseMeta{
			Nome:          "Anamnese ABA",
			Especialidade: "TEA/Autismo",
			Versao:        "2024.1",
			Status:        "Ativa",
			Observacoes:   &obs,
		},
		Questionnaire: questions,
	}
	return writeOutputs(t, out, reviewsDir, "docx:aba", promote)
}

func writeOutputs(t seedanamnese.TemplateFile, out, reviewsDir, sourceRef string, promote bool) error {
	draftPath := filepath.Join(out, t.Slug+".draft.json")
	if err := seedanamnese.WriteTemplateFile(draftPath, t); err != nil {
		return err
	}
	if err := seedanamnese.WriteReviewReport(t, sourceRef, reviewsDir); err != nil {
		return err
	}
	fmt.Printf("  %s: %d perguntas -> %s\n", t.Slug, len(t.Questionnaire), draftPath)
	if promote {
		canonical := filepath.Join(out, t.Slug+".json")
		if err := seedanamnese.WriteTemplateFile(canonical, t); err != nil {
			return err
		}
		fmt.Printf("  %s: promovido -> %s\n", t.Slug, canonical)
	}
	return nil
}

func pdftotext(pdfPath string) (string, error) {
	cmd := exec.Command("pdftotext", "-layout", pdfPath, "-")
	out, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("pdftotext: %w", err)
	}
	return string(out), nil
}
