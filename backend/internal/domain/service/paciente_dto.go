package service

import (
	"time"

	"espaco-terapia-os/backend/internal/domain/entity"

	"github.com/google/uuid"
)

type PacienteUnidadeDTO struct {
	UnidadeID uuid.UUID `json:"unidade_id"`
	Principal bool      `json:"principal"`
	Ativo     bool      `json:"ativo"`
}

type PacienteDTO struct {
	ID                      uuid.UUID            `json:"id"`
	NomeCompleto            string               `json:"nome_completo"`
	NomeSocial              *string              `json:"nome_social,omitempty"`
	DataNascimento          string               `json:"data_nascimento"`
	SexoBiologico           string               `json:"sexo_biologico"`
	CPF                     *string              `json:"cpf,omitempty"`
	RGNumero                *string              `json:"rg_numero,omitempty"`
	RGOrgao                 *string              `json:"rg_orgao,omitempty"`
	Foto                    *string              `json:"foto,omitempty"`
	TelPrincipal            string               `json:"tel_principal"`
	TelSecundario           *string              `json:"tel_secundario,omitempty"`
	Email                   *string              `json:"email,omitempty"`
	Endereco                *string              `json:"endereco,omitempty"`
	Numero                  *string              `json:"numero,omitempty"`
	Complemento             *string              `json:"complemento,omitempty"`
	Bairro                  *string              `json:"bairro,omitempty"`
	Cidade                  *string              `json:"cidade,omitempty"`
	UF                      string               `json:"uf"`
	CEP                     string               `json:"cep"`
	ResponsavelNome         string               `json:"responsavel_nome"`
	ResponsavelCPF          *string              `json:"responsavel_cpf,omitempty"`
	ResponsavelParentesco   *string              `json:"responsavel_parentesco,omitempty"`
	ResponsavelTel          *string              `json:"responsavel_tel,omitempty"`
	ResponsavelEmail        *string              `json:"responsavel_email,omitempty"`
	ContatoEmergenciaNome   *string              `json:"contato_emergencia_nome,omitempty"`
	ContatoEmergenciaTel    *string              `json:"contato_emergencia_tel,omitempty"`
	PessoasAutorizadasBusca []string             `json:"pessoas_autorizadas_busca,omitempty"`
	Escola                  *string              `json:"escola,omitempty"`
	SerieAno                *string              `json:"serie_ano,omitempty"`
	NecessidadesEspeciais   *string              `json:"necessidades_especiais,omitempty"`
	PediatraReferencia      *string              `json:"pediatra_referencia,omitempty"`
	Altura                  *float64             `json:"altura,omitempty"`
	Peso                    *float64             `json:"peso,omitempty"`
	TipoSanguineo           *string              `json:"tipo_sanguineo,omitempty"`
	Alergias                *string              `json:"alergias,omitempty"`
	DoencasCronicas         *string              `json:"doencas_cronicas,omitempty"`
	MedicacoesContinuo      *string              `json:"medicacoes_continuo,omitempty"`
	CirurgiasPrevias        *string              `json:"cirurgias_previas,omitempty"`
	HistoricoFamiliar       *string              `json:"historico_familiar,omitempty"`
	Vacinas                 []entity.Vacina      `json:"vacinas,omitempty"`
	Observacoes             *string              `json:"observacoes,omitempty"`
	AtividadeFisicaFreq     *string              `json:"atividade_fisica_frequencia,omitempty"`
	AtividadeFisicaTipo     *string              `json:"atividade_fisica_tipo,omitempty"`
	Alimentacao             *string              `json:"alimentacao,omitempty"`
	SonoHoras               *int                 `json:"sono_horas,omitempty"`
	ProfissionalResponsavel *uuid.UUID           `json:"profissional_responsavel,omitempty"`
	Status                  string               `json:"status"`
	DeletedAt               *string              `json:"deleted_at,omitempty"`
	ConsentimentoLGPD       bool                 `json:"consentimento_lgpd"`
	AutorizacaoUsoImagem    bool                 `json:"autorizacao_uso_imagem"`
	AssinaturaDigital       *string              `json:"assinatura_digital,omitempty"`
	DocumentosAnexos        []entity.DocumentoAnexo `json:"documentos_anexos,omitempty"`
	Unidades                []PacienteUnidadeDTO `json:"unidades,omitempty"`
	UltimaConsultaEm        *string              `json:"ultima_consulta_em,omitempty"`
	ProximaConsultaEm       *string              `json:"proxima_consulta_em,omitempty"`
	TotalConsultas          *int                 `json:"total_consultas,omitempty"`
	CreatedAt               string               `json:"created_at"`
	UpdatedAt               string               `json:"updated_at"`
}

