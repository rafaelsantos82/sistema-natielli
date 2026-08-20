package service

import (
	"context"
	"fmt"
	"math"
	"sort"
	"strings"
	"time"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
)

const balanceteTolerancia = 0.01

// BalanceteFiltrosInput parâmetros para geração do balancete.
type BalanceteFiltrosInput struct {
	DtIni          time.Time
	DtFin          time.Time
	UnidadeID      *uuid.UUID
	CentroCusto    *string
	OcultarZeradas bool
}

type BalanceteColunasDCDTO struct {
	SaldoAnteriorDevedor float64 `json:"saldoAnteriorDevedor"`
	SaldoAnteriorCredor  float64 `json:"saldoAnteriorCredor"`
	MovimentoDevedor     float64 `json:"movimentoDevedor"`
	MovimentoCredor      float64 `json:"movimentoCredor"`
	SaldoAtualDevedor    float64 `json:"saldoAtualDevedor"`
	SaldoAtualCredor     float64 `json:"saldoAtualCredor"`
}

type BalanceteLinhaDTO struct {
	ContaCodigo  string                `json:"conta_codigo"`
	ContaNome    string                `json:"conta_nome"`
	Tipo         string                `json:"tipo"`
	Natureza     string                `json:"natureza"`
	Nivel        int                   `json:"nivel"`
	SaldoInicial float64               `json:"saldo_inicial"`
	Debitos      float64               `json:"debitos"`
	Creditos     float64               `json:"creditos"`
	SaldoFinal   float64               `json:"saldo_final"`
	Colunas      BalanceteColunasDCDTO `json:"colunas"`
}

type BalanceteMetaDTO struct {
	TotalDebitos               float64 `json:"totalDebitos"`
	TotalCreditos              float64 `json:"totalCreditos"`
	TotalSaldoAnteriorDevedor  float64 `json:"totalSaldoAnteriorDevedor"`
	TotalSaldoAnteriorCredor   float64 `json:"totalSaldoAnteriorCredor"`
	TotalSaldoAtualDevedor     float64 `json:"totalSaldoAtualDevedor"`
	TotalSaldoAtualCredor      float64 `json:"totalSaldoAtualCredor"`
	Equilibrado                bool    `json:"equilibrado"`
	ContasSemMovimento         int     `json:"contasSemMovimento"`
}

type BalanceteResultadoDTO struct {
	Linhas []BalanceteLinhaDTO `json:"linhas"`
	Meta   BalanceteMetaDTO    `json:"meta"`
}

type BalanceteService struct {
	contas *ContaContabilService
	lancs  *LancamentoContabilService
}

func NewBalanceteService(contas *ContaContabilService, lancs *LancamentoContabilService) *BalanceteService {
	return &BalanceteService{contas: contas, lancs: lancs}
}

func round2(n float64) float64 {
	return math.Round(n*100) / 100
}

func signedSaldo(debito, credito float64, natureza string) float64 {
	if natureza == "Credora" {
		return credito - debito
	}
	return debito - credito
}

func splitSaldoDC(saldo float64, natureza string) (devedor, credor float64) {
	s := round2(saldo)
	if s == 0 {
		return 0, 0
	}
	if natureza == "Credora" {
		if s > 0 {
			return 0, s
		}
		return round2(-s), 0
	}
	if s > 0 {
		return s, 0
	}
	return 0, round2(-s)
}

func buildColunasDC(saldoIni, deb, cred, saldoFin float64, natureza string) BalanceteColunasDCDTO {
	antD, antC := splitSaldoDC(saldoIni, natureza)
	atD, atC := splitSaldoDC(saldoFin, natureza)
	return BalanceteColunasDCDTO{
		SaldoAnteriorDevedor: antD,
		SaldoAnteriorCredor:  antC,
		MovimentoDevedor:     round2(deb),
		MovimentoCredor:      round2(cred),
		SaldoAtualDevedor:    atD,
		SaldoAtualCredor:     atC,
	}
}

