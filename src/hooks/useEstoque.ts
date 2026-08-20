import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { featureFlags } from '@/lib/featureFlags';
import { createResource, deleteResource, listResource, updateResource } from '@/lib/api/genericCrud';
import { getUnidadeApiId } from '@/lib/unidades/apiIds';
import { useUnidadeAtiva } from '@/contexts/UnidadeContext';
import {
  movimentacaoFromApi,
  movimentacaoToApiPayload,
  SALDO_INSUFICIENTE_MSG,
  type MovimentacaoInput,
  type MovimentacaoTipo,
} from '@/lib/mappers/estoqueMapper';

export type { MovimentacaoInput };

export interface ItemEstoque {
  id: string;
  codigo: string;
  nome: string;
  categoria: string;
  unidade_medida: string;
  estoque_atual: number;
  estoque_minimo: number;
  localizacao?: string;
  status: 'Ativo' | 'Inativo';
  createdAt: string;
  updatedAt: string;
}

export interface Movimentacao {
  id: string;
  item_id: string;
  item_nome: string;
  tipo: MovimentacaoTipo;
  quantidade: number;
  data_hora: string;
  documento?: string;
  motivo: string;
  responsavel_id: string;
  responsavel_nome: string;
  saldo_anterior: number;
  saldo_atual: number;
  createdAt: string;
}

export interface Inventario {
  id: string;
  data: string;
  responsavel_id: string;
  responsavel_nome: string;
  contagens: {
    item_id: string;
    item_nome: string;
    estoque_sistema: number;
    contagem_fisica: number;
    divergencia: number;
  }[];
  observacoes?: string;
  createdAt: string;
}

export { SALDO_INSUFICIENTE_MSG };

const STORAGE_KEY_ITENS = 'estoque_itens';
const STORAGE_KEY_MOVIMENTACOES = 'estoque_movimentacoes';
const STORAGE_KEY_INVENTARIOS = 'estoque_inventarios';

