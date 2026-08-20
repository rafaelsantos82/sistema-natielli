import { z } from 'zod';

export const planoSaudeSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(200, 'Nome muito longo'),
  cnpj: z.string().min(14, 'CNPJ inválido').max(18, 'CNPJ inválido'),
  registro_ans: z.string().min(1, 'Registro ANS é obrigatório').max(50, 'Registro ANS muito longo'),
  telefone: z.string().min(10, 'Telefone inválido').max(20, 'Telefone inválido'),
  email: z.string().email('Email inválido').max(200, 'Email muito longo'),
  endereco: z.string().min(1, 'Endereço é obrigatório').max(500, 'Endereço muito longo'),
  ativo: z.boolean().default(true),
  observacoes: z.string().max(1000, 'Observações muito longas').optional(),
});

export type PlanoSaudeFormData = z.infer<typeof planoSaudeSchema>;

export const acaoJudicialSchema = z.object({
  numero_processo: z.string().min(1, 'Número do processo é obrigatório').max(100, 'Número muito longo'),
  plano_saude_id: z.string().min(1, 'Plano de saúde é obrigatório'),
  plano_saude_nome: z.string().min(1, 'Nome do plano é obrigatório'),
  valor_acao: z.coerce.number().positive('Valor deve ser positivo'),
  data_entrada: z.string().min(1, 'Data de entrada é obrigatória'),
  data_sentenca: z.string().optional(),
  status: z.enum(['Em Andamento', 'Procedente', 'Improcedente', 'Acordo']),
  descricao: z.string().min(1, 'Descrição é obrigatória').max(1000, 'Descrição muito longa'),
  observacoes: z.string().max(1000, 'Observações muito longas').optional(),
});

export type AcaoJudicialFormData = z.infer<typeof acaoJudicialSchema>;

export const notaFiscalSchema = z.object({
  numero_nota: z.string().min(1, 'Número da nota é obrigatório').max(100, 'Número muito longo'),
  plano_saude_id: z.string().min(1, 'Plano de saúde é obrigatório'),
  plano_saude_nome: z.string().min(1, 'Nome do plano é obrigatório'),
  paciente_nome: z.string().min(1, 'Nome do paciente é obrigatório').max(200, 'Nome muito longo'),
  data_emissao: z.string().min(1, 'Data de emissão é obrigatória'),
  data_vencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  valor_servico: z.coerce.number().positive('Valor deve ser positivo'),
  valor_pago: z.coerce.number().optional(),
  status: z.enum(['Pendente', 'Pago Parcial', 'Pago', 'Em Disputa']).default('Pendente'),
  acao_judicial_id: z.string().optional(),
  observacoes: z.string().max(1000, 'Observações muito longas').optional(),
});

export type NotaFiscalFormData = z.infer<typeof notaFiscalSchema>;
