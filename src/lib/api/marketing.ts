import { apiRequest } from '@/lib/api/client';
import {
  apiFetchBlob,
  apiFetchDelete,
  apiMultipartPost,
} from '@/lib/api/multipart';
import type { ListMeta } from '@/lib/api/documentos.types';
import type { ManualDTO, MaterialMarketingDTO } from '@/lib/api/marketing.types';

const BASE = '/marketing';

export async function listManuais(params?: {
  page?: number;
  page_size?: number;
  q?: string;
}): Promise<{ items: ManualDTO[]; meta: ListMeta }> {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.page_size) q.set('page_size', String(params.page_size));
  if (params?.q) q.set('q', params.q);
  const s = q.toString();
  const res = await apiRequest<ManualDTO[]>(`${BASE}/manuais${s ? `?${s}` : ''}`);
  return { items: res.data ?? [], meta: res.meta ?? {} };
}

export async function listMateriais(params?: {
  page?: number;
  page_size?: number;
  q?: string;
}): Promise<{ items: MaterialMarketingDTO[]; meta: ListMeta }> {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.page_size) q.set('page_size', String(params.page_size));
  if (params?.q) q.set('q', params.q);
  const s = q.toString();
  const res = await apiRequest<MaterialMarketingDTO[]>(`${BASE}/materiais${s ? `?${s}` : ''}`);
  return { items: res.data ?? [], meta: res.meta ?? {} };
}

export async function uploadManual(form: FormData): Promise<ManualDTO> {
  return apiMultipartPost<ManualDTO>(`${BASE}/manuais/upload`, form, {
    requireDataId: true,
  });
}

export async function uploadMaterial(form: FormData): Promise<MaterialMarketingDTO> {
  return apiMultipartPost<MaterialMarketingDTO>(`${BASE}/materiais/upload`, form, {
    requireDataId: true,
  });
}

export async function downloadManual(id: string): Promise<Blob> {
  return apiFetchBlob(`${BASE}/manuais/${encodeURIComponent(id)}/download`);
}

export async function downloadMaterial(id: string): Promise<Blob> {
  return apiFetchBlob(`${BASE}/materiais/${encodeURIComponent(id)}/download`);
}

export async function deleteManual(id: string): Promise<void> {
  await apiFetchDelete(`${BASE}/manuais/${encodeURIComponent(id)}`);
}

export async function deleteMaterial(id: string): Promise<void> {
  await apiFetchDelete(`${BASE}/materiais/${encodeURIComponent(id)}`);
}
