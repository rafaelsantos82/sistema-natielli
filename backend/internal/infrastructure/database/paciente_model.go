package database

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type pacienteModel struct {
	ID                      uuid.UUID      `gorm:"type:uuid;primaryKey"`
	NomeCompleto            string         `gorm:"column:nome_completo;not null"`
	NomeSocial              *string        `gorm:"column:nome_social"`
	DataNascimento          time.Time      `gorm:"column:data_nascimento;type:date;not null"`
	SexoBiologico           string         `gorm:"column:sexo_biologico;not null"`
	CPF                     *string        `gorm:"column:cpf"`
	RGNumero                *string        `gorm:"column:rg_numero"`
	RGOrgao                 *string        `gorm:"column:rg_orgao"`
	Foto                    *string        `gorm:"column:foto"`
	TelPrincipal            string         `gorm:"column:tel_principal;not null"`
	TelSecundario           *string        `gorm:"column:tel_secundario"`
	Email                   *string        `gorm:"column:email"`
	Endereco                *string        `gorm:"column:endereco"`
	Numero                  *string        `gorm:"column:numero"`
	Complemento             *string        `gorm:"column:complemento"`
	Bairro                  *string        `gorm:"column:bairro"`
	Cidade                  *string        `gorm:"column:cidade"`
	UF                      string         `gorm:"column:uf;not null"`
	CEP                     string         `gorm:"column:cep;not null"`
	ResponsavelNome         string         `gorm:"column:responsavel_nome;not null"`
	ResponsavelCPF          *string        `gorm:"column:responsavel_cpf"`
	ResponsavelParentesco   *string        `gorm:"column:responsavel_parentesco"`
	ResponsavelTel          *string        `gorm:"column:responsavel_tel"`
	ResponsavelEmail        *string        `gorm:"column:responsavel_email"`
	ContatoEmergenciaNome   *string        `gorm:"column:contato_emergencia_nome"`
	ContatoEmergenciaTel    *string        `gorm:"column:contato_emergencia_tel"`
	PessoasAutorizadasBusca []string       `gorm:"column:pessoas_autorizadas_busca;type:text[]"`
	Escola                  *string        `gorm:"column:escola"`
	SerieAno                *string        `gorm:"column:serie_ano"`
	NecessidadesEspeciais   *string        `gorm:"column:necessidades_especiais"`
	PediatraReferencia      *string        `gorm:"column:pediatra_referencia"`
	Altura                  *float64       `gorm:"column:altura"`
	Peso                    *float64       `gorm:"column:peso"`
	TipoSanguineo           *string        `gorm:"column:tipo_sanguineo"`
	Alergias                *string        `gorm:"column:alergias"`
	DoencasCronicas         *string        `gorm:"column:doencas_cronicas"`
	MedicacoesContinuo      *string        `gorm:"column:medicacoes_continuo"`
	CirurgiasPrevias        *string        `gorm:"column:cirurgias_previas"`
	HistoricoFamiliar       *string        `gorm:"column:historico_familiar"`
	Vacinas                 JSONB          `gorm:"column:vacinas;type:jsonb"`
	Observacoes             *string        `gorm:"column:observacoes"`
	AtividadeFisicaFreq     *string        `gorm:"column:atividade_fisica_frequencia"`
	AtividadeFisicaTipo     *string        `gorm:"column:atividade_fisica_tipo"`
	Alimentacao             *string        `gorm:"column:alimentacao"`
	SonoHoras               *int           `gorm:"column:sono_horas"`
	ProfissionalResponsavel *uuid.UUID     `gorm:"column:profissional_responsavel;type:uuid"`
	Status                  string         `gorm:"column:status;not null"`
	ConsentimentoLGPD       bool           `gorm:"column:consentimento_lgpd;not null"`
	AutorizacaoUsoImagem    bool           `gorm:"column:autorizacao_uso_imagem;not null"`
	AssinaturaDigital       *string        `gorm:"column:assinatura_digital"`
	DocumentosAnexos        JSONB          `gorm:"column:documentos_anexos;type:jsonb"`
	CreatedAt               time.Time      `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt               time.Time      `gorm:"column:updated_at;autoUpdateTime"`
	DeletedAt               gorm.DeletedAt `gorm:"column:deleted_at;index"`
}

func (pacienteModel) TableName() string { return "pacientes" }

type pacienteUnidadeModel struct {
	PacienteID uuid.UUID `gorm:"column:paciente_id;type:uuid;primaryKey"`
	UnidadeID  uuid.UUID `gorm:"column:unidade_id;type:uuid;primaryKey"`
	Principal  bool      `gorm:"column:principal;not null"`
	Ativo      bool      `gorm:"column:ativo;not null"`
	VinculadoEm time.Time `gorm:"column:vinculado_em;autoCreateTime"`
}

func (pacienteUnidadeModel) TableName() string { return "paciente_unidades" }
