package seedpacientes

import (
	"strings"
	"unicode"

	"github.com/google/uuid"
)

func InferUnidade(cidade, etiqueta string) (uuid.UUID, string) {
	blob := foldASCII(cidade + " " + etiqueta)
	switch {
	case strings.Contains(blob, "catanduva") || strings.Contains(blob, "cantanduva") || strings.Contains(blob, "cataduva"):
		return UnidadeCatanduva, "unidade-catanduva"
	case strings.Contains(blob, "londrina"):
		return UnidadeLondrina, "unidade-londrina"
	case strings.Contains(blob, "sertan"):
		return UnidadeSertanopolis, "unidade-sertanopolis"
	case strings.Contains(blob, "online"):
		return UnidadeOnline, "unidade-online"
	default:
		return UnidadeOnline, "unidade-online"
	}
}

func normalizeCidade(s string) string {
	k := foldASCII(s)
	switch {
	case strings.Contains(k, "catanduva") || k == "cantanduva" || k == "cataduva":
		return "Catanduva"
	case strings.Contains(k, "sertan"):
		return "Sertanópolis"
	case strings.Contains(k, "londrina"):
		return "Londrina"
	default:
		return strings.TrimSpace(s)
	}
}

func normalizeUF(estado string) string {
	e := strings.ToUpper(strings.TrimSpace(estado))
	if e == "INT" {
		return "EX"
	}
	if len(e) == 2 {
		return e
	}
	return e
}

func foldASCII(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	var b strings.Builder
	for _, r := range s {
		switch r {
		case 'á', 'à', 'â', 'ã':
			b.WriteByte('a')
		case 'é', 'ê':
			b.WriteByte('e')
		case 'í':
			b.WriteByte('i')
		case 'ó', 'ô', 'õ':
			b.WriteByte('o')
		case 'ú':
			b.WriteByte('u')
		case 'ç':
			b.WriteByte('c')
		default:
			if unicode.IsSpace(r) {
				b.WriteByte(' ')
			} else {
				b.WriteRune(r)
			}
		}
	}
	return b.String()
}
