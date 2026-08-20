package dto

import (
	"espaco-terapia-os/backend/internal/application"
	"espaco-terapia-os/backend/internal/domain/entity"
	"espaco-terapia-os/backend/internal/domain/service"

	"github.com/google/uuid"
)

type VacinaRequest struct {
	Data string `json:"data"`
	Tipo string `json:"tipo"`
}

type DocumentoAnexoRequest struct {
	Tipo      string  `json:"tipo"`
	Arquivo   string  `json:"arquivo"`
	Descricao *string `json:"descricao,omitempty"`
}

type UnidadeLinkRequest struct {
	UnidadeID uuid.UUID `json:"unidade_id" binding:"required"`
	Principal bool      `json:"principal"`
}

type CreatePacienteRequest struct {
	NomeCompleto            string                  `json:"nome_completo" binding:"required"`
	NomeSocial              *string                 `json:"nome_social"`
	DataNascimento          string                  `json:"data_nascimento" binding:"required"`
	SexoBiologico           string                  `json:"sexo_biologico" binding:"required"`
	CPF                     *string                 `json:"cpf"`
	RGNumero                *string                 `json:"rg_numero"`
	RGOrgao                 *string                 `json:"rg_orgao"`
	Foto                    *string                 `json:"foto"`
	TelPrincipal            string                  `json:"tel_principal" binding:"required"`
	TelSecundario           *string                 `json:"tel_secundario"`
	Email                   *string                 `json:"email"`
	Endereco                *string                 `json:"endereco"`
	Numero                  *string                 `json:"numero"`
	Complemento             *string                 `json:"complemento"`
	Bairro                  *string                 `json:"bairro"`
	Cidade                  *string                 `json:"cidade"`
	UF                      string                  `json:"uf" binding:"required,len=2"`
	CEP                     string                  `json:"cep" binding:"required"`
	ResponsavelNome         string                  `json:"responsavel_nome" binding:"required"`
	ResponsavelCPF          *string                 `json:"responsavel_cpf"`
	ResponsavelParentesco   *string                 `json:"responsavel_parentesco"`
	ResponsavelTel          *string                 `json:"responsavel_tel"`
	ResponsavelEmail        *string                 `json:"responsavel_email"`
	ContatoEmergenciaNome   *string                 `json:"contato_emergencia_nome"`
	ContatoEmergenciaTel    *string                 `json:"contato_emergencia_tel"`
	PessoasAutorizadasBusca []string                `json:"pessoas_autorizadas_busca"`
	Escola                  *string                 `json:"escola"`
	SerieAno                *string                 `json:"serie_ano"`
	NecessidadesEspeciais   *string                 `json:"necessidades_especiais"`
	PediatraReferencia      *string                 `json:"pediatra_referencia"`
	Altura                  *float64                `json:"altura"`
	Peso                    *float64                `json:"peso"`
	TipoSanguineo           *string                 `json:"tipo_sanguineo"`
	Alergias                *string                 `json:"alergias"`
	DoencasCronicas         *string                 `json:"doencas_cronicas"`
	MedicacoesContinuo      *string                 `json:"medicacoes_continuo"`
	CirurgiasPrevias        *string                 `json:"cirurgias_previas"`
	HistoricoFamiliar       *string                 `json:"historico_familiar"`
	Vacinas                 []VacinaRequest         `json:"vacinas"`
	Observacoes             *string                 `json:"observacoes"`
	AtividadeFisicaFreq     *string                 `json:"atividade_fisica_frequencia"`
	AtividadeFisicaTipo     *string                 `json:"atividade_fisica_tipo"`
	Alimentacao             *string                 `json:"alimentacao"`
	SonoHoras               *int                    `json:"sono_horas"`
	ProfissionalResponsavel *uuid.UUID              `json:"profissional_responsavel"`
	Status                  string                  `json:"status"`
	ConsentimentoLGPD       bool                    `json:"consentimento_lgpd"`
	AutorizacaoUsoImagem    bool                    `json:"autorizacao_uso_imagem"`
	AssinaturaDigital       *string                 `json:"assinatura_digital"`
	DocumentosAnexos        []DocumentoAnexoRequest `json:"documentos_anexos"`
	UnidadeIDs              []UnidadeLinkRequest    `json:"unidade_ids" binding:"required,min=1,dive"`
}

type UpdatePacienteRequest struct {
	CreatePacienteRequest
}

