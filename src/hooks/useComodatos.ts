import { featureFlags } from '@/lib/featureFlags';
import { useGenericApiResource } from '@/hooks/useGenericApiResource';
import { getUnidadeApiId } from '@/lib/unidades/apiIds';
import { useUnidadeAtiva } from '@/contexts/UnidadeContext';
import { partitionComodatos } from '@/lib/comodato/comodatoStatus';
import {
  mapComodatoDevolucaoPatch,
  mapComodatoFromApi,
  mapComodatoToApiBody,
  type ComodatoApiRow,
  type ComodatoMapped,
} from '@/lib/mappers/comodatoMapper';
import type { DevolucaoFormData } from '@/lib/validations/comodato.schema';

export {
  getComodatoStatusLabel,
  isComodatoAtrasado,
  isComodatoAtivo,
  isComodatoDevolvido,
  partitionComodatos,
} from '@/lib/comodato/comodatoStatus';

export type Comodato = ComodatoMapped;

const STORAGE_KEY = 'comodatos';

export const useComodatos = () => {
  const { unidadeAtivaId } = useUnidadeAtiva();
  const unidadeApiId = getUnidadeApiId(unidadeAtivaId);
  const apiEnabled = featureFlags.comodatoApiEnabled;

  const { items, create, update, remove } = useGenericApiResource<Comodato>({
    queryKey: 'comodatos',
    path: '/comodatos',
    apiEnabled,
    listParams: unidadeApiId ? { unidade_id: unidadeApiId } : undefined,
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
    mapFromApi: (c) => mapComodatoFromApi(c as ComodatoApiRow),
    mapToCreate: (c) => mapComodatoToApiBody(c),
    mapToUpdate: (c) => mapComodatoToApiBody(c),
  });

  const getComodatosAtivos = () => partitionComodatos(items).ativos;

  const getComodatosAtrasados = () => partitionComodatos(items).atrasados;

  const registrarDevolucao = async (id: string, data: DevolucaoFormData) => {
    const current = items.find((i) => i.id === id);
    if (!current) {
      throw new Error('Comodato não encontrado');
    }
    const patch = mapComodatoDevolucaoPatch(current, data);
    await update(id, patch);
  };

  return {
    comodatos: items,
    addComodato: (data: Omit<Comodato, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: string }) =>
      create({
        ...data,
        status: data.status ?? 'Emprestado',
        condicao_entrega: data.condicao_entrega || 'Não informado',
        quantidade: data.quantidade ?? 1,
      } as Omit<Comodato, 'id' | 'createdAt' | 'updatedAt'>),
    updateComodato: update,
    deleteComodato: remove,
    getComodatosAtivos,
    getComodatosAtrasados,
    registrarDevolucao,
  };
};
