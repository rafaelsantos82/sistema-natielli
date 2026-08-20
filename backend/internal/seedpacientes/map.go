package seedpacientes

import (
	"strconv"
	"strings"
	"time"

	"espaco-terapia-os/backend/internal/domain/entity"
)

var unknownBirth = time.Date(1900, 1, 1, 0, 0, 0, 0, time.UTC)

func MapCadastro(u UnifiedRecord) Cadastro {
	c := Cadastro{
		NomeCompleto:    strings.TrimSpace(u.Nome),
		NomeSocial:      ptrNonEmpty(u.Apelido),
		TelPrincipal:    u.TelDigits,
		CEP:             PlaceholderCEP,
		ResponsavelNome: strings.TrimSpace(u.Nome),
		Status:          mapStatus(u.StatusRaw),
		UF:              normalizeUF(u.Estado),
	}
	if cidade := normalizeCidade(u.Cidade); cidade != "" {
		c.Cidade = &cidade
	}
	c.UnidadeID, c.UnidadeSlug = InferUnidade(u.Cidade, u.EtiquetaRaw)

	notes := []string{ObsImportPrefix}

	nasc, unknown, nascIssue := parseNascimento(u.NascRaw)
	c.DataNascimento = nasc
	c.NascimentoUnknown = unknown
	if nascIssue != "" {
		c.Issues = append(c.Issues, nascIssue)
	}
	if unknown {
		notes = append(notes, "Data de nascimento não informada (placeholder 1900-01-01).")
	}

	if u.CPFDigits != "" {
		if entity.NormalizeCPF(u.CPFDigits) != "" && isLikelyValidCPF(u.CPFDigits) {
			cpf := entity.NormalizeCPF(u.CPFDigits)
			c.CPF = &cpf
		} else {
			c.Issues = append(c.Issues, "cpf_invalid")
			notes = append(notes, "CPF da planilha ignorado (formato inválido).")
		}
	} else {
		notes = append(notes, "CPF não informado na planilha.")
	}

	if u.Email != "" && strings.Contains(u.Email, "@") {
		c.Email = &u.Email
	}

	if cad, ok := parseDateFlexible(u.CadastroRaw); ok {
		t := cad.UTC()
		c.DataCadastro = &t
	}

	if len(c.UF) != 2 {
		c.Issues = append(c.Issues, "uf_invalid")
		c.UF = "EX"
		notes = append(notes, "UF da planilha inválida; gravado EX.")
	}

	notes = append(notes, "Sexo, CEP e responsável preenchidos com placeholder de importação.")
	c.Observacoes = strings.Join(notes, " ")
	return c
}

func mapStatus(raw string) string {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "ativo":
		return string(entity.PacienteAtivo)
	case "inativo", "pausado":
		return string(entity.PacienteInativo)
	case "falecido":
		return string(entity.PacienteFalecido)
	default:
		return string(entity.PacienteInativo)
	}
}

func parseNascimento(raw string) (time.Time, bool, string) {
	d, ok := parseDateFlexible(raw)
	if !ok {
		return unknownBirth, true, "nasc_unparsed"
	}
	if d.Year() == 2026 {
		return unknownBirth, true, ""
	}
	if d.After(time.Now()) {
		return unknownBirth, true, "nasc_future"
	}
	return d, false, ""
}

func parseDateFlexible(raw string) (time.Time, bool) {
	s := strings.TrimSpace(raw)
	if s == "" {
		return time.Time{}, false
	}
	if strings.Contains(s, ".") && !strings.Contains(s, "/") {
		if n, err := strconv.ParseFloat(s, 64); err == nil && n > 20000 && n < 60000 {
			base := time.Date(1899, 12, 30, 0, 0, 0, 0, time.UTC)
			return base.AddDate(0, 0, int(n)), true
		}
	}
	for _, layout := range []string{"02/01/2006", "2006-01-02", "02-01-2006", "2/1/2006"} {
		if t, err := time.ParseInLocation(layout, s, time.UTC); err == nil {
			return t, true
		}
	}
	return time.Time{}, false
}

