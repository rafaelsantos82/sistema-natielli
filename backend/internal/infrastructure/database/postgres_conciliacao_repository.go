package database

import (
	"context"

	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type postgresConciliacaoRepository struct {
	db *gorm.DB
}

func NewPostgresConciliacaoRepository(db *gorm.DB) repository.ConciliacaoRepository {
	return &postgresConciliacaoRepository{db: db}
}

type conciliacaoAggRow struct {
	AcaoID               uuid.UUID `gorm:"column:acao_id"`
	ValorNotasVinculadas float64   `gorm:"column:valor_notas"`
	ValorPagoTotal       float64   `gorm:"column:valor_pago"`
	QtdNotas             int64     `gorm:"column:qtd_notas"`
}

func (r *postgresConciliacaoRepository) baseQuery(planoSaudeID *uuid.UUID, status string) *gorm.DB {
	q := r.db.Table("acoes_judiciais AS a").
		Select(`
			a.id AS acao_id,
			COALESCE(SUM(n.valor_servico), 0) AS valor_notas,
			COALESCE(SUM(COALESCE(n.valor_pago, 0)), 0) AS valor_pago,
			COUNT(n.id) AS qtd_notas`).
		Joins("LEFT JOIN notas_fiscais n ON n.acao_judicial_id = a.id").
		Group("a.id")
	if planoSaudeID != nil && *planoSaudeID != uuid.Nil {
		q = q.Where("a.plano_saude_id = ?", *planoSaudeID)
	}
	if status != "" {
		q = q.Where("a.status = ?", status)
	}
	return q
}

func (r *postgresConciliacaoRepository) ListResumoByAcao(
	ctx context.Context,
	filter repository.CRUDListFilter,
	planoSaudeID *uuid.UUID,
) ([]repository.ConciliacaoResumoRow, int64, error) {
	q := r.baseQuery(planoSaudeID, filter.Status)
	if filter.Query != "" {
		like := "%" + filter.Query + "%"
		q = q.Where("a.numero_processo ILIKE ? OR a.plano_saude_nome ILIKE ?", like, like)
	}

	var total int64
	countQ := r.db.Table("(?) AS sub", q)
	if err := countQ.WithContext(ctx).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	page := filter.Page
	if page < 1 {
		page = 1
	}
	pageSize := filter.PageSize
	if pageSize < 1 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	var rows []conciliacaoAggRow
	if err := q.WithContext(ctx).
		Order("a.data_entrada DESC").
		Offset(offset).
		Limit(pageSize).
		Scan(&rows).Error; err != nil {
		return nil, 0, err
	}

	out := make([]repository.ConciliacaoResumoRow, 0, len(rows))
	for _, row := range rows {
		out = append(out, repository.ConciliacaoResumoRow{
			AcaoID:               row.AcaoID,
			ValorNotasVinculadas: row.ValorNotasVinculadas,
			ValorPagoTotal:       row.ValorPagoTotal,
			QtdNotas:             row.QtdNotas,
		})
	}
	return out, total, nil
}

func (r *postgresConciliacaoRepository) SumByAcao(ctx context.Context, acaoID uuid.UUID) (float64, float64, int64, error) {
	var row struct {
		ValorNotas float64 `gorm:"column:valor_notas"`
		ValorPago  float64 `gorm:"column:valor_pago"`
		QtdNotas   int64   `gorm:"column:qtd_notas"`
	}
	err := r.db.WithContext(ctx).Table("notas_fiscais").
		Select(`
			COALESCE(SUM(valor_servico), 0) AS valor_notas,
			COALESCE(SUM(COALESCE(valor_pago, 0)), 0) AS valor_pago,
			COUNT(*) AS qtd_notas`).
		Where("acao_judicial_id = ?", acaoID).
		Scan(&row).Error
	if err != nil {
		return 0, 0, 0, err
	}
	return row.ValorNotas, row.ValorPago, row.QtdNotas, nil
}
