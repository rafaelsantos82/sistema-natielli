import { apiRequest } from '@/lib/api/client';
import { apiFetchDelete, apiMultipartPost } from '@/lib/api/multipart';
import type { ChaveDigitalDTO } from '@/lib/api/chaveDigital.types';

export async function getChaveDigital(unidadeId: string): Promise<ChaveDigitalDTO | null> {
  const { data } = await apiRequest<ChaveDigitalDTO | { configured: false }>(
    `/unidades/${encodeURIComponent(unidadeId)}/chave-digital`,
  );
  if (!data || 'configured' in data) return null;
  return data;
}

export async function registerChaveDigital(
  unidadeId: string,
  pfxFile: File,
  password: string,
): Promise<ChaveDigitalDTO> {
  const form = new FormData();
  form.append('pfx', pfxFile);
  form.append('password', password);
  return apiMultipartPost<ChaveDigitalDTO>(
    `/unidades/${encodeURIComponent(unidadeId)}/chave-digital`,
    form,
    { requireDataId: false },
  );
}

export async function revokeChaveDigital(unidadeId: string): Promise<void> {
  await apiFetchDelete(`/unidades/${encodeURIComponent(unidadeId)}/chave-digital`);
}
