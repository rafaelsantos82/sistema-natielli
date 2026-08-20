import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { featureFlags } from '@/lib/featureFlags';
import {
  deleteProfissionalDocumento,
  downloadProfissionalDocumento,
  listProfissionalDocumentos,
  uploadProfissionalDocumento,
  type ProfissionalDocumentoApi,
} from '@/lib/api/profissionalDocumentos';
import { getApiBaseUrl } from '@/lib/api/env';
import { getValidToken } from '@/lib/auth/token';
import { getAccessToken } from '@/lib/auth/tokenStore';
import { ApiClientError } from '@/lib/api/client';
import type { ApiSuccessEnvelope } from '@/lib/api/types';
import { validateProfissionalDocFile } from '@/lib/uploads/profissionalDocPolicy';

export type DocumentoCategoria =
  | 'documento_pessoal'
  | 'registro_profissional'
  | 'comprovante'
  | 'contrato'
  | 'outro';

export interface ProfissionalDocumento {
  id: string;
  profissionalId: string;
  categoria: DocumentoCategoria;
  obrigatorio: boolean;
  nomeArquivo: string;
  mimeType: string;
  tamanhoBytes: number;
  versao: number;
  substitui?: string;
  uploadedAt: string;
  uploadedBy: string;
}

export const PROFISSIONAL_DOCS_OBRIGATORIOS: DocumentoCategoria[] = [
  'documento_pessoal',
  'registro_profissional',
];

export const DOCUMENTO_CATEGORIA_LABEL: Record<DocumentoCategoria, string> = {
  documento_pessoal: 'Documento pessoal (RG/CPF)',
  registro_profissional: 'Registro profissional',
  comprovante: 'Comprovante',
  contrato: 'Contrato',
  outro: 'Outro',
};

export interface StatusObrigatorios {
  pendentes: DocumentoCategoria[];
  completos: boolean;
}

function mapFromApi(row: ProfissionalDocumentoApi): ProfissionalDocumento {
  return {
    id: row.id,
    profissionalId: row.profissional_id,
    categoria: row.categoria as DocumentoCategoria,
    obrigatorio: row.obrigatorio,
    nomeArquivo: row.nome_arquivo,
    mimeType: row.mime_type,
    tamanhoBytes: row.tamanho_bytes,
    versao: row.versao,
    substitui: row.substitui,
    uploadedAt: row.uploaded_at,
    uploadedBy: row.uploaded_by,
  };
}

function filterActive(docs: ProfissionalDocumento[]): ProfissionalDocumento[] {
  const substituidos = new Set(
    docs.map((d) => d.substitui).filter(Boolean) as string[],
  );
  return docs.filter((d) => !substituidos.has(d.id));
}

async function listAllProfissionalDocumentos(): Promise<ProfissionalDocumento[]> {
  const token = getValidToken(getAccessToken);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${getApiBaseUrl()}/profissionais/documentos`, { headers });
  if (!res.ok) throw await ApiClientError.fromResponse(res);
  const body = (await res.json()) as ApiSuccessEnvelope<ProfissionalDocumentoApi[]>;
  return filterActive((body.data ?? []).map(mapFromApi));
}

export const useProfissionalDocumentos = () => {
  const apiEnabled = featureFlags.profissionaisApiEnabled;
  const queryClient = useQueryClient();

  const { data: allDocumentos = [], isLoading } = useQuery({
    queryKey: ['profissional-documentos'],
    enabled: apiEnabled,
    queryFn: listAllProfissionalDocumentos,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['profissional-documentos'] });

  const uploadMutation = useMutation({
    mutationFn: async (input: {
      profissionalId: string;
      categoria: DocumentoCategoria;
      file: File;
      substitui?: string;
    }) => {
      validateProfissionalDocFile(input.file);
      const form = new FormData();
      form.append('file', input.file);
      form.append('categoria', input.categoria);
      if (input.substitui) form.append('substitui', input.substitui);
      const row = await uploadProfissionalDocumento(input.profissionalId, form);
      return mapFromApi(row);
    },
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: async ({ profissionalId, id }: { profissionalId: string; id: string }) => {
      await deleteProfissionalDocumento(profissionalId, id);
    },
    onSuccess: invalidate,
  });

  const byProfissional = useMemo(() => {
    const map = new Map<string, ProfissionalDocumento[]>();
    for (const d of allDocumentos) {
      const list = map.get(d.profissionalId) ?? [];
      list.push(d);
      map.set(d.profissionalId, list);
    }
    return map;
  }, [allDocumentos]);

  const listByProfissional = useCallback(
    (profissionalId: string) => byProfissional.get(profissionalId) ?? [],
    [byProfissional],
  );

  const ativosPorCategoria = useCallback(
    (profissionalId: string, categoria: DocumentoCategoria) =>
      listByProfissional(profissionalId).filter((d) => d.categoria === categoria),
    [listByProfissional],
  );

  const uploadAsync = useCallback(
    async (input: {
      profissionalId: string;
      categoria: DocumentoCategoria;
      obrigatorio?: boolean;
      file: File;
      uploadedBy: string;
      substitui?: string;
    }) => uploadMutation.mutateAsync(input),
    [uploadMutation],
  );

  const remove = useCallback(
    async (id: string, profissionalId: string) => {
      await removeMutation.mutateAsync({ id, profissionalId });
    },
    [removeMutation],
  );

  const download = useCallback(async (profissionalId: string, doc: ProfissionalDocumento) => {
    const blob = await downloadProfissionalDocumento(profissionalId, doc.id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.nomeArquivo;
    a.rel = 'noopener';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const statusObrigatorios = useCallback(
    (profissionalId: string): StatusObrigatorios => {
      const pendentes = PROFISSIONAL_DOCS_OBRIGATORIOS.filter(
        (cat) => ativosPorCategoria(profissionalId, cat).length === 0,
      );
      return { pendentes, completos: pendentes.length === 0 };
    },
    [ativosPorCategoria],
  );

  return {
    documentos: allDocumentos,
    isLoading,
    listByProfissional,
    ativosPorCategoria,
    upload: uploadAsync,
    uploadAsync,
    remove,
    download,
    statusObrigatorios,
    addNotaFiscal: uploadAsync,
    updateNotaFiscal: uploadAsync,
    deleteNotaFiscal: remove,
    conciliarNota: async () => {
      throw new Error('Não aplicável');
    },
  };
};
