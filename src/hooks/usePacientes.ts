import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  listPacientes,
  getPaciente,
  createPaciente,
  updatePaciente,
  deletePaciente,
  restorePaciente,
} from '@/lib/api/pacientes';
import { featureFlags } from '@/lib/featureFlags';
import { getUnidadeApiId } from '@/lib/unidades/apiIds';
import { formatListLoadError } from '@/lib/api/formatApiError';
import { showErrorToast } from '@/lib/ui/showErrorToast';
import type { ListPacientesParams } from '@/lib/api/pacientes.types';
import { dtoToListRow } from '@/lib/mappers/pacienteMapper';
import type { CreatePacientePayload } from '@/lib/api/pacientes.types';
import { useUnidadeAtiva } from '@/contexts/UnidadeContext';
import type { ListMeta } from '@/lib/api/types';

export interface PacienteListRow {
  id: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  dataNasc: string;
  telefone: string;
  email: string;
  status: 'ativo' | 'inativo' | 'falecido';
  /** Registro com soft delete (excluído) — exibir como inativo na listagem. */
  excluido?: boolean;
  proximaConsulta?: string;
  ultimaConsulta?: string;
  totalConsultas?: number;
}

export type PacientesListCache = {
  rows: PacienteListRow[];
  meta: ListMeta;
};

export function getPacientesListErrorMessage(error: unknown): string {
  return formatListLoadError(error, 'pacientes');
}

export function usePacientesList(
  search = '',
  page = 1,
  pageSize = 20,
  opts?: { todasUnidades?: boolean },
) {
  const { unidadeAtivaId } = useUnidadeAtiva();
  const unidadeApiId = getUnidadeApiId(unidadeAtivaId);
  const todasUnidades = Boolean(opts?.todasUnidades);

  return useQuery({
    queryKey: ['pacientes', todasUnidades ? 'all' : unidadeAtivaId, search, page],
    enabled: featureFlags.pacientesApiEnabled && (todasUnidades || !!unidadeApiId),
    queryFn: async () => {
      if (!todasUnidades && !unidadeApiId) {
        throw new Error('Unidade ativa sem UUID de API configurado');
      }
      const params: ListPacientesParams = {
        q: search || undefined,
        include_deleted: true,
        page,
        page_size: pageSize,
      };
      if (!todasUnidades && unidadeApiId) {
        params.unidade_id = unidadeApiId;
      }
      const { items, meta } = await listPacientes(params);
      return {
        rows: items.map(dtoToListRow),
        meta,
      };
    },
  });
}

export function usePacienteDetail(id: string | null) {
  return useQuery({
    queryKey: ['paciente', id],
    enabled: !!id && featureFlags.pacientesApiEnabled,
    queryFn: () => getPaciente(id!),
  });
}

function patchPacientesListRows(
  queryClient: ReturnType<typeof useQueryClient>,
  patientId: string,
  patch: Partial<PacienteListRow>,
) {
  queryClient.setQueriesData<PacientesListCache>(
    { queryKey: ['pacientes'] },
    (old) => {
      if (!old) return old;
      return {
        ...old,
        rows: old.rows.map((row) =>
          row.id === patientId ? { ...row, ...patch } : row,
        ),
      };
    },
  );
}

export function usePacienteMutations() {
  const queryClient = useQueryClient();
  const { unidadeAtivaId } = useUnidadeAtiva();

  const refetchPacientes = () =>
    queryClient.refetchQueries({ queryKey: ['pacientes'], type: 'active' });

  const syncPacientes = async () => {
    await refetchPacientes();
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreatePacientePayload) => createPaciente(payload),
    onSuccess: async () => {
      await syncPacientes();
      toast.success('Paciente cadastrado com sucesso');
    },
    onError: (err: unknown) => {
      showErrorToast(err, { action: 'salvar', entity: 'o paciente' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreatePacientePayload }) =>
      updatePaciente(id, payload),
    onSuccess: async () => {
      await syncPacientes();
      toast.success('Paciente atualizado com sucesso');
    },
    onError: (err: unknown) => {
      showErrorToast(err, { action: 'salvar', entity: 'o paciente' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePaciente(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['pacientes'] });
      const snapshots = queryClient.getQueriesData<PacientesListCache>({
        queryKey: ['pacientes'],
      });
      patchPacientesListRows(queryClient, id, {
        excluido: true,
        status: 'inativo',
      });
      return { snapshots };
    },
    onError: (err: unknown, _id, context) => {
      context?.snapshots.forEach(([key, data]) => {
        queryClient.setQueryData(key as QueryKey, data);
      });
      showErrorToast(err, { action: 'excluir', entity: 'o paciente' });
    },
    onSuccess: () => {
      toast.success('Paciente removido com sucesso');
    },
    onSettled: async () => {
      await syncPacientes();
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restorePaciente(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['pacientes'] });
      const snapshots = queryClient.getQueriesData<PacientesListCache>({
        queryKey: ['pacientes'],
      });
      patchPacientesListRows(queryClient, id, {
        excluido: false,
        status: 'ativo',
      });
      return { snapshots };
    },
    onError: (err: unknown, _id, context) => {
      context?.snapshots.forEach(([key, data]) => {
        queryClient.setQueryData(key as QueryKey, data);
      });
      showErrorToast(err, { action: 'restaurar', entity: 'o paciente' });
    },
    onSuccess: () => {
      toast.success('Paciente restaurado com sucesso');
    },
    onSettled: async () => {
      await syncPacientes();
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    restoreMutation,
    unidadeAtivaId,
  };
}

/** Lista simplificada para selects (Consultas, Comodato) */
export function usePacientesOptions() {
  const { data, isLoading, isError } = usePacientesList('', 1, 100);
  const options = (data?.rows ?? [])
    .filter((r) => !r.excluido)
    .map((r) => ({
      id: r.id,
      nome: r.nome,
      nome_completo: r.nome,
    }));
  return { options, isLoading, isError };
}
