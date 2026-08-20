import { z } from 'zod';

export const contratoSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  tipo: z.enum(['Atendimento', 'Prestação de Serviço', 'Termo de Responsabilidade', 'Outros'], {
    required_error: 'Tipo é obrigatório',
  }),
  paciente_id: z.string().optional(),
  paciente_nome: z.string().optional(),
  profissional_id: z.string().optional(),
  profissional_nome: z.string().optional(),
  conteudo: z.string().optional(),
  status: z.enum(['Rascunho', 'Aguardando Assinatura', 'Assinado', 'Recusado', 'Expirado']),
  criado_por: z.string().min(1, 'Criador é obrigatório'),
});

export type ContratoFormData = z.infer<typeof contratoSchema>;

/** Metadados do contrato (arquivo enviado separadamente via multipart). */
export const contratoFormSchema = contratoSchema.omit({
  criado_por: true,
  status: true,
  conteudo: true,
});
export type ContratoFormValues = z.infer<typeof contratoFormSchema>;

export const signatarioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(200, 'Nome muito longo'),
  email: z.string().email('Email inválido'),
  tipo: z.enum(['Paciente', 'Responsável Legal', 'Profissional', 'Testemunha'], {
    required_error: 'Tipo é obrigatório',
  }),
  cpf: z.string().optional(),
  parentesco: z.string().max(100, 'Parentesco muito longo').optional(),
});

export type SignatarioFormData = z.infer<typeof signatarioSchema>;

export const compartilhamentoSchema = z.object({
  expiracao_horas: z.coerce
    .number()
    .int()
    .positive('Deve ser positivo')
    .min(1, 'Mínimo 1 hora')
    .max(720, 'Máximo 30 dias'),
});

export type CompartilhamentoFormData = z.infer<typeof compartilhamentoSchema>;
