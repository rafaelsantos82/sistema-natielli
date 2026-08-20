import { apiRequest } from '@/lib/api/client';
import type { ListMeta } from '@/lib/api/types';
import type {
  ListProfissionaisParams,
  ProfissionalConselhoDTO,
  ProfissionalDTO,
} from '@/lib/api/profissionais.types';

function buildQuery(params: ListProfissionaisParams): string {
  const q = new URLSearchParams();
  if (params.unidade_id) q.set('unidade_id', params.unidade_id);
  if (params.q) q.set('q', params.q);
  if (params.status) q.set('status', params.status);
  if (params.page) q.set('page', String(params.page));
  if (params.page_size) q.set('page_size', String(params.page_size));
  if (params.include_deleted) q.set('include_deleted', 'true');
  const s = q.toString();
  return s ? `?${s}` : '';
}

export async function listProfissionais(
  params: ListProfissionaisParams = {}
): Promise<{ items: ProfissionalDTO[]; meta: ListMeta }> {
  const { data, meta } = await apiRequest<ProfissionalDTO[]>(
    `/profissionais${buildQuery(params)}`
  );
  return {
    items: data ?? [],
    meta: (meta as ListMeta) ?? { page: 1, page_size: 20, total: 0, total_pages: 0 },
  };
}

export async function getProfissional(id: string): Promise<ProfissionalDTO> {
  const { data } = await apiRequest<ProfissionalDTO>(
    `/profissionais/${encodeURIComponent(id)}`
  );
  return data;
}

export async function createProfissional(payload: unknown): Promise<string> {
  const { data } = await apiRequest<{ id: string }>('/profissionais', {
    method: 'POST',
    body: payload,
  });
  return data.id;
}

export async function updateProfissional(id: string, payload: unknown): Promise<ProfissionalDTO> {
  const { data } = await apiRequest<ProfissionalDTO>(
    `/profissionais/${encodeURIComponent(id)}`,
    { method: 'PUT', body: payload }
  );
  return data;
}

export async function deleteProfissional(id: string): Promise<void> {
  await apiRequest(`/profissionais/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function restoreProfissional(id: string): Promise<ProfissionalDTO> {
  const { data } = await apiRequest<ProfissionalDTO>(
    `/profissionais/${encodeURIComponent(id)}/restore`,
    { method: 'POST' },
  );
  return data;
}

export async function listProfissionalConselhos(
  profissionalId: string
): Promise<ProfissionalConselhoDTO[]> {
  const { data } = await apiRequest<ProfissionalConselhoDTO[]>(
    `/profissionais/${encodeURIComponent(profissionalId)}/conselhos`
  );
  return data ?? [];
}
