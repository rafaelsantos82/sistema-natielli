import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { featureFlags } from '@/lib/featureFlags';
import { createResource, deleteResource, listResource, updateResource } from '@/lib/api/genericCrud';
import { fetchBalancete } from '@/lib/api/contabilidade';
import { gerarBalancete as gerarBalanceteLib } from '@/lib/contabilidade/gerarBalancete';
import type {
  BalanceteFiltros,
  BalanceteResultado,
  ContaContabil,
  LancamentoContabil,
} from '@/lib/contabilidade/types';

export type { BalanceteFiltros, BalanceteResultado, ContaContabil, LancamentoContabil };
/** @deprecated Use ContaContabil */
export type BalanceteConfig = ContaContabil;

const STORAGE_KEY_CONTAS = 'contabilidade_contas';
const STORAGE_KEY_LANCAMENTOS = 'contabilidade_lancamentos';

function normalizeConta(raw: Record<string, unknown>): ContaContabil {
  return {
    id: String(raw.id ?? raw.codigo ?? ''),
    codigo: String(raw.codigo ?? ''),
    nome: String(raw.nome ?? ''),
    tipo: (raw.tipo as ContaContabil['tipo']) ?? 'Analítica',
    natureza: (raw.natureza as ContaContabil['natureza']) ?? 'Devedora',
    pai: raw.pai != null ? String(raw.pai) : null,
  };
}

function normalizeLancamento(raw: Record<string, unknown>): LancamentoContabil {
  return {
    id: String(raw.id ?? ''),
    data: String(raw.data ?? '').slice(0, 10),
    conta_codigo: String(raw.conta_codigo ?? ''),
    conta_nome: raw.conta_nome != null ? String(raw.conta_nome) : undefined,
    debito: Number(raw.debito ?? raw.valor ?? 0),
    credito: Number(raw.credito ?? 0),
    historico: raw.historico != null ? String(raw.historico) : undefined,
    centro_custo: raw.centro_custo != null ? String(raw.centro_custo) : null,
    unidade_id: raw.unidade_id != null ? String(raw.unidade_id) : null,
  };
}

const readContas = (): ContaContabil[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY_CONTAS) ?? '[]') as Record<string, unknown>[];
    return raw.map(normalizeConta);
  } catch {
    return [];
  }
};

const readLancamentos = (): LancamentoContabil[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY_LANCAMENTOS) ?? '[]') as Record<string, unknown>[];
    return raw.map(normalizeLancamento);
  } catch {
    return [];
  }
};

export const useBalancetes = () => {
  const apiEnabled = featureFlags.contabilidadeApiEnabled;
  const queryClient = useQueryClient();

  const contasQuery = useQuery({
    queryKey: ['contabilidade-contas'],
    enabled: apiEnabled,
    queryFn: async () => {
      const { items } = await listResource<Record<string, unknown>>('/contabilidade/contas', {
        page_size: 500,
      });
      return items.map(normalizeConta);
    },
  });

  const lancamentosQuery = useQuery({
    queryKey: ['contabilidade-lancamentos'],
    enabled: apiEnabled,
    queryFn: async () => {
      const { items } = await listResource<Record<string, unknown>>('/contabilidade/lancamentos', {
        page_size: 2000,
      });
      return items.map(normalizeLancamento);
    },
  });

  const contas = apiEnabled ? (contasQuery.data ?? []) : readContas();
  const lancamentos = apiEnabled ? (lancamentosQuery.data ?? []) : readLancamentos();
  const isLoading = apiEnabled && (contasQuery.isLoading || lancamentosQuery.isLoading);
  const isError = apiEnabled && (contasQuery.isError || lancamentosQuery.isError);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['contabilidade-contas'] });
    await queryClient.invalidateQueries({ queryKey: ['contabilidade-lancamentos'] });
  };

  const gerarBalancete = useCallback(
    async (filtros: BalanceteFiltros): Promise<BalanceteResultado> => {
      if (apiEnabled) {
        try {
          return await fetchBalancete(filtros);
        } catch {
          // fallback client-side se endpoint indisponível
        }
      }
      return gerarBalanceteLib(contas, lancamentos, filtros);
    },
    [apiEnabled, contas, lancamentos],
  );

  const addConta = async (data: Omit<ContaContabil, 'id'>) => {
    if (apiEnabled) {
      await createResource('/contabilidade/contas', data);
      await invalidate();
      return;
    }
    const next = [...readContas(), { ...data, id: data.codigo }];
    localStorage.setItem(STORAGE_KEY_CONTAS, JSON.stringify(next));
  };

  const addLancamento = async (data: Omit<LancamentoContabil, 'id'>) => {
    if (apiEnabled) {
      await createResource('/contabilidade/lancamentos', data);
      await invalidate();
      return;
    }
    const next = [...readLancamentos(), { ...data, id: crypto.randomUUID() }];
    localStorage.setItem(STORAGE_KEY_LANCAMENTOS, JSON.stringify(next));
  };

  return {
    contas,
    lancamentos,
    isLoading,
    isError,
    gerarBalancete,
    addConta,
    addLancamento,
    updateConta: async (id: string, patch: Partial<ContaContabil>) => {
      if (apiEnabled) {
        const cur = contas.find((c) => c.id === id || c.codigo === id);
        if (cur) await updateResource('/contabilidade/contas', cur.codigo, { ...cur, ...patch });
        await invalidate();
      }
    },
    deleteConta: async (codigo: string) => {
      if (apiEnabled) {
        await deleteResource('/contabilidade/contas', codigo);
        await invalidate();
      }
    },
    deleteLancamento: async (id: string) => {
      if (apiEnabled) {
        await deleteResource('/contabilidade/lancamentos', id);
        await invalidate();
      }
    },
    refetch: invalidate,
  };
};
