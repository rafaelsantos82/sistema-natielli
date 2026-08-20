import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  aceitarAssinaturaContrato,
  compartilharContrato,
  createContratoFromForm,
  deleteContrato,
  getContrato,
  getContratoAssinaturaPublic,
  getContratoCompartilhadoPublic,
  listContratos,
  recordAcessoCompartilhado,
  replaceContratoArquivo,
  solicitarAssinaturaContrato,
  updateContrato,
} from '@/lib/api/contratos';
import type {
  CompartilharContratoPayload,
  ContratoAssinaturaPublicDTO,
  ContratoCompartilhadoPublicDTO,
  ContratoMetadataPayload,
  SolicitarAssinaturaPayload,
  UpdateContratoPayload,
} from '@/lib/api/contratos.types';
import { dtoToContratoRow, formToMetadataPayload, type ContratoListRow } from '@/lib/mappers/contratoMapper';
import type { ContratoFormValues } from '@/lib/validations/contrato.schema';
import { featureFlags } from '@/lib/featureFlags';
import { showErrorToast } from '@/lib/ui/showErrorToast';
import { toast } from 'sonner';

export type Contrato = ContratoListRow;

export function useContratosList(opts: { q?: string; status?: string; page?: number } = {}) {
  return useQuery({
    queryKey: ['contratos', opts.q, opts.status, opts.page],
    enabled: featureFlags.contratosApiEnabled,
    queryFn: async () => {
      const { items, meta } = await listContratos({
        q: opts.q,
        status: opts.status,
        page: opts.page ?? 1,
        page_size: 100,
      });
      return { items: items.map(dtoToContratoRow), meta };
    },
  });
}

export function useContratoDetail(id: string | null) {
  return useQuery({
    queryKey: ['contratos', 'detail', id],
    enabled: featureFlags.contratosApiEnabled && Boolean(id),
    queryFn: async () => dtoToContratoRow(await getContrato(id!)),
  });
}

export function useContratosMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['contratos'] });
  };

  const createMutation = useMutation({
    mutationFn: ({ values, file }: { values: ContratoFormValues; file: File }) =>
      createContratoFromForm(values, file),
    onSuccess: () => {
      toast.success('Contrato criado com sucesso');
      invalidate();
    },
    onError: (err) => showErrorToast(err, { action: 'criar', entity: 'o contrato' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateContratoPayload }) =>
      updateContrato(id, payload),
    onSuccess: () => {
      toast.success('Contrato atualizado com sucesso');
      invalidate();
    },
    onError: (err) => showErrorToast(err, { action: 'salvar', entity: 'o contrato' }),
  });

  const replaceArquivoMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => replaceContratoArquivo(id, file),
    onSuccess: () => {
      toast.success('Arquivo do contrato atualizado');
      invalidate();
    },
    onError: (err) => showErrorToast(err, { action: 'substituir arquivo', entity: 'o contrato' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteContrato(id),
    onSuccess: () => {
      toast.success('Contrato excluído');
      invalidate();
    },
    onError: (err) => showErrorToast(err, { action: 'excluir', entity: 'o contrato' }),
  });

  const compartilharMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CompartilharContratoPayload }) =>
      compartilharContrato(id, payload),
    onError: (err) => showErrorToast(err, { action: 'compartilhar', entity: 'o contrato' }),
  });

  const solicitarAssinaturaMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SolicitarAssinaturaPayload }) =>
      solicitarAssinaturaContrato(id, payload),
    onError: (err) =>
      showErrorToast(err, { action: 'solicitar assinatura', entity: 'o contrato' }),
  });

  return {
    createMutation,
    updateMutation,
    replaceArquivoMutation,
    deleteMutation,
    compartilharMutation,
    solicitarAssinaturaMutation,
  };
}

export function useContratoCompartilhadoPublic(token: string | undefined) {
  return useQuery({
    queryKey: ['contratos', 'public', 'compartilhado', token],
    enabled: Boolean(token),
    queryFn: async (): Promise<ContratoCompartilhadoPublicDTO> =>
      getContratoCompartilhadoPublic(token!),
    retry: false,
  });
}

export function useRecordAcessoCompartilhado() {
  return useMutation({
    mutationFn: (token: string) => recordAcessoCompartilhado(token),
  });
}

export function useContratoAssinaturaPublic(token: string | undefined) {
  return useQuery({
    queryKey: ['contratos', 'public', 'assinatura', token],
    enabled: Boolean(token),
    queryFn: async (): Promise<ContratoAssinaturaPublicDTO> =>
      getContratoAssinaturaPublic(token!),
    retry: false,
  });
}

export function useAceitarAssinatura() {
  return useMutation({
    mutationFn: ({ token, observacoes }: { token: string; observacoes?: string }) =>
      aceitarAssinaturaContrato(token, observacoes),
  });
}

/** @deprecated use useContratosList — mantido para imports legados durante transição */
export const useContratos = () => {
  const list = useContratosList();
  const mutations = useContratosMutations();

  return {
    contratos: list.data?.items ?? [],
    isLoading: list.isLoading,
    isError: list.isError,
    refetch: list.refetch,
    addContrato: (values: ContratoFormValues, file: File) =>
      mutations.createMutation.mutateAsync({ values, file }),
    updateContrato: (id: string, payload: UpdateContratoPayload) =>
      mutations.updateMutation.mutateAsync({ id, payload }),
    deleteContrato: (id: string) => mutations.deleteMutation.mutateAsync(id),
    compartilharContrato: async (id: string, payload: CompartilharContratoPayload) =>
      mutations.compartilharMutation.mutateAsync({ id, payload }),
    criarSolicitacaoAssinatura: async (id: string, payload: SolicitarAssinaturaPayload) =>
      mutations.solicitarAssinaturaMutation.mutateAsync({ id, payload }),
    ...mutations,
  };
};

export { formToMetadataPayload };
