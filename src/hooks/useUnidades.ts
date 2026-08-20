import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { featureFlags } from '@/lib/featureFlags';
import { listUnidades } from '@/lib/api/unidades';
import { getUnidadeApiId, getUnidadeSlugFromApiId } from '@/lib/unidades/apiIds';

export interface Unidade {
  id: string;
  /** UUID da API quando `unidadesApiEnabled`; usado em filtros de consultas/salas. */
  apiId?: string;
  nome: string;
  slug: string;
  status: 'ativa' | 'inativa';
  endereco?: string;
  telefone?: string;
  createdAt: string;
  updatedAt: string;
  deleted_at?: string;
}

const STORAGE_KEY = 'unidades';
const UNIDADES_REMOVIDAS = new Set(['unidade-duque-caxias', 'unidade-tijuca']);

export const UNIDADE_PADRAO_ID = 'unidade-catanduva';

const SEED: Unidade[] = [
  {
    id: UNIDADE_PADRAO_ID,
    apiId: getUnidadeApiId(UNIDADE_PADRAO_ID) ?? undefined,
    nome: 'Catanduva',
    slug: 'catanduva',
    status: 'ativa',
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: 'unidade-londrina',
    apiId: 'a0000000-0000-4000-8000-000000000004',
    nome: 'Londrina',
    slug: 'londrina',
    status: 'ativa',
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: 'unidade-sertanopolis',
    apiId: 'a0000000-0000-4000-8000-000000000005',
    nome: 'Sertanópolis',
    slug: 'sertanopolis',
    status: 'ativa',
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: 'unidade-online',
    apiId: 'a0000000-0000-4000-8000-000000000006',
    nome: 'Online',
    slug: 'online',
    status: 'ativa',
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
];

const readStored = (): Unidade[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const dtoToUnidade = (d: {
  id: string;
  nome: string;
  slug?: string;
  status?: string;
  endereco?: string;
  telefone?: string;
  created_at?: string;
  updated_at?: string;
}): Unidade => ({
  id: getUnidadeSlugFromApiId(d.id) ?? d.slug ?? d.id,
  apiId: d.id,
  nome: d.nome,
  slug: d.slug ?? getUnidadeSlugFromApiId(d.id) ?? d.id,
  status: (d.status === 'inativa' ? 'inativa' : 'ativa') as Unidade['status'],
  endereco: d.endereco,
  telefone: d.telefone,
  createdAt: d.created_at ?? new Date().toISOString(),
  updatedAt: d.updated_at ?? new Date().toISOString(),
});

/** Garante que o seed exista quando API desligada. */
export const ensureUnidadesSeed = (): Unidade[] => {
  if (featureFlags.unidadesApiEnabled) {
    return SEED;
  }
  const stored = readStored();
  const current = stored.filter((u) => !UNIDADES_REMOVIDAS.has(u.id));
  if (current.length === 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
    return SEED;
  }
  const ids = new Set(current.map((u) => u.id));
  const missing = SEED.filter((s) => !ids.has(s.id));
  const next = missing.length > 0 ? [...current, ...missing] : current;
  if (missing.length > 0 || next.length !== stored.length) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
};

export const getUnidadesAtivas = (): Unidade[] =>
  ensureUnidadesSeed().filter((u) => !u.deleted_at && u.status === 'ativa');

export const useUnidades = () => {
  const apiEnabled = featureFlags.unidadesApiEnabled;
  const queryClient = useQueryClient();
  const [localUnidades, setLocalUnidades] = useState<Unidade[]>(() => ensureUnidadesSeed());

  const { data: apiUnidades } = useQuery({
    queryKey: ['unidades'],
    enabled: apiEnabled,
    queryFn: async () => {
      const items = await listUnidades();
      return items.map(dtoToUnidade);
    },
  });

  const unidades = apiEnabled && apiUnidades?.length ? apiUnidades : localUnidades;

  useEffect(() => {
    if (!apiEnabled) {
      setLocalUnidades(ensureUnidadesSeed());
    }
  }, [apiEnabled]);

  const persist = (next: Unidade[]) => {
    if (!apiEnabled) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    setLocalUnidades(next);
    if (apiEnabled) {
      void queryClient.invalidateQueries({ queryKey: ['unidades'] });
    }
  };

  const list = useCallback(
    (opts: { incluirRemovidas?: boolean } = {}) =>
      unidades.filter((u) => (opts.incluirRemovidas ? true : !u.deleted_at)),
    [unidades],
  );

  const getById = useCallback(
    (id: string) => unidades.find((u) => u.id === id) ?? null,
    [unidades],
  );

  const create = useCallback(
    (data: Omit<Unidade, 'id' | 'createdAt' | 'updatedAt' | 'deleted_at'>): Unidade => {
      const now = new Date().toISOString();
      const novo: Unidade = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      persist([...readStored(), novo]);
      return novo;
    },
    [apiEnabled],
  );

  const update = useCallback((id: string, patch: Partial<Unidade>) => {
    const current = apiEnabled ? unidades : readStored();
    const next = current.map((u) =>
      u.id === id ? { ...u, ...patch, updatedAt: new Date().toISOString() } : u,
    );
    persist(next);
  }, [apiEnabled, unidades]);

  const softDelete = useCallback((id: string) => {
    const now = new Date().toISOString();
    const current = apiEnabled ? unidades : readStored();
    persist(
      current.map((u) =>
        u.id === id ? { ...u, deleted_at: now, status: 'inativa', updatedAt: now } : u,
      ),
    );
  }, [apiEnabled, unidades]);

  return { unidades, list, getById, create, update, softDelete, apiReadOnly: apiEnabled };
};