func (s *BalanceteService) Generate(ctx context.Context, in BalanceteFiltrosInput) (*BalanceteResultadoDTO, error) {
	if in.DtIni.After(in.DtFin) {
		return nil, domainerrors.NewValidationError("Período inicial não pode ser posterior ao período final.")
	}

	listFilter := repository.CRUDListFilter{Page: 1, PageSize: 5000}
	contasRes, err := s.contas.List(ctx, listFilter)
	if err != nil {
		return nil, err
	}
	lancRes, err := s.lancs.List(ctx, listFilter)
	if err != nil {
		return nil, err
	}

	contas := contasRes.Items
	lancamentos := lancRes.Items

	linhasMap := make(map[string]BalanceteLinhaDTO)
	byCodigo := make(map[string]ContaContabilDTO, len(contas))
	for _, c := range contas {
		byCodigo[c.Codigo] = c
	}

	ccFilter := ""
	if in.CentroCusto != nil {
		ccFilter = strings.TrimSpace(*in.CentroCusto)
	}

	for _, conta := range contas {
		var debAntes, credAntes, debPeriodo, credPeriodo float64
		for _, m := range lancamentos {
			if m.ContaCodigo != conta.Codigo {
				continue
			}
			if in.UnidadeID != nil {
				if m.UnidadeID == nil || *m.UnidadeID != *in.UnidadeID {
					continue
				}
			}
			if ccFilter != "" {
				cc := ""
				if m.CentroCusto != nil {
					cc = strings.TrimSpace(*m.CentroCusto)
				}
				if cc != ccFilter {
					continue
				}
			}
			d, err := time.Parse("2006-01-02", m.Data)
			if err != nil {
				continue
			}
			d = time.Date(d.Year(), d.Month(), d.Day(), 0, 0, 0, 0, time.UTC)
			ini := time.Date(in.DtIni.Year(), in.DtIni.Month(), in.DtIni.Day(), 0, 0, 0, 0, time.UTC)
			fim := time.Date(in.DtFin.Year(), in.DtFin.Month(), in.DtFin.Day(), 0, 0, 0, 0, time.UTC)
			if d.Before(ini) {
				debAntes += m.Debito
				credAntes += m.Credito
			} else if !d.After(fim) {
				debPeriodo += m.Debito
				credPeriodo += m.Credito
			}
		}

		saldoIni := round2(signedSaldo(debAntes, credAntes, conta.Natureza))
		debitos := round2(debPeriodo)
		creditos := round2(credPeriodo)
		saldoFin := round2(saldoIni + signedSaldo(debitos, creditos, conta.Natureza))

		linha := BalanceteLinhaDTO{
			ContaCodigo:  conta.Codigo,
			ContaNome:    conta.Nome,
			Tipo:         conta.Tipo,
			Natureza:     conta.Natureza,
			Nivel:        contaNivel(conta.Codigo, byCodigo),
			SaldoInicial: saldoIni,
			Debitos:      debitos,
			Creditos:     creditos,
			SaldoFinal:   saldoFin,
			Colunas:      buildColunasDC(saldoIni, debitos, creditos, saldoFin, conta.Natureza),
		}

		if in.OcultarZeradas && linha.Debitos == 0 && linha.Creditos == 0 && linha.SaldoInicial == 0 && linha.SaldoFinal == 0 && conta.Tipo == "Analítica" {
			continue
		}
		linhasMap[conta.Codigo] = linha
	}

	rollupSinteticas(linhasMap, contas, byCodigo)

	linhas := make([]BalanceteLinhaDTO, 0, len(linhasMap))
	for _, l := range linhasMap {
		linhas = append(linhas, l)
	}
	sort.Slice(linhas, func(i, j int) bool {
		return linhas[i].ContaCodigo < linhas[j].ContaCodigo
	})

	if in.OcultarZeradas {
		filtered := linhas[:0]
		for _, l := range linhas {
			if l.SaldoInicial != 0 || l.Debitos != 0 || l.Creditos != 0 || l.SaldoFinal != 0 || l.Tipo == "Sintética" {
				filtered = append(filtered, l)
			}
		}
		linhas = filtered
	}

	meta := computeBalanceteMeta(linhas)
	return &BalanceteResultadoDTO{Linhas: linhas, Meta: meta}, nil
}

func contaNivel(codigo string, byCodigo map[string]ContaContabilDTO) int {
	nivel := 0
	current, ok := byCodigo[codigo]
	for ok && current.Pai != nil && *current.Pai != "" {
		nivel++
		current, ok = byCodigo[*current.Pai]
	}
	return nivel
}

