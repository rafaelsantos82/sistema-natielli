package service

import (
	"context"
	"log/slog"
	"time"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
)

type ConciliacaoService struct {
	acaoStore  AcaoJudicialStore
	notaStore  NotaFiscalStore
	concRepo   repository.ConciliacaoRepository
	logger     *slog.Logger
}

func NewConciliacaoService(
	acao AcaoJudicialStore,
	nota NotaFiscalStore,
	conc repository.ConciliacaoRepository,
	logger *slog.Logger,
) *ConciliacaoService {
	return &ConciliacaoService{acaoStore: acao, notaStore: nota, concRepo: conc, logger: logger}
}

func (s *ConciliacaoService) GetResumoAcao(ctx context.Context, acaoID uuid.UUID) (*ConciliacaoAcaoResumoDTO, error) {
	if err := requireID(acaoID); err != nil {
		return nil, err
	}
	acao, err := s.acaoStore.GetByID(ctx, acaoID)
	if err != nil {
		return nil, err
	}
	if acao == nil {
		return nil, notFound("AcaoJudicial", acaoID)
	}
	return s.buildResumo(ctx, *acao, true)
}

func (s *ConciliacaoService) ListResumos(
	ctx context.Context,
	filter repository.CRUDListFilter,
	planoSaudeID *uuid.UUID,
) (*ListResult[ConciliacaoAcaoResumoItemDTO], error) {
	filter = normalizeCRUDFilter(filter)
	rows, total, err := s.concRepo.ListResumoByAcao(ctx, filter, planoSaudeID)
	if err != nil {
		return nil, err
	}

	items := make([]ConciliacaoAcaoResumoItemDTO, 0, len(rows))
	for _, row := range rows {
		acao, err := s.acaoStore.GetByID(ctx, row.AcaoID)
		if err != nil {
			return nil, err
		}
		if acao == nil {
			continue
		}
		totais := CalcConciliacaoTotais(acao.ValorAcao, row.ValorNotasVinculadas, row.ValorPagoTotal)
		items = append(items, ConciliacaoAcaoResumoItemDTO{
			AcaoJudicial:         *acao,
			ValorNotasVinculadas: totais.ValorNotasVinculadas,
			ValorPagoTotal:       totais.ValorPagoTotal,
			SaldoEmAberto:        totais.SaldoEmAberto,
			PercentualPago:       totais.PercentualPago,
			Quitada:              totais.Quitada,
			QtdNotas:             int(row.QtdNotas),
		})
	}

	pageSize := filter.PageSize
	if pageSize < 1 {
		pageSize = 20
	}
	totalPages := int(total) / pageSize
	if int(total)%pageSize != 0 {
		totalPages++
	}
	return &ListResult[ConciliacaoAcaoResumoItemDTO]{
		Items:      items,
		Total:      total,
		Page:       filter.Page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

func (s *ConciliacaoService) ConciliarNota(
	ctx context.Context,
	notaID, acaoID uuid.UUID,
	valorPago float64,
) (*ConciliarNotaResultDTO, error) {
	if err := requireID(notaID); err != nil {
		return nil, err
	}
	if err := requireID(acaoID); err != nil {
		return nil, err
	}

	nota, err := s.notaStore.GetByID(ctx, notaID)
	if err != nil {
		return nil, err
	}
	if nota == nil {
		return nil, notFound("NotaFiscal", notaID)
	}

	acao, err := s.acaoStore.GetByID(ctx, acaoID)
	if err != nil {
		return nil, err
	}
	if acao == nil {
		return nil, notFound("AcaoJudicial", acaoID)
	}

	if nota.PlanoSaudeID != acao.PlanoSaudeID {
		return nil, domainerrors.NewValidationError("A ação judicial deve ser do mesmo plano de saúde da nota fiscal.")
	}

	valorPago = roundMoney(valorPago)
	if valorPago < 0 {
		return nil, domainerrors.NewValidationError("O valor pago não pode ser negativo.")
	}
	if valorPago > nota.ValorServico+ConciliacaoQuitadaTolerance {
		return nil, domainerrors.NewValidationError("O valor pago não pode ser maior que o valor do serviço da nota.")
	}

	de, _ := time.Parse("2006-01-02", nota.DataEmissao)
	dv, _ := time.Parse("2006-01-02", nota.DataVencimento)
	now := time.Now().UTC()
	vp := valorPago
	status := DeriveNotaFiscalStatus(nota.ValorServico, valorPago)

	in := NotaFiscalInput{
		NumeroNota:      nota.NumeroNota,
		PlanoSaudeID:    nota.PlanoSaudeID,
		PlanoSaudeNome:  nota.PlanoSaudeNome,
		PacienteNome:    nota.PacienteNome,
		DataEmissao:     de,
		DataVencimento:  dv,
		ValorServico:    nota.ValorServico,
		ValorPago:       &vp,
		Status:          status,
		AcaoJudicialID:  &acaoID,
		DataConciliacao: &now,
		Observacoes:     nota.Observacoes,
	}

	updated, err := s.notaStore.Update(ctx, notaID, in)
	if err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "nota_fiscal", "conciliar", notaID)

	resumo, err := s.buildResumo(ctx, *acao, true)
	if err != nil {
		return nil, err
	}
	return &ConciliarNotaResultDTO{Nota: *updated, Resumo: *resumo}, nil
}

func (s *ConciliacaoService) buildResumo(
	ctx context.Context,
	acao AcaoJudicialDTO,
	includeNotas bool,
) (*ConciliacaoAcaoResumoDTO, error) {
	valorNotas, valorPago, qtd, err := s.concRepo.SumByAcao(ctx, acao.ID)
	if err != nil {
		return nil, err
	}
	totais := CalcConciliacaoTotais(acao.ValorAcao, valorNotas, valorPago)

	resumo := &ConciliacaoAcaoResumoDTO{
		AcaoJudicial:         acao,
		ValorNotasVinculadas: totais.ValorNotasVinculadas,
		ValorPagoTotal:       totais.ValorPagoTotal,
		SaldoEmAberto:        totais.SaldoEmAberto,
		PercentualPago:       totais.PercentualPago,
		Quitada:              totais.Quitada,
		QtdNotas:             int(qtd),
	}

	if includeNotas {
		all, err := s.notaStore.List(ctx, repository.CRUDListFilter{Page: 1, PageSize: 500})
		if err != nil {
			return nil, err
		}
		notas := make([]NotaFiscalDTO, 0)
		for _, n := range all.Items {
			if n.AcaoJudicialID != nil && *n.AcaoJudicialID == acao.ID {
				notas = append(notas, n)
			}
		}
		resumo.Notas = notas
	}

	return resumo, nil
}
