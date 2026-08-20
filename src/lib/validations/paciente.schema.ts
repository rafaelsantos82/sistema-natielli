import { z } from 'zod';

const validateCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i), 10) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i), 10) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(10), 10)) return false;

  return true;
};

const optionalCpf = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine((val) => !val || validateCPF(val), 'CPF inválido');

export const vacinaSchema = z.object({
  data: z.string(),
  tipo: z.string(),
});

export const documentoAnexoSchema = z.object({
  tipo: z.string(),
  arquivo: z.string(),
  descricao: z.string().optional(),
});

export const pacienteSchema = z
  .object({
    nome_completo: z.string().min(3, 'Nome completo é obrigatório'),
    nome_social: z.string().optional(),
    data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
    sexo_biologico: z.enum(['masculino', 'feminino', 'intersexo'], {
      required_error: 'Sexo biológico é obrigatório',
    }),
    cpf: optionalCpf,
    rg_numero: z.string().optional(),
    rg_orgao: z.string().optional(),
    foto: z.string().optional(),

    tel_principal: z.string().min(1, 'Telefone principal é obrigatório'),
    tel_secundario: z.string().optional(),
    email: z.string().email('E-mail inválido').optional().or(z.literal('')),
    endereco: z.string().optional(),
    numero: z.string().optional(),
    complemento: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    uf: z.string().min(2, 'UF é obrigatória').max(2),
    cep: z.string().min(1, 'CEP é obrigatório'),
    contato_emergencia_nome: z.string().optional(),
    contato_emergencia_tel: z.string().optional(),

    responsavel_nome: z.string().min(1, 'Nome do responsável é obrigatório'),
    responsavel_cpf: optionalCpf,
    responsavel_parentesco: z.string().optional(),
    responsavel_tel: z.string().optional(),
    responsavel_email: z.string().email('E-mail inválido').optional().or(z.literal('')),
    pessoas_autorizadas_busca: z.array(z.string()).optional().default([]),

    escola: z.string().optional(),
    serie_ano: z.string().optional(),
    necessidades_especiais: z.string().optional(),
    pediatra_referencia: z.string().optional(),

    altura: z.number().positive('Altura deve ser positiva').optional(),
    peso: z.number().positive('Peso deve ser positivo').optional(),
    tipo_sanguineo: z
      .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Desconhecido'])
      .optional(),
    alergias: z.string().optional(),
    doencas_cronicas: z.string().optional(),
    medicacoes_continuo: z.string().optional(),
    cirurgias_previas: z.string().optional(),
    historico_familiar: z.string().optional(),
    vacinas: z.array(vacinaSchema).optional(),
    observacoes: z.string().optional(),

    atividade_fisica_frequencia: z.string().optional(),
    atividade_fisica_tipo: z.string().optional(),
    alimentacao: z.string().optional(),
    sono_horas: z.number().min(0).max(24).optional(),

    status: z.enum(['ativo', 'inativo', 'falecido']).default('ativo'),
    consentimento_lgpd: z.boolean().refine((val) => val === true, {
      message: 'É necessário consentimento LGPD',
    }),
    autorizacao_uso_imagem: z.boolean().optional().default(false),
    assinatura_digital: z.string().optional(),
    documentos_anexos: z.array(documentoAnexoSchema).optional(),
  })
  .superRefine((data, ctx) => {
    const cpf = (data.cpf ?? '').replace(/\D/g, '');
    const respCpf = (data.responsavel_cpf ?? '').replace(/\D/g, '');
    if (!cpf && !respCpf) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe CPF do paciente ou do responsável legal',
        path: ['responsavel_cpf'],
      });
    }
    if (data.data_nascimento) {
      const birth = new Date(data.data_nascimento);
      const min = new Date();
      min.setFullYear(min.getFullYear() - 25);
      if (birth < min) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Paciente deve ter no máximo 25 anos',
          path: ['data_nascimento'],
        });
      }
      if (birth > new Date()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Data de nascimento não pode ser futura',
          path: ['data_nascimento'],
        });
      }
    }
  });

export type PacienteFormData = z.infer<typeof pacienteSchema>;
