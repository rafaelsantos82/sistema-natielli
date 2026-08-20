package dto

import (
	"espaco-terapia-os/backend/internal/application"
	"espaco-terapia-os/backend/internal/domain/entity"
	"espaco-terapia-os/backend/internal/domain/service"

	"github.com/google/uuid"
)

type ListProfissionaisQuery struct {
	UnidadeID      string `form:"unidade_id"`
	Query          string `form:"q"`
	Status         string `form:"status"`
	Page           int    `form:"page"`
	PageSize       int    `form:"page_size"`
	IncludeDeleted bool   `form:"include_deleted"`
}

type ProfissionalRequest struct {
	Nome                   string                   `json:"nome" binding:"required"`
	CPF                    *string                  `json:"cpf"`
	RG                     *string                  `json:"rg"`
	DataNascimento         *string                  `json:"data_nascimento"`
	Email                  string                   `json:"email" binding:"required,email"`
	Telefone               *string                  `json:"telefone"`
	Celular                *string                  `json:"celular"`
	Conselho               *string                  `json:"conselho"`
	NumeroRegistro         *string                  `json:"numero_registro"`
	UFRegistro             *string                  `json:"uf_registro"`
	Foto                   *string                  `json:"foto"`
	CEP                    *string                  `json:"cep"`
	Logradouro             *string                  `json:"logradouro"`
	Numero                 *string                  `json:"numero"`
	Complemento            *string                  `json:"complemento"`
	Bairro                 *string                  `json:"bairro"`
	Cidade                 *string                  `json:"cidade"`
	UF                     *string                  `json:"uf"`
	ModalidadesAtendimento []string                 `json:"modalidades_atendimento"`
	LocaisAtendimento      []string                 `json:"locais_atendimento"`
	DuracaoPadraoSessao    *int                     `json:"duracao_padrao_sessao"`
	DiasAtendimento        []string                 `json:"dias_atendimento"`
	JanelasHorarias        []map[string]interface{} `json:"janelas_horarias"`
	HorarioInicio          *string                  `json:"horario_inicio"`
	HorarioFim             *string                  `json:"horario_fim"`
	DuracaoConsulta        *int                     `json:"duracao_consulta"`
	ConsentimentoLGPD      bool                     `json:"consentimento_lgpd"`
	DataConsentimento      *string                  `json:"data_consentimento"`
	CompartilhamentoDados  bool                     `json:"compartilhamento_dados"`
	FinalidadeDados        *string                  `json:"finalidade_dados"`
	Status                 string                   `json:"status"`
	Observacoes            *string                  `json:"observacoes"`
	DadosComplementares    map[string]interface{}   `json:"dados_complementares"`
	AnexosContratuais      []string                 `json:"anexos_contratuais"`
	UnidadeIDs             []uuid.UUID              `json:"unidade_ids" binding:"required,min=1"`
	Especialidades         []string                 `json:"especialidades"`
}

type UpdateProfissionalRequest struct {
	ProfissionalRequest
}

func (r *ProfissionalRequest) ToServiceInput() (service.ProfissionalInput, error) {
	dataNasc, err := application.ParseOptionalDate(r.DataNascimento)
	if err != nil {
		return service.ProfissionalInput{}, err
	}
	dataConsent, err := application.ParseOptionalDate(r.DataConsentimento)
	if err != nil {
		return service.ProfissionalInput{}, err
	}
	return service.ProfissionalInput{
		Nome:                   r.Nome,
		CPF:                    r.CPF,
		RG:                     r.RG,
		DataNascimento:         dataNasc,
		Email:                  r.Email,
		Telefone:               r.Telefone,
		Celular:                r.Celular,
		Conselho:               r.Conselho,
		NumeroRegistro:         r.NumeroRegistro,
		UFRegistro:             r.UFRegistro,
		Foto:                   r.Foto,
		CEP:                    r.CEP,
		Logradouro:             r.Logradouro,
		Numero:                 r.Numero,
		Complemento:            r.Complemento,
		Bairro:                 r.Bairro,
		Cidade:                 r.Cidade,
		UF:                     r.UF,
		ModalidadesAtendimento: r.ModalidadesAtendimento,
		LocaisAtendimento:      r.LocaisAtendimento,
		DuracaoPadraoSessao:    r.DuracaoPadraoSessao,
		DiasAtendimento:        r.DiasAtendimento,
		JanelasHorarias:        r.JanelasHorarias,
		HorarioInicio:          r.HorarioInicio,
		HorarioFim:             r.HorarioFim,
		DuracaoConsulta:        r.DuracaoConsulta,
		ConsentimentoLGPD:      r.ConsentimentoLGPD,
		DataConsentimento:      dataConsent,
		CompartilhamentoDados:  r.CompartilhamentoDados,
		FinalidadeDados:        r.FinalidadeDados,
		Status:                 entity.ProfissionalStatus(r.Status),
		Observacoes:            r.Observacoes,
		DadosComplementares:    r.DadosComplementares,
		AnexosContratuais:      r.AnexosContratuais,
		UnidadeIDs:             r.UnidadeIDs,
		Especialidades:         r.Especialidades,
	}, nil
}

type ConselhoRequest struct {
	Tipo      string  `json:"tipo" binding:"required"`
	Numero    string  `json:"numero" binding:"required"`
	UF        string  `json:"uf" binding:"required,len=2"`
	Validade  *string `json:"validade"`
	Principal bool    `json:"principal"`
}

func (r *ConselhoRequest) ToServiceInput() (service.ConselhoInput, error) {
	validade, err := application.ParseOptionalDate(r.Validade)
	if err != nil {
		return service.ConselhoInput{}, err
	}
	return service.ConselhoInput{
		Tipo:      r.Tipo,
		Numero:    r.Numero,
		UF:        r.UF,
		Validade:  validade,
		Principal: r.Principal,
	}, nil
}

type CreateProfissionalData struct {
	ID string `json:"id"`
}

type CreateConselhoData struct {
	ID string `json:"id"`
}
