package service

import "math"

const ConciliacaoQuitadaTolerance = 0.01

// ConciliacaoTotais métricas derivadas para uma ação judicial.
type ConciliacaoTotais struct {
	ValorNotasVinculadas float64
	ValorPagoTotal       float64
	SaldoEmAberto        float64
	PercentualPago       float64
	Quitada              bool
}

func CalcConciliacaoTotais(valorAcao, valorNotasVinculadas, valorPagoTotal float64) ConciliacaoTotais {
	saldo := valorAcao - valorPagoTotal
	if saldo < 0 {
		saldo = 0
	}
	pct := 0.0
	if valorAcao > 0 {
		pct = (valorPagoTotal / valorAcao) * 100
	}
	return ConciliacaoTotais{
		ValorNotasVinculadas: valorNotasVinculadas,
		ValorPagoTotal:       valorPagoTotal,
		SaldoEmAberto:        saldo,
		PercentualPago:       pct,
		Quitada:              valorPagoTotal >= valorAcao-ConciliacaoQuitadaTolerance,
	}
}

func DeriveNotaFiscalStatus(valorServico, valorPago float64) string {
	if valorPago >= valorServico-ConciliacaoQuitadaTolerance {
		return "Pago"
	}
	if valorPago > 0 {
		return "Pago Parcial"
	}
	return "Pendente"
}

func roundMoney(v float64) float64 {
	return math.Round(v*100) / 100
}
