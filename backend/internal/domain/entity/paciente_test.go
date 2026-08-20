package entity

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func validPaciente() *Paciente {
	cpf := "52998224725"
	respCPF := "11144477735"
	return &Paciente{
		NomeCompleto:      "Maria Silva",
		DataNascimento:    time.Now().AddDate(-10, 0, 0),
		SexoBiologico:     SexoFeminino,
		CPF:               &cpf,
		TelPrincipal:      "21999999999",
		UF:                "RJ",
		CEP:               "20000000",
		ResponsavelNome:   "João Silva",
		ResponsavelCPF:    &respCPF,
		ConsentimentoLGPD: true,
		Status:            PacienteAtivo,
		Unidades: []PacienteUnidadeLink{
			{UnidadeID: uuid.New(), Principal: true, Ativo: true},
		},
	}
}

func TestPacienteValidate_LGPDRequiredOnCreate(t *testing.T) {
	p := validPaciente()
	p.ConsentimentoLGPD = false
	if err := p.Validate(true); err == nil {
		t.Fatal("expected LGPD validation error")
	}
}

func TestPacienteValidate_AdultoPermitido(t *testing.T) {
	p := validPaciente()
	p.DataNascimento = time.Now().AddDate(-30, 0, 0)
	if err := p.Validate(false); err != nil {
		t.Fatalf("adult patient should be valid: %v", err)
	}
}

func TestPacienteValidate_SexoNaoInformado(t *testing.T) {
	p := validPaciente()
	p.SexoBiologico = SexoNaoInformado
	if err := p.Validate(false); err != nil {
		t.Fatalf("nao_informado should be valid: %v", err)
	}
}

func TestPacienteValidate_ImportSemCPF(t *testing.T) {
	p := validPaciente()
	p.CPF = nil
	p.ResponsavelCPF = nil
	if err := p.ValidateOpts(ValidateOpts{AllowEmptyCPF: true}); err != nil {
		t.Fatalf("import without CPF should be valid: %v", err)
	}
}

func TestPacienteValidate_CPFInvalido(t *testing.T) {
	p := validPaciente()
	bad := "12345678901"
	p.CPF = &bad
	p.ResponsavelCPF = nil
	if err := p.Validate(false); err == nil {
		t.Fatal("expected CPF validation error")
	}
}

func TestPacienteValidate_SemCPFPacienteEResponsavel(t *testing.T) {
	p := validPaciente()
	p.CPF = nil
	p.ResponsavelCPF = nil
	if err := p.Validate(false); err == nil {
		t.Fatal("expected validation when both CPFs empty")
	}
}

func TestNormalizeCPF(t *testing.T) {
	got := NormalizeCPF("529.982.247-25")
	if got != "52998224725" {
		t.Fatalf("got %s", got)
	}
}
