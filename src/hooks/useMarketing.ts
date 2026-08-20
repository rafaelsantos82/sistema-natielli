import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteManual as apiDeleteManual,
  deleteMaterial as apiDeleteMaterial,
  downloadManual,
  downloadMaterial,
  listManuais,
  listMateriais,
  uploadManual,
  uploadMaterial,
} from '@/lib/api/marketing';
import type {
  ManualDTO,
  ManualUploadInput,
  MaterialMarketingDTO,
  MaterialUploadInput,
} from '@/lib/api/marketing.types';
import { featureFlags } from '@/lib/featureFlags';
import { validateProfissionalDocFile } from '@/lib/uploads/profissionalDocPolicy';
import { showErrorToast } from '@/lib/ui/showErrorToast';
import { toast } from 'sonner';

export interface Manual {
  id: string;
  titulo: string;
  versao: string;
  publico_alvo: string;
  arquivo_nome: string;
  tags: string[];
  status: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  id: string;
  titulo: string;
  tipo: string;
  arquivo_nome: string;
  tags: string[];
  campanha?: string;
  unidade_id?: string;
  status: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

export type { ManualUploadInput, MaterialUploadInput };

function normalizeManual(raw: ManualDTO): Manual {
  return {
    id: raw.id,
    titulo: raw.titulo ?? '',
    versao: raw.versao ?? '',
    publico_alvo: raw.publico_alvo ?? '',
    arquivo_nome: raw.arquivo_nome ?? '',
    tags: raw.tags ?? [],
    status: raw.status ?? 'Rascunho',
    observacoes: raw.observacoes ?? undefined,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function normalizeMaterial(raw: MaterialMarketingDTO): Material {
  return {
    id: raw.id,
    titulo: raw.titulo ?? '',
    tipo: raw.tipo ?? '',
    arquivo_nome: raw.arquivo_nome ?? '',
    tags: raw.tags ?? [],
    campanha: raw.campanha ?? undefined,
    unidade_id: raw.unidade_id ?? undefined,
    status: raw.status ?? 'Rascunho',
    observacoes: raw.observacoes ?? undefined,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

const STORAGE_KEY_MANUAIS = 'marketing_manuais';
const STORAGE_KEY_MATERIAIS = 'marketing_materiais';

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function appendTags(form: FormData, tags?: string[]) {
  if (tags && tags.length > 0) {
    form.append('tags', JSON.stringify(tags));
  }
}

export function useMarketingLists() {
  const apiEnabled = featureFlags.marketingApiEnabled;

  const readManuais = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_MANUAIS) ?? '[]') as Manual[];
    } catch {
      return [];
    }
  };
  const readMateriais = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_MATERIAIS) ?? '[]') as Material[];
    } catch {
      return [];
    }
  };

  const manuaisQuery = useQuery({
    queryKey: ['marketing-manuais', apiEnabled],
    queryFn: async () => {
      if (!apiEnabled) return readManuais();
      const { items } = await listManuais({ page_size: 200 });
      return items.map(normalizeManual);
    },
  });

  const materiaisQuery = useQuery({
    queryKey: ['marketing-materiais', apiEnabled],
    queryFn: async () => {
      if (!apiEnabled) return readMateriais();
      const { items } = await listMateriais({ page_size: 200 });
      return items.map(normalizeMaterial);
    },
  });

  const manuais = manuaisQuery.data ?? [];
  const materiais = materiaisQuery.data ?? [];

  const searchManuais = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return manuais;
    return manuais.filter(
      (m) =>
        m.titulo.toLowerCase().includes(q) ||
        m.arquivo_nome.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q)) ||
        m.publico_alvo.toLowerCase().includes(q),
    );
  };

  const searchMateriais = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return materiais;
    return materiais.filter(
      (m) =>
        m.titulo.toLowerCase().includes(q) ||
        m.arquivo_nome.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q)) ||
        (m.campanha ?? '').toLowerCase().includes(q),
    );
  };

  return {
    manuais,
    materiais,
    searchManuais,
    searchMateriais,
    isLoading: manuaisQuery.isLoading || materiaisQuery.isLoading,
    isError: manuaisQuery.isError || materiaisQuery.isError,
    error: manuaisQuery.error ?? materiaisQuery.error,
    apiEnabled,
  };
}

