import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createDocumentoCategoria,
  deleteBibliotecaArquivo,
  deleteDocumentoCategoria,
  downloadBibliotecaArquivo,
  listBibliotecaArquivos,
  listDocumentoCategorias,
  updateDocumentoCategoria,
  uploadBibliotecaArquivo,
} from '@/lib/api/documentos';
import type {
  BibliotecaArquivoDTO,
  CreateCategoriaPayload,
  DocumentoCategoriaDTO,
  UpdateCategoriaPayload,
} from '@/lib/api/documentos.types';
import { featureFlags } from '@/lib/featureFlags';
import { validateProfissionalDocFile } from '@/lib/uploads/profissionalDocPolicy';
import { showErrorToast } from '@/lib/ui/showErrorToast';
import { toast } from 'sonner';

export type BibliotecaUploadInput = {
  categoriaId: string;
  file: File;
  titulo?: string;
};

export type { BibliotecaArquivoDTO, DocumentoCategoriaDTO };

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function useDocumentoCategorias(includeInativas = false) {
  return useQuery({
    queryKey: ['documentos', 'categorias', includeInativas],
    enabled: featureFlags.documentosApiEnabled,
    queryFn: () => listDocumentoCategorias({ include_inativas: includeInativas }),
  });
}

export function useBibliotecaArquivos(opts: {
  categoriaId?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['documentos', 'arquivos', opts.categoriaId, opts.q, opts.page, opts.pageSize],
    enabled: featureFlags.documentosApiEnabled,
    queryFn: () =>
      listBibliotecaArquivos({
        categoria_id: opts.categoriaId,
        q: opts.q,
        page: opts.page ?? 1,
        page_size: opts.pageSize ?? 100,
      }),
  });
}

export function useBibliotecaDocumentosMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['documentos'] });
  };

  const createCategoriaMutation = useMutation({
    mutationFn: (payload: CreateCategoriaPayload) => createDocumentoCategoria(payload),
    onSuccess: () => {
      toast.success('Categoria criada com sucesso');
      invalidateAll();
    },
    onError: (err) => showErrorToast(err, { action: 'salvar', entity: 'a categoria' }),
  });

  const updateCategoriaMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCategoriaPayload }) =>
      updateDocumentoCategoria(id, payload),
    onSuccess: () => {
      toast.success('Categoria atualizada com sucesso');
      invalidateAll();
    },
    onError: (err) => showErrorToast(err, { action: 'salvar', entity: 'a categoria' }),
  });

  const deleteCategoriaMutation = useMutation({
    mutationFn: (id: string) => deleteDocumentoCategoria(id),
    onSuccess: () => {
      toast.success('Categoria removida com sucesso');
      invalidateAll();
    },
    onError: (err) => showErrorToast(err, { action: 'excluir', entity: 'a categoria' }),
  });

  const uploadMutation = useMutation({
    mutationFn: async (input: BibliotecaUploadInput) => {
      validateProfissionalDocFile(input.file);
      const form = new FormData();
      form.append('categoria_id', input.categoriaId);
      form.append('file', input.file);
      if (input.titulo?.trim()) form.append('titulo', input.titulo.trim());
      return uploadBibliotecaArquivo(form);
    },
    onSuccess: () => {
      toast.success('Documento enviado com sucesso');
      invalidateAll();
    },
    onError: (err) => showErrorToast(err, { action: 'enviar', entity: 'o documento' }),
  });

  const deleteArquivoMutation = useMutation({
    mutationFn: (id: string) => deleteBibliotecaArquivo(id),
    onSuccess: () => {
      toast.success('Documento removido com sucesso');
      invalidateAll();
    },
    onError: (err) => showErrorToast(err, { action: 'excluir', entity: 'o documento' }),
  });

  const download = async (arq: BibliotecaArquivoDTO) => {
    try {
      const blob = await downloadBibliotecaArquivo(arq.id);
      triggerDownload(blob, arq.nome_arquivo || arq.titulo);
    } catch (err) {
      showErrorToast(err, { action: 'baixar', entity: 'o documento' });
    }
  };

  return {
    createCategoriaMutation,
    updateCategoriaMutation,
    deleteCategoriaMutation,
    uploadMutation,
    deleteArquivoMutation,
    download,
  };
}
