import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { featureFlags } from '@/lib/featureFlags';
import { useUnidadeAtiva } from '@/contexts/UnidadeContext';
import { getUnidadeApiId } from '@/lib/unidades/apiIds';
import { financeiroApi } from '@/lib/api/financeiro';
import {
  categoriaToPayload,
  lancamentoToPayload,
  mapCategoria,
  mapCentro,
  mapLancamento,
} from '@/lib/mappers/financeiroMapper';

export interface Categoria {
  id: string;
  nome: string;
  tipo: 'Receita' | 'Despesa';
  cor?: string;
  descricao?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CentroCusto {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Lancamento {
  id: string;
  tipo: 'Receita' | 'Despesa';
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  categoria_id: string;
  categoria_nome: string;
  centro_custo_id?: string;
  centro_custo_nome?: string;
  forma_pagamento?: 'Dinheiro' | 'PIX' | 'Cartão Débito' | 'Cartão Crédito' | 'Transferência' | 'Boleto' | 'Outro';
  documento?: string;
  observacoes?: string;
  status: 'Pendente' | 'Pago' | 'Vencido' | 'Cancelado';
  recorrente: boolean;
  frequencia_recorrencia?: 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';
  parcelas?: number;
  parcela_atual?: number;
  anexo_url?: string;
  conciliado: boolean;
  data_conciliacao?: string;
  unidadeId?: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY_CATEGORIAS = 'financeiro_categorias';
const STORAGE_KEY_CENTROS_CUSTO = 'financeiro_centros_custo';
const STORAGE_KEY_LANCAMENTOS = 'financeiro_lancamentos';

export const useFinanceiro = () => {
  const apiEnabled = featureFlags.financeiroApiEnabled;
  const { unidadeAtivaId } = useUnidadeAtiva();
  const unidadeApiId = getUnidadeApiId(unidadeAtivaId);
  const queryClient = useQueryClient();

  const [localCategorias, setLocalCategorias] = useState<Categoria[]>([]);
  const [localCentros, setLocalCentros] = useState<CentroCusto[]>([]);
  const [localLancamentos, setLocalLancamentos] = useState<Lancamento[]>([]);

  useEffect(() => {
    if (!apiEnabled) {
      setLocalCategorias(
        JSON.parse(localStorage.getItem(STORAGE_KEY_CATEGORIAS) ?? '[]'),
      );
      setLocalCentros(
        JSON.parse(localStorage.getItem(STORAGE_KEY_CENTROS_CUSTO) ?? '[]'),
      );
      setLocalLancamentos(
        JSON.parse(localStorage.getItem(STORAGE_KEY_LANCAMENTOS) ?? '[]'),
      );
    }
  }, [apiEnabled]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['financeiro'] });
  };

  const { data: categorias = [] } = useQuery({
    queryKey: ['financeiro', 'categorias'],
    enabled: apiEnabled,
    queryFn: async () => {
      const { items } = await financeiroApi.listCategorias(unidadeApiId ?? undefined);
      return items.map((i) => mapCategoria(i as Parameters<typeof mapCategoria>[0]));
    },
  });

  const { data: centrosCusto = [] } = useQuery({
    queryKey: ['financeiro', 'centros'],
    enabled: apiEnabled,
    queryFn: async () => {
      const { items } = await financeiroApi.listCentros();
      return items.map((i) => mapCentro(i as Parameters<typeof mapCentro>[0]));
    },
  });

  const { data: lancamentos = [] } = useQuery({
    queryKey: ['financeiro', 'lancamentos'],
    enabled: apiEnabled,
    queryFn: async () => {
      const { items } = await financeiroApi.listLancamentos();
      return items.map((i) => mapLancamento(i as Parameters<typeof mapLancamento>[0]));
    },
  });

  const categoriasState = apiEnabled ? categorias : localCategorias;
  const centrosState = apiEnabled ? centrosCusto : localCentros;
  const lancamentosState = apiEnabled ? lancamentos : localLancamentos;

  const persistLocal = (
    key: string,
    setter: (v: unknown) => void,
    value: unknown,
  ) => {
    localStorage.setItem(key, JSON.stringify(value));
    setter(value as never);
  };

  const addCategoria = async (
    categoriaData: Omit<Categoria, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    if (apiEnabled) {
      await financeiroApi.createCategoria(categoriaToPayload(categoriaData));
      await invalidate();
      return categoriaData as Categoria;
    }
    const newCategoria: Categoria = {
      ...categoriaData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const next = [...localCategorias, newCategoria];
    persistLocal(STORAGE_KEY_CATEGORIAS, setLocalCategorias, next);
    return newCategoria;
  };

  const updateCategoria = async (id: string, categoriaData: Partial<Categoria>) => {
    if (apiEnabled) {
      const cur = categoriasState.find((c) => c.id === id);
      if (!cur) return;
      await financeiroApi.updateCategoria(id, categoriaToPayload({ ...cur, ...categoriaData }));
      await invalidate();
      return;
    }
    const next = localCategorias.map((cat) =>
      cat.id === id ? { ...cat, ...categoriaData, updatedAt: new Date().toISOString() } : cat,
    );
    persistLocal(STORAGE_KEY_CATEGORIAS, setLocalCategorias, next);
  };

  const deleteCategoria = async (id: string) => {
    if (apiEnabled) {
      await financeiroApi.deleteCategoria(id);
      await invalidate();
      return;
    }
    persistLocal(
      STORAGE_KEY_CATEGORIAS,
      setLocalCategorias,
      localCategorias.filter((cat) => cat.id !== id),
    );
  };

  const addCentroCusto = async (
    centroCustoData: Omit<CentroCusto, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    if (apiEnabled) {
      await financeiroApi.createCentro(centroCustoData);
      await invalidate();
      return centroCustoData as CentroCusto;
    }
    const newCentroCusto: CentroCusto = {
      ...centroCustoData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const next = [...localCentros, newCentroCusto];
    persistLocal(STORAGE_KEY_CENTROS_CUSTO, setLocalCentros, next);
    return newCentroCusto;
  };

  const updateCentroCusto = async (id: string, centroCustoData: Partial<CentroCusto>) => {
    if (apiEnabled) {
      const cur = centrosState.find((c) => c.id === id);
      if (!cur) return;
      await financeiroApi.updateCentro(id, { ...cur, ...centroCustoData });
      await invalidate();
      return;
    }
    const next = localCentros.map((cc) =>
      cc.id === id ? { ...cc, ...centroCustoData, updatedAt: new Date().toISOString() } : cc,
    );
    persistLocal(STORAGE_KEY_CENTROS_CUSTO, setLocalCentros, next);
  };

  const deleteCentroCusto = async (id: string) => {
    if (apiEnabled) {
      await financeiroApi.deleteCentro(id);
      await invalidate();
      return;
    }
    persistLocal(
      STORAGE_KEY_CENTROS_CUSTO,
      setLocalCentros,
      localCentros.filter((cc) => cc.id !== id),
    );
  };

  const addLancamento = async (
    lancamentoData: Omit<Lancamento, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
  ) => {
    const hoje = new Date().toISOString().split('T')[0];
    const status = lancamentoData.data_pagamento
      ? 'Pago'
      : lancamentoData.data_vencimento < hoje
        ? 'Vencido'
        : 'Pendente';

    if (apiEnabled) {
      const unidadeSlug = lancamentoData.unidadeId ?? unidadeAtivaId;
      await financeiroApi.createLancamento(
        lancamentoToPayload({
          ...lancamentoData,
          status,
          unidadeId: unidadeSlug,
        }),
      );
      await invalidate();
      return { ...lancamentoData, status } as Lancamento;
    }

    const newLancamento: Lancamento = {
      ...lancamentoData,
      id: crypto.randomUUID(),
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const next = [...localLancamentos, newLancamento];
    persistLocal(STORAGE_KEY_LANCAMENTOS, setLocalLancamentos, next);
    return newLancamento;
  };

  const updateLancamento = async (id: string, lancamentoData: Partial<Lancamento>) => {
    if (apiEnabled) {
      const cur = lancamentosState.find((l) => l.id === id);
      if (!cur) return;
      await financeiroApi.updateLancamento(id, lancamentoToPayload({ ...cur, ...lancamentoData }));
      await invalidate();
      return;
    }
    const next = localLancamentos.map((lanc) => {
      if (lanc.id !== id) return lanc;
      const updated = { ...lanc, ...lancamentoData, updatedAt: new Date().toISOString() };
      const hoje = new Date().toISOString().split('T')[0];
      if (updated.data_pagamento) updated.status = 'Pago';
      else if (updated.data_vencimento < hoje) updated.status = 'Vencido';
      else updated.status = 'Pendente';
      return updated;
    });
    persistLocal(STORAGE_KEY_LANCAMENTOS, setLocalLancamentos, next);
  };

  const deleteLancamento = async (id: string) => {
    if (apiEnabled) {
      await financeiroApi.deleteLancamento(id);
      await invalidate();
      return;
    }
    persistLocal(
      STORAGE_KEY_LANCAMENTOS,
      setLocalLancamentos,
      localLancamentos.filter((lanc) => lanc.id !== id),
    );
  };

  const registrarPagamento = useCallback(
    (id: string, data_pagamento: string, forma_pagamento?: string) => {
      void updateLancamento(id, {
        data_pagamento,
        forma_pagamento: forma_pagamento as Lancamento['forma_pagamento'],
        status: 'Pago',
      });
    },
    [lancamentosState],
  );

  const conciliarLancamento = useCallback((id: string) => {
    void updateLancamento(id, {
      conciliado: true,
      data_conciliacao: new Date().toISOString(),
    });
  }, []);

  useEffect(() => {
    if (apiEnabled) return;
    const hoje = new Date().toISOString().split('T')[0];
    localLancamentos
      .filter((lanc) => lanc.status === 'Pendente' && lanc.data_vencimento < hoje)
      .forEach((lanc) => {
        void updateLancamento(lanc.id, { status: 'Vencido' });
      });
  }, [apiEnabled, localLancamentos]);

  return {
    categorias: categoriasState,
    addCategoria,
    updateCategoria,
    deleteCategoria,
    centrosCusto: centrosState,
    addCentroCusto,
    updateCentroCusto,
    deleteCentroCusto,
    lancamentos: lancamentosState,
    addLancamento,
    updateLancamento,
    deleteLancamento,
    registrarPagamento,
    conciliarLancamento,
  };
};
