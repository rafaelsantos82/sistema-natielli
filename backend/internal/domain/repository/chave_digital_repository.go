package repository

import (
	"context"

	"github.com/google/uuid"
)

type ChaveDigitalRecord struct {
	ID               uuid.UUID
	UnidadeID        uuid.UUID
	SignerCommonName string
	SignerOrg        string
	SignerCPF        string
	CertValidFrom    string
	CertValidTo      string
	CertIssuer       string
	CertSerial       string
	Algoritmo        string
	PfxCiphertext    []byte
	PfxPasswordCT    []byte
	EncryptionKeyID  string
	CadastradaPor    uuid.UUID
}

type ChaveDigitalRepository interface {
	FindActiveByUnidade(ctx context.Context, unidadeID uuid.UUID) (*ChaveDigitalRecord, error)
	RevokeActiveByUnidade(ctx context.Context, unidadeID uuid.UUID) error
	Create(ctx context.Context, rec *ChaveDigitalRecord) error
}

type DocumentoAssinadoRecord struct {
	ID               uuid.UUID
	Name             string
	Type             string
	DocumentHash     string
	Signature        string
	Certificate      string
	SignedAt         string
	Algorithm        string
	SignerCommonName string
	SignerOrg        string
	SignerCPF        string
	CertValidFrom    string
	CertValidTo      string
	CertIssuer       string
	CertSerial       string
	UnidadeID        uuid.UUID
	CadastradoPor    uuid.UUID
	OriginalPath     string
	SignedPath       string
	CreatedAt        string
}

type DocumentoAssinadoListFilter struct {
	UnidadeID uuid.UUID
	Page      int
	PageSize  int
}

type DocumentoAssinadoRepository interface {
	Create(ctx context.Context, rec *DocumentoAssinadoRecord) error
	FindByID(ctx context.Context, id uuid.UUID) (*DocumentoAssinadoRecord, error)
	List(ctx context.Context, filter DocumentoAssinadoListFilter) ([]*DocumentoAssinadoRecord, int64, error)
}
