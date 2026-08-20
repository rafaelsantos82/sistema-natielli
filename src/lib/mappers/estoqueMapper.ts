import type { MovimentacaoFormData } from '@/lib/validations/estoque.schema';

export type MovimentacaoTipo = 'Entrada' | 'Saída' | 'Ajuste';

export type MovimentacaoApiPayload = {
  item_id: string;
  item_nome: string;
  tipo: MovimentacaoTipo;
  quantidade: number;
  data_hora: string;
  documento?: string;
  motivo: string;
  responsavel_id: string;
  responsavel_nome: string;
  saldo_atual?: number;
};

export type MovimentacaoInput = {
  item_id: string;
  item_nome: string;
  tipo: MovimentacaoTipo;
  quantidade: number;
  data_hora: string;
  documento?: string;
  motivo: string;
  responsavel_id: string;
  responsavel_nome: string;
  /** Saldo final desejado — obrigatório para tipo Ajuste na API */
  saldo_alvo?: number;
};

export type MovimentacaoMapped = MovimentacaoInput & {
  id: string;
  saldo_anterior: number;
  saldo_atual: number;
  createdAt: string;
};

export const SALDO_INSUFICIENTE_MSG = 'Quantidade de saída excede o saldo disponível';

export function movimentacaoToApiPayload(data: MovimentacaoInput): MovimentacaoApiPayload {
  const payload: MovimentacaoApiPayload = {
    item_id: data.item_id,
    item_nome: data.item_nome,
    tipo: data.tipo,
    quantidade: data.quantidade,
    data_hora: data.data_hora,
    motivo: data.motivo,
    responsavel_id: data.responsavel_id,
    responsavel_nome: data.responsavel_nome,
  };

  if (data.documento?.trim()) {
    payload.documento = data.documento.trim();
  }

  if (data.tipo === 'Ajuste' && data.saldo_alvo !== undefined) {
    payload.saldo_atual = data.saldo_alvo;
  }

  return payload;
}

export function movimentacaoFromApi(raw: Record<string, unknown>): MovimentacaoMapped {
  const tipo = raw.tipo as MovimentacaoTipo;
  return {
    id: String(raw.id),
    item_id: String(raw.item_id),
    item_nome: String(raw.item_nome ?? ''),
    tipo: tipo === 'Saída' || tipo === 'Ajuste' ? tipo : 'Entrada',
    quantidade: Number(raw.quantidade ?? 0),
    data_hora: String(raw.data_hora ?? new Date().toISOString()),
    documento: raw.documento ? String(raw.documento) : undefined,
    motivo: String(raw.motivo ?? ''),
    responsavel_id: String(raw.responsavel_id),
    responsavel_nome: String(raw.responsavel_nome ?? ''),
    saldo_anterior: Number(raw.saldo_anterior ?? 0),
    saldo_atual: Number(raw.saldo_atual ?? 0),
    createdAt: String(raw.created_at ?? new Date().toISOString()),
  };
}

export function movimentacaoFormToInput(data: MovimentacaoFormData): MovimentacaoInput {
  return {
    item_id: data.item_id,
    item_nome: data.item_nome,
    tipo: data.tipo,
    quantidade: data.quantidade,
    data_hora: data.data_hora,
    documento: data.documento,
    motivo: data.motivo,
    responsavel_id: data.responsavel_id,
    responsavel_nome: data.responsavel_nome,
  };
}
