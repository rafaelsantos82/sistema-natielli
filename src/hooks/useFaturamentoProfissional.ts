import { useMemo } from 'react';
import { useConsultas, isElegivelPagamento, type Consulta } from '@/hooks/useConsultas';
import { useFinanceiro, type Lancamento } from '@/hooks/useFinanceiro';
import { UNIDADE_PADRAO_ID } from '@/hooks/useUnidades';

/**
 * Agregador READ-ONLY para o Dashboard do Profissional.
 * NÃO recalcula regras financeiras: apenas combina fontes existentes.
 *
 * - "A receber" e "Aprovado": derivado de `useConsultas` via `isElegivelPagamento`.
 * - "Pago": cruzamento por referência ao `consulta.id` em `Lancamento.documento`/`observacoes`.
 *   Quando o vínculo não existe, retorna 0 (UI deve avisar via tooltip).
 */
export interface FaturamentoProfissional {
  aReceberCount: number;
  aReceberValor: number;
  aprovadosCount: number;
  aprovadosValor: number;
  pagoCount: number;
  pagoValor: number;
  temVinculoFinanceiro: boolean;
}

const referenciaConsulta = (l: Lancamento, consultaId: string) => {
  const ref = `${l.documento ?? ''} ${l.observacoes ?? ''}`.toLowerCase();
  return ref.includes(consultaId.toLowerCase());
};

const valorConsulta = (_c: Consulta, lancamentosVinculados: Lancamento[]) =>
  lancamentosVinculados.reduce((acc, l) => acc + (l.valor ?? 0), 0);

export const useFaturamentoProfissional = (
  profissionalId: string | null,
  /** Quando informado, restringe consultas e lançamentos à unidade. `null`/`undefined` = todas. */
  unidadeId?: string | null,
): FaturamentoProfissional => {
  const { consultas } = useConsultas();
  const { lancamentos } = useFinanceiro();

  return useMemo(() => {
    const empty: FaturamentoProfissional = {
      aReceberCount: 0,
      aReceberValor: 0,
      aprovadosCount: 0,
      aprovadosValor: 0,
      pagoCount: 0,
      pagoValor: 0,
      temVinculoFinanceiro: false,
    };
    if (!profissionalId) return empty;

    const escopoUnidade = unidadeId ?? null;
    const minhas = consultas.filter((c) => {
      if (c.profissionalId !== profissionalId) return false;
      if (!escopoUnidade) return true;
      return (c.unidadeId ?? UNIDADE_PADRAO_ID) === escopoUnidade;
    });
    const elegiveis = minhas.filter(isElegivelPagamento);

    let aReceberCount = 0;
    let aReceberValor = 0;
    let aprovadosValor = 0;
    let pagoCount = 0;
    let pagoValor = 0;
    let temVinculoFinanceiro = false;

    for (const c of elegiveis) {
      const vinculados = lancamentos.filter((l) => referenciaConsulta(l, c.id));
      if (vinculados.length > 0) temVinculoFinanceiro = true;

      const valor = valorConsulta(c, vinculados);
      aprovadosValor += valor;

      const pago = vinculados.find((l) => l.status === 'Pago');
      const pendente = vinculados.find((l) => l.status === 'Pendente');

      if (pago) {
        pagoCount += 1;
        pagoValor += pago.valor ?? 0;
      } else if (pendente) {
        aReceberCount += 1;
        aReceberValor += pendente.valor ?? 0;
      } else {
        // Sem lançamento vinculado: ainda conta como "a receber" (count) sem valor
        aReceberCount += 1;
      }
    }

    return {
      aReceberCount,
      aReceberValor,
      aprovadosCount: elegiveis.length,
      aprovadosValor,
      pagoCount,
      pagoValor,
      temVinculoFinanceiro,
    };
  }, [consultas, lancamentos, profissionalId, unidadeId]);
};
