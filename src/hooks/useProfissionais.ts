import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { toast } from 'sonner';
import { featureFlags } from '@/lib/featureFlags';
import { useUnidadeAtiva } from '@/contexts/UnidadeContext';
import { getUnidadeApiId } from '@/lib/unidades/apiIds';
import {
  createProfissional,
  deleteProfissional,
  listProfissionais,
  restoreProfissional,
  updateProfissional,
} from '@/lib/api/profissionais';
import { dtoToProfissional, profissionalToPayload } from '@/lib/mappers/profissionalMapper';
import { showErrorToast } from '@/lib/ui/showErrorToast';

export type ConselhoTipo =
  | 'CRP'
  | 'CRM'
  | 'CREFITO'
  | 'COREN'
  | 'CRN'
  | 'CREFONO'
  | 'CRO'
  | 'CRBM'
  | 'OUTRO';

export interface Profissional {
  id: string;
  nome: string;
  cpf?: string;
  rg?: string;
  dataNascimento?: string;
  email: string;
  telefone?: string;
  celular?: string;
  conselho?: ConselhoTipo;
  numeroRegistro?: string;
  ufRegistro?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  especialidades?: string[];
  unidadeIds?: string[];
  diasAtendimento?: string[];
  horarioInicio?: string;
  horarioFim?: string;
  duracaoConsulta?: number;
  consentimentoLGPD?: boolean;
  dataConsentimento?: string;
  compartilhamentoDados?: boolean;
  finalidadeDados?: string;
  status: 'ativo' | 'inativo' | 'suspenso';
  observacoes?: string;
  dados_complementares?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deleted_at?: string;
}

const STORAGE_KEY = 'profissionais';

