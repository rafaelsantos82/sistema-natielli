package service

import (
	"time"

	"espaco-terapia-os/backend/internal/domain/entity"

	"github.com/google/uuid"
)

type ProfissionalDTO struct {
	ID                     uuid.UUID              `json:"id"`
	Nome                   string                 `json:"nome"`
	CPF                    *string                `json:"cpf,omitempty"`
	RG                     *string                `json:"rg,omitempty"`
	DataNascimento         *string                `json:"data_nascimento,omitempty"`
	Email                  string                 `json:"email"`
	Telefone               *string                `json:"telefone,omitempty"`
	Celular                *string                `json:"celular,omitempty"`
	Conselho               *string                `json:"conselho,omitempty"`
	NumeroRegistro         *string                `json:"numero_registro,omitempty"`
	UFRegistro             *string                `json:"uf_registro,omitempty"`
	Foto                   *string                `json:"foto,omitempty"`
	CEP                    *string                `json:"cep,omitempty"`
	Logradouro             *string                `json:"logradouro,omitempty"`
	Numero                 *string                `json:"numero,omitempty"`
	Complemento            *string                `json:"complemento,omitempty"`
	Bairro                 *string                `json:"bairro,omitempty"`
	Cidade                 *string                `json:"cidade,omitempty"`
	UF                     *string                `json:"uf,omitempty"`
	ModalidadesAtendimento []string               `json:"modalidades_atendimento,omitempty"`
	LocaisAtendimento      []string               `json:"locais_atendimento,omitempty"`
	DuracaoPadraoSessao    *int                   `json:"duracao_padrao_sessao,omitempty"`
	DiasAtendimento        []string               `json:"dias_atendimento,omitempty"`
	JanelasHorarias        []map[string]interface{} `json:"janelas_horarias,omitempty"`
	HorarioInicio          *string                `json:"horario_inicio,omitempty"`
	HorarioFim             *string                `json:"horario_fim,omitempty"`
	DuracaoConsulta        *int                   `json:"duracao_consulta,omitempty"`
	ConsentimentoLGPD      bool                   `json:"consentimento_lgpd"`
	DataConsentimento      *time.Time             `json:"data_consentimento,omitempty"`
	CompartilhamentoDados  bool                   `json:"compartilhamento_dados"`
	FinalidadeDados        *string                `json:"finalidade_dados,omitempty"`
	Status                 string                 `json:"status"`
	Observacoes            *string                `json:"observacoes,omitempty"`
	DadosComplementares    map[string]interface{} `json:"dados_complementares,omitempty"`
	AnexosContratuais      []string               `json:"anexos_contratuais,omitempty"`
	UnidadeIDs             []uuid.UUID            `json:"unidade_ids"`
	Especialidades         []string               `json:"especialidades,omitempty"`
	CreatedAt              time.Time              `json:"created_at"`
	UpdatedAt              time.Time              `json:"updated_at"`
	DeletedAt              *string                `json:"deleted_at,omitempty"`
}

type ProfissionalConselhoDTO struct {
	ID        uuid.UUID  `json:"id"`
	Tipo      string     `json:"tipo"`
	Numero    string     `json:"numero"`
	UF        string     `json:"uf"`
	Validade  *string    `json:"validade,omitempty"`
	Principal bool       `json:"principal"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

func ToProfissionalDTO(p *entity.Profissional) *ProfissionalDTO {
	dto := &ProfissionalDTO{
		ID:                     p.ID,
		Nome:                   p.Nome,
		CPF:                    p.CPF,
		RG:                     p.RG,
		Email:                  p.Email,
		Telefone:               p.Telefone,
		Celular:                p.Celular,
		NumeroRegistro:         p.NumeroRegistro,
		UFRegistro:             p.UFRegistro,
		Foto:                   p.Foto,
		CEP:                    p.CEP,
		Logradouro:             p.Logradouro,
		Numero:                 p.Numero,
		Complemento:            p.Complemento,
		Bairro:                 p.Bairro,
		Cidade:                 p.Cidade,
		UF:                     p.UF,
		ModalidadesAtendimento: p.ModalidadesAtendimento,
		LocaisAtendimento:      p.LocaisAtendimento,
		DuracaoPadraoSessao:    p.DuracaoPadraoSessao,
		DiasAtendimento:        p.DiasAtendimento,
		JanelasHorarias:        p.JanelasHorarias,
		HorarioInicio:          p.HorarioInicio,
		HorarioFim:             p.HorarioFim,
		DuracaoConsulta:        p.DuracaoConsulta,
		ConsentimentoLGPD:      p.ConsentimentoLGPD,
		DataConsentimento:      p.DataConsentimento,
		CompartilhamentoDados:  p.CompartilhamentoDados,
		FinalidadeDados:        p.FinalidadeDados,
		Status:                 string(p.Status),
		Observacoes:            p.Observacoes,
		DadosComplementares:    p.DadosComplementares,
		AnexosContratuais:      p.AnexosContratuais,
		UnidadeIDs:             p.UnidadeIDs,
		Especialidades:         p.Especialidades,
		CreatedAt:              p.CreatedAt,
		UpdatedAt:              p.UpdatedAt,
	}
	if p.Conselho != nil {
		s := string(*p.Conselho)
		dto.Conselho = &s
	}
	if p.DataNascimento != nil {
		s := p.DataNascimento.Format("2006-01-02")
		dto.DataNascimento = &s
	}
	if p.DeletedAt != nil {
		s := p.DeletedAt.UTC().Format(time.RFC3339)
		dto.DeletedAt = &s
	}
	return dto
}

func ToProfissionalConselhoDTO(c *entity.ProfissionalConselho) *ProfissionalConselhoDTO {
	dto := &ProfissionalConselhoDTO{
		ID:        c.ID,
		Tipo:      string(c.Tipo),
		Numero:    c.Numero,
		UF:        c.UF,
		Principal: c.Principal,
		CreatedAt: c.CreatedAt,
		UpdatedAt: c.UpdatedAt,
	}
	if c.Validade != nil {
		s := c.Validade.Format("2006-01-02")
		dto.Validade = &s
	}
	return dto
}
