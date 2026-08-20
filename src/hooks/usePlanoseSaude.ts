import { featureFlags } from '@/lib/featureFlags';
import { useGenericApiResource } from '@/hooks/useGenericApiResource';

export interface PlanoSaude {
  id: string;
  nome: string;
  codigo?: string;
  status: 'ativo' | 'inativo';
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

const STORAGE_KEY = 'planosSaude';

export const usePlanosSaude = () => {
  const apiEnabled = featureFlags.planosApiEnabled;
  const { items, create, update, remove } = useGenericApiResource<PlanoSaude>({
    queryKey: 'planos-saude',
    path: '/planos-saude',
    apiEnabled,
    local: {
      read: () => {
        try {
          return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
        } catch {
          return [];
        }
      },
      write: (next) => localStorage.setItem(STORAGE_KEY, JSON.stringify(next)),
    },
    mapFromApi: (p) => ({
      id: String(p.id),
      nome: String((p as { nome?: string }).nome ?? ''),
      codigo: (p as { codigo?: string }).codigo,
      status: ((p as { status?: string }).status === 'inativo' ? 'inativo' : 'ativo') as PlanoSaude['status'],
      createdAt: String((p as { created_at?: string }).created_at ?? new Date().toISOString()),
      updatedAt: String((p as { updated_at?: string }).updated_at ?? new Date().toISOString()),
    }),
  });

  return {
    planosSaude: items,
    addPlano: (data: Omit<PlanoSaude, 'id' | 'createdAt' | 'updatedAt'>) => create(data),
    updatePlano: update,
    deletePlano: remove,
  };
};
