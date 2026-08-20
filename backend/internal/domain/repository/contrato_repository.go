package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type ContratoRecord struct {
	ID               uuid.UUID
	Titulo           string
	Tipo             string
	PacienteID       *uuid.UUID
	PacienteNome     *string
	ProfissionalID   *uuid.UUID
	ProfissionalNome *string
	Conteudo              string
	ArquivoNome           string
	ArquivoMime           string
	ArquivoTamanhoBytes   int64
	StoragePath           string
	Status           string
	CriadoPor        uuid.UUID
	CriadoEm         time.Time
	AtualizadoEm     time.Time
	DeletedAt        *time.Time
}

type CompartilhamentoRecord struct {
	ID              uuid.UUID
	ContratoID      uuid.UUID
	ContratoTitulo  string
	Token           string
	ExpiraEm        time.Time
	PodeVisualizar  bool
	PodeBaixar      bool
}

type SignatarioRecord struct {
	ID            uuid.UUID
	SolicitacaoID uuid.UUID
	Nome          string
	Email         string
	Tipo          string
	CPF           *string
	Parentesco    *string
	Ordem         int
	Status        string
	TokenAcesso   string
	ExpiraEm      *time.Time
	AssinadoEm    *time.Time
}

type SolicitacaoAssinaturaRecord struct {
	ID                   uuid.UUID
	ContratoID           uuid.UUID
	ContratoTitulo       string
	Status               string
	MensagemPersonalizada *string
	ExpiraEm             *time.Time
}

type ContratoRepository interface {
	List(ctx context.Context, q, status string, page, pageSize int) ([]*ContratoRecord, int64, error)
	GetByID(ctx context.Context, id uuid.UUID) (*ContratoRecord, error)
	Create(ctx context.Context, rec *ContratoRecord) error
	Update(ctx context.Context, rec *ContratoRecord) error
	SoftDelete(ctx context.Context, id uuid.UUID, at time.Time) error

	CreateCompartilhamento(ctx context.Context, rec *CompartilhamentoRecord) error
	FindCompartilhamentoByToken(ctx context.Context, token string) (*CompartilhamentoRecord, error)
	RecordCompartilhamentoAcesso(ctx context.Context, compartilhamentoID uuid.UUID, ip string) error

	CreateSolicitacao(ctx context.Context, rec *SolicitacaoAssinaturaRecord) error
	CreateSignatario(ctx context.Context, rec *SignatarioRecord) error
	FindSignatarioByToken(ctx context.Context, token string) (*SignatarioRecord, *ContratoRecord, error)
	UpdateSignatarioStatus(ctx context.Context, id uuid.UUID, status string, assinadoEm time.Time, ip string) error
	CountSignatariosPendentes(ctx context.Context, solicitacaoID uuid.UUID) (int64, error)
	GetSolicitacaoByContrato(ctx context.Context, contratoID uuid.UUID) (*SolicitacaoAssinaturaRecord, error)
	UpdateContratoStatus(ctx context.Context, id uuid.UUID, status string) error
}
