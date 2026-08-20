package seedanamnese

import (
	"regexp"
	"strings"
	"unicode"

	"github.com/google/uuid"
)

var (
	reUnderscores = regexp.MustCompile(`_{2,}`)
	reSpaces      = regexp.MustCompile(`\s+`)
	reImageRef    = regexp.MustCompile(`^\[image\d+\]:`)
	reBold        = regexp.MustCompile(`\*\*([^*]+)\*\*`)
)

var headerSkip = []string{
	"data da anamnese",
	"profissional:",
	"nome do(a) paciente",
	"nome do paciente",
	"nome:",
	"idade:",
	"entrevistado",
	"grau de parentesco",
	"data de nascimento",
	"endereço:",
	"endereco:",
	"email:",
	"anamnese terapia ocupacional",
	"anamnese fonoaudiologia",
	"ficha de anamnese",
	"ficha clínica inicial",
	"ficha clinica inicial",
	"identificação",
	"identificacao",
}

// ParsePlainText extracts question candidates from normalized plain text.
func ParsePlainText(lines []string, sectionPrefix string) []QuestionItem {
	var out []QuestionItem
	used := map[string]int{}
	section := sectionPrefix

	for _, raw := range lines {
		line := normalizeLine(raw)
		if line == "" || reImageRef.MatchString(line) {
			continue
		}
		if isSectionHeader(line) {
			section = slugify(line)
			continue
		}
		if isHeaderMetadata(line) {
			continue
		}
		if isOnlyUnderscores(line) {
			continue
		}

		parts := splitQuestionParts(line)
		for _, part := range parts {
			q := buildQuestion(part, section, used)
			if q != nil {
				out = append(out, *q)
			}
		}
	}
	return out
}

func normalizeLine(s string) string {
	s = strings.TrimSpace(s)
	s = reUnderscores.ReplaceAllString(s, " ")
	s = reBold.ReplaceAllString(s, "$1")
	s = strings.ReplaceAll(s, "\\", "")
	s = reSpaces.ReplaceAllString(s, " ")
	return strings.TrimSpace(s)
}

func isSectionHeader(line string) bool {
	if strings.Contains(line, "?") {
		return false
	}
	upper := 0
	for _, r := range line {
		if unicode.IsLetter(r) {
			if unicode.IsUpper(r) {
				upper++
			}
		}
	}
	letters := len([]rune(line))
	if letters < 4 {
		return false
	}
	// Mostly uppercase section titles
	if upper*100/letters >= 70 && len(line) < 80 {
		return true
	}
	return false
}

func isHeaderMetadata(line string) bool {
	low := strings.ToLower(line)
	for _, h := range headerSkip {
		if strings.HasPrefix(low, h) {
			return true
		}
	}
	// Table markdown rows without question marks — handled separately
	if strings.HasPrefix(line, "|") && !strings.Contains(line, "?") {
		return strings.Contains(strings.ToUpper(line), "VESTIR") ||
			strings.Contains(strings.ToUpper(line), "-----")
	}
	return false
}

func isOnlyUnderscores(line string) bool {
	stripped := strings.ReplaceAll(line, "_", "")
	stripped = strings.TrimSpace(stripped)
	return stripped == ""
}

func splitQuestionParts(line string) []string {
	// Split combined lines: "A? B? C?"
	if strings.Count(line, "?") > 1 {
		var parts []string
		rest := line
		for {
			idx := strings.Index(rest, "?")
			if idx < 0 {
				if strings.TrimSpace(rest) != "" {
					parts = append(parts, strings.TrimSpace(rest))
				}
				break
			}
			part := strings.TrimSpace(rest[:idx+1])
			if part != "" {
				parts = append(parts, part)
			}
			rest = strings.TrimSpace(rest[idx+1:])
		}
		return parts
	}
	return []string{line}
}

func buildQuestion(text, section string, used map[string]int) *QuestionItem {
	text = strings.TrimSpace(strings.TrimRight(text, "_"))
	if len(text) < 8 {
		return nil
	}
	if isHeaderMetadata(text) {
		return nil
	}

	qType, options := inferType(text)
	if qType == "" {
		qType = "text"
	}
	linkBase := section + "_" + slugify(text)
	if linkBase == "_" || linkBase == "" {
		linkBase = "q_" + slugify(text)
	}
	linkID := uniqueLinkID(linkBase, used)

	item := QuestionItem{
		LinkID: linkID,
		Text:   text,
		Type:   qType,
	}
	if len(options) > 0 {
		item.Options = options
	}
	return &item
}

