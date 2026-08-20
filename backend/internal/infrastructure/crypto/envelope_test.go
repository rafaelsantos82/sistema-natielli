package crypto

import (
	"bytes"
	"testing"
)

func TestEnvelopeEncryptDecryptRoundtrip(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	t.Setenv("SIGNING_MASTER_KEY", "test-master-key-at-least-32-chars-long!!")

	env, err := NewEnvelopeFromEnv()
	if err != nil {
		t.Fatal(err)
	}

	plain := []byte("pfx-bytes-and-password-secret")
	ct, err := env.Encrypt(plain)
	if err != nil {
		t.Fatal(err)
	}
	if bytes.Equal(ct, plain) {
		t.Fatal("ciphertext must differ from plaintext")
	}

	out, err := env.Decrypt(ct)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(out, plain) {
		t.Fatalf("got %q want %q", out, plain)
	}
}

func TestEnvelopeDecryptString(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	t.Setenv("SIGNING_MASTER_KEY", "another-test-key-32-bytes-minimum!!")

	env, err := NewEnvelopeFromEnv()
	if err != nil {
		t.Fatal(err)
	}
	ct, err := env.EncryptString("cert-password-123")
	if err != nil {
		t.Fatal(err)
	}
	s, err := env.DecryptString(ct)
	if err != nil {
		t.Fatal(err)
	}
	if s != "cert-password-123" {
		t.Fatalf("got %q", s)
	}
}

func TestEnvelopeProductionRequiresKey(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("SIGNING_MASTER_KEY", "")

	_, err := NewEnvelopeFromEnv()
	if err == nil {
		t.Fatal("expected error when SIGNING_MASTER_KEY missing in production")
	}
}
