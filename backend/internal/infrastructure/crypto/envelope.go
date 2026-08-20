package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"os"
	"strings"
)

const defaultKeyID = "v1"

// Envelope cifra/decifra blobs com AES-256-GCM.
type Envelope struct {
	aead   cipher.AEAD
	keyID  string
}

func NewEnvelopeFromEnv() (*Envelope, error) {
	raw := strings.TrimSpace(os.Getenv("SIGNING_MASTER_KEY"))
	if raw == "" {
		if strings.EqualFold(strings.TrimSpace(os.Getenv("APP_ENV")), "production") {
			return nil, errors.New("SIGNING_MASTER_KEY é obrigatória em produção")
		}
		raw = "dev-only-signing-master-key-32bytes!!"
	}
	key := deriveKey(raw)
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	aead, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	return &Envelope{aead: aead, keyID: defaultKeyID}, nil
}

func deriveKey(secret string) []byte {
	sum := sha256.Sum256([]byte(secret))
	return sum[:]
}

func (e *Envelope) KeyID() string { return e.keyID }

// Encrypt retorna nonce+ciphertext.
func (e *Envelope) Encrypt(plaintext []byte) ([]byte, error) {
	nonce := make([]byte, e.aead.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, fmt.Errorf("gerar nonce: %w", err)
	}
	return e.aead.Seal(nonce, nonce, plaintext, nil), nil
}

func (e *Envelope) Decrypt(ciphertext []byte) ([]byte, error) {
	ns := e.aead.NonceSize()
	if len(ciphertext) < ns {
		return nil, errors.New("ciphertext inválido")
	}
	nonce, body := ciphertext[:ns], ciphertext[ns:]
	return e.aead.Open(nil, nonce, body, nil)
}

func (e *Envelope) EncryptString(s string) ([]byte, error) {
	return e.Encrypt([]byte(s))
}

func (e *Envelope) DecryptString(ciphertext []byte) (string, error) {
	b, err := e.Decrypt(ciphertext)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

// EncodeBase64 auxilia persistência BYTEA via driver.
func EncodeBase64(b []byte) string {
	return base64.StdEncoding.EncodeToString(b)
}

func DecodeBase64(s string) ([]byte, error) {
	return base64.StdEncoding.DecodeString(s)
}
