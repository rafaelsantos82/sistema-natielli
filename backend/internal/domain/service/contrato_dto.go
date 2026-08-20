package service

import "github.com/google/uuid"

type ContratoDTO struct {
	ID                    uuid.UUID  `json:"id"`
	Titulo                string     `json:"titulo"`
	Tipo                  string     `json:"tipo"`
	PacienteID            *uuid.UUID `json:"paciente_id,omitempty"`
	PacienteNome          *string    `json:"paciente_nome,omitempty"`
	ProfissionalID        *uuid.UUID `json:"profissional_id,omitempty"`
	ProfissionalNome      *string    `json:"profissional_nome,omitempty"`
	Conteudo              string     `json:"conteudo,omitempty"`
	ArquivoNome           string     `json:"arquivo_nome,omitempty"`
	ArquivoMime           string     `json:"arquivo_mime,omitempty"`
	ArquivoTamanhoBytes   int64      `json:"arquivo_tamanho_bytes,omitempty"`
	TemArquivo            bool       `json:"tem_arquivo"`
	Status                string     `json:"status"`
	CriadoPor             uuid.UUID  `json:"criado_por"`
	CriadoEm              string     `json:"criado_em"`
	AtualizadoEm          string     `json:"atualizado_em"`
}

type ContratoInput struct {
	Titulo           string
	Tipo             string
	PacienteID       *uuid.UUID
	PacienteNome     *string
	ProfissionalID   *uuid.UUID
	ProfissionalNome *string
	Status           string
	CriadoPor        uuid.UUID
}

type ContratoArquivoUploadInput struct {
	OriginalName string
	DeclaredMIME string
	Size         int64
}

type ContratoArquivoMeta struct {
	NomeArquivo string
	MimeType    string
}

type ContratoListFilter struct {
	Query    string
	Status   string
	Page     int
	PageSize int
}

type CompartilharContratoInput struct {
	ExpiracaoHoras int
	PodeVisualizar bool
	PodeBaixar     bool
}

type CompartilharContratoResult struct {
	Token    string `json:"token"`
	URL      string `json:"url"`
	ExpiraEm string `json:"expira_em"`
}

type SignatarioInput struct {
	Nome       string
	Email      string
	Tipo       string
	CPF        string
	Parentesco string
	Ordem      int
}

type SolicitarAssinaturaInput struct {
	Mensagem        string
	Signatarios     []SignatarioInput
	ExpiraEmHoras   int
}

type SignatarioLinkDTO struct {
	ID    uuid.UUID `json:"id"`
	Nome  string    `json:"nome"`
	Email string    `json:"email"`
	URL   string    `json:"url"`
	Token string    `json:"token"`
}

type SolicitarAssinaturaResult struct {
	SolicitacaoID uuid.UUID           `json:"solicitacao_id"`
	Signatarios   []SignatarioLinkDTO `json:"signatarios"`
}

type ContratoCompartilhadoPublicDTO struct {
	Titulo         string `json:"titulo"`
	Tipo           string `json:"tipo"`
	Status         string `json:"status"`
	Conteudo       string `json:"conteudo,omitempty"`
	ArquivoNome    string `json:"arquivo_nome,omitempty"`
	ArquivoMime    string `json:"arquivo_mime,omitempty"`
	TemArquivo     bool   `json:"tem_arquivo"`
	DownloadURL    string `json:"download_url,omitempty"`
	PacienteNome   string `json:"paciente_nome,omitempty"`
	PodeVisualizar bool   `json:"pode_visualizar"`
	PodeBaixar     bool   `json:"pode_baixar"`
	ExpiraEm       string `json:"expira_em"`
}

type ContratoAssinaturaPublicDTO struct {
	SignatarioNome   string `json:"signatario_nome"`
	SignatarioEmail  string `json:"signatario_email"`
	SignatarioTipo   string `json:"signatario_tipo"`
	ContratoTitulo   string `json:"contrato_titulo"`
	ContratoTipo     string `json:"contrato_tipo"`
	Conteudo         string `json:"conteudo,omitempty"`
	ArquivoNome      string `json:"arquivo_nome,omitempty"`
	ArquivoMime      string `json:"arquivo_mime,omitempty"`
	TemArquivo       bool   `json:"tem_arquivo"`
	DownloadURL      string `json:"download_url,omitempty"`
	StatusSignatario string `json:"status_signatario"`
	JaAssinado       bool   `json:"ja_assinado"`
}
