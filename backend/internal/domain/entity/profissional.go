package entity

import (
	"strings"
	"time"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"

	"github.com/google/uuid"
)

type ProfissionalStatus string

const (
	ProfissionalAtivo    ProfissionalStatus = "ativo"
	ProfissionalInativo  ProfissionalStatus = "inativo"
	ProfissionalSuspenso ProfissionalStatus = "suspenso"
)

type ConselhoTipo string

type Profissional struct {
	ID                     uuid.UUID
	Nome                   string
	CPF                    *string
	RG                     *string
	DataNascimento         *time.Time
	Email                  string
	Telefone               *string
	Celular                *string
	Conselho               *ConselhoTipo
	NumeroRegistro         *string
	UFRegistro             *string
	Foto                   *string
	CEP                    *string
	Logradouro             *string
	Numero                 *string
	Complemento            *string
	Bairro                 *string
	Cidade                 *string
	UF                     *string
	ModalidadesAtendimento []string
	LocaisAtendimento      []string
	DuracaoPadraoSessao    *int
	DiasAtendimento        []string
	JanelasHorarias        []map[string]interface{}
	HorarioInicio          *string
	HorarioFim             *string
	DuracaoConsulta        *int
	ConsentimentoLGPD      bool
	DataConsentimento      *time.Time
	CompartilhamentoDados  bool
	FinalidadeDados        *string
	Status                 ProfissionalStatus
	Observacoes            *string
	DadosComplementares    map[string]interface{}
	AnexosContratuais      []string
	UnidadeIDs             []uuid.UUID
	Especialidades         []string
	CreatedAt              time.Time
	UpdatedAt              time.Time
	DeletedAt              *time.Time
}

type ProfissionalConselho struct {
	ID             uuid.UUID
	ProfissionalID uuid.UUID
	Tipo           ConselhoTipo
	Numero         string
	UF             string
	Validade       *time.Time
	Principal      bool
	CreatedAt      time.Time
	UpdatedAt      time.Time
	DeletedAt      *time.Time
}

func (p *Profissional) Validate() error {
	if strings.TrimSpace(p.Nome) == "" {
		return domainerrors.NewRequiredFieldError("nome")
	}
	if strings.TrimSpace(p.Email) == "" {
		return domainerrors.NewRequiredFieldError("email")
	}
	if len(p.UnidadeIDs) == 0 {
		return domainerrors.NewRequiredFieldError("unidade_ids")
	}
	if p.Status == "" {
		p.Status = ProfissionalAtivo
	}
	return nil
}

func (c *ProfissionalConselho) Validate() error {
	if strings.TrimSpace(string(c.Tipo)) == "" {
		return domainerrors.NewRequiredFieldError("tipo")
	}
	if strings.TrimSpace(c.Numero) == "" {
		return domainerrors.NewRequiredFieldError("numero")
	}
	if strings.TrimSpace(c.UF) == "" || len(strings.TrimSpace(c.UF)) != 2 {
		return domainerrors.NewInvalidFormatError("uf", "UF deve ter 2 caracteres")
	}
	return nil
}