func ToPacienteDTO(p *entity.Paciente) *PacienteDTO {
	if p == nil {
		return nil
	}
	unidades := make([]PacienteUnidadeDTO, 0, len(p.Unidades))
	for _, u := range p.Unidades {
		unidades = append(unidades, PacienteUnidadeDTO{
			UnidadeID: u.UnidadeID,
			Principal: u.Principal,
			Ativo:     u.Ativo,
		})
	}
	vacinas := p.Vacinas
	if vacinas == nil {
		vacinas = []entity.Vacina{}
	}
	docs := p.DocumentosAnexos
	if docs == nil {
		docs = []entity.DocumentoAnexo{}
	}
	dto := &PacienteDTO{
		ID:                      p.ID,
		NomeCompleto:            p.NomeCompleto,
		NomeSocial:              p.NomeSocial,
		DataNascimento:          p.DataNascimento.Format("2006-01-02"),
		SexoBiologico:           string(p.SexoBiologico),
		CPF:                     p.CPF,
		RGNumero:                p.RGNumero,
		RGOrgao:                 p.RGOrgao,
		Foto:                    p.Foto,
		TelPrincipal:            p.TelPrincipal,
		TelSecundario:           p.TelSecundario,
		Email:                   p.Email,
		Endereco:                p.Endereco,
		Numero:                  p.Numero,
		Complemento:             p.Complemento,
		Bairro:                  p.Bairro,
		Cidade:                  p.Cidade,
		UF:                      p.UF,
		CEP:                     p.CEP,
		ResponsavelNome:         p.ResponsavelNome,
		ResponsavelCPF:          p.ResponsavelCPF,
		ResponsavelParentesco:   p.ResponsavelParentesco,
		ResponsavelTel:          p.ResponsavelTel,
		ResponsavelEmail:        p.ResponsavelEmail,
		ContatoEmergenciaNome:   p.ContatoEmergenciaNome,
		ContatoEmergenciaTel:    p.ContatoEmergenciaTel,
		PessoasAutorizadasBusca: p.PessoasAutorizadasBusca,
		Escola:                  p.Escola,
		SerieAno:                p.SerieAno,
		NecessidadesEspeciais:   p.NecessidadesEspeciais,
		PediatraReferencia:      p.PediatraReferencia,
		Altura:                  p.Altura,
		Peso:                    p.Peso,
		TipoSanguineo:           p.TipoSanguineo,
		Alergias:                p.Alergias,
		DoencasCronicas:         p.DoencasCronicas,
		MedicacoesContinuo:      p.MedicacoesContinuo,
		CirurgiasPrevias:        p.CirurgiasPrevias,
		HistoricoFamiliar:       p.HistoricoFamiliar,
		Vacinas:                 vacinas,
		Observacoes:             p.Observacoes,
		AtividadeFisicaFreq:     p.AtividadeFisicaFreq,
		AtividadeFisicaTipo:     p.AtividadeFisicaTipo,
		Alimentacao:             p.Alimentacao,
		SonoHoras:               p.SonoHoras,
		ProfissionalResponsavel: p.ProfissionalResponsavel,
		Status:                  pacienteStatusForDTO(p),
		ConsentimentoLGPD:       p.ConsentimentoLGPD,
		AutorizacaoUsoImagem:    p.AutorizacaoUsoImagem,
		AssinaturaDigital:       p.AssinaturaDigital,
		DocumentosAnexos:        docs,
		Unidades:                unidades,
		CreatedAt:               p.CreatedAt.Format(time.RFC3339),
		UpdatedAt:               p.UpdatedAt.Format(time.RFC3339),
	}
	if p.DeletedAt != nil {
		s := p.DeletedAt.UTC().Format(time.RFC3339)
		dto.DeletedAt = &s
	}
	if p.CarteiraStats != nil {
		if p.CarteiraStats.UltimaConsultaEm != nil {
			s := p.CarteiraStats.UltimaConsultaEm.UTC().Format(time.RFC3339)
			dto.UltimaConsultaEm = &s
		}
		if p.CarteiraStats.ProximaConsultaEm != nil {
			s := p.CarteiraStats.ProximaConsultaEm.UTC().Format(time.RFC3339)
			dto.ProximaConsultaEm = &s
		}
		total := p.CarteiraStats.TotalConsultas
		dto.TotalConsultas = &total
	}
	return dto
}

func pacienteStatusForDTO(p *entity.Paciente) string {
	if p.DeletedAt != nil {
		return string(entity.PacienteInativo)
	}
	return string(p.Status)
}
