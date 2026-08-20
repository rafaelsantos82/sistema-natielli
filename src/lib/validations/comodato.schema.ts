import { z } from 'zod';

export const comodatoFormSchema = z.object({
  item_id: z.string().optional(),
  item_nome: z.string().min(1, 'Nome do item é obrigatório'),
  descricao: z.string().optional(),
  paciente_id: z.string().min(1, 'Paciente é obrigatório'),
  paciente_nome: z.string().min(1, 'Nome do paciente é obrigatório'),
  data_emprestimo: z.string().min(1, 'Data de empréstimo é obrigatória'),
  data_devolucao_prevista: z.string().min(1, 'Data de devolução prevista é obrigatória'),
  condicao_entrega: z.string().min(1, 'Condição de entrega é obrigatória'),
  observacoes: z.string().optional(),
  responsavel_id: z.string().min(1, 'Responsável é obrigatório'),
  responsavel_nome: z.string().min(1, 'Nome do responsável é obrigatório'),
  numero_serie: z.string().optional(),
  quantidade: z.coerce.number().min(1, 'Quantidade mínima é 1').default(1),
});

export const devolucaoFormSchema = z.object({
  data_devolucao_real: z.string().min(1, 'Data de devolução é obrigatória'),
  condicao_devolucao: z.string().min(1, 'Condição de devolução é obrigatória'),
  observacoes: z.string().optional(),
});

export type ComodatoFormData = z.infer<typeof comodatoFormSchema>;
export type DevolucaoFormData = z.infer<typeof devolucaoFormSchema>;
