import { apiRequest } from '@/lib/api/client';
import { apiFetchBlob, apiMultipartPost } from '@/lib/api/multipart';
import type {
  DocumentoAssinadoDTO,
  DocumentoAssinadoType,
  ListDocumentosAssinadosMeta,
  VerifyAssinaturaResult,
} from '@/lib/api/documentosAssinados.types';

const BASE = '/documentos-assinados';

export async function listDocumentosAssinados(
  unidadeId: string,
  page = 1,
  pageSize = 50,
): Promise<{ items: DocumentoAssinadoDTO[]; meta: ListDocumentosAssinadosMeta }> {
  const q = new URLSearchParams({
    unidade_id: unidadeId,
    page: String(page),
    page_size: String(pageSize),
  });
  const res = await apiRequest<DocumentoAssinadoDTO[]>(`${BASE}?${q}`);
  return { items: res.data ?? [], meta: res.meta ?? {} };
}

export async function assinarDocumento(
  unidadeId: string,
  file: Blob,
  name: string,
  type: DocumentoAssinadoType,
): Promise<DocumentoAssinadoDTO> {
  const form = new FormData();
  form.append('unidade_id', unidadeId);
  form.append('name', name);
  form.append('type', type);
  form.append('file', file, `${name}.pdf`);
  return apiMultipartPost<DocumentoAssinadoDTO>(`${BASE}/assinar`, form, {
    requireDataId: false,
  });
}

export async function verificarDocumentoAssinado(id: string): Promise<VerifyAssinaturaResult> {
  const { data } = await apiRequest<VerifyAssinaturaResult>(
    `${BASE}/${encodeURIComponent(id)}/verificar`,
    { method: 'POST' },
  );
  return data;
}

export async function downloadDocumentoAssinado(id: string): Promise<Blob> {
  return apiFetchBlob(`${BASE}/${encodeURIComponent(id)}/download`);
}
