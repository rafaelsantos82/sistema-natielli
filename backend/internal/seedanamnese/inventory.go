package seedanamnese

// SourceMapping documents canonical source files (see docs/ANAMNESE-MIGRATION.md).
var SourceMapping = []struct {
	Slug           string
	SourceFile     string
	Skip           bool
	SkipReason     string
	CanonicalJSON  string
}{
	{
		Slug:          "to-2024",
		SourceFile:    "backend/docs/anamnese/ANAMNESE ESP TERAPIA 2024.md",
		CanonicalJSON: "backend/data/anamneses/to-2024.json",
	},
	{
		Slug:       "to-2024-alt",
		SourceFile: "backend/docs/anamnese/ANAMNESE ESP TERAPIA 2024 (1).md",
		Skip:       true,
		SkipReason: "Variante do TO 2024; usar ANAMNESE ESP TERAPIA 2024.md como canônico",
	},
	{
		Slug:          "ficha-clinica-inicial",
		SourceFile:    "backend/docs/anamnese/Modelo - Anamnese- atualizado.pdf",
		CanonicalJSON: "backend/data/anamneses/ficha-clinica-inicial.json",
	},
	{
		Slug:       "modelo-atualizado-dup-1",
		SourceFile: "backend/docs/anamnese/Modelo - Anamnese- atualizado (1).pdf",
		Skip:       true,
		SkipReason: "Duplicata binária de Modelo - Anamnese- atualizado.pdf",
	},
	{
		Slug:       "modelo-atualizado-dup-2",
		SourceFile: "backend/docs/anamnese/Modelo - Anamnese- atualizado (2).pdf",
		Skip:       true,
		SkipReason: "Duplicata binária de Modelo - Anamnese- atualizado.pdf",
	},
	{
		Slug:       "saulo-preenchida",
		SourceFile: "backend/docs/anamnese/Ficha Anamnese Infantil - Saulo Jesus001.pdf",
		Skip:       true,
		SkipReason: "PDF preenchido à mão; não importar respostas (referência estrutural apenas)",
	},
	{
		Slug:          "aba",
		SourceFile:    "backend/docs/anamnese/Anamnese-ABA.docx",
		CanonicalJSON: "backend/data/anamneses/aba.json",
	},
	{
		Slug:       "modelo-docx",
		SourceFile: "backend/docs/anamnese/Modelo - Anamnese.docx",
		Skip:       true,
		SkipReason: "Comparar com ficha-clinica-inicial.pdf antes de importar separadamente",
	},
}
