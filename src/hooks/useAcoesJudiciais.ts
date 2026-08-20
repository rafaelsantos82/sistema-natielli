import { featureFlags } from '@/lib/featureFlags';
import { useGenericApiResource } from '@/hooks/useGenericApiResource';
import {
  mapAcaoJudicialFromApi,
  mapAcaoJudicialToApiBody,
  type AcaoJudicialApiRow,
} from '@/lib/mappers/acaoJudicialMapper';

export interface AcaoJudicial {
  id: string;
  paciente_id: string;
  paciente_nome?: string;
  plano_id?: string;
  plano_saude_id?: string;
  plano_saude_nome?: string;
  numero_processo: string;
  tipo: string;
  status: string;
  valor_acao: number;
  descricao: string;
  data_abertura?: string;
  data_entrada?: string;
  data_sentenca?: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

const STORAGE_KEY = 'acoesJudiciais';

export const useAcoesJudiciais = () => {
  const apiEnabled = featureFlags.planosApiEnabled;
  const { items, create, update, remove } = useGenericApiResource<AcaoJudicial>({
    queryKey: 'acoes-judiciais',
    path: '/acoes-judiciais',
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
    mapFromApi: (a) => mapAcaoJudicialFromApi(a as AcaoJudicialApiRow),
    mapToCreate: (a) => mapAcaoJudicialToApiBody(a),
    mapToUpdate: (a) => mapAcaoJudicialToApiBody(a),
  });

  return {
    acoesJudiciais: items,
    addAcao: (data: Omit<AcaoJudicial, 'id' | 'createdAt' | 'updatedAt'>) => create(data),
    updateAcao: update,
    deleteAcao: remove,
    addAcaoJudicial: (data: Omit<AcaoJudicial, 'id' | 'createdAt' | 'updatedAt'>) => create(data),
    updateAcaoJudicial: update,
    deleteAcaoJudicial: remove,
  };
};
