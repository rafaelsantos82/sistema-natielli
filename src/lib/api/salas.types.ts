export interface SalaDTO {
  id: string;
  nome_sala: string;
  codigo?: string;
  unidade_id: string;
  capacidade?: number;
  status: string;
  especialidades?: string[];
  recursos?: string[];
  created_at: string;
  updated_at: string;
}

export interface ReservaDTO {
  id: string;
  sala_id: string;
  data_hora_inicio: string;
  duracao: number;
  profissional_id: string;
  profissional_nome: string;
  consulta_id?: string;
  tipo_atendimento?: string;
  observacoes?: string;
  rrule?: string;
  created_at: string;
}

export interface ListSalasParams {
  unidade_id?: string;
  q?: string;
  page?: number;
  page_size?: number;
}
