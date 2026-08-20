package auth

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	Role                 string `json:"role"`
	MustChangePassword   bool   `json:"must_change_password,omitempty"`
	jwt.RegisteredClaims
}

type RevocationStore interface {
	IsRevoked(ctx context.Context, tokenHash string) (bool, error)
	Revoke(ctx context.Context, tokenHash string, expiresAt time.Time) error
}

type JWTService struct {
	secret     []byte
	issuer     string
	expiration time.Duration
	revocations RevocationStore
}

func NewJWTService(secret, issuer string, expirationMinutes int, revocations RevocationStore) *JWTService {
	return &JWTService{
		secret:     []byte(secret),
		issuer:     issuer,
		expiration: time.Duration(expirationMinutes) * time.Minute,
		revocations: revocations,
	}
}

func (s *JWTService) Generate(userID, email, role string, mustChangePassword bool) (string, error) {
	now := time.Now().UTC()
	claims := Claims{
		Role:               role,
		MustChangePassword: mustChangePassword,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			Audience:  jwt.ClaimStrings{"api"},
			Issuer:    s.issuer,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(s.expiration)),
			ID:        userID + ":" + now.Format(time.RFC3339Nano),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.secret)
}

func (s *JWTService) Parse(raw string) (*Claims, error) {
	return s.ParseWithContext(context.Background(), raw)
}

func (s *JWTService) ParseWithContext(ctx context.Context, raw string) (*Claims, error) {
	if s.revocations != nil {
		hash := HashToken(raw)
		revoked, err := s.revocations.IsRevoked(ctx, hash)
		if err != nil {
			return nil, errors.New("invalid token")
		}
		if revoked {
			return nil, errors.New("invalid token")
		}
	}

	claims := &Claims{}
	token, err := jwt.ParseWithClaims(raw, claims, func(t *jwt.Token) (interface{}, error) {
		if t.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, errors.New("unexpected signing method")
		}
		return s.secret, nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}

func (s *JWTService) Revoke(ctx context.Context, raw string) error {
	if s.revocations == nil {
		return nil
	}
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(raw, claims, func(t *jwt.Token) (interface{}, error) {
		return s.secret, nil
	})
	if err != nil || !token.Valid || claims.ExpiresAt == nil {
		return errors.New("invalid token")
	}
	return s.revocations.Revoke(ctx, HashToken(raw), claims.ExpiresAt.Time)
}

func HashToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}