func inferType(text string) (string, []ChoiceOption) {
	low := strings.ToLower(text)
	hasSimNao := strings.Contains(low, "sim (") || strings.Contains(low, "sim(") ||
		strings.Contains(low, "não (") || strings.Contains(low, "nao (")
	hasParenChoice := strings.Count(text, "( )") >= 2 || strings.Count(text, "()") >= 2

	if hasSimNao && strings.Contains(text, "não sabe") || strings.Contains(text, "nao sabe") {
		return "choice", []ChoiceOption{
			{Value: "sim", Label: "Sim"},
			{Value: "nao", Label: "Não"},
			{Value: "nao_sei", Label: "Não sei"},
		}
	}
	if hasSimNao || (hasParenChoice && strings.Contains(text, "?")) {
		return "boolean", nil
	}
	if hasParenChoice && !strings.Contains(text, "?") {
		return "choice", extractParenChoices(text)
	}
	if strings.Contains(text, "?") {
		return "text", nil
	}
	if strings.Contains(low, "quando") || strings.Contains(low, "qual") ||
		strings.Contains(low, "descreva") || strings.Contains(low, "como foi") {
		return "text", nil
	}
	// Label with blank (underscores removed) — open text
	if strings.HasSuffix(text, ":") || len(text) > 20 {
		return "text", nil
	}
	return "", nil
}

func extractParenChoices(text string) []ChoiceOption {
	// e.g. ( ) a termo ( ) prematuro
	parts := strings.Split(text, "(")
	var opts []ChoiceOption
	for _, p := range parts {
		p = strings.TrimSpace(strings.Trim(p, ")"))
		if p == "" || p == " " {
			continue
		}
		if len(p) > 40 {
			continue
		}
		opts = append(opts, ChoiceOption{Value: slugify(p), Label: p})
	}
	return opts
}

func slugify(s string) string {
	s = strings.ToLower(s)
	var b strings.Builder
	lastDash := false
	for _, r := range s {
		if unicode.IsLetter(r) || unicode.IsNumber(r) {
			b.WriteRune(r)
			lastDash = false
			continue
		}
		if !lastDash && b.Len() > 0 {
			b.WriteByte('_')
			lastDash = true
		}
	}
	out := strings.Trim(b.String(), "_")
	if len(out) > 55 {
		out = out[:55]
		out = strings.Trim(out, "_")
	}
	if out == "" {
		return "item"
	}
	return out
}

func uniqueLinkID(base string, used map[string]int) string {
	if used[base] == 0 {
		used[base] = 1
		return base
	}
	used[base]++
	return base + "_" + strings.ReplaceAll(uuid.New().String()[:8], "-", "")
}

// ParseMarkdownFile reads and parses a markdown anamnese source.
func ParseMarkdownFile(content string) []QuestionItem {
	content = StripMarkdownImageData(content)
	lines := strings.Split(content, "\n")
	return ParsePlainText(lines, "to")
}

// StripMarkdownImageData removes embedded image data URLs from markdown exports.
func StripMarkdownImageData(content string) string {
	idx := strings.Index(content, "\n[image")
	if idx >= 0 {
		content = content[:idx]
	}
	return content
}

// ParseTableRows extracts questions from markdown table cells in TO form.
func ParseTableRows(lines []string, used map[string]int) []QuestionItem {
	var out []QuestionItem
	for _, raw := range lines {
		if !strings.Contains(raw, "|") {
			continue
		}
		cells := strings.Split(raw, "|")
		for _, cell := range cells {
			cell = normalizeLine(cell)
			if cell == "" || strings.Contains(cell, "---") {
				continue
			}
			if !strings.Contains(cell, "?") && !strings.Contains(strings.ToLower(cell), "veste") &&
				!strings.Contains(strings.ToLower(cell), "tira") && !strings.Contains(strings.ToLower(cell), "toma") &&
				!strings.Contains(strings.ToLower(cell), "consegue") && !strings.Contains(strings.ToLower(cell), "possui") {
				continue
			}
			for _, part := range splitQuestionParts(cell) {
				if !strings.HasSuffix(part, "?") && len(part) < 15 {
					part = part + "?"
				}
				q := buildQuestion(part, "autonomia", used)
				if q != nil {
					out = append(out, *q)
				}
			}
		}
	}
	return out
}
