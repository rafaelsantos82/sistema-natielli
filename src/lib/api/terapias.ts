import {
  createResource,
  deleteResource,
  getResource,
  listResource,
  updateResource,
} from '@/lib/api/genericCrud';

export interface TerapiaDTO {
  id: string;
  nome_terapia: string;
  objetivo_terapeutico: string;
  status: string;
  versao: number;
  created_at: string;
  updated_at: string;
}

export const terapiasApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    listResource<TerapiaDTO>('/terapias', params),
  get: (id: string) => getResource<TerapiaDTO>('/terapias', id),
  create: (body: unknown) => createResource('/terapias', body),
  update: (id: string, body: unknown) => updateResource<TerapiaDTO>('/terapias', id, body),
  delete: (id: string) => deleteResource('/terapias', id),
};
