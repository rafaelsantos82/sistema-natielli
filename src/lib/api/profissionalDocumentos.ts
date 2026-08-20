import {
  apiFetchBlob,
  apiFetchDelete,
  apiMultipartPost,
  apiAuthHeaders,
  resolveApiUrl,
} from '@/lib/api/multipart';
import { ApiClientError } from '@/lib/api/client';
import type { ApiSuccessEnvelope } from '@/lib/api/types';

export type ProfissionalDocumentoApi = {
  id: string;
  profissional_id: string;
  categoria: string;
  obrigatorio: boolean;
  nome_arquivo: string;
  mime_type: string;
  tamanho_bytes: number;
  versao: number;
  substitui?: string;
  uploaded_at: string;
  uploaded_by: string;
};

function basePath(profissionalId: string) {
  return `/profissionais/${encodeURIComponent(profissionalId)}/documentos`;
}

export async function listProfissionalDocumentos(
  profissionalId: string,
  categoria?: string,
): Promise<ProfissionalDocumentoApi[]> {
  const url = new URL(resolveApiUrl(basePath(profissionalId)));
  if (categoria) url.searchParams.set('categoria', categoria);
  const res = await fetch(url.toString(), { headers: apiAuthHeaders() });
  if (!res.ok) throw await ApiClientError.fromResponse(res);
  const body = (await res.json()) as ApiSuccessEnvelope<ProfissionalDocumentoApi[]>;
  return body.data ?? [];
}

export async function uploadProfissionalDocumento(
  profissionalId: string,
  form: FormData,
): Promise<ProfissionalDocumentoApi> {
  return apiMultipartPost<ProfissionalDocumentoApi>(basePath(profissionalId), form, {
    requireDataId: true,
  });
}

export async function downloadProfissionalDocumento(
  profissionalId: string,
  docId: string,
): Promise<Blob> {
  return apiFetchBlob(`${basePath(profissionalId)}/${encodeURIComponent(docId)}/download`);
}

export async function deleteProfissionalDocumento(
  profissionalId: string,
  docId: string,
): Promise<void> {
  await apiFetchDelete(`${basePath(profissionalId)}/${encodeURIComponent(docId)}`);
}
