package entity

import (
	"strings"
	"time"
	"unicode"

	"github.com/google/uuid"
	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
)

type SexoBiologico string

const (
	SexoMasculino  SexoBiologico = "masculino"
	SexoFeminino   SexoBiologico = "feminino"
	SexoIntersexo  SexoBiologico = "intersexo"
)

type PacienteStatus string

const (
	PacienteAtivo    PacienteStatus = "ativo"
	PacienteInativo  PacienteStatus = "inativo"
	PacienteFalecido PacienteStatus = "falecido"
)

type Vacina struct {
	Data string `json:"data"`
	Tipo string `json:"tipo"`
}

type DocumentoAnexo struct {
	Tipo        string  `json:"tipo"`
	Arquivo     string  `json:"arquivo"`
	Descricao   *string `json:"descricao,omitempty"`
}

type PacienteUnidadeLink struct {
	UnidadeID uuid.UUID
	Principal bool
	Ativo     bool
}

// PacienteCarteiraStats métricas de consultas (listagem terapeuta; não persistido).
type PacienteCarteiraStats struct {
	UltimaConsultaEm  *time.Time
	ProximaConsultaEm *time.Time
	TotalConsultas    int
}

type Paciente struct {
	ID                      uuid.UUID
	NomeCompleto            string
	NomeSocial              *string
	DataNascimento          time.Time
	SexoBiologico           SexoBiologico
	CPF                     *string
	RGNumero                *string
	RGOrgao                 *string
	Foto                    *string
	TelPrincipal            string
	TelSecundario           *string
	Email                   *string
	Endereco                *string
	Numero                  *string
	Complemento             *string
	Bairro                  *string
	Cidade                  *string
	UF                      string
	CEP                     string
	ResponsavelNome         string
	ResponsavelCPF          *string
	ResponsavelParentesco   *string
	ResponsavelTel          *string
	ResponsavelEmail        *string
	ContatoEmergenciaNome   *string
	ContatoEmergenciaTel    *string
	PessoasAutorizadasBusca []string
	Escola                  *string
	SerieAno                *string
	NecessidadesEspeciais   *string
	PediatraReferencia      *string
	Altura                  *float64
	Peso                    *float64
	TipoSanguineo           *string
	Alergias                *string
	DoencasCronicas         *string
	MedicacoesContinuo      *string
	CirurgiasPrevias        *string
	HistoricoFamiliar       *string
	Vacinas                 []Vacina
	Observacoes             *string
	AtividadeFisicaFreq     *string
	AtividadeFisicaTipo     *string
	Alimentacao             *string
	SonoHoras               *int
	ProfissionalResponsavel *uuid.UUID
	Status                  PacienteStatus
	ConsentimentoLGPD       bool
	AutorizacaoUsoImagem    bool
	AssinaturaDigital       *string
	DocumentosAnexos        []DocumentoAnexo
	Unidades                []PacienteUnidadeLink
	CarteiraStats           *PacienteCarteiraStats
	CreatedAt               time.Time
	UpdatedAt               time.Time
	DeletedAt               *time.Time
}

func (p *Paciente) Validate(requireLGPD bool) error {
	if strings.TrimSpace(p.NomeCompleto) == "" {
		return domainerrors.NewRequiredFieldError("nome_completo")
	}
	if p.DataNascimento.IsZero() {
		return domainerrors.NewRequiredFieldError("data_nascimento")
	}
	now := time.Now()
	if p.DataNascimento.After(now) {
		return domainerrors.NewInvalidFormatError("data_nascimento", "Data de nascimento não pode ser futura")
	}
	minDate := now.AddDate(-25, 0, 0)
	if p.DataNascimento.Before(minDate) {
		return domainerrors.NewInvalidFormatError("data_nascimento", "Paciente deve ter no máximo 25 anos (clínica pediátrica)")
	}
	if p.SexoBiologico != SexoMasculino && p.SexoBiologico != SexoFeminino && p.SexoBiologico != SexoIntersexo {
		return domainerrors.NewInvalidFormatError("sexo_biologico", "Sexo biológico inválido")
	}
	if p.CPF != nil && *p.CPF != "" {
		if !isValidCPFDigits(*p.CPF) {
			return domainerrors.NewInvalidFormatError("cpf", "CPF inválido")
		}
	}
	if strings.TrimSpace(p.TelPrincipal) == "" {
		return domainerrors.NewRequiredFieldError("tel_principal")
	}
	if len(strings.TrimSpace(p.UF)) != 2 {
		return domainerrors.NewInvalidFormatError("uf", "UF deve ter 2 caracteres")
	}
	if strings.TrimSpace(p.CEP) == "" {
		return domainerrors.NewRequiredFieldError("cep")
	}
	if strings.TrimSpace(p.ResponsavelNome) == "" {
		return domainerrors.NewRequiredFieldError("responsavel_nome")
	}
	cpfEmpty := p.CPF == nil || strings.TrimSpace(*p.CPF) == ""
	respCPFEmpty := p.ResponsavelCPF == nil || strings.TrimSpace(*p.ResponsavelCPF) == ""
	if cpfEmpty && respCPFEmpty {
		return domainerrors.NewValidationError("Informe CPF do paciente ou CPF do responsável legal")
	}
	if p.ResponsavelCPF != nil && *p.ResponsavelCPF != "" && !isValidCPFDigits(*p.ResponsavelCPF) {
		return domainerrors.NewInvalidFormatError("responsavel_cpf", "CPF do responsável inválido")
	}
	if requireLGPD && !p.ConsentimentoLGPD {
		return domainerrors.NewValidationError("Consentimento LGPD é obrigatório")
	}
	if p.SonoHoras != nil && (*p.SonoHoras < 0 || *p.SonoHoras > 24) {
		return domainerrors.NewInvalidFormatError("sono_horas", "Sono deve estar entre 0 e 24 horas")
	}
	if p.Status != PacienteAtivo && p.Status != PacienteInativo && p.Status != PacienteFalecido {
		return domainerrors.NewInvalidFormatError("status", "Status inválido")
	}
	if len(p.Unidades) == 0 {
		return domainerrors.NewRequiredFieldError("unidade_ids")
	}
	principalCount := 0
	for _, u := range p.Unidades {
		if u.Principal {
			principalCount++
		}
	}
	if principalCount != 1 {
		return domainerrors.NewValidationError("Exatamente uma unidade deve ser marcada como principal")
	}
	return nil
}

func isValidCPFDigits(cpf string) bool {
	digits := onlyDigits(cpf)
	if len(digits) != 11 {
		return false
	}
	allSame := true
	for i := 1; i < len(digits); i++ {
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

func onlyDigits(s string) string {
	var b strings.Builder
	for _, r := range s {
		if unicode.IsDigit(r) {
			b.WriteRune(r)
		}
	}
	return b.String()
}

func NormalizeCPF(cpf string) string {
	d := onlyDigits(cpf)
	if d == "" {
		return ""
	}
	return d
}
