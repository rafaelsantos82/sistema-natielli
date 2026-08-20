import { apiRequest } from '@/lib/api/client';
import type { ListMeta } from '@/lib/api/types';
import type { NotaFiscal } from '@/hooks/useNotasFiscais';
import type { AcaoJudicial } from '@/hooks/useAcoesJudiciais';

export type ConciliacaoAcaoResumo = {
  acao_judicial: AcaoJudicial;
  valor_notas_vinculadas: number;
  valor_pago_total: number;
  saldo_em_aberto: number;
  percentual_pago: number;
  quitada: boolean;
  qtd_notas: number;
  notas?: NotaFiscal[];
};

export type ConciliacaoAcaoResumoItem = Omit<ConciliacaoAcaoResumo, 'notas'>;

export type ConciliarNotaResult = {
  nota: NotaFiscal;
  resumo_acao: ConciliacaoAcaoResumo;
};

export async function getConciliacaoAcao(id: string): Promise<ConciliacaoAcaoResumo> {
  const { data } = await apiRequest<ConciliacaoAcaoResumo>(`/acoes-judiciais/${encodeURIComponent(id)}/conciliacao`);
  return data;
}

export async function listConciliacaoResumo(
  params: Record<string, string | number | undefined> = {},
): Promise<{ items: ConciliacaoAcaoResumoItem[]; meta: ListMeta }> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') {
      q.set(k, String(v));
    }
  });
  const qs = q.toString();
  const { data, meta } = await apiRequest<ConciliacaoAcaoResumoItem[]>(
    `/acoes-judiciais/conciliacao-resumo${qs ? `?${qs}` : ''}`,
  );
  return {
    items: data ?? [],
    meta: (meta as ListMeta) ?? { page: 1, page_size: 20, total: 0, total_pages: 0 },
  };
}

export async function conciliarNotaApi(
  notaId: string,
  body: { acao_judicial_id: string; valor_pago: number },
): Promise<ConciliarNotaResult> {
  const { data } = await apiRequest<ConciliarNotaResult>(
    `/notas-fiscais/${encodeURIComponent(notaId)}/conciliar`,
    { method: 'POST', body },
  );
  return data;
}
