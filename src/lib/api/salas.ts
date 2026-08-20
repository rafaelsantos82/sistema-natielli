import { apiRequest } from '@/lib/api/client';
import type { ListMeta } from '@/lib/api/types';
import type { ListSalasParams, ReservaDTO, SalaDTO } from '@/lib/api/salas.types';

function buildQuery(params: ListSalasParams): string {
  const q = new URLSearchParams();
  if (params.unidade_id) q.set('unidade_id', params.unidade_id);
  if (params.q) q.set('q', params.q);
  if (params.page) q.set('page', String(params.page));
  if (params.page_size) q.set('page_size', String(params.page_size));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export async function listSalas(
  params: ListSalasParams = {}
): Promise<{ items: SalaDTO[]; meta: ListMeta }> {
  const { data, meta } = await apiRequest<SalaDTO[]>(`/salas${buildQuery(params)}`);
  return {
    items: data ?? [],
    meta: (meta as ListMeta) ?? { page: 1, page_size: 50, total: 0, total_pages: 0 },
  };
}

export async function createSala(payload: unknown): Promise<string> {
  const { data } = await apiRequest<{ id: string }>('/salas', { method: 'POST', body: payload });
  return data.id;
}

export async function updateSala(id: string, payload: unknown): Promise<SalaDTO> {
  const { data } = await apiRequest<SalaDTO>(`/salas/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: payload,
  });
  return data;
}

export async function deleteSala(id: string): Promise<void> {
  await apiRequest(`/salas/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function listReservas(salaId: string): Promise<ReservaDTO[]> {
  const { data } = await apiRequest<ReservaDTO[]>(
    `/salas/${encodeURIComponent(salaId)}/reservas`
  );
  return data ?? [];
}

export async function createReserva(salaId: string, payload: unknown): Promise<string> {
  const { data } = await apiRequest<{ id: string }>(
    `/salas/${encodeURIComponent(salaId)}/reservas`,
    { method: 'POST', body: payload }
  );
  return data.id;
}

export async function updateReserva(
  salaId: string,
  reservaId: string,
  payload: unknown
): Promise<ReservaDTO> {
  const { data } = await apiRequest<ReservaDTO>(
    `/salas/${encodeURIComponent(salaId)}/reservas/${encodeURIComponent(reservaId)}`,
    { method: 'PUT', body: payload }
  );
  return data;
}

export async function deleteReserva(salaId: string, reservaId: string): Promise<void> {
  await apiRequest(
    `/salas/${encodeURIComponent(salaId)}/reservas/${encodeURIComponent(reservaId)}`,
    { method: 'DELETE' }
  );
}
