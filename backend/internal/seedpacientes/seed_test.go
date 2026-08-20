package seedpacientes

import (
	"errors"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"
)

func TestUnifyPrefersLaterFile(t *testing.T) {
	older := []RawRow{{
		"NOME": "Ana", "WHATSAPP": "5511999999999", "STATUS": "Ativo", "DT DE NASC": "01/01/1990",
	}}
	newer := []RawRow{{
		"NOME": "Ana", "WHATSAPP": "5511999999999", "STATUS": "Inativo", "DT DE NASC": "01/01/1990",
	}}
	extra := []RawRow{{
		"NOME": "Beto", "WHATSAPP": "5511888888888", "STATUS": "Ativo", "DT DE NASC": "02/02/1985",
	}}
	got := Unify([]struct {
		Path string
		Rows []RawRow
	}{
		{Path: "old.xlsx", Rows: append(append([]RawRow{}, older...), extra...)},
		{Path: "natielli.xlsx", Rows: newer},
	})
	if len(got) != 2 {
		t.Fatalf("want 2 unique, got %d", len(got))
	}
	byTel := map[string]UnifiedRecord{}
	for _, r := range got {
		byTel[r.TelDigits] = r
	}
	if byTel["5511999999999"].StatusRaw != "Inativo" {
		t.Fatalf("natielli overlay lost: %+v", byTel["5511999999999"])
	}
	if byTel["5511888888888"].Nome != "Beto" {
		t.Fatalf("extra from old file missing")
	}
}

func TestMapCadastroPlaceholderDOBAndINT(t *testing.T) {
	u := UnifiedRecord{
		Nome: "Maria Teste", Apelido: "Ma", TelDigits: "5511911111111",
		Estado: "INT", Cidade: "Cantanduva", NascRaw: "10/07/2026",
		StatusRaw: "Pausado", EtiquetaRaw: "presencial;Catanduva",
	}
	c := MapCadastro(u)
	if !c.NascimentoUnknown || !c.DataNascimento.Equal(unknownBirth) {
		t.Fatalf("2026 DOB should be unknown, got %v", c.DataNascimento)
	}
	if c.UF != "EX" {
		t.Fatalf("INT -> EX, got %s", c.UF)
	}
	if c.UnidadeID != UnidadeCatanduva {
		t.Fatalf("unidade %s", c.UnidadeSlug)
	}
	if c.Status != "inativo" {
		t.Fatalf("Pausado -> inativo, got %s", c.Status)
	}
	if c.CEP != PlaceholderCEP || c.ResponsavelNome != "Maria Teste" {
		t.Fatalf("placeholders: %+v", c)
	}
}

func TestMapCadastroInvalidCPF(t *testing.T) {
	u := UnifiedRecord{Nome: "X", TelDigits: "1", Estado: "SP", CPFDigits: "12345678", CPFRaw: "12345678", NascRaw: "01/01/1994"}
	c := MapCadastro(u)
	if c.CPF != nil {
		t.Fatalf("short CPF should be dropped")
	}
	found := false
	for _, i := range c.Issues {
		if i == "cpf_invalid" {
			found = true
		}
	}
	if !found {
		t.Fatalf("expected cpf_invalid issue, got %v", c.Issues)
	}
}

func TestBuildComercialSplits(t *testing.T) {
	u := UnifiedRecord{
		CheckinsRaw:    "A - Uma vez\nB - Uma vez",
		EtiquetaRaw:    "presencial;Catanduva;RMKT",
		RecorrenteRaw:  "Sim",
		UltimoAtendRaw: "Não atendido",
		PlanoAtivo:     "Presencial Básico",
		DataInicio:     "27/08/2025",
	}
	com := BuildComercial(u)
	if len(com.Checkins) != 2 || len(com.Etiquetas) != 3 {
		t.Fatalf("split failed: %+v", com)
	}
	if !com.Recorrente || com.UltimoAtendimento != nil {
		t.Fatalf("recorrente/ultimo: %+v", com)
	}
	if com.DataInicio != "2025-08-27" {
		t.Fatalf("iso date %s", com.DataInicio)
	}
}

