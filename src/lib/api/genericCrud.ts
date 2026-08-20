import { apiRequest } from '@/lib/api/client';
import type { ListMeta } from '@/lib/api/types';

export async function listResource<T>(
  path: string,
  params: Record<string, string | number | undefined> = {}
): Promise<{ items: T[]; meta: ListMeta }> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') q.set(k, String(v));
  });
  const qs = q.toString();
  const { data, meta } = await apiRequest<T[]>(`${path}${qs ? `?${qs}` : ''}`);
  return {
    items: data ?? [],
    meta: (meta as ListMeta) ?? { page: 1, page_size: 20, total: 0, total_pages: 0 },
  };
}

export async function getResource<T>(path: string, id: string): Promise<T> {
  const { data } = await apiRequest<T>(`${path}/${encodeURIComponent(id)}`);
  return data;
}

export async function createResource(path: string, body: unknown): Promise<string> {
  const { data } = await apiRequest<{ id: string }>(path, { method: 'POST', body });
  return data.id;
}

export async function updateResource<T>(path: string, id: string, body: unknown): Promise<T> {
  const { data } = await apiRequest<T>(`${path}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body,
  });
  return data;
}

export async function deleteResource(path: string, id: string): Promise<void> {
  await apiRequest(`${path}/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