export const useEstoque = () => {
  const apiEnabled = featureFlags.estoqueApiEnabled;
  const { unidadeAtivaId } = useUnidadeAtiva();
  const unidadeApiId = getUnidadeApiId(unidadeAtivaId);
  const queryClient = useQueryClient();

  const [localItens, setLocalItens] = useState<ItemEstoque[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_ITENS);
    return stored ? JSON.parse(stored) : [];
  });

  const { data: apiItens = [] } = useQuery({
    queryKey: ['estoque-itens', unidadeApiId],
    enabled: apiEnabled && !!unidadeApiId,
    queryFn: async () => {
      const { items } = await listResource<Record<string, unknown>>('/estoque/itens', {
        unidade_id: unidadeApiId!,
        page_size: 500,
      });
      return items.map(
        (i) =>
          ({
            id: String(i.id),
            codigo: String(i.codigo ?? ''),
            nome: String(i.nome ?? ''),
            categoria: String(i.categoria ?? ''),
            unidade_medida: String(i.unidade_medida ?? 'un'),
            estoque_atual: Number(i.estoque_atual ?? 0),
            estoque_minimo: Number(i.estoque_minimo ?? 0),
            localizacao: i.localizacao as string | undefined,
            status: (i.status === 'Inativo' ? 'Inativo' : 'Ativo') as ItemEstoque['status'],
            createdAt: String(i.created_at ?? new Date().toISOString()),
            updatedAt: String(i.updated_at ?? new Date().toISOString()),
          }) as ItemEstoque,
      );
    },
  });

  const itens = apiEnabled ? apiItens : localItens;

  const [localMovimentacoes, setLocalMovimentacoes] = useState<Movimentacao[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_MOVIMENTACOES);
    return stored ? JSON.parse(stored) : [];
  });

  const { data: apiMovimentacoes = [] } = useQuery({
    queryKey: ['estoque-movimentacoes', unidadeApiId],
    enabled: apiEnabled,
    queryFn: async () => {
      const { items } = await listResource<Record<string, unknown>>('/estoque/movimentacoes', {
        page_size: 500,
      });
      return items.map((row) => movimentacaoFromApi(row));
    },
  });

  const movimentacoes = apiEnabled ? apiMovimentacoes : localMovimentacoes;

  const [inventarios, setInventarios] = useState<Inventario[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_INVENTARIOS);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    if (!apiEnabled) {
      localStorage.setItem(STORAGE_KEY_ITENS, JSON.stringify(localItens));
    }
  }, [localItens, apiEnabled]);

  useEffect(() => {
    if (!apiEnabled) {
      localStorage.setItem(STORAGE_KEY_MOVIMENTACOES, JSON.stringify(localMovimentacoes));
    }
  }, [localMovimentacoes, apiEnabled]);

  useEffect(() => {
    if (!apiEnabled) {
      localStorage.setItem(STORAGE_KEY_INVENTARIOS, JSON.stringify(inventarios));
    }
  }, [inventarios, apiEnabled]);

  const invalidateEstoqueQueries = () => {
    void queryClient.invalidateQueries({ queryKey: ['estoque-itens'] });
    void queryClient.invalidateQueries({ queryKey: ['estoque-movimentacoes'] });
  };

  // Gerenciamento de Itens
  const addItem = async (itemData: Omit<ItemEstoque, 'id' | 'createdAt' | 'updatedAt' | 'estoque_atual'>) => {
    if (apiEnabled) {
      const id = await createResource('/estoque/itens', { ...itemData, unidade_id: unidadeApiId, estoque_atual: 0 });
      void queryClient.invalidateQueries({ queryKey: ['estoque-itens'] });
      return { ...itemData, id, estoque_atual: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    }
    const newItem: ItemEstoque = {
      ...itemData,
      id: Date.now().toString(),
      estoque_atual: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setLocalItens((prev) => [...prev, newItem]);
    return newItem;
  };

  const updateItem = async (id: string, itemData: Partial<Omit<ItemEstoque, 'id' | 'createdAt' | 'estoque_atual'>>) => {
    if (apiEnabled) {
      const cur = itens.find((i) => i.id === id);
      if (cur) {
        await updateResource('/estoque/itens', id, { ...cur, ...itemData });
        void queryClient.invalidateQueries({ queryKey: ['estoque-itens'] });
      }
      return;
    }
    setLocalItens((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...itemData, updatedAt: new Date().toISOString() } : item,
      ),
    );
  };

  const deleteItem = async (id: string) => {
    if (apiEnabled) {
      await deleteResource('/estoque/itens', id);
      invalidateEstoqueQueries();
      return;
    }
    setLocalItens((prev) => prev.filter((item) => item.id !== id));
    setLocalMovimentacoes((prev) => prev.filter((mov) => mov.item_id !== id));
  };

  const getItemById = (id: string) => {
    return itens.find((item) => item.id === id);
  };

  const computeSaldoLocal = (
    tipo: Movimentacao['tipo'],
    saldoAnterior: number,
    quantidade: number,
    saldoAlvo?: number,
  ): number => {
    if (tipo === 'Entrada') {
      return saldoAnterior + quantidade;
    }
    if (tipo === 'Saída') {
      return saldoAnterior - quantidade;
    }
    if (saldoAlvo !== undefined) {
      return saldoAlvo;
    }
    return saldoAnterior + quantidade;
  };

  // Gerenciamento de Movimentações
  const addMovimentacao = async (movData: MovimentacaoInput): Promise<Movimentacao | string | null> => {
    const item = getItemById(movData.item_id);
    if (!item) return null;

    const saldo_anterior = item.estoque_atual;

    if (movData.tipo === 'Saída' && movData.quantidade > saldo_anterior) {
      throw new Error(SALDO_INSUFICIENTE_MSG);
    }

    if (apiEnabled) {
      const id = await createResource('/estoque/movimentacoes', movimentacaoToApiPayload(movData));
      invalidateEstoqueQueries();
      return id;
    }

    const saldo_atual = computeSaldoLocal(
      movData.tipo,
      saldo_anterior,
      movData.quantidade,
      movData.saldo_alvo,
    );

    const newMovimentacao: Movimentacao = {
      ...movData,
      id: Date.now().toString(),
      saldo_anterior,
      saldo_atual,
      createdAt: new Date().toISOString(),
    };

    setLocalMovimentacoes((prev) => [...prev, newMovimentacao]);
    setLocalItens((prev) =>
      prev.map((i) =>
        i.id === movData.item_id
          ? { ...i, estoque_atual: saldo_atual, updatedAt: new Date().toISOString() }
          : i,
      ),
    );

    return newMovimentacao;
  };

  const getMovimentacoesByItem = (itemId: string) => {
    return movimentacoes.filter((mov) => mov.item_id === itemId);
  };

  // Gerenciamento de Inventários
  const addInventario = (invData: Omit<Inventario, 'id' | 'createdAt'>) => {
    const newInventario: Inventario = {
      ...invData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setInventarios((prev) => [...prev, newInventario]);
    return newInventario;
  };

  // Itens com estoque baixo
  const getItensComEstoqueBaixo = () => {
    return itens.filter(
      (item) => item.status === 'Ativo' && item.estoque_atual <= item.estoque_minimo
    );
  };

  return {
    itens,
    movimentacoes,
    inventarios,
    addItem,
    updateItem,
    deleteItem,
    getItemById,
    addMovimentacao,
    getMovimentacoesByItem,
    addInventario,
    getItensComEstoqueBaixo,
  };
};
