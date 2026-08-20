import { z } from 'zod';

export const categoriaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  tipo: z.enum(['Receita', 'Despesa'], {
    required_error: 'Tipo é obrigatório',
  }),
  cor: z.string().optional(),
  descricao: z.string().max(500, 'Descrição muito longa').optional(),
});

export type CategoriaFormData = z.infer<typeof categoriaSchema>;

export const centroCustoSchema = z.object({
  codigo: z.string().min(1, 'Código é obrigatório').max(20, 'Código muito longo'),
  nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  descricao: z.string().max(500, 'Descrição muito longa').optional(),
  ativo: z.boolean().default(true),
});

export type CentroCustoFormData = z.infer<typeof centroCustoSchema>;

export const lancamentoSchema = z.object({
  tipo: z.enum(['Receita', 'Despesa'], {
    required_error: 'Tipo é obrigatório',
  }),
  descricao: z.string().min(1, 'Descrição é obrigatória').max(500, 'Descrição muito longa'),
  valor: z.coerce.number().positive('Valor deve ser positivo'),
  data_vencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  data_pagamento: z.string().optional(),
  categoria_id: z.string().min(1, 'Categoria é obrigatória'),
  categoria_nome: z.string().min(1, 'Nome da categoria é obrigatório'),
  centro_custo_id: z.string().optional(),
  centro_custo_nome: z.string().optional(),
  forma_pagamento: z.enum(['Dinheiro', 'PIX', 'Cartão Débito', 'Cartão Crédito', 'Transferência', 'Boleto', 'Outro']).optional(),
  documento: z.string().max(100, 'Documento muito longo').optional(),
  observacoes: z.string().max(1000, 'Observações muito longas').optional(),
  recorrente: z.boolean().default(false),
  frequencia_recorrencia: z.enum(['Mensal', 'Trimestral', 'Semestral', 'Anual']).optional(),
  parcelas: z.coerce.number().min(1, 'Número de parcelas inválido').optional(),
  parcela_atual: z.coerce.number().optional(),
  anexo_url: z.string().optional(),
  conciliado: z.boolean().default(false),
  data_conciliacao: z.string().optional(),
  unidadeId: z.string().optional(),
});

export type LancamentoFormData = z.infer<typeof lancamentoSchema>;
