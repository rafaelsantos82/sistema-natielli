import type { Categoria, CentroCusto, Lancamento } from '@/hooks/useFinanceiro';
import { getUnidadeApiId, getUnidadeSlugFromApiId } from '@/lib/unidades/apiIds';

type CategoriaDTO = {
  id: string;
  nome: string;
  tipo: string;
  cor?: string;
  descricao?: string;
  created_at: string;
  updated_at: string;
};

type LancamentoDTO = {
  id: string;
  tipo: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  categoria_id: string;
  categoria_nome: string;
  centro_custo_id?: string;
  centro_custo_nome?: string;
  forma_pagamento?: string;
  documento?: string;
  observacoes?: string;
  status: string;
  recorrente: boolean;
  frequencia_recorrencia?: string;
  parcelas?: number;
  parcela_atual?: number;
  anexo_url?: string;
  conciliado: boolean;
  data_conciliacao?: string;
  unidade_id?: string;
  created_at: string;
  updated_at: string;
};

export function mapCategoria(d: CategoriaDTO): Categoria {
  return {
    id: d.id,
    nome: d.nome,
    tipo: d.tipo as Categoria['tipo'],
    cor: d.cor,
    descricao: d.descricao,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  };
}

export function mapCentro(d: {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}): CentroCusto {
  return {
    id: d.id,
    codigo: d.codigo,
    nome: d.nome,
    descricao: d.descricao,
    ativo: d.ativo,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  };
}

export function mapLancamento(d: LancamentoDTO): Lancamento {
  return {
    id: d.id,
    tipo: d.tipo as Lancamento['tipo'],
    descricao: d.descricao,
    valor: d.valor,
    data_vencimento: d.data_vencimento,
    data_pagamento: d.data_pagamento,
    categoria_id: d.categoria_id,
    categoria_nome: d.categoria_nome,
    centro_custo_id: d.centro_custo_id,
    centro_custo_nome: d.centro_custo_nome,
    forma_pagamento: d.forma_pagamento as Lancamento['forma_pagamento'],
    documento: d.documento,
    observacoes: d.observacoes,
    status: d.status as Lancamento['status'],
    recorrente: d.recorrente,
    frequencia_recorrencia: d.frequencia_recorrencia as Lancamento['frequencia_recorrencia'],
    parcelas: d.parcelas,
    parcela_atual: d.parcela_atual,
    anexo_url: d.anexo_url,
    conciliado: d.conciliado,
    data_conciliacao: d.data_conciliacao,
    unidadeId: d.unidade_id
      ? getUnidadeSlugFromApiId(d.unidade_id) ?? d.unidade_id
      : undefined,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  };
}

export function categoriaToPayload(c: Partial<Categoria>): Record<string, unknown> {
  return {
    nome: c.nome,
    tipo: c.tipo,
    cor: c.cor,
    descricao: c.descricao,
  };
}

export function lancamentoToPayload(l: Partial<Lancamento>): Record<string, unknown> {
  return {
    tipo: l.tipo,
    descricao: l.descricao,
    valor: l.valor,
    data_vencimento: l.data_vencimento,
    data_pagamento: l.data_pagamento,
    categoria_id: l.categoria_id,
    categoria_nome: l.categoria_nome,
    centro_custo_id: l.centro_custo_id,
    centro_custo_nome: l.centro_custo_nome,
    forma_pagamento: l.forma_pagamento,
    documento: l.documento,
    observacoes: l.observacoes,
    status: l.status,
    recorrente: l.recorrente ?? false,
    unidade_id: l.unidadeId ? getUnidadeApiId(l.unidadeId) ?? undefined : undefined,
  };
}
