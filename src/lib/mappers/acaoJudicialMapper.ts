import type { AcaoJudicial } from '@/hooks/useAcoesJudiciais';

export type AcaoJudicialApiRow = Record<string, unknown>;

export type AcaoJudicialApiPayload = {
  numero_processo: string;
  plano_saude_id: string;
  plano_saude_nome: string;
  valor_acao: number;
  data_entrada: string;
  data_sentenca?: string;
  status: string;
  descricao: string;
  observacoes?: string;
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

export function mapAcaoJudicialFromApi(a: Record<string, unknown>): AcaoJudicial {
  const row = a as {
    id?: string;
    paciente_id?: string;
    paciente_nome?: string;
    plano_id?: string;
    plano_saude_id?: string;
    plano_saude_nome?: string;
    numero_processo?: string;
    tipo?: string;
    status?: string;
    valor_acao?: number;
    descricao?: string;
    data_abertura?: string;
    data_entrada?: string;
    observacoes?: string;
    created_at?: string;
    updated_at?: string;
  };
  return {
    id: String(a.id ?? ''),
    paciente_id: String(row.paciente_id ?? ''),
    paciente_nome: row.paciente_nome,
    plano_id: row.plano_id,
    plano_saude_id: row.plano_saude_id ?? row.plano_id,
    plano_saude_nome: row.plano_saude_nome,
    numero_processo: row.numero_processo ?? '',
    tipo: String(row.tipo ?? ''),
    status: String(row.status ?? 'Em Andamento'),
    valor_acao: Number(row.valor_acao ?? 0),
    descricao: row.descricao ?? row.observacoes ?? '',
    data_abertura: row.data_abertura,
    data_entrada: row.data_entrada ?? row.data_abertura,
    observacoes: row.observacoes,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

export function mapAcaoJudicialToApiBody(
  a: Pick<
    AcaoJudicial,
    | 'numero_processo'
    | 'plano_saude_id'
    | 'plano_saude_nome'
    | 'valor_acao'
    | 'data_entrada'
    | 'status'
    | 'descricao'
    | 'observacoes'
  > & { data_sentenca?: string },
): AcaoJudicialApiPayload {
  const payload: AcaoJudicialApiPayload = {
    numero_processo: String(a.numero_processo ?? ''),
    plano_saude_id: String(a.plano_saude_id ?? ''),
    plano_saude_nome: String(a.plano_saude_nome ?? ''),
    valor_acao: Number(a.valor_acao ?? 0),
    data_entrada: toDateOnly(a.data_entrada),
    status: a.status || 'Em Andamento',
    descricao: String(a.descricao ?? ''),
  };
  if (a.data_sentenca?.trim()) {
    payload.data_sentenca = toDateOnly(a.data_sentenca);
  }
  if (a.observacoes?.trim()) {
    payload.observacoes = a.observacoes.trim();
  }
  return payload;
}
