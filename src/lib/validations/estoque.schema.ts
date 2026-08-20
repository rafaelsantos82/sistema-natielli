import { z } from 'zod';

export const itemEstoqueSchema = z.object({
  codigo: z.string().min(1, 'Código é obrigatório').max(50, 'Código muito longo'),
  nome: z.string().min(1, 'Nome é obrigatório').max(200, 'Nome muito longo'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  unidade_medida: z.string().min(1, 'Unidade de medida é obrigatória'),
  estoque_minimo: z.coerce.number().min(0, 'Estoque mínimo não pode ser negativo'),
  localizacao: z.string().max(100, 'Localização muito longa').optional(),
  status: z.enum(['Ativo', 'Inativo'], {
    required_error: 'Status é obrigatório',
  }),
});

export type ItemEstoqueFormData = z.infer<typeof itemEstoqueSchema>;

export const movimentacaoSchema = z.object({
  item_id: z.string().min(1, 'Item é obrigatório'),
  item_nome: z.string().min(1, 'Nome do item é obrigatório'),
  tipo: z.enum(['Entrada', 'Saída', 'Ajuste'], {
    required_error: 'Tipo é obrigatório',
  }),
  quantidade: z.coerce.number().positive('Quantidade deve ser positiva'),
  data_hora: z.string().min(1, 'Data/hora é obrigatória'),
  documento: z.string().max(50, 'Documento muito longo').optional(),
  motivo: z.string().min(1, 'Motivo é obrigatório').max(500, 'Motivo muito longo'),
  responsavel_id: z.string().min(1, 'Responsável é obrigatório'),
  responsavel_nome: z.string().min(1, 'Nome do responsável é obrigatório'),
});

export type MovimentacaoFormData = z.infer<typeof movimentacaoSchema>;
