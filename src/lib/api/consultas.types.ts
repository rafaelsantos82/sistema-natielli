import type { ListMeta } from '@/lib/api/types';

export interface ConsultaDTO {
  id: string;
  paciente_id: string;
  paciente_nome: string;
  profissional_id: string;
  profissional_nome: string;
  unidade_id?: string;
  sala_id?: string;
  sala_nome?: string;
  data_hora: string;
  duracao: number;
  motivo: string;
  observacoes?: string;
  observacoes_anamnese?: string;
  status: 'agendada' | 'confirmada' | 'cancelada' | 'concluida';
  notificacao_enviada?: boolean;
  confirmacao_presenca?: boolean;
  status_atendimento?: string;
  prontuario_evolucao_id?: string;
  aprovado_por?: string;
  aprovado_em?: string;
  rejeitado_por?: string;
  rejeitado_em?: string;
  motivo_rejeicao?: string;
  created_at: string;
  updated_at: string;
}

export interface ListConsultasParams {
  unidade_id?: string;
  profissional_id?: string;
  data_inicio?: string;
  data_fim?: string;
  status?: string;
  page?: number;
  page_size?: number;
}

export type { ListMeta };
