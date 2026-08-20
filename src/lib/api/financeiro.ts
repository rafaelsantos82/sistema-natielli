import { createResource, deleteResource, listResource, updateResource } from '@/lib/api/genericCrud';
import type { Categoria, CentroCusto, Lancamento } from '@/hooks/useFinanceiro';

const BASE = '/financeiro';

export const financeiroApi = {
  listCategorias: (unidadeId?: string) =>
    listResource<Categoria>(`${BASE}/categorias`, { page_size: 500, unidade_id: unidadeId }),
  createCategoria: (body: unknown) => createResource(`${BASE}/categorias`, body),
  updateCategoria: (id: string, body: unknown) =>
    updateResource<Categoria>(`${BASE}/categorias`, id, body),
  deleteCategoria: (id: string) => deleteResource(`${BASE}/categorias`, id),

  listCentros: () => listResource<CentroCusto>(`${BASE}/centros-custo`, { page_size: 500 }),
  createCentro: (body: unknown) => createResource(`${BASE}/centros-custo`, body),
  updateCentro: (id: string, body: unknown) =>
    updateResource<CentroCusto>(`${BASE}/centros-custo`, id, body),
  deleteCentro: (id: string) => deleteResource(`${BASE}/centros-custo`, id),

  listLancamentos: (unidadeId?: string) =>
    listResource<Lancamento>(`${BASE}/lancamentos`, { page_size: 500, unidade_id: unidadeId }),
  createLancamento: (body: unknown) => createResource(`${BASE}/lancamentos`, body),
  updateLancamento: (id: string, body: unknown) =>
    updateResource<Lancamento>(`${BASE}/lancamentos`, id, body),
  deleteLancamento: (id: string) => deleteResource(`${BASE}/lancamentos`, id),
};
