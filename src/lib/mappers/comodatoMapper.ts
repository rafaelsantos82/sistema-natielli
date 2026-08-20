import type { DevolucaoFormData } from '@/lib/validations/comodato.schema';

export type ComodatoApiRow = {
  id?: string;
  item_id?: string | null;
  item_nome?: string;
  descricao?: string | null;
  paciente_id?: string;
  paciente_nome?: string;
  profissional_id?: string;
  data_emprestimo?: string;
  data_devolucao_prevista?: string;
  data_devolucao_real?: string | null;
  status?: string;
  condicao_entrega?: string;
  condicao_devolucao?: string | null;
  observacoes?: string | null;
  responsavel_id?: string;
  responsavel_nome?: string;
  numero_serie?: string | null;
  quantidade?: number;
  created_at?: string;
  updated_at?: string;
};

export type ComodatoMapped = {
  id: string;
  item_id: string;
  item_nome: string;
  descricao?: string;
  paciente_id: string;
  paciente_nome: string;
  profissional_id?: string;
  data_emprestimo: string;
  data_devolucao_prevista: string;
  data_devolucao_real?: string;
  status: string;
  condicao_entrega: string;
  condicao_devolucao?: string;
  observacoes?: string;
  responsavel_id: string;
  responsavel_nome: string;
  numero_serie?: string;
  quantidade: number;
  createdAt: string;
  updatedAt: string;
};

export type ComodatoApiPayload = {
  item_id?: string;
  item_nome: string;
  descricao?: string;
  paciente_id: string;
  paciente_nome: string;
  data_emprestimo: string;
  data_devolucao_prevista: string;
  data_devolucao_real?: string;
  status: string;
  condicao_entrega: string;
  condicao_devolucao?: string;
  observacoes?: string;
  responsavel_id: string;
  responsavel_nome: string;
  numero_serie?: string;
  quantidade: number;
};

function toDateOnly(value?: string): string {
  if (!value?.trim()) return '';
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return trimmed;
}

export function mapComodatoFromApi(c: ComodatoApiRow): ComodatoMapped {
  return {
    id: String(c.id ?? ''),
    item_id: c.item_id ? String(c.item_id) : '',
    item_nome: String(c.item_nome ?? ''),
    descricao: c.descricao ? String(c.descricao) : undefined,
    paciente_id: String(c.paciente_id ?? ''),
    paciente_nome: String(c.paciente_nome ?? ''),
    profissional_id: c.profissional_id ? String(c.profissional_id) : undefined,
    data_emprestimo: toDateOnly(c.data_emprestimo),
    data_devolucao_prevista: toDateOnly(c.data_devolucao_prevista),
    data_devolucao_real: c.data_devolucao_real ? toDateOnly(c.data_devolucao_real) : undefined,
    status: String(c.status ?? 'Emprestado'),
    condicao_entrega: String(c.condicao_entrega ?? ''),
    condicao_devolucao: c.condicao_devolucao ? String(c.condicao_devolucao) : undefined,
    observacoes: c.observacoes ? String(c.observacoes) : undefined,
    responsavel_id: String(c.responsavel_id ?? ''),
    responsavel_nome: String(c.responsavel_nome ?? ''),
    numero_serie: c.numero_serie ? String(c.numero_serie) : undefined,
    quantidade: Number(c.quantidade ?? 1) || 1,
    createdAt: String(c.created_at ?? new Date().toISOString()),
    updatedAt: String(c.updated_at ?? new Date().toISOString()),
  };
}

export function mapComodatoToApiBody(
  c: Pick<
    ComodatoMapped,
    | 'item_id'
    | 'item_nome'
    | 'descricao'
    | 'paciente_id'
    | 'paciente_nome'
    | 'data_emprestimo'
    | 'data_devolucao_prevista'
    | 'data_devolucao_real'
    | 'status'
    | 'condicao_entrega'
    | 'condicao_devolucao'
    | 'observacoes'
    | 'responsavel_id'
    | 'responsavel_nome'
    | 'numero_serie'
    | 'quantidade'
  >,
): ComodatoApiPayload {
  const payload: ComodatoApiPayload = {
    item_nome: c.item_nome,
    paciente_id: c.paciente_id,
    paciente_nome: c.paciente_nome,
    data_emprestimo: toDateOnly(c.data_emprestimo),
    data_devolucao_prevista: toDateOnly(c.data_devolucao_prevista),
    status: c.status || 'Emprestado',
    condicao_entrega: c.condicao_entrega || 'Não informado',
    responsavel_id: c.responsavel_id,
    responsavel_nome: c.responsavel_nome,
    quantidade: Number(c.quantidade) >= 1 ? Number(c.quantidade) : 1,
  };

  if (c.item_id?.trim()) {
    payload.item_id = c.item_id.trim();
  }
  if (c.descricao?.trim()) {
    payload.descricao = c.descricao.trim();
  }
  if (c.data_devolucao_real?.trim()) {
    payload.data_devolucao_real = toDateOnly(c.data_devolucao_real);
  }
  if (c.condicao_devolucao?.trim()) {
    payload.condicao_devolucao = c.condicao_devolucao.trim();
  }
  if (c.observacoes?.trim()) {
    payload.observacoes = c.observacoes.trim();
  }
  if (c.numero_serie?.trim()) {
    payload.numero_serie = c.numero_serie.trim();
  }

  return payload;
}

export function mapComodatoDevolucaoPatch(
  current: ComodatoMapped,
  data: DevolucaoFormData,
): Partial<ComodatoMapped> {
  const observacoes = data.observacoes?.trim()
    ? data.observacoes.trim()
    : current.observacoes;

  return {
    status: 'Devolvido',
    data_devolucao_real: toDateOnly(data.data_devolucao_real),
    condicao_devolucao: data.condicao_devolucao,
    observacoes,
  };
}
