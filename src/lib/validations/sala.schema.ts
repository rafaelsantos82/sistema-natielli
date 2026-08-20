import { z } from 'zod';

export const salaSchema = z.object({
  nome_sala: z.string().min(1, 'Nome da sala é obrigatório').max(100, 'Nome muito longo'),
  codigo: z.string().max(20, 'Código muito longo').optional(),
  unidadeId: z.string().min(1, 'Unidade é obrigatória'),
  status: z.enum(['Ativa', 'Inativa'], {
    required_error: 'Status é obrigatório',
  }),
});

export type SalaFormData = z.infer<typeof salaSchema>;

export const reservaSchema = z.object({
  sala_id: z.string().min(1, 'Sala é obrigatória'),
  data_hora_inicio: z.string().min(1, 'Data/hora de início é obrigatória'),
  duracao: z.coerce.number().int().positive('Duração deve ser positiva').min(15, 'Duração mínima de 15 minutos'),
  profissional_id: z.string().min(1, 'Profissional é obrigatório'),
  profissional_nome: z.string().min(1, 'Nome do profissional é obrigatório'),
  consulta_id: z.string().optional(),
  tipo_atendimento: z.string().optional(),
  observacoes: z.string().max(500, 'Observações muito longas').optional(),
  rrule: z.string().optional(),
});

export type ReservaFormData = z.infer<typeof reservaSchema>;
