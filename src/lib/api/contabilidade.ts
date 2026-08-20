import { apiRequest } from '@/lib/api/client';
import type { BalanceteFiltros, BalanceteResultado } from '@/lib/contabilidade/types';

export async function fetchBalancete(filtros: BalanceteFiltros): Promise<BalanceteResultado> {
  const q = new URLSearchParams();
  q.set('dt_ini', filtros.periodo_inicio);
  q.set('dt_fin', filtros.periodo_fim);
  if (filtros.centro_custo?.trim()) q.set('centro_custo', filtros.centro_custo.trim());
  if (filtros.unidade_id?.trim()) q.set('unidade_id', filtros.unidade_id.trim());
  if (filtros.ocultar_zeradas) q.set('ocultar_zeradas', 'true');

  const { data } = await apiRequest<BalanceteResultado>(`/contabilidade/balancete?${q.toString()}`);
  return data;
}
