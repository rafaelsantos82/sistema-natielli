import { apiRequest } from '@/lib/api/client';
import {
  apiFetchBlob,
  apiFetchDelete,
  apiMultipartPost,
} from '@/lib/api/multipart';
import type {
  BibliotecaArquivoDTO,
  CreateCategoriaPayload,
  DocumentoCategoriaDTO,
  ListBibliotecaArquivosParams,
  ListDocumentoCategoriasParams,
  ListMeta,
  UpdateCategoriaPayload,
} from '@/lib/api/documentos.types';

const BASE = '/documentos';

export async function listDocumentoCategorias(
  params: ListDocumentoCategoriasParams = {},
): Promise<DocumentoCategoriaDTO[]> {
  const q = new URLSearchParams();
  if (params.include_inativas) q.set('include_inativas', 'true');
  const s = q.toString();
  const { data } = await apiRequest<DocumentoCategoriaDTO[]>(
    `${BASE}/categorias${s ? `?${s}` : ''}`,
  );
  return data ?? [];
}

export async function getDocumentoCategoria(id: string): Promise<DocumentoCategoriaDTO> {
  const { data } = await apiRequest<DocumentoCategoriaDTO>(`${BASE}/categorias/${encodeURIComponent(id)}`);
  return data;
}

export async function createDocumentoCategoria(
  payload: CreateCategoriaPayload,
): Promise<DocumentoCategoriaDTO> {
  const { data } = await apiRequest<DocumentoCategoriaDTO>(`${BASE}/categorias`, {
    method: 'POST',
    body: payload,
  });
  return data;
}

export async function updateDocumentoCategoria(
  id: string,
  payload: UpdateCategoriaPayload,
): Promise<DocumentoCategoriaDTO> {
  const { data } = await apiRequest<DocumentoCategoriaDTO>(
    `${BASE}/categorias/${encodeURIComponent(id)}`,
    { method: 'PUT', body: payload },
  );
  return data;
}

export async function deleteDocumentoCategoria(id: string): Promise<void> {
  await apiRequest(`${BASE}/categorias/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function listBibliotecaArquivos(
  params: ListBibliotecaArquivosParams = {},
): Promise<{ items: BibliotecaArquivoDTO[]; meta: ListMeta }> {
  const q = new URLSearchParams();
  if (params.categoria_id) q.set('categoria_id', params.categoria_id);
  if (params.q) q.set('q', params.q);
  if (params.page) q.set('page', String(params.page));
  if (params.page_size) q.set('page_size', String(params.page_size));
  const s = q.toString();
  const res = await apiRequest<BibliotecaArquivoDTO[]>(`${BASE}/arquivos${s ? `?${s}` : ''}`);
  return { items: res.data ?? [], meta: res.meta ?? {} };
}

export async function uploadBibliotecaArquivo(form: FormData): Promise<BibliotecaArquivoDTO> {
  return apiMultipartPost<BibliotecaArquivoDTO>(`${BASE}/arquivos`, form, {
    requireDataId: true,
  });
}

export async function downloadBibliotecaArquivo(id: string): Promise<Blob> {
  return apiFetchBlob(`${BASE}/arquivos/${encodeURIComponent(id)}/download`);
}

export async function deleteBibliotecaArquivo(id: string): Promise<void> {
  await apiFetchDelete(`${BASE}/arquivos/${encodeURIComponent(id)}`);
}
