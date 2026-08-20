package seedpacientes

import (
	"fmt"
	"strings"

	"github.com/xuri/excelize/v2"
)

var headerAliases = map[string]string{
	"DATA DE NASCIMENTO": "DT DE NASC",
	"DATA DE CADASTRADO": "DT DE CADASTRADO",
}

// LoadXLSX reads the first sheet into raw rows (header-normalized).
func LoadXLSX(path string) ([]RawRow, error) {
	f, err := excelize.OpenFile(path)
	if err != nil {
		return nil, fmt.Errorf("abrir xlsx %s: %w", path, err)
	}
	defer func() { _ = f.Close() }()

	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return nil, fmt.Errorf("xlsx sem abas: %s", path)
	}
	rows, err := f.GetRows(sheets[0], excelize.Options{RawCellValue: true})
	if err != nil {
		return nil, fmt.Errorf("ler aba %s: %w", sheets[0], err)
	}
	if len(rows) < 2 {
		return nil, fmt.Errorf("xlsx sem dados: %s", path)
	}

	headers := make([]string, len(rows[0]))
	for i, h := range rows[0] {
		key := foldHeader(h)
		if alias, ok := headerAliases[key]; ok {
			key = alias
		}
		headers[i] = key
	}

	out := make([]RawRow, 0, len(rows)-1)
	for _, row := range rows[1:] {
		if isEmptyRow(row) {
			continue
		}
		m := RawRow{}
		for i, h := range headers {
			if h == "" {
				continue
			}
			val := ""
			if i < len(row) {
				val = strings.TrimSpace(row[i])
			}
			m[h] = val
		}
		if strings.TrimSpace(m["NOME"]) == "" {
			continue
		}
		out = append(out, m)
	}
	return out, nil
}

func isEmptyRow(row []string) bool {
	for _, c := range row {
		if strings.TrimSpace(c) != "" {
			return false
		}
	}
	return true
}

func (r RawRow) get(keys ...string) string {
	for _, k := range keys {
		if v, ok := r[k]; ok && strings.TrimSpace(v) != "" {
			return strings.TrimSpace(v)
		}
	}
	return ""
}

func rawToUnified(r RawRow, source string) UnifiedRecord {
	return UnifiedRecord{
		Nome:           r.get("NOME"),
		Apelido:        r.get("APELIDO"),
		TelDigits:      digits(r.get("WHATSAPP")),
		Estado:         r.get("ESTADO"),
		Cidade:         r.get("CIDADE"),
		CPFDigits:      digits(r.get("CPF")),
		CPFRaw:         r.get("CPF"),
		Email:          strings.ToLower(strings.TrimSpace(r.get("EMAIL"))),
		NascRaw:        r.get("DT DE NASC"),
		StatusRaw:      r.get("STATUS"),
		CadastroRaw:    r.get("DT DE CADASTRADO"),
		CheckinsRaw:    r.get("CHECK-INS"),
		UltimoAtendRaw: r.get("ULTIMO ATENDIMENTO"),
		PlanoAtivo:     r.get("PLANO ATIVO"),
		StatusPlano:    r.get("STATUS PLANO"),
		DataInicio:     r.get("DATA INICIO"),
		DataFim:        r.get("DATA FIM"),
		RecorrenteRaw:  r.get("RECORRENTE"),
		EtiquetaRaw:    r.get("ETIQUETA"),
		SourceFile:     source,
	}
}
