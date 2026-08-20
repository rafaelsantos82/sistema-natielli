import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assinarDocumento,
  downloadDocumentoAssinado,
  listDocumentosAssinados,
  verificarDocumentoAssinado,
} from '@/lib/api/documentosAssinados';
import type {
  DocumentoAssinadoDTO,
  DocumentoAssinadoType,
} from '@/lib/api/documentosAssinados.types';
import { resolveUnidadeApiId } from '@/lib/unidades/apiIds';
import { featureFlags } from '@/lib/featureFlags';
import { showErrorToast } from '@/lib/ui/showErrorToast';
import { toast } from 'sonner';

export type { DocumentoAssinadoDTO, DocumentoAssinadoType };

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function useDocumentosAssinadosList(unidadeSlugOrId: string | undefined, page = 1) {
  const unidadeApiId = resolveUnidadeApiId(unidadeSlugOrId);
  return useQuery({
    queryKey: ['documentos-assinados', unidadeSlugOrId, page],
    enabled: featureFlags.documentosAssinadosApiEnabled && !!unidadeApiId,
    queryFn: () => listDocumentosAssinados(unidadeApiId!, page),
  });
}

export function useDocumentosAssinadosMutations(unidadeSlugOrId: string | undefined) {
  const qc = useQueryClient();
  const unidadeApiId = resolveUnidadeApiId(unidadeSlugOrId);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['documentos-assinados', unidadeSlugOrId] });
  };

  const assinarMutation = useMutation({
    mutationFn: (input: { file: Blob; name: string; type: DocumentoAssinadoType }) => {
      if (!unidadeApiId) {
        return Promise.reject(new Error('Unidade ativa sem identificador válido para a API'));
      }
      return assinarDocumento(unidadeApiId, input.file, input.name, input.type);
    },
    onSuccess: () => {
      invalidate();
      toast.success('Documento assinado com sucesso');
    },
    onError: (err) => showErrorToast(err, { action: 'assinar', entity: 'o documento' }),
  });

  const verificarMutation = useMutation({
    mutationFn: (id: string) => verificarDocumentoAssinado(id),
    onError: (err) => showErrorToast(err, { action: 'verificar', entity: 'a assinatura' }),
  });

  const downloadMutation = useMutation({
    mutationFn: async ({ id, filename }: { id: string; filename: string }) => {
      const blob = await downloadDocumentoAssinado(id);
      triggerDownload(blob, filename);
    },
    onSuccess: () => toast.success('Download iniciado'),
    onError: (err) => showErrorToast(err, { action: 'baixar', entity: 'o documento' }),
  });

  return { assinarMutation, verificarMutation, downloadMutation };
}
