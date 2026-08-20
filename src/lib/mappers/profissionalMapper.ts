import type { ProfissionalDTO } from '@/lib/api/profissionais.types';
import type { Profissional } from '@/hooks/useProfissionais';
import { getUnidadeApiId, getUnidadeSlugFromApiId } from '@/lib/unidades/apiIds';

/** Form/slug (ProfissionalForm) ↔ enum Postgres `dia_semana`. */
const DIA_FORM_TO_API: Record<string, string> = {
  domingo: 'dom',
  segunda: 'seg',
  terca: 'ter',
  quarta: 'qua',
  quinta: 'qui',
  sexta: 'sex',
  sabado: 'sab',
  dom: 'dom',
  seg: 'seg',
  ter: 'ter',
  qua: 'qua',
  qui: 'qui',
  sex: 'sex',
  sab: 'sab',
};

const DIA_API_TO_FORM: Record<string, string> = {
  dom: 'domingo',
  seg: 'segunda',
  ter: 'terca',
  qua: 'quarta',
  qui: 'quinta',
  sex: 'sexta',
  sab: 'sabado',
};

function mapDiasToApi(dias?: string[]): string[] {
  return (dias ?? []).map((d) => DIA_FORM_TO_API[d] ?? d);
}

function mapDiasFromApi(dias?: string[]): string[] {
  return (dias ?? []).map((d) => DIA_API_TO_FORM[d] ?? d);
}

export function dtoToProfissional(d: ProfissionalDTO): Profissional {
  return {
    id: d.id,
    nome: d.nome,
    cpf: d.cpf,
    rg: d.rg,
    dataNascimento: d.data_nascimento,
    email: d.email,
    telefone: d.telefone,
    celular: d.celular,
    conselho: d.conselho as Profissional['conselho'],
    numeroRegistro: d.numero_registro,
    ufRegistro: d.uf_registro,
    cep: d.cep,
    logradouro: d.logradouro,
    numero: d.numero,
    complemento: d.complemento,
    bairro: d.bairro,
    cidade: d.cidade,
    uf: d.uf,
    especialidades: d.especialidades ?? [],
    unidadeIds: d.unidade_ids?.map((id) => getUnidadeSlugFromApiId(id) ?? id),
    diasAtendimento: mapDiasFromApi(d.dias_atendimento),
    horarioInicio: d.horario_inicio,
    horarioFim: d.horario_fim,
    duracaoConsulta: d.duracao_consulta,
    consentimentoLGPD: d.consentimento_lgpd,
    status: d.status as Profissional['status'],
    observacoes: d.observacoes,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    deleted_at: d.deleted_at,
  };
}

/** Dados do ProfissionalForm → modelo do hook. */
export function formToProfissional(
  data: {
    nome: string;
    cpf: string;
    rg?: string;
    dataNascimento: string;
    email: string;
    telefone: string;
    celular: string;
    conselho: Profissional['conselho'];
    numeroRegistro: string;
    ufRegistro: string;
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    especialidades: string[];
    diasAtendimento: string[];
    horarioInicio: string;
    horarioFim: string;
    duracaoConsulta: number;
    consentimentoLGPD: boolean;
    dataConsentimento?: string;
    compartilhamentoDados: boolean;
    finalidadeDados?: string;
    status: Profissional['status'];
    observacoes?: string;
  },
): Omit<Profissional, 'id' | 'createdAt' | 'updatedAt' | 'deleted_at'> {
  return {
    nome: data.nome,
    cpf: data.cpf,
    rg: data.rg,
    dataNascimento: data.dataNascimento,
    email: data.email,
    telefone: data.telefone,
    celular: data.celular,
    conselho: data.conselho,
    numeroRegistro: data.numeroRegistro,
    ufRegistro: data.ufRegistro,
    cep: data.cep,
    logradouro: data.logradouro,
    numero: data.numero,
    complemento: data.complemento,
    bairro: data.bairro,
    cidade: data.cidade,
    uf: data.uf,
    especialidades: data.especialidades,
    diasAtendimento: data.diasAtendimento,
    horarioInicio: data.horarioInicio,
    horarioFim: data.horarioFim,
    duracaoConsulta: data.duracaoConsulta,
    consentimentoLGPD: data.consentimentoLGPD,
    dataConsentimento: data.dataConsentimento,
    compartilhamentoDados: data.compartilhamentoDados,
    finalidadeDados: data.finalidadeDados,
    status: data.status,
    observacoes: data.observacoes,
  };
}

export function profissionalToForm(p: Profissional): Record<string, unknown> {
  return {
    nome: p.nome,
    cpf: p.cpf ?? '',
    rg: p.rg,
    dataNascimento: p.dataNascimento ?? '',
    email: p.email,
    telefone: p.telefone ?? '',
    celular: p.celular ?? '',
    conselho: p.conselho ?? 'OUTRO',
    numeroRegistro: p.numeroRegistro ?? '',
    ufRegistro: p.ufRegistro ?? '',
    cep: p.cep,
    logradouro: p.logradouro,
    numero: p.numero,
    complemento: p.complemento,
    bairro: p.bairro,
    cidade: p.cidade,
    uf: p.uf,
    especialidades: p.especialidades ?? [],
    diasAtendimento: p.diasAtendimento ?? [],
    horarioInicio: p.horarioInicio ?? '08:00',
    horarioFim: p.horarioFim ?? '18:00',
    duracaoConsulta: p.duracaoConsulta ?? 50,
    consentimentoLGPD: p.consentimentoLGPD ?? false,
    dataConsentimento: p.dataConsentimento,
    compartilhamentoDados: p.compartilhamentoDados ?? false,
    finalidadeDados: p.finalidadeDados,
    status: p.status,
    observacoes: p.observacoes,
  };
}

export function profissionalToPayload(
  p: Partial<Profissional>,
  unidadeAtivaSlugId: string
): Record<string, unknown> {
  const unidadeIds = p.unidadeIds?.length
    ? p.unidadeIds.map((slug) => getUnidadeApiId(slug)).filter(Boolean)
    : [getUnidadeApiId(unidadeAtivaSlugId)].filter(Boolean);

  return {
    nome: p.nome,
    email: p.email,
    cpf: p.cpf || undefined,
    rg: p.rg || undefined,
    data_nascimento: p.dataNascimento || undefined,
    telefone: p.telefone || undefined,
    celular: p.celular || undefined,
    conselho: p.conselho || undefined,
    numero_registro: p.numeroRegistro || undefined,
    uf_registro: p.ufRegistro || undefined,
    cep: p.cep || undefined,
    logradouro: p.logradouro || undefined,
    numero: p.numero || undefined,
    complemento: p.complemento || undefined,
    bairro: p.bairro || undefined,
    cidade: p.cidade || undefined,
    uf: p.uf || undefined,
    especialidades: p.especialidades ?? [],
    unidade_ids: unidadeIds,
    dias_atendimento: mapDiasToApi(p.diasAtendimento),
    horario_inicio: p.horarioInicio || undefined,
    horario_fim: p.horarioFim || undefined,
    duracao_consulta: p.duracaoConsulta ?? 50,
    consentimento_lgpd: p.consentimentoLGPD ?? false,
    status: p.status ?? 'ativo',
    observacoes: p.observacoes || undefined,
  };
}
