package database

import (
	"time"

	"github.com/google/uuid"
)

type chaveDigitalModel struct {
	ID                    uuid.UUID  `gorm:"column:id;type:uuid;primaryKey"`
	UnidadeID             uuid.UUID  `gorm:"column:unidade_id;type:uuid;not null"`
	SignerCommonName      string     `gorm:"column:signer_common_name;not null"`
	SignerOrg             *string    `gorm:"column:signer_org"`
	SignerCPF             *string    `gorm:"column:signer_cpf"`
	CertValidFrom         time.Time  `gorm:"column:cert_valid_from;not null"`
	CertValidTo           time.Time  `gorm:"column:cert_valid_to;not null"`
	CertIssuer            string     `gorm:"column:cert_issuer;not null"`
	CertSerial            string     `gorm:"column:cert_serial;not null"`
	Algoritmo             string     `gorm:"column:algoritmo;not null"`
	PfxCiphertext         []byte     `gorm:"column:pfx_ciphertext;not null"`
	PfxPasswordCiphertext []byte     `gorm:"column:pfx_password_ciphertext;not null"`
	EncryptionKeyID       string     `gorm:"column:encryption_key_id;not null"`
	CadastradaPor         uuid.UUID  `gorm:"column:cadastrada_por;type:uuid;not null"`
	CreatedAt             time.Time  `gorm:"column:created_at;not null"`
	UpdatedAt             time.Time  `gorm:"column:updated_at;not null"`
	RevogadaEm            *time.Time `gorm:"column:revogada_em"`
}

func (chaveDigitalModel) TableName() string { return "chaves_digitais" }

type documentoAssinadoModel struct {
	ID               uuid.UUID  `gorm:"column:id;type:uuid;primaryKey"`
	Name             string     `gorm:"column:name;not null"`
	Type             string     `gorm:"column:type;not null"`
	DocumentHash     string     `gorm:"column:document_hash;not null"`
	Signature        string     `gorm:"column:signature;not null"`
	Certificate      string     `gorm:"column:certificate;not null"`
	SignedAt         time.Time  `gorm:"column:signed_at;not null"`
	Algorithm        string     `gorm:"column:algorithm;not null"`
	SignerCommonName string     `gorm:"column:signer_common_name;not null"`
	SignerOrg        *string    `gorm:"column:signer_org"`
	SignerCPF        *string    `gorm:"column:signer_cpf"`
	SignerCNPJ       *string    `gorm:"column:signer_cnpj"`
	CertValidFrom    time.Time  `gorm:"column:cert_valid_from;not null"`
	CertValidTo      time.Time  `gorm:"column:cert_valid_to;not null"`
	CertIssuer       string     `gorm:"column:cert_issuer;not null"`
	CertSerial       string     `gorm:"column:cert_serial;not null"`
	UnidadeID        *uuid.UUID `gorm:"column:unidade_id;type:uuid"`
	CadastradoPor    *uuid.UUID `gorm:"column:cadastrado_por;type:uuid"`
	OriginalPath     *string    `gorm:"column:original_path"`
	SignedPath       *string    `gorm:"column:signed_path"`
	CreatedAt        time.Time  `gorm:"column:created_at;not null"`
}

func (documentoAssinadoModel) TableName() string { return "documentos_assinados" }
