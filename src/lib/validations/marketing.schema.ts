import { z } from 'zod';
import { PROFISSIONAL_DOC_MAX_BYTES } from '@/lib/uploads/profissionalDocPolicy';

const fileField = z
  .instanceof(File, { message: 'Arquivo é obrigatório' })
  .refine((f) => f.size > 0, 'Arquivo vazio')
  .refine((f) => f.size <= PROFISSIONAL_DOC_MAX_BYTES, 'Arquivo excede o tamanho máximo');

export const manualUploadFormSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  versao: z.string().min(1, 'Versão é obrigatória').max(20, 'Versão muito longa'),
  publico_alvo: z.enum(['Interno', 'Externo', 'Ambos'], {
    required_error: 'Público-alvo é obrigatório',
  }),
  file: fileField,
  tags: z.array(z.string()).default([]),
  status: z.enum(['Rascunho', 'Publicado', 'Arquivado']).default('Rascunho'),
  observacoes: z.string().max(1000, 'Observações muito longas').optional(),
});

export type ManualUploadFormData = z.infer<typeof manualUploadFormSchema>;

export const materialUploadFormSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  tipo: z.string().min(1, 'Tipo é obrigatório').max(100, 'Tipo muito longo'),
  file: fileField,
  tags: z.array(z.string()).default([]),
  campanha: z.string().max(100, 'Nome da campanha muito longo').optional(),
  unidade_id: z.string().uuid().optional(),
  status: z.enum(['Rascunho', 'Aprovado', 'Publicado', 'Arquivado']).default('Rascunho'),
  observacoes: z.string().max(1000, 'Observações muito longas').optional(),
});

export type MaterialUploadFormData = z.infer<typeof materialUploadFormSchema>;

/** @deprecated JSON API — preferir upload multipart */
export const manualSchema = manualUploadFormSchema;
export type ManualFormData = ManualUploadFormData;

/** @deprecated JSON API — preferir upload multipart */
export const materialSchema = materialUploadFormSchema;
export type MaterialFormData = MaterialUploadFormData;
