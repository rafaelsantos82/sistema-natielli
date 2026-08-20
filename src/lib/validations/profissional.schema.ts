import { z } from 'zod';

export const precoTerapiaSchema = z.object({
  nome_terapia: z.string().min(1, 'Terapia é obrigatório'),
  preco_base: z.number().positive('Preço base deve ser positivo'),
  moeda: z.string().default('BRL'),
  tipo_cobranca: z.enum(['Por sessao', 'Pacote', 'Mensal'], {
    required_error: 'Tipo de cobrança é obrigatório',
  }),
  qtd_inclusa: z.number().optional(),
  preco_promocional: z.number().optional(),
  vigencia_inicio: z.string(),
  vigencia_fim: z.string().optional(),
  politica_cancelamento: z.string().optional(),
  observacoes: z.string().optional(),
}).refine(
  (data) => {
    if (data.preco_promocional !== undefined && data.preco_promocional > 0) {
      return data.preco_promocional <= data.preco_base;
    }
    return true;
  },
  {
    message: 'Preço promocional deve ser menor ou igual ao preço base',
    path: ['preco_promocional'],
  }
).refine(
  (data) => {
    if (data.vigencia_fim) {
      return new Date(data.vigencia_fim) >= new Date(data.vigencia_inicio);
    }
    return true;
  },
  {
    message: 'Data fim deve ser posterior ou igual à data início',
    path: ['vigencia_fim'],
  }
);

export const profissionalSchema = z.object({
  // Identificação
  nome_completo: z.string().min(3, 'Nome completo é obrigatório'),
  conselho_classe: z.enum(['CRM', 'CRO', 'CREFITO', 'CRP', 'COREN', 'CRN', 'CREFONO', 'CRBM', 'Outro']).optional(),
  numero_registro: z.string().optional(),
  cpf: z.string().optional(),
  email: z.string().email('E-mail inválido').min(1, 'E-mail é obrigatório'),
  telefone_principal: z.string().min(1, 'Telefone é obrigatório'),
  foto: z.string().optional(),
  status: z.enum(['ativo', 'inativo', 'afastado']).default('ativo'),

  // Especialidades & Modalidades
  especialidades: z.array(z.string()).optional(),
  modalidades_atendimento: z.array(z.enum(['Presencial', 'Tele'])).optional(),
  locais_atendimento: z.array(z.string()).optional(),
  duracao_padrao_sessao_min: z.number().optional(),

  // Agenda
  dias_de_atendimento: z.array(z.enum(['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'])).optional(),
  janelas_horarias: z.array(z.object({
    inicio: z.string(),
    fim: z.string(),
  })).optional(),

  // LGPD & Contratos
  consentimento_tratamento_dados: z.boolean().refine((val) => val === true, {
    message: 'Consentimento de tratamento de dados é obrigatório',
  }),
  anexos_contratuais: z.array(z.string()).optional(),
  observacoes: z.string().optional(),
});

export type ProfissionalFormData = z.infer<typeof profissionalSchema>;
export type PrecoTerapiaFormData = z.infer<typeof precoTerapiaSchema>;
