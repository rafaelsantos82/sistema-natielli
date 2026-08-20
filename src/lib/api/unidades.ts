import { apiRequest } from '@/lib/api/client';
import type { UnidadeDTO } from '@/lib/api/unidades.types';

export async function listUnidades(): Promise<UnidadeDTO[]> {
  const { data } = await apiRequest<UnidadeDTO[]>('/unidades');
  return data ?? [];
}

export async function getUnidade(id: string): Promise<UnidadeDTO> {
  const { data } = await apiRequest<UnidadeDTO>(`/unidades/${encodeURIComponent(id)}`);
  return data;
}
