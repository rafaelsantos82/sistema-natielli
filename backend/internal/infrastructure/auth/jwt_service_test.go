package auth

import "testing"

func TestJWTGenerateAndParse(t *testing.T) {
	svc := NewJWTService("secret", "issuer", 30, nil)

	token, err := svc.Generate("user-1", "user@example.com", "admin", false)
	if err != nil {
		t.Fatalf("unexpected generate error: %v", err)
	}

	claims, err := svc.Parse(token)
	if err != nil {
		t.Fatalf("unexpected parse error: %v", err)
	}

	if claims.Subject != "user-1" {
		t.Fatalf("expected subject user-1, got %s", claims.Subject)
	}
	if claims.Role != "admin" {
		t.Fatalf("expected role admin, got %s", claims.Role)
	}
}
