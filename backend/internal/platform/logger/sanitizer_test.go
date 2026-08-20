package logger

import (
	"log/slog"
	"strings"
	"testing"
)

func TestRedactSensitiveKeys(t *testing.T) {
	cases := []struct {
		key string
	}{
		{"password"},
		{"Authorization"},
		{"access_token"},
		{"DATABASE_URL"},
	}
	for _, tc := range cases {
		if got := RedactValue(tc.key, "secret-value"); got != redacted {
			t.Fatalf("key %q: got %q want redacted", tc.key, got)
		}
	}
}

func TestMaskIP(t *testing.T) {
	if got := MaskIP("187.32.1.2"); got != "187.32.xxx.xxx" {
		t.Fatalf("got %q", got)
	}
}

func TestSanitizePathQuery(t *testing.T) {
	got := SanitizePath("/api/v1/auth/token?token=abc&page=1")
	if strings.Contains(got, "abc") {
		t.Fatalf("token leaked in path: %q", got)
	}
	if strings.Contains(got, "abc") {
		t.Fatalf("token value leaked: %q", got)
	}
	if !strings.Contains(got, "token=") {
		t.Fatalf("expected token param in path: %q", got)
	}
}

func TestLooksLikeJWT(t *testing.T) {
	if !looksLikeJWT("eyJhbGciOiJIUzI1NiJ9.payload.sig") {
		t.Fatal("expected jwt detection")
	}
}

func TestRedactAttr(t *testing.T) {
	attr := RedactAttr(nil, slog.String("password", "hunter2"))
	if attr.Value.String() != redacted {
		t.Fatalf("got %q", attr.Value.String())
	}
}

func TestMaskEmail(t *testing.T) {
	got := MaskEmail("rafael@example.com")
	if strings.Contains(got, "rafael") {
		t.Fatalf("local part not masked: %q", got)
	}
}
