package service

import "testing"

func TestCalcConciliacaoTotais_Quitada(t *testing.T) {
	totais := CalcConciliacaoTotais(10000, 8000, 10000)
	if !totais.Quitada {
		t.Fatal("expected quitada")
	}
	if totais.SaldoEmAberto != 0 {
		t.Fatalf("saldo=%v", totais.SaldoEmAberto)
	}
}

func TestCalcConciliacaoTotais_SaldoEmAberto(t *testing.T) {
	totais := CalcConciliacaoTotais(10000, 5000, 3000)
	if totais.SaldoEmAberto != 7000 {
		t.Fatalf("saldo=%v want 7000", totais.SaldoEmAberto)
	}
	if totais.Quitada {
		t.Fatal("should not be quitada")
	}
}

func TestDeriveNotaFiscalStatus(t *testing.T) {
	if DeriveNotaFiscalStatus(100, 100) != "Pago" {
		t.Fatal("full payment")
	}
	if DeriveNotaFiscalStatus(100, 50) != "Pago Parcial" {
		t.Fatal("partial")
	}
	if DeriveNotaFiscalStatus(100, 0) != "Pendente" {
		t.Fatal("pending")
	}
}
