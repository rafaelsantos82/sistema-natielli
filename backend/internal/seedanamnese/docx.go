package seedanamnese

import (
	"archive/zip"
	"fmt"
	"io"
	"regexp"
	"strings"
)

var reXMLText = regexp.MustCompile(`<w:t[^>]*>([^<]*)</w:t>`)

// DocxToPlainText extracts visible text from a .docx (word/document.xml).
func DocxToPlainText(path string) (string, error) {
	r, err := zip.OpenReader(path)
	if err != nil {
		return "", err
	}
	defer r.Close()
	var doc []byte
	for _, f := range r.File {
		if f.Name != "word/document.xml" {
			continue
		}
		rc, err := f.Open()
		if err != nil {
			return "", err
		}
		doc, err = io.ReadAll(rc)
		rc.Close()
		if err != nil {
			return "", err
		}
		break
	}
	if len(doc) == 0 {
		return "", fmt.Errorf("word/document.xml não encontrado em %s", path)
	}
	var b strings.Builder
	for _, m := range reXMLText.FindAllSubmatch(doc, -1) {
		b.Write(m[1])
	}
	// Insert newlines before section-like caps words
	out := b.String()
	out = strings.ReplaceAll(out, "Identificação", "\nIdentificação\n")
	out = strings.ReplaceAll(out, "Queixa principal", "\nQueixa principal\n")
	out = strings.ReplaceAll(out, "Histórico", "\nHistórico\n")
	return out, nil
}

// DocxToLines splits docx text into pseudo-lines for the parser.
func DocxToLines(path string) ([]string, error) {
	text, err := DocxToPlainText(path)
	if err != nil {
		return nil, err
	}
	text = strings.ReplaceAll(text, "?", "?\n")
	text = strings.ReplaceAll(text, "(  )", "\n(  ) ")
	text = strings.ReplaceAll(text, "Se sim", "\nSe sim")
	var lines []string
	for _, chunk := range strings.Split(text, "\n") {
		chunk = strings.TrimSpace(chunk)
		if chunk != "" {
			lines = append(lines, chunk)
		}
	}
	return lines, nil
}
