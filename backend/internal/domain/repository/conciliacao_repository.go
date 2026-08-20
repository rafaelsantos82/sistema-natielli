package repository

import (
	"context"

	"github.com/google/uuid"
)

// ConciliacaoResumoRow agregação SQL por ação judicial.
type ConciliacaoResumoRow struct {
	AcaoID               uuid.UUID
	ValorNotasVinculadas float64
	ValorPagoTotal       float64
	QtdNotas             int64
}

// ConciliacaoRepository consultas de conciliação NF x ações.
type ConciliacaoRepository interface {
	ListResumoByAcao(ctx context.Context, filter CRUDListFilter, planoSaudeID *uuid.UUID) ([]ConciliacaoResumoRow, int64, error)
	SumByAcao(ctx context.Context, acaoID uuid.UUID) (valorNotas, valorPago float64, qtd int64, err error)
}