func rollupSinteticas(linhasMap map[string]BalanceteLinhaDTO, contas []ContaContabilDTO, byCodigo map[string]ContaContabilDTO) {
	sinteticas := make([]ContaContabilDTO, 0)
	for _, c := range contas {
		if c.Tipo == "Sintética" {
			sinteticas = append(sinteticas, c)
		}
	}
	sort.Slice(sinteticas, func(i, j int) bool {
		return len(sinteticas[i].Codigo) > len(sinteticas[j].Codigo)
	})

	for _, conta := range sinteticas {
		var filhos []BalanceteLinhaDTO
		for _, l := range linhasMap {
			c, ok := byCodigo[l.ContaCodigo]
			if !ok || c.Pai == nil || *c.Pai != conta.Codigo {
				continue
			}
			filhos = append(filhos, l)
		}
		if len(filhos) == 0 {
			continue
		}
		agg := BalanceteLinhaDTO{
			ContaCodigo: conta.Codigo,
			ContaNome:   conta.Nome,
			Tipo:        conta.Tipo,
			Natureza:    conta.Natureza,
			Nivel:       contaNivel(conta.Codigo, byCodigo),
		}
		for _, f := range filhos {
			agg.SaldoInicial = round2(agg.SaldoInicial + f.SaldoInicial)
			agg.Debitos = round2(agg.Debitos + f.Debitos)
			agg.Creditos = round2(agg.Creditos + f.Creditos)
			agg.SaldoFinal = round2(agg.SaldoFinal + f.SaldoFinal)
		}
		agg.Colunas = buildColunasDC(agg.SaldoInicial, agg.Debitos, agg.Creditos, agg.SaldoFinal, agg.Natureza)
		linhasMap[conta.Codigo] = agg
	}
}

func computeBalanceteMeta(linhas []BalanceteLinhaDTO) BalanceteMetaDTO {
	var meta BalanceteMetaDTO
	for _, l := range linhas {
		if l.Tipo == "Sintética" {
			continue
		}
		meta.TotalDebitos += l.Debitos
		meta.TotalCreditos += l.Creditos
		meta.TotalSaldoAnteriorDevedor += l.Colunas.SaldoAnteriorDevedor
		meta.TotalSaldoAnteriorCredor += l.Colunas.SaldoAnteriorCredor
		meta.TotalSaldoAtualDevedor += l.Colunas.SaldoAtualDevedor
		meta.TotalSaldoAtualCredor += l.Colunas.SaldoAtualCredor
		if l.Debitos == 0 && l.Creditos == 0 && l.SaldoInicial == 0 && l.SaldoFinal == 0 {
			meta.ContasSemMovimento++
		}
	}
	meta.TotalDebitos = round2(meta.TotalDebitos)
	meta.TotalCreditos = round2(meta.TotalCreditos)
	meta.TotalSaldoAnteriorDevedor = round2(meta.TotalSaldoAnteriorDevedor)
	meta.TotalSaldoAnteriorCredor = round2(meta.TotalSaldoAnteriorCredor)
	meta.TotalSaldoAtualDevedor = round2(meta.TotalSaldoAtualDevedor)
	meta.TotalSaldoAtualCredor = round2(meta.TotalSaldoAtualCredor)
	meta.Equilibrado = math.Abs(meta.TotalDebitos-meta.TotalCreditos) <= balanceteTolerancia
	return meta
}

// ValidateBalanceteDates valida strings yyyy-MM-dd.
func ValidateBalanceteDates(dtIni, dtFin string) (time.Time, time.Time, error) {
	ini, err := time.Parse("2006-01-02", dtIni)
	if err != nil {
		return time.Time{}, time.Time{}, domainerrors.NewValidationError("Data inicial inválida. Use o formato AAAA-MM-DD.")
	}
	fim, err := time.Parse("2006-01-02", dtFin)
	if err != nil {
		return time.Time{}, time.Time{}, domainerrors.NewValidationError("Data final inválida. Use o formato AAAA-MM-DD.")
	}
	if ini.After(fim) {
		return time.Time{}, time.Time{}, domainerrors.NewValidationError("Período inicial não pode ser posterior ao período final.")
	}
	return ini, fim, nil
}

// ParseBalanceteUnidadeID parseia UUID opcional de unidade.
func ParseBalanceteUnidadeID(raw string) (*uuid.UUID, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, nil
	}
	id, err := uuid.Parse(raw)
	if err != nil {
		return nil, domainerrors.NewValidationError(fmt.Sprintf("Unidade inválida: %s", raw))
	}
	return &id, nil
}
