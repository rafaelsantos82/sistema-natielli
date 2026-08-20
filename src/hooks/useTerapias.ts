import { featureFlags } from '@/lib/featureFlags';
import { useGenericApiResource } from '@/hooks/useGenericApiResource';

export interface Terapia {
  id: string;
  nome_terapia: string;
  objetivo_terapeutico: string;
  status: 'Ativo' | 'Inativo';
  versao: number;
  updated_at: string;
}

const STORAGE_KEY = 'terapias';
const LEGACY_STORAGE_KEY = 'tratamentos';

const readStored = (): Terapia[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as Terapia[];
    }
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacy) return [];
    const parsed = JSON.parse(legacy) as Array<Record<string, unknown>>;
    const migrated: Terapia[] = parsed.map((item) => ({
      id: String(item.id ?? ''),
      nome_terapia: String(item.nome_terapia ?? item.nome_tratamento ?? ''),
      objetivo_terapeutico: String(item.objetivo_terapeutico ?? ''),
      status: item.status === 'Inativo' ? 'Inativo' : 'Ativo',
      versao: Number(item.versao ?? 1),
      updated_at: String(item.updated_at ?? new Date().toISOString()),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return migrated;
  } catch {
    return [];
  }
};

export const useTerapias = () => {
  const apiEnabled = featureFlags.terapiasApiEnabled;
  const { items, isLoading, isError, error, create, update, remove } = useGenericApiResource<Terapia>({
    queryKey: 'terapias',
    path: '/terapias',
    apiEnabled,
    local: {
      read: readStored,
      write: (next) => localStorage.setItem(STORAGE_KEY, JSON.stringify(next)),
    },
    mapFromApi: (t) => ({
      ...t,
      nome_terapia: (t as { nome_terapia?: string; nome_tratamento?: string }).nome_terapia
        ?? (t as { nome_tratamento?: string }).nome_tratamento
        ?? '',
      status: (t.status === 'Inativo' ? 'Inativo' : 'Ativo') as Terapia['status'],
      updated_at: (t as { updated_at?: string }).updated_at ?? new Date().toISOString(),
    }),
    mapToCreate: (t) => ({
      nome_terapia: t.nome_terapia,
      objetivo_terapeutico: t.objetivo_terapeutico,
      diretriz_protocolar: t.objetivo_terapeutico,
      status: t.status,
      versao: t.versao ?? 1,
      itens_regime: [],
      necessidade_consentimento: false,
    }),
    mapToUpdate: (t) => ({
      nome_terapia: t.nome_terapia,
      objetivo_terapeutico: t.objetivo_terapeutico,
      diretriz_protocolar: t.objetivo_terapeutico,
      status: t.status,
      versao: t.versao,
      itens_regime: [],
      necessidade_consentimento: false,
    }),
  });

  return {
    terapias: items,
    isLoading,
    isError,
    error,
    addTerapia: (data: Omit<Terapia, 'id' | 'updated_at'>) =>
      create({
        ...data,
        versao: data.versao ?? 1,
        updated_at: new Date().toISOString(),
      }),
    updateTerapia: (id: string, patch: Partial<Terapia>) => update(id, patch),
    deleteTerapia: remove,
  };
};
