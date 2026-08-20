import type { ListMeta } from '@/lib/api/types';

export interface ProfissionalDTO {
  id: string;
  nome: string;
  cpf?: string;
  rg?: string;
  data_nascimento?: string;
  email: string;
  telefone?: string;
  celular?: string;
  conselho?: string;
  numero_registro?: string;
  uf_registro?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  modalidades_atendimento?: string[];
  dias_atendimento?: string[];
  horario_inicio?: string;
  horario_fim?: string;
  duracao_consulta?: number;
  consentimento_lgpd?: boolean;
  status: string;
  observacoes?: string;
  unidade_ids?: string[];
  especialidades?: string[];
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface ProfissionalConselhoDTO {
  id: string;
  tipo: string;
  numero: string;
  uf: string;
  validade?: string;
  principal: boolean;
}

export interface ListProfissionaisParams {
  unidade_id?: string;
  q?: string;
  status?: string;
  page?: number;
  page_size?: number;
  include_deleted?: boolean;
}

export type { ListMeta };

export type CreateProfissionalPayload = Record<string, unknown>;
export type UpdateProfissionalPayload = Record<string, unknown>;
