import { z } from 'zod';
import { formatCPF, formatCNPJ, validateCPF, validateCNPJ } from '@/lib/utils/validators';

const cpfField = z
  .string()
  .min(1, 'CPF é obrigatório')
  .refine(validateCPF, 'CPF inválido')
  .transform(formatCPF);

const cnpjField = z
  .string()
  .min(1, 'CNPJ é obrigatório')
  .refine(validateCNPJ, 'CNPJ inválido')
  .transform(formatCNPJ);

// Schema para funcionário CLT
export const funcionarioCLTSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100),
  cpf: cpfField,
  cargo: z.string().min(2, 'Cargo deve ter no mínimo 2 caracteres').max(100),
  salario_base: z.number().min(0.01, 'Salário deve ser maior que zero'),
  data_admissao: z.string(),
  ativo: z.boolean().default(true),
  dependentes: z.number().int().min(0).default(0),
  vale_transporte: z.boolean().default(true),
  vale_alimentacao: z.number().min(0).default(0),
});

export type FuncionarioCLT = z.infer<typeof funcionarioCLTSchema>;

// Schema para funcionário PJ
export const funcionarioPJSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100),
  cnpj: cnpjField,
  razao_social: z.string().min(3, 'Razão social deve ter no mínimo 3 caracteres').max(150),
  servico: z.string().min(2, 'Serviço deve ter no mínimo 2 caracteres').max(100),
  valor_hora: z.number().min(0.01, 'Valor/hora deve ser maior que zero'),
  data_inicio: z.string(),
  ativo: z.boolean().default(true),
});

export type FuncionarioPJ = z.infer<typeof funcionarioPJSchema>;

// Schema para folha de pagamento CLT
export const folhaCLTSchema = z.object({
  id: z.string().optional(),
  funcionario_id: z.string(),
  mes_referencia: z.string().regex(/^\d{4}-\d{2}$/, 'Formato inválido (YYYY-MM)'),
  salario_base: z.number().min(0),
  horas_extras: z.number().min(0).default(0),
  adicional_noturno: z.number().min(0).default(0),
  outros_proventos: z.number().min(0).default(0),
  vale_transporte: z.number().min(0).default(0),
  vale_alimentacao: z.number().min(0).default(0),
  inss: z.number().min(0).default(0),
  fgts: z.number().min(0).default(0),
  irrf: z.number().min(0).default(0),
  outros_descontos: z.number().min(0).default(0),
  salario_liquido: z.number().min(0).default(0),
  data_pagamento: z.string().optional(),
  status: z.enum(['pendente', 'pago', 'cancelado']).default('pendente'),
});

export type FolhaCLT = z.infer<typeof folhaCLTSchema>;

// Schema para folha de pagamento PJ
export const folhaPJSchema = z.object({
  id: z.string().optional(),
  funcionario_id: z.string(),
  mes_referencia: z.string().regex(/^\d{4}-\d{2}$/, 'Formato inválido (YYYY-MM)'),
  horas_trabalhadas: z.number().min(0, 'Horas trabalhadas deve ser maior ou igual a zero'),
  valor_hora: z.number().min(0.01, 'Valor/hora deve ser maior que zero'),
  valor_total: z.number().min(0).default(0),
  retencao_iss: z.number().min(0).default(0),
  retencao_ir: z.number().min(0).default(0),
  valor_liquido: z.number().min(0).default(0),
  data_pagamento: z.string().optional(),
  status: z.enum(['pendente', 'pago', 'cancelado']).default('pendente'),
  descricao_servicos: z.string().max(500).optional(),
});

export type FolhaPJ = z.infer<typeof folhaPJSchema>;