const readStored = (): Profissional[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

function patchProfissionaisCache(
  queryClient: ReturnType<typeof useQueryClient>,
  unidadeApiId: string | undefined,
  profissionalId: string,
  patch: Partial<Profissional>,
) {
  queryClient.setQueriesData<Profissional[]>(
    { queryKey: ['profissionais', unidadeApiId] },
    (old) => {
      if (!old) return old;
      return old.map((row) => (row.id === profissionalId ? { ...row, ...patch } : row));
    },
  );
}

export const useProfissionais = () => {
  const apiEnabled = featureFlags.profissionaisApiEnabled;
  const { unidadeAtivaId } = useUnidadeAtiva();
  const unidadeApiId = getUnidadeApiId(unidadeAtivaId);
  const queryClient = useQueryClient();

  const [localProfissionais, setLocalProfissionais] = useState<Profissional[]>(() =>
    apiEnabled ? [] : readStored(),
  );

  useEffect(() => {
    if (!apiEnabled) {
      setLocalProfissionais(readStored());
    }
  }, [apiEnabled]);

  const { data: apiProfissionais = [], isLoading, isError, error } = useQuery({
    queryKey: ['profissionais', unidadeApiId],
    enabled: apiEnabled && !!unidadeApiId,
    queryFn: async () => {
      const { items } = await listProfissionais({
        unidade_id: unidadeApiId!,
        page_size: 500,
        include_deleted: true,
      });
      return items.map(dtoToProfissional);
    },
  });

  const profissionais = apiEnabled ? apiProfissionais : localProfissionais;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['profissionais'] });

  const persistLocal = (next: Profissional[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setLocalProfissionais(next);
  };

  const list = useCallback(
    (opts: { incluirRemovidos?: boolean } = {}) =>
      profissionais.filter((p) => (opts.incluirRemovidos ? true : !p.deleted_at)),
    [profissionais],
  );

  const getById = useCallback(
    (id: string) => profissionais.find((p) => p.id === id) ?? null,
    [profissionais],
  );

  const create = useCallback(
    async (
      data: Omit<Profissional, 'id' | 'createdAt' | 'updatedAt' | 'deleted_at' | 'status'> & {
        status?: Profissional['status'];
      },
    ): Promise<Profissional> => {
      if (apiEnabled) {
        const id = await createProfissional(
          profissionalToPayload({ ...data, status: data.status ?? 'ativo' }, unidadeAtivaId),
        );
        await invalidate();
        const found = profissionais.find((p) => p.id === id);
        if (found) return found;
        return {
          ...data,
          id,
          status: data.status ?? 'ativo',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      const now = new Date().toISOString();
      const novo: Profissional = {
        ...data,
        id: crypto.randomUUID(),
        status: data.status ?? 'ativo',
        createdAt: now,
        updatedAt: now,
      };
      persistLocal([...readStored(), novo]);
      return novo;
    },
    [apiEnabled, unidadeAtivaId, profissionais, queryClient],
  );

  const update = useCallback(
    async (id: string, patch: Partial<Profissional>) => {
      if (apiEnabled) {
        const current = getById(id);
        if (!current) return;
        await updateProfissional(
          id,
          profissionalToPayload({ ...current, ...patch }, unidadeAtivaId),
        );
        await invalidate();
        return;
      }
      const current = readStored();
      const next = current.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
      );
      persistLocal(next);
    },
    [apiEnabled, unidadeAtivaId, getById, queryClient],
  );

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProfissional(id),
    onMutate: async (id) => {
      if (!apiEnabled || !unidadeApiId) return;
      await queryClient.cancelQueries({ queryKey: ['profissionais', unidadeApiId] });
      const snapshots = queryClient.getQueriesData<Profissional[]>({
        queryKey: ['profissionais', unidadeApiId],
      });
      patchProfissionaisCache(queryClient, unidadeApiId, id, {
        deleted_at: new Date().toISOString(),
        status: 'inativo',
      });
      return { snapshots };
    },
    onError: (err: unknown, _id, context) => {
      context?.snapshots.forEach(([key, data]) => {
        queryClient.setQueryData(key as QueryKey, data);
      });
      showErrorToast(err, { action: 'excluir', entity: 'o profissional' });
    },
    onSuccess: () => {
      toast.success('Profissional removido com sucesso');
    },
    onSettled: () => {
      void invalidate();
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreProfissional(id),
    onMutate: async (id) => {
      if (!apiEnabled || !unidadeApiId) return;
      await queryClient.cancelQueries({ queryKey: ['profissionais', unidadeApiId] });
      const snapshots = queryClient.getQueriesData<Profissional[]>({
        queryKey: ['profissionais', unidadeApiId],
      });
      patchProfissionaisCache(queryClient, unidadeApiId, id, {
        deleted_at: undefined,
        status: 'ativo',
      });
      return { snapshots };
    },
    onError: (err: unknown, _id, context) => {
      context?.snapshots.forEach(([key, data]) => {
        queryClient.setQueryData(key as QueryKey, data);
      });
      showErrorToast(err, { action: 'restaurar', entity: 'o profissional' });
    },
    onSuccess: () => {
      toast.success('Profissional restaurado com sucesso');
    },
    onSettled: () => {
      void invalidate();
    },
  });

  const softDelete = useCallback(
    async (id: string) => {
      if (apiEnabled) {
        await deleteMutation.mutateAsync(id);
        return;
      }
      const now = new Date().toISOString();
      const current = readStored();
      persistLocal(
        current.map((p) =>
          p.id === id ? { ...p, deleted_at: now, status: 'inativo', updatedAt: now } : p,
        ),
      );
      toast.success('Profissional removido com sucesso');
    },
    [apiEnabled, deleteMutation],
  );

  const restore = useCallback(
    async (id: string) => {
      if (apiEnabled) {
        await restoreMutation.mutateAsync(id);
        return;
      }
      const current = readStored();
      persistLocal(
        current.map((p) =>
          p.id === id
            ? {
                ...p,
                deleted_at: undefined,
                status: 'ativo',
                updatedAt: new Date().toISOString(),
              }
            : p,
        ),
      );
      toast.success('Profissional restaurado com sucesso');
    },
    [apiEnabled, restoreMutation],
  );

  return {
    profissionais,
    isLoading: apiEnabled ? isLoading : false,
    isError: apiEnabled ? isError : false,
    error: apiEnabled ? error : null,
    list,
    getById,
    create,
    update,
    softDelete,
    restore,
    isDeleting: deleteMutation.isPending,
    isRestoring: restoreMutation.isPending,
  };
};
