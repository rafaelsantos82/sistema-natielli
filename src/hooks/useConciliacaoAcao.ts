import { useQuery, useQueryClient } from '@tanstack/react-query';
import { featureFlags } from '@/lib/featureFlags';
import {
  conciliarNotaApi,
  getConciliacaoAcao,
  listConciliacaoResumo,
  type ConciliacaoAcaoResumo,
  type ConciliacaoAcaoResumoItem,
} from '@/lib/api/conciliacao';

export function useConciliacaoResumo(params?: {
  plano_saude_id?: string;
  status?: string;
  page?: number;
  page_size?: number;
  q?: string;
}) {
  const apiEnabled = featureFlags.planosApiEnabled;
  return useQuery({
    queryKey: ['conciliacao-resumo', params],
    enabled: apiEnabled,
    queryFn: () => listConciliacaoResumo(params),
  });
}

export function useConciliacaoAcaoDetalhe(acaoId: string | undefined) {
  const apiEnabled = featureFlags.planosApiEnabled;
  return useQuery({
    queryKey: ['conciliacao-acao', acaoId],
    enabled: apiEnabled && Boolean(acaoId),
    queryFn: () => getConciliacaoAcao(acaoId!),
  });
}

export function useConciliarNota() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais'] }),
      queryClient.invalidateQueries({ queryKey: ['acoes-judiciais'] }),
      queryClient.invalidateQueries({ queryKey: ['conciliacao-resumo'] }),
      queryClient.invalidateQueries({ queryKey: ['conciliacao-acao'] }),
    ]);
  };

  const conciliar = async (
    notaId: string,
    acaoJudicialId: string,
    valorPago: number,
  ): Promise<ConciliarNotaResult> => {
    if (featureFlags.planosApiEnabled) {
      const result = await conciliarNotaApi(notaId, {
        acao_judicial_id: acaoJudicialId,
        valor_pago: valorPago,
      });
      await invalidate();
      return result;
    }
    throw new Error('Conciliação requer API de planos habilitada');
  };

  return { conciliar, invalidate };
}

export type { ConciliacaoAcaoResumo, ConciliacaoAcaoResumoItem };
