package service

import "github.com/google/uuid"

type ChaveDigitalDTO struct {
	ID               uuid.UUID `json:"id"`
	UnidadeID        uuid.UUID `json:"unidade_id"`
	SignerCommonName string    `json:"signer_common_name"`
	SignerOrg        string    `json:"signer_org,omitempty"`
	SignerCPF        string    `json:"signer_cpf,omitempty"`
	CertValidFrom    string    `json:"cert_valid_from"`
	CertValidTo      string    `json:"cert_valid_to"`
	CertIssuer       string    `json:"cert_issuer"`
	CertSerial       string    `json:"cert_serial"`
	Algoritmo        string    `json:"algoritmo"`
	IsICPBrasil      bool      `json:"is_icp_brasil"`
	IsValid          bool      `json:"is_valid"`
}

type DocumentoAssinadoDTO struct {
	ID               uuid.UUID `json:"id"`
	Name             string    `json:"name"`
	Type             string    `json:"type"`
	DocumentHash     string    `json:"document_hash"`
	SignedAt         string    `json:"signed_at"`
	Algorithm        string    `json:"algorithm"`
	SignerCommonName string    `json:"signer_common_name"`
	SignerOrg        string    `json:"signer_org,omitempty"`
	CertValidTo      string    `json:"cert_valid_to"`
	CertIssuer       string    `json:"cert_issuer"`
	UnidadeID        uuid.UUID `json:"unidade_id"`
}

type VerifyAssinaturaResult struct {
	Valid   bool   `json:"valid"`
	Message string `json:"message"`
}