export function useMarketingMutations() {
  const queryClient = useQueryClient();
  const apiEnabled = featureFlags.marketingApiEnabled;

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['marketing-manuais'] });
    void queryClient.invalidateQueries({ queryKey: ['marketing-materiais'] });
  };

  const persistManuais = (next: Manual[]) =>
    localStorage.setItem(STORAGE_KEY_MANUAIS, JSON.stringify(next));
  const persistMateriais = (next: Material[]) =>
    localStorage.setItem(STORAGE_KEY_MATERIAIS, JSON.stringify(next));

  const readManuais = (): Manual[] => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_MANUAIS) ?? '[]') as Manual[];
    } catch {
      return [];
    }
  };
  const readMateriais = (): Material[] => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_MATERIAIS) ?? '[]') as Material[];
    } catch {
      return [];
    }
  };

  const uploadManualMutation = useMutation({
    mutationFn: async (input: ManualUploadInput) => {
      validateProfissionalDocFile(input.file);
      if (!apiEnabled) {
        const next: Manual = {
          id: crypto.randomUUID(),
          titulo: input.titulo,
          versao: input.versao,
          publico_alvo: input.publico_alvo,
          arquivo_nome: input.file.name,
          tags: input.tags ?? [],
          status: input.status ?? 'Rascunho',
          observacoes: input.observacoes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        persistManuais([...readManuais(), next]);
        return next;
      }
      const form = new FormData();
      form.append('titulo', input.titulo.trim());
      form.append('versao', input.versao.trim());
      form.append('publico_alvo', input.publico_alvo);
      form.append('file', input.file);
      if (input.status) form.append('status', input.status);
      if (input.observacoes?.trim()) form.append('observacoes', input.observacoes.trim());
      appendTags(form, input.tags);
      return normalizeManual(await uploadManual(form));
    },
    onSuccess: () => {
      toast.success('Manual enviado com sucesso');
      invalidate();
    },
    onError: (err) => showErrorToast(err, { action: 'enviar', entity: 'o manual' }),
  });

  const uploadMaterialMutation = useMutation({
    mutationFn: async (input: MaterialUploadInput) => {
      validateProfissionalDocFile(input.file);
      if (!apiEnabled) {
        const next: Material = {
          id: crypto.randomUUID(),
          titulo: input.titulo,
          tipo: input.tipo,
          arquivo_nome: input.file.name,
          tags: input.tags ?? [],
          campanha: input.campanha,
          unidade_id: input.unidade_id,
          status: input.status ?? 'Rascunho',
          observacoes: input.observacoes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        persistMateriais([...readMateriais(), next]);
        return next;
      }
      const form = new FormData();
      form.append('titulo', input.titulo.trim());
      form.append('tipo', input.tipo.trim());
      form.append('file', input.file);
      if (input.status) form.append('status', input.status);
      if (input.campanha?.trim()) form.append('campanha', input.campanha.trim());
      if (input.unidade_id) form.append('unidade_id', input.unidade_id);
      if (input.observacoes?.trim()) form.append('observacoes', input.observacoes.trim());
      appendTags(form, input.tags);
      return normalizeMaterial(await uploadMaterial(form));
    },
    onSuccess: () => {
      toast.success('Material enviado com sucesso');
      invalidate();
    },
    onError: (err) => showErrorToast(err, { action: 'enviar', entity: 'o material' }),
  });

  const deleteManualMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!apiEnabled) {
        persistManuais(readManuais().filter((m) => m.id !== id));
        return;
      }
      await apiDeleteManual(id);
    },
    onSuccess: () => {
      toast.success('Manual removido com sucesso');
      invalidate();
    },
    onError: (err) => showErrorToast(err, { action: 'excluir', entity: 'o manual' }),
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!apiEnabled) {
        persistMateriais(readMateriais().filter((m) => m.id !== id));
        return;
      }
      await apiDeleteMaterial(id);
    },
    onSuccess: () => {
      toast.success('Material removido com sucesso');
      invalidate();
    },
    onError: (err) => showErrorToast(err, { action: 'excluir', entity: 'o material' }),
  });

  const downloadManualFile = async (item: Manual) => {
    if (!item.arquivo_nome) return;
    try {
      if (!apiEnabled) {
        toast.info('Download disponível apenas com a API de marketing ativa');
        return;
      }
      const blob = await downloadManual(item.id);
      triggerDownload(blob, item.arquivo_nome);
    } catch (err) {
      showErrorToast(err, { action: 'baixar', entity: 'o manual' });
    }
  };

  const downloadMaterialFile = async (item: Material) => {
    if (!item.arquivo_nome) return;
    try {
      if (!apiEnabled) {
        toast.info('Download disponível apenas com a API de marketing ativa');
        return;
      }
      const blob = await downloadMaterial(item.id);
      triggerDownload(blob, item.arquivo_nome);
    } catch (err) {
      showErrorToast(err, { action: 'baixar', entity: 'o material' });
    }
  };

  return {
    uploadManualMutation,
    uploadMaterialMutation,
    deleteManualMutation,
    deleteMaterialMutation,
    downloadManualFile,
    downloadMaterialFile,
  };
}

/** @deprecated Use useMarketingLists + useMarketingMutations */
export const useMarketing = () => {
  const lists = useMarketingLists();
  const mutations = useMarketingMutations();
  return {
    ...lists,
    addManual: mutations.uploadManualMutation.mutateAsync,
    addMaterial: mutations.uploadMaterialMutation.mutateAsync,
    deleteManual: mutations.deleteManualMutation.mutateAsync,
    deleteMaterial: mutations.deleteMaterialMutation.mutateAsync,
    downloadManual: mutations.downloadManualFile,
    downloadMaterial: mutations.downloadMaterialFile,
    updateManual: async () => {
      /* não implementado — edição futura */
    },
  };
};