func TestLookupMatch(t *testing.T) {
	cpf := "52998224725"
	idx := LookupIndex{
		ByCPF: map[string]uuid.UUID{cpf: uuid.MustParse("a0000000-0000-4000-8000-000000000099")},
		ByTel: map[string]uuid.UUID{"5511999": uuid.MustParse("a0000000-0000-4000-8000-000000000098")},
	}
	id, ok := idx.Match(Identity{CPF: &cpf, TelDigits: "5511999"})
	if !ok || id.String() != "a0000000-0000-4000-8000-000000000099" {
		t.Fatalf("CPF should win: %v %v", id, ok)
	}
	id, ok = idx.Match(Identity{TelDigits: "5511999"})
	if !ok || id.String() != "a0000000-0000-4000-8000-000000000098" {
		t.Fatalf("tel match: %v %v", id, ok)
	}
}

func TestPersistPendenciasBlocked(t *testing.T) {
	err := persistPendencias(nil, nil, PendenciasFile{})
	if !errors.Is(err, ErrSchemaNotReady) {
		t.Fatalf("got %v", err)
	}
}

func TestDigitsScientificPhone(t *testing.T) {
	got := digits("5.517997580619E+12")
	if got != "5517997580619" {
		t.Fatalf("got %s", got)
	}
}

func TestLoadXLSXRoundtrip(t *testing.T) {
	path := t.TempDir() + "/mini.xlsx"
	f := excelize.NewFile()
	sheet := f.GetSheetName(0)
	headers := []string{"NOME", "WHATSAPP", "ESTADO", "DATA DE NASCIMENTO", "STATUS"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		if err := f.SetCellValue(sheet, cell, h); err != nil {
			t.Fatal(err)
		}
	}
	vals := []string{"Ana", "5511999", "SP", "01/01/1994", "Ativo"}
	for i, v := range vals {
		cell, _ := excelize.CoordinatesToCellName(i+1, 2)
		if err := f.SetCellValue(sheet, cell, v); err != nil {
			t.Fatal(err)
		}
	}
	if err := f.SaveAs(path); err != nil {
		t.Fatal(err)
	}
	rows, err := LoadXLSX(path)
	if err != nil {
		t.Fatal(err)
	}
	if len(rows) != 1 || rows[0]["NOME"] != "Ana" || rows[0]["DT DE NASC"] != "01/01/1994" {
		t.Fatalf("alias/load: %+v", rows)
	}
}

func TestUnifyRealSpreadsheetsIfPresent(t *testing.T) {
	oldP := "/Users/rprenzier/Downloads/clientes_22_07_2026.xlsx"
	newP := "/Users/rprenzier/Downloads/clientes_Natielli.xlsx"
	if _, err := os.Stat(oldP); err != nil {
		t.Skip("planilhas reais ausentes")
	}
	oldRows, err := LoadXLSX(oldP)
	if err != nil {
		t.Fatal(err)
	}
	newRows, err := LoadXLSX(newP)
	if err != nil {
		t.Fatal(err)
	}
	u := Unify([]struct {
		Path string
		Rows []RawRow
	}{
		{Path: oldP, Rows: oldRows},
		{Path: newP, Rows: newRows},
	})
	if len(u) != 270 {
		t.Fatalf("want 270 unique clients, got %d (old=%d new=%d tel0=%s)", len(u), len(oldRows), len(newRows), u[0].TelDigits)
	}
}

func TestAdultBirthKept(t *testing.T) {
	u := UnifiedRecord{Nome: "A", TelDigits: "1", Estado: "SP", NascRaw: "09/07/1957"}
	c := MapCadastro(u)
	if c.NascimentoUnknown || c.DataNascimento.Year() != 1957 {
		t.Fatalf("real DOB lost: %+v", c.DataNascimento)
	}
	if time.Since(c.DataNascimento).Hours()/24/365 < 25 {
		t.Fatalf("expected adult")
	}
}
