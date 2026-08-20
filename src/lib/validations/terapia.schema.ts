import { z } from 'zod';

export const itemRegimeSchema = z.object({
  medicamento: z.string().min(1, 'Medicamento é obrigatório'),
  via: z.enum(['VO', 'IV', 'IM', 'SC', 'SL', 'Topica', 'Inalatoria', 'Retal', 'Ocular', 'Nasal'], {
    required_error: 'Via é obrigatória',
  }),
  dose: z.number().positive('Dose deve ser positiva'),
  dose_unidade: z.enum(['mg', 'g', 'mcg', 'UI', 'mL']),
  frequencia: z.string().min(1, 'Frequência é obrigatória'),
  horario: z.string().optional(),
  duracao: z.number().nonnegative('Duração não pode ser negativa').optional(),
  duracao_unidade: z.enum(['dias', 'semanas', 'meses']).optional(),
  orientacoes: z.string().optional(),
});

export const terapiaSchema = z.object({
  nome_terapia: z.string().min(3, 'Nome da terapia é obrigatório'),
  objetivo_terapeutico: z.string().min(10, 'Objetivo terapêutico é obrigatório'),
  diretriz_protocolar: z.enum(['Protocolo Clinico', 'Diretriz interna', 'Off-label justificado'], {
    required_error: 'Diretriz protocolar é obrigatória',
  }),
  codigos_referencia: z.array(z.string()).optional(),
  itens_regime: z.array(itemRegimeSchema).min(1, 'É necessário pelo menos um item no regime'),
  regra_ajuste: z.string().optional(),
  indicacoes: z.string().optional(),
  contraindicacoes: z.string().optional(),
  interacoes_relevantes: z.string().optional(),
  monitorizacao: z.string().optional(),
  eventos_adversos: z.string().optional(),
  necessidade_consentimento: z.boolean().default(false),
  texto_consentimento: z.string().optional(),
  status: z.enum(['Ativo', 'Inativo']).default('Ativo'),
  versao: z.number().default(1),
  anexos: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  observacoes: z.string().optional(),
}).refine(
  (data) => {
    if (data.necessidade_consentimento) {
      return !!data.texto_consentimento && data.texto_consentimento.length > 0;
    }
    return true;
  },
  {
    message: 'Texto de consentimento é obrigatório quando necessidade_consentimento está marcado',
    path: ['texto_consentimento'],
  }
);

export type TerapiaFormData = z.infer<typeof terapiaSchema>;
export type ItemRegimeFormData = z.infer<typeof itemRegimeSchema>;
