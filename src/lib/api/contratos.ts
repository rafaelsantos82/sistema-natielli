import { apiRequest } from '@/lib/api/client';
import { getApiBaseUrl } from '@/lib/api/env';
import {
  appendMetadataToFormData,
  formToMetadataPayload,
} from '@/lib/mappers/contratoMapper';
import type { ContratoFormValues } from '@/lib/validations/contrato.schema';
import { apiFetchBlob, apiMultipartPost, apiMultipartPut } from '@/lib/api/multipart';
import type {
  CompartilharContratoPayload,
  CompartilharContratoResult,
  ContratoAssinaturaPublicDTO,
  ContratoCompartilhadoPublicDTO,
  ContratoDTO,
  ContratoMetadataPayload,
  ListContratosParams,
  ListMeta,
  SolicitarAssinaturaPayload,
  SolicitarAssinaturaResult,
  UpdateContratoPayload,
} from '@/lib/api/contratos.types';

const BASE = '/contratos';

export async function listContratos(
  params: ListContratosParams = {},
): Promise<{ items: ContratoDTO[]; meta: ListMeta }> {
  const q = new URLSearchParams();
  if (params.q) q.set('q', params.q);
  if (params.status) q.set('status', params.status);
  if (params.page) q.set('page', String(params.page));
  if (params.page_size) q.set('page_size', String(params.page_size));
  const s = q.toString();
  const res = await apiRequest<ContratoDTO[]>(`${BASE}${s ? `?${s}` : ''}`);
  return { items: res.data ?? [], meta: (res.meta as ListMeta) ?? {} };
}

export async function getContrato(id: string): Promise<ContratoDTO> {
  const { data } = await apiRequest<ContratoDTO>(`${BASE}/${encodeURIComponent(id)}`);
  return data;
}

export async function createContratoWithFile(
  meta: ContratoMetadataPayload,
  file: File,
): Promise<ContratoDTO> {
  const fd = new FormData();
  appendMetadataToFormData(fd, meta);
  fd.append('file', file);
  return apiMultipartPost<ContratoDTO>(BASE, fd);
}

export async function createContratoFromForm(
  values: ContratoFormValues,
  file: File,
): Promise<ContratoDTO> {
  return createContratoWithFile(formToMetadataPayload(values), file);
}

export async function updateContrato(
  id: string,
  payload: UpdateContratoPayload,
): Promise<ContratoDTO> {
  const { data } = await apiRequest<ContratoDTO>(`${BASE}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: payload,
  });
  return data;
}

export async function replaceContratoArquivo(id: string, file: File): Promise<ContratoDTO> {
  const fd = new FormData();
  fd.append('file', file);
  return apiMultipartPut<ContratoDTO>(`${BASE}/${encodeURIComponent(id)}/arquivo`, fd);
}

export async function downloadContrato(id: string): Promise<Blob> {
  return apiFetchBlob(`${BASE}/${encodeURIComponent(id)}/arquivo`);
}

export async function deleteContrato(id: string): Promise<void> {
  await apiRequest(`${BASE}/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function compartilharContrato(
  id: string,
  payload: CompartilharContratoPayload,
): Promise<CompartilharContratoResult> {
  const { data } = await apiRequest<CompartilharContratoResult>(
    `${BASE}/${encodeURIComponent(id)}/compartilhar`,
    { method: 'POST', body: payload },
  );
  return data;
}

export async function solicitarAssinaturaContrato(
  id: string,
  payload: SolicitarAssinaturaPayload,
): Promise<SolicitarAssinaturaResult> {
  const { data } = await apiRequest<SolicitarAssinaturaResult>(
    `${BASE}/${encodeURIComponent(id)}/solicitacoes-assinatura`,
    { method: 'POST', body: payload },
  );
  return data;
}

export async function getContratoCompartilhadoPublic(
  token: string,
): Promise<ContratoCompartilhadoPublicDTO> {
  const { data } = await apiRequest<ContratoCompartilhadoPublicDTO>(
    `${BASE}/compartilhado/${encodeURIComponent(token)}`,
    { skipAuth: true },
  );
  return data;
}

export async function downloadContratoCompartilhado(token: string): Promise<Blob> {
  return apiFetchBlob(`${BASE}/compartilhado/${encodeURIComponent(token)}/arquivo`, {
    skipAuth: true,
    logoutOn401: false,
  });
}

export function resolveContratoDownloadUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized.startsWith(base)) return normalized;
  return `${base}${normalized}`;
}

export async function recordAcessoCompartilhado(token: string): Promise<void> {
  await apiRequest(`${BASE}/compartilhado/${encodeURIComponent(token)}/acesso`, {
    method: 'POST',
    skipAuth: true,
  });
}

export async function getContratoAssinaturaPublic(
  token: string,
): Promise<ContratoAssinaturaPublicDTO> {
  const { data } = await apiRequest<ContratoAssinaturaPublicDTO>(
    `${BASE}/assinatura/${encodeURIComponent(token)}`,
    { skipAuth: true },
  );
  return data;
}

export async function downloadContratoAssinatura(token: string): Promise<Blob> {
  return apiFetchBlob(`${BASE}/assinatura/${encodeURIComponent(token)}/arquivo`, {
    skipAuth: true,
    logoutOn401: false,
  });
}

export async function aceitarAssinaturaContrato(
  token: string,
  observacoes?: string,
): Promise<void> {
  await apiRequest(`${BASE}/assinatura/${encodeURIComponent(token)}/aceitar`, {
    method: 'POST',
    skipAuth: true,
    body: { observacoes: observacoes ?? '' },
  });
}