type ListPacientesQuery struct {
	UnidadeID      string `form:"unidade_id"`
	Query          string `form:"q"`
	CPF            string `form:"cpf"`
	Status         string `form:"status"`
	Page           int    `form:"page"`
	PageSize       int    `form:"page_size"`
	IncludeDeleted bool   `form:"include_deleted"`
}

func (r *CreatePacienteRequest) ToServiceInput() (service.PacienteInput, error) {
	birth, err := application.ParseDataNascimento(r.DataNascimento)
	if err != nil {
		return service.PacienteInput{}, err
	}
	return service.PacienteInput{
		NomeCompleto:            r.NomeCompleto,
		NomeSocial:              r.NomeSocial,
		DataNascimento:          birth,
		SexoBiologico:           application.ParseSexo(r.SexoBiologico),
		CPF:                     r.CPF,
		RGNumero:                r.RGNumero,
		RGOrgao:                 r.RGOrgao,
		Foto:                    r.Foto,
		TelPrincipal:            r.TelPrincipal,
		TelSecundario:           r.TelSecundario,
		Email:                   r.Email,
		Endereco:                r.Endereco,
		Numero:                  r.Numero,
		Complemento:             r.Complemento,
		Bairro:                  r.Bairro,
		Cidade:                  r.Cidade,
		UF:                      r.UF,
		CEP:                     r.CEP,
		ResponsavelNome:         r.ResponsavelNome,
		ResponsavelCPF:          r.ResponsavelCPF,
		ResponsavelParentesco:   r.ResponsavelParentesco,
		ResponsavelTel:          r.ResponsavelTel,
		ResponsavelEmail:        r.ResponsavelEmail,
		ContatoEmergenciaNome:   r.ContatoEmergenciaNome,
		ContatoEmergenciaTel:    r.ContatoEmergenciaTel,
		PessoasAutorizadasBusca: r.PessoasAutorizadasBusca,
		Escola:                  r.Escola,
		SerieAno:                r.SerieAno,
		NecessidadesEspeciais:   r.NecessidadesEspeciais,
		PediatraReferencia:      r.PediatraReferencia,
		Altura:                  r.Altura,
		Peso:                    r.Peso,
		TipoSanguineo:           r.TipoSanguineo,
		Alergias:                r.Alergias,
		DoencasCronicas:         r.DoencasCronicas,
		MedicacoesContinuo:      r.MedicacoesContinuo,
		CirurgiasPrevias:        r.CirurgiasPrevias,
		HistoricoFamiliar:       r.HistoricoFamiliar,
		Vacinas:                 MapVacinas(r.Vacinas),
		Observacoes:             r.Observacoes,
		AtividadeFisicaFreq:     r.AtividadeFisicaFreq,
		AtividadeFisicaTipo:     r.AtividadeFisicaTipo,
		Alimentacao:             r.Alimentacao,
		SonoHoras:               r.SonoHoras,
		ProfissionalResponsavel: r.ProfissionalResponsavel,
		Status:                  application.ParseStatus(r.Status),
		ConsentimentoLGPD:       r.ConsentimentoLGPD,
		AutorizacaoUsoImagem:    r.AutorizacaoUsoImagem,
		AssinaturaDigital:       r.AssinaturaDigital,
		DocumentosAnexos:        MapDocumentos(r.DocumentosAnexos),
		UnidadeLinks:            MapUnidadeLinks(r.UnidadeIDs),
	}, nil
}

func MapVacinas(in []VacinaRequest) []entity.Vacina {
	out := make([]entity.Vacina, 0, len(in))
	for _, v := range in {
		out = append(out, entity.Vacina{Data: v.Data, Tipo: v.Tipo})
	}
	return out
}

func MapDocumentos(in []DocumentoAnexoRequest) []entity.DocumentoAnexo {
	out := make([]entity.DocumentoAnexo, 0, len(in))
	for _, d := range in {
		out = append(out, entity.DocumentoAnexo{
			Tipo:      d.Tipo,
			Arquivo:   d.Arquivo,
			Descricao: d.Descricao,
		})
	}
	return out
}

func MapUnidadeLinks(in []UnidadeLinkRequest) []service.UnidadeLinkInput {
	out := make([]service.UnidadeLinkInput, 0, len(in))
	for _, u := range in {
		out = append(out, service.UnidadeLinkInput{
			UnidadeID: u.UnidadeID,
			Principal: u.Principal,
		})
	}
	return out
}
