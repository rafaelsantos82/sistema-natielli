package crypto

import (
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"fmt"
	"strings"
	"time"

	"golang.org/x/crypto/pkcs12"
)

type CertMetadata struct {
	CommonName   string
	Organization string
	CPF          string
	ValidFrom    time.Time
	ValidTo      time.Time
	Issuer       string
	Serial       string
}

type SignResult struct {
	DocumentHashBase64 string
	SignatureBase64    string
	CertificatePEM     string
	Metadata           CertMetadata
	Algorithm          string
}

func ParsePFX(pfxData []byte, password string) (*rsa.PrivateKey, *x509.Certificate, CertMetadata, error) {
	blocks, err := pkcs12.ToPEM(pfxData, password)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "password") {
			return nil, nil, CertMetadata{}, errors.New("senha do certificado incorreta")
		}
		return nil, nil, CertMetadata{}, fmt.Errorf("erro ao ler certificado: %w", err)
	}
	var cert *x509.Certificate
	var key *rsa.PrivateKey
	for _, b := range blocks {
		switch b.Type {
		case "CERTIFICATE":
			c, err := x509.ParseCertificate(b.Bytes)
			if err != nil {
				continue
			}
			if cert == nil || c.NotAfter.After(cert.NotAfter) {
				cert = c
			}
		case "PRIVATE KEY", "RSA PRIVATE KEY":
			if k, err := x509.ParsePKCS1PrivateKey(b.Bytes); err == nil {
				key = k
				continue
			}
			pk, err := x509.ParsePKCS8PrivateKey(b.Bytes)
			if err != nil {
				continue
			}
			k, ok := pk.(*rsa.PrivateKey)
			if ok {
				key = k
			}
		}
	}
	if cert == nil || key == nil {
		return nil, nil, CertMetadata{}, errors.New("certificado ou chave privada não encontrados no arquivo")
	}
	org := ""
	if len(cert.Subject.Organization) > 0 {
		org = cert.Subject.Organization[0]
	}
	meta := CertMetadata{
		CommonName:   cert.Subject.CommonName,
		Organization: org,
		ValidFrom:    cert.NotBefore.UTC(),
		ValidTo:      cert.NotAfter.UTC(),
		Issuer:       cert.Issuer.CommonName,
		Serial:       cert.SerialNumber.String(),
	}
	return key, cert, meta, nil
}

func ValidateICPBrasil(cert *x509.Certificate) bool {
	issuer := strings.ToUpper(cert.Issuer.CommonName)
	keywords := []string{"ICP-BRASIL", "AC BRASIL", "AUTORIDADE CERTIFICADORA", "ITI", "CERTISIGN", "SERPRO", "SERASA"}
	for _, kw := range keywords {
		if strings.Contains(issuer, kw) {
			return true
		}
	}
	return false
}

func IsCertificateValid(cert *x509.Certificate, now time.Time) bool {
	return !now.Before(cert.NotBefore) && !now.After(cert.NotAfter)
}

func SignPDFBytes(pdf []byte, pfxData []byte, password string) (*SignResult, error) {
	key, cert, meta, err := ParsePFX(pfxData, password)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	if !IsCertificateValid(cert, now) {
		return nil, errors.New("certificado expirado ou ainda não válido")
	}
	hash := sha256.Sum256(pdf)
	sig, err := rsa.SignPKCS1v15(rand.Reader, key, crypto.SHA256, hash[:])
	if err != nil {
		return nil, fmt.Errorf("falha ao assinar documento: %w", err)
	}
	pemCert := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: cert.Raw})
	return &SignResult{
		DocumentHashBase64: base64.StdEncoding.EncodeToString(hash[:]),
		SignatureBase64:    base64.StdEncoding.EncodeToString(sig),
		CertificatePEM:     string(pemCert),
		Metadata:           meta,
		Algorithm:          "SHA256withRSA",
	}, nil
}

func VerifySignedPDF(pdf []byte, documentHashB64, signatureB64, certificatePEM string) (bool, string, error) {
	hashBytes, err := base64.StdEncoding.DecodeString(documentHashB64)
	if err != nil {
		return false, "hash inválido", err
	}
	computed := sha256.Sum256(pdf)
	if string(computed[:]) != string(hashBytes) {
		return false, "O documento foi modificado após a assinatura", nil
	}
	sig, err := base64.StdEncoding.DecodeString(signatureB64)
	if err != nil {
		return false, "assinatura inválida", err
	}
	block, _ := pem.Decode([]byte(certificatePEM))
	if block == nil {
		return false, "certificado inválido", errors.New("pem inválido")
	}
	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return false, "certificado inválido", err
	}
	if !IsCertificateValid(cert, time.Now().UTC()) {
		return false, "Certificado expirado ou ainda não válido", nil
	}
	pub, ok := cert.PublicKey.(*rsa.PublicKey)
	if !ok {
		return false, "chave pública inválida", nil
	}
	if err := rsa.VerifyPKCS1v15(pub, crypto.SHA256, hashBytes, sig); err != nil {
		return false, "Assinatura digital inválida", nil
	}
	return true, "Assinatura válida", nil
}

// StampSignedPDF copia o PDF original (faixa visual pode ser adicionada depois).
func StampSignedPDF(original []byte) []byte {
	out := make([]byte, len(original))
	copy(out, original)
	return out
}