func isLikelyValidCPF(digits string) bool {
	d := entity.NormalizeCPF(digits)
	return checksumCPF(d)
}

func checksumCPF(digits string) bool {
	if len(digits) != 11 {
		return false
	}
	allSame := true
	for i := 1; i < 11; i++ {
		if digits[i] != digits[0] {
			allSame = false
			break
		}
	}
	if allSame {
		return false
	}
	sum := 0
	for i := 0; i < 9; i++ {
		sum += int(digits[i]-'0') * (10 - i)
	}
	d1 := (sum * 10) % 11
	if d1 == 10 {
		d1 = 0
	}
	if int(digits[9]-'0') != d1 {
		return false
	}
	sum = 0
	for i := 0; i < 10; i++ {
		sum += int(digits[i]-'0') * (11 - i)
	}
	d2 := (sum * 10) % 11
	if d2 == 10 {
		d2 = 0
	}
	return int(digits[10]-'0') == d2
}

func splitList(raw, sep string) []string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil
	}
	parts := strings.Split(raw, sep)
	out := make([]string, 0, len(parts))
	seen := map[string]struct{}{}
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		key := strings.ToLower(p)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		out = append(out, p)
	}
	return out
}

func BuildComercial(u UnifiedRecord) Comercial {
	ultimo := strings.TrimSpace(u.UltimoAtendRaw)
	var ultimoPtr *string
	if ultimo != "" && !strings.EqualFold(ultimo, "Não atendido") && !strings.EqualFold(ultimo, "Nao atendido") {
		ultimoPtr = &ultimo
	}
	return Comercial{
		PlanoAtivo:        strings.TrimSpace(u.PlanoAtivo),
		StatusPlano:       strings.TrimSpace(u.StatusPlano),
		DataInicio:        toISODate(u.DataInicio),
		DataFim:           toISODate(u.DataFim),
		Recorrente:        strings.EqualFold(strings.TrimSpace(u.RecorrenteRaw), "Sim"),
		Checkins:          splitList(u.CheckinsRaw, "\n"),
		UltimoAtendimento: ultimoPtr,
		Etiquetas:         splitList(strings.ReplaceAll(u.EtiquetaRaw, ",", ";"), ";"),
	}
}

func toISODate(raw string) string {
	d, ok := parseDateFlexible(raw)
	if !ok {
		return strings.TrimSpace(raw)
	}
	return d.Format("2006-01-02")
}

func BuildPendencias(records []UnifiedRecord) PendenciasFile {
	out := PendenciasFile{
		SchemaVersion: SchemaVersion,
		Source:        "clientes_natielli_union",
		GeneratedAt:   time.Now().UTC().Format(time.RFC3339),
		Counts:        map[string]int{},
		Records:       make([]PendenciaRecord, 0, len(records)),
	}
	withPlano, withCheckins, withEtq := 0, 0, 0
	for _, u := range records {
		com := BuildComercial(u)
		if com.PlanoAtivo != "" {
			withPlano++
		}
		if len(com.Checkins) > 0 {
			withCheckins++
		}
		if len(com.Etiquetas) > 0 {
			withEtq++
		}
		id := Identity{NomeCompleto: u.Nome, TelDigits: u.TelDigits}
		if u.CPFDigits != "" && isLikelyValidCPF(u.CPFDigits) {
			cpf := entity.NormalizeCPF(u.CPFDigits)
			id.CPF = &cpf
		}
		out.Records = append(out.Records, PendenciaRecord{Identity: id, Comercial: com})
	}
	out.Counts["records"] = len(out.Records)
	out.Counts["with_plano"] = withPlano
	out.Counts["with_checkins"] = withCheckins
	out.Counts["with_etiquetas"] = withEtq
	return out
}
