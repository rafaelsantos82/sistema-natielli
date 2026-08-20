package seedpacientes

import (
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
)

const (
	SchemaVersion   = 1
	PlaceholderCEP  = "00000-000"
	UnknownBirthYMD = "1900-01-01"
	ObsImportPrefix = "Import planilha Natielli."
)

var (
	UnidadeCatanduva    = uuid.MustParse("a0000000-0000-4000-8000-000000000003")
	UnidadeLondrina     = uuid.MustParse("a0000000-0000-4000-8000-000000000004")
	UnidadeSertanopolis = uuid.MustParse("a0000000-0000-4000-8000-000000000005")
	UnidadeOnline       = uuid.MustParse("a0000000-0000-4000-8000-000000000006")
)

// RawRow is one spreadsheet row with normalized uppercase headers.
type RawRow map[string]string

type UnifiedRecord struct {
	Nome           string
	Apelido        string
	TelDigits      string
	Estado         string
	Cidade         string
	CPFDigits      string
	CPFRaw         string
	Email          string
	NascRaw        string
	StatusRaw      string
	CadastroRaw    string
	CheckinsRaw    string
	UltimoAtendRaw string
	PlanoAtivo     string
	StatusPlano    string
	DataInicio     string
	DataFim        string
	RecorrenteRaw  string
	EtiquetaRaw    string
	SourceFile     string
}

type Cadastro struct {
	NomeCompleto      string
	NomeSocial        *string
	DataNascimento    time.Time
	NascimentoUnknown bool
	TelPrincipal      string
	Email             *string
	Cidade            *string
	UF                string
	CEP               string
	CPF               *string
	ResponsavelNome   string
	Status            string
	Observacoes       string
	UnidadeID         uuid.UUID
	UnidadeSlug       string
	DataCadastro      *time.Time
	Issues            []string
}

type Comercial struct {
	PlanoAtivo        string   `json:"plano_ativo,omitempty"`
	StatusPlano       string   `json:"status_plano,omitempty"`
	DataInicio        string   `json:"data_inicio,omitempty"`
	DataFim           string   `json:"data_fim,omitempty"`
	Recorrente        bool     `json:"recorrente"`
	Checkins          []string `json:"checkins,omitempty"`
	UltimoAtendimento *string  `json:"ultimo_atendimento,omitempty"`
	Etiquetas         []string `json:"etiquetas,omitempty"`
}

type Identity struct {
	NomeCompleto string  `json:"nome_completo"`
	TelDigits    string  `json:"tel_digits"`
	CPF          *string `json:"cpf"`
}

type PendenciaRecord struct {
	Identity  Identity  `json:"identity"`
	Comercial Comercial `json:"comercial"`
}

type PendenciasFile struct {
	SchemaVersion int               `json:"schema_version"`
	Source        string            `json:"source"`
	GeneratedAt   string            `json:"generated_at"`
	Counts        map[string]int    `json:"counts"`
	Records       []PendenciaRecord `json:"records"`
}

type ApplyReport struct {
	Created           int
	Skipped           int
	Invalid           int
	PendenciasWritten int
	Issues            []string
}

func ptrNonEmpty(s string) *string {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	return &s
}

func digits(s string) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return ""
	}
	if f, err := strconv.ParseFloat(strings.ReplaceAll(s, ",", ""), 64); err == nil && f > 0 && !strings.ContainsAny(s, "/-") {
		// Excel numeric phones / scientific notation → integer digits.
		if f == float64(int64(f)) && f < 1e16 {
			s = strconv.FormatInt(int64(f), 10)
		}
	}
	var b strings.Builder
	for _, r := range s {
		if r >= '0' && r <= '9' {
			b.WriteRune(r)
		}
	}
	return b.String()
}

func foldHeader(s string) string {
	s = strings.TrimSpace(s)
	s = strings.Join(strings.Fields(s), " ")
	return strings.ToUpper(s)
}
