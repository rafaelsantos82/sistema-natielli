package service

import (
	"context"
	"testing"
	"time"

	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
)

func TestSignedSaldoAndSplit(t *testing.T) {
	if got := signedSaldo(100, 30, "Devedora"); got != 70 {
		t.Fatalf("devedora got %v", got)
	}
	if got := signedSaldo(10, 50, "Credora"); got != 40 {
		t.Fatalf("credora got %v", got)
	}
	d, c := splitSaldoDC(100, "Devedora")
	if d != 100 || c != 0 {
		t.Fatalf("split devedor: %v %v", d, c)
	}
}

func TestValidateBalanceteDates(t *testing.T) {
	_, _, err := ValidateBalanceteDates("2026-06-01", "2026-05-01")
	if err == nil {
		t.Fatal("expected error for inverted period")
	}
	ini, fim, err := ValidateBalanceteDates("2026-05-01", "2026-05-31")
	if err != nil || ini.After(fim) {
		t.Fatalf("valid period: %v", err)
	}
}

func TestBalanceteServiceGenerate_equilibrado(t *testing.T) {
	contaStore := &mockContaContabilStore{items: []ContaContabilDTO{
		{Codigo: "1.1", Nome: "Caixa", Tipo: "Analítica", Natureza: "Devedora"},
		{Codigo: "2.1", Nome: "Fornec", Tipo: "Analítica", Natureza: "Credora"},
	}}
	lancStore := &mockLancamentoContabilStore{items: []LancamentoContabilDTO{
		{Data: "2026-05-05", ContaCodigo: "1.1", Debito: 50, Credito: 0, Historico: "d"},
		{Data: "2026-05-05", ContaCodigo: "2.1", Debito: 0, Credito: 50, Historico: "c"},
	}}
	svc := NewBalanceteService(
		NewContaContabilService(contaStore, nil),
		NewLancamentoContabilService(lancStore, nil),
	)
	ini, _ := time.Parse("2006-01-02", "2026-05-01")
	fim, _ := time.Parse("2006-01-02", "2026-05-31")
	out, err := svc.Generate(context.Background(), BalanceteFiltrosInput{DtIni: ini, DtFin: fim})
	if err != nil {
		t.Fatal(err)
	}
	if !out.Meta.Equilibrado {
		t.Fatalf("expected balanced, meta %+v", out.Meta)
	}
}

type mockContaContabilStore struct {
	items []ContaContabilDTO
}

func (m *mockContaContabilStore) Create(ctx context.Context, in ContaContabilInput) (*ContaContabilDTO, error) {
	return nil, nil
}
func (m *mockContaContabilStore) GetByCodigo(ctx context.Context, codigo string) (*ContaContabilDTO, error) {
	return nil, nil
}
func (m *mockContaContabilStore) Update(ctx context.Context, codigo string, in ContaContabilInput) (*ContaContabilDTO, error) {
	return nil, nil
}
func (m *mockContaContabilStore) Delete(ctx context.Context, codigo string) error { return nil }
func (m *mockContaContabilStore) List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[ContaContabilDTO], error) {
	return &ListResult[ContaContabilDTO]{Items: m.items, Page: 1, PageSize: len(m.items), Total: int64(len(m.items)), TotalPages: 1}, nil
}

type mockLancamentoContabilStore struct {
	items []LancamentoContabilDTO
}

func (m *mockLancamentoContabilStore) Create(ctx context.Context, in LancamentoContabilInput) (*LancamentoContabilDTO, error) {
	return nil, nil
}
func (m *mockLancamentoContabilStore) GetByID(ctx context.Context, id uuid.UUID) (*LancamentoContabilDTO, error) {
	return nil, nil
}
func (m *mockLancamentoContabilStore) Update(ctx context.Context, id uuid.UUID, in LancamentoContabilInput) (*LancamentoContabilDTO, error) {
	return nil, nil
}
func (m *mockLancamentoContabilStore) Delete(ctx context.Context, id uuid.UUID) error { return nil }
func (m *mockLancamentoContabilStore) List(ctx context.Context, filter repository.CRUDListFilter) (*ListResult[LancamentoContabilDTO], error) {
	return &ListResult[LancamentoContabilDTO]{Items: m.items, Page: 1, PageSize: len(m.items), Total: int64(len(m.items)), TotalPages: 1}, nil
}
