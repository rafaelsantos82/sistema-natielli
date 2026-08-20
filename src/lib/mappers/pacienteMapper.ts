import type {
  CreatePacientePayload,
  PacienteDTO,
} from '@/lib/api/pacientes.types';
import type { PacienteFormData } from '@/lib/validations/paciente.schema';
import { buildUnidadeIdsPayload } from '@/lib/unidades/apiIds';

function digitsOnly(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const d = value.replace(/\D/g, '');
  return d || undefined;
}

function emptyToUndefined(s: string | undefined): string | undefined {
  if (s === undefined || s === null) return undefined;
  const t = s.trim();
  return t === '' ? undefined : t;
}

function maxAge25(dateStr: string): boolean {
  const birth = new Date(dateStr);
  if (Number.isNaN(birth.getTime())) return false;
  const limit = new Date();
  limit.setFullYear(limit.getFullYear() - 25);
  return birth >= limit;
}

export function formToApiPayload(
  data: PacienteFormData,
  activeUnidadeSlug: string
): CreatePacientePayload {
  const cpf = digitsOnly(data.cpf);
  const responsavelCpf = digitsOnly(data.responsavel_cpf);

  return {
    nome_completo: data.nome_completo.trim(),
    nome_social: emptyToUndefined(data.nome_social),
    data_nascimento: data.data_nascimento,
    sexo_biologico: data.sexo_biologico,
    cpf: cpf,
    rg_numero: emptyToUndefined(data.rg_numero),
    rg_orgao: emptyToUndefined(data.rg_orgao),
    foto: emptyToUndefined(data.foto),
    tel_principal: data.tel_principal.trim(),
    tel_secundario: emptyToUndefined(data.tel_secundario),
    email: emptyToUndefined(data.email),
    endereco: emptyToUndefined(data.endereco),
    numero: emptyToUndefined(data.numero),
    complemento: emptyToUndefined(data.complemento),
    bairro: emptyToUndefined(data.bairro),
    cidade: emptyToUndefined(data.cidade),
    uf: data.uf.toUpperCase().slice(0, 2),
    cep: digitsOnly(data.cep) ?? data.cep,
    responsavel_nome: data.responsavel_nome.trim(),
    responsavel_cpf: responsavelCpf,
    responsavel_parentesco: emptyToUndefined(data.responsavel_parentesco),
    responsavel_tel: emptyToUndefined(data.responsavel_tel),
    responsavel_email: emptyToUndefined(data.responsavel_email),
    contato_emergencia_nome: emptyToUndefined(data.contato_emergencia_nome),
    contato_emergencia_tel: emptyToUndefined(data.contato_emergencia_tel),
    pessoas_autorizadas_busca: data.pessoas_autorizadas_busca ?? [],
    escola: emptyToUndefined(data.escola),
    serie_ano: emptyToUndefined(data.serie_ano),
    necessidades_especiais: emptyToUndefined(data.necessidades_especiais),
    pediatra_referencia: emptyToUndefined(data.pediatra_referencia),
    altura: data.altura,
    peso: data.peso,
    tipo_sanguineo: data.tipo_sanguineo,
    alergias: emptyToUndefined(data.alergias),
    doencas_cronicas: emptyToUndefined(data.doencas_cronicas),
    medicacoes_continuo: emptyToUndefined(data.medicacoes_continuo),
    cirurgias_previas: emptyToUndefined(data.cirurgias_previas),
    historico_familiar: emptyToUndefined(data.historico_familiar),
    vacinas: data.vacinas ?? [],
    observacoes: emptyToUndefined(data.observacoes),
    atividade_fisica_frequencia: emptyToUndefined(data.atividade_fisica_frequencia),
    atividade_fisica_tipo: emptyToUndefined(data.atividade_fisica_tipo),
    alimentacao: emptyToUndefined(data.alimentacao),
    sono_horas: data.sono_horas,
    status: data.status,
    consentimento_lgpd: data.consentimento_lgpd,
    autorizacao_uso_imagem: data.autorizacao_uso_imagem ?? false,
    assinatura_digital: emptyToUndefined(data.assinatura_digital),
    documentos_anexos: data.documentos_anexos ?? [],
    unidade_ids: buildUnidadeIdsPayload(activeUnidadeSlug),
  };
}

export function dtoToForm(dto: PacienteDTO): PacienteFormData {
  return {
    nome_completo: dto.nome_completo,
    nome_social: dto.nome_social ?? '',
    data_nascimento: dto.data_nascimento,
    sexo_biologico: dto.sexo_biologico as PacienteFormData['sexo_biologico'],
    cpf: dto.cpf ?? '',
    rg_numero: dto.rg_numero ?? '',
    rg_orgao: dto.rg_orgao ?? '',
    foto: dto.foto ?? '',
    tel_principal: dto.tel_principal,
    tel_secundario: dto.tel_secundario ?? '',
    email: dto.email ?? '',
    endereco: dto.endereco ?? '',
    numero: dto.numero ?? '',
    complemento: dto.complemento ?? '',
    bairro: dto.bairro ?? '',
    cidade: dto.cidade ?? '',
    uf: dto.uf,
    cep: dto.cep,
    contato_emergencia_nome: dto.contato_emergencia_nome ?? '',
    contato_emergencia_tel: dto.contato_emergencia_tel ?? '',
    responsavel_nome: dto.responsavel_nome,
    responsavel_cpf: dto.responsavel_cpf ?? '',
    responsavel_parentesco: dto.responsavel_parentesco ?? '',
    responsavel_tel: dto.responsavel_tel ?? '',
    responsavel_email: dto.responsavel_email ?? '',
    pessoas_autorizadas_busca: dto.pessoas_autorizadas_busca ?? [],
    escola: dto.escola ?? '',
    serie_ano: dto.serie_ano ?? '',
    necessidades_especiais: dto.necessidades_especiais ?? '',
    pediatra_referencia: dto.pediatra_referencia ?? '',
    altura: dto.altura,
    peso: dto.peso,
    tipo_sanguineo: dto.tipo_sanguineo as PacienteFormData['tipo_sanguineo'],
    alergias: dto.alergias ?? '',
    doencas_cronicas: dto.doencas_cronicas ?? '',
    medicacoes_continuo: dto.medicacoes_continuo ?? '',
    cirurgias_previas: dto.cirurgias_previas ?? '',
    historico_familiar: dto.historico_familiar ?? '',
    vacinas: dto.vacinas ?? [],
    observacoes: dto.observacoes ?? '',
    atividade_fisica_frequencia: dto.atividade_fisica_frequencia ?? '',
    atividade_fisica_tipo: dto.atividade_fisica_tipo ?? '',
    alimentacao: dto.alimentacao ?? '',
    sono_horas: dto.sono_horas,
    status: dto.status as PacienteFormData['status'],
    consentimento_lgpd: dto.consentimento_lgpd,
    autorizacao_uso_imagem: dto.autorizacao_uso_imagem,
    assinatura_digital: dto.assinatura_digital ?? '',
    documentos_anexos: dto.documentos_anexos ?? [],
  };
}

function formatDateTimeBr(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function dtoToListRow(dto: PacienteDTO) {
  const excluido = Boolean(dto.deleted_at);
  const unidadeIds = (dto.unidades ?? [])
    .filter((u) => u.ativo !== false)
    .sort((a, b) => Number(b.principal) - Number(a.principal))
    .map((u) => u.unidade_id);
  return {
    id: dto.id,
    nome: dto.nome_completo,
    cpf: dto.cpf ?? '—',
    data_nascimento: dto.data_nascimento,
    dataNasc: formatDateBr(dto.data_nascimento),
    telefone: dto.tel_principal,
    email: dto.email ?? '—',
    excluido,
    status: (excluido ? 'inativo' : dto.status) as 'ativo' | 'inativo' | 'falecido',
    proximaConsulta: formatDateTimeBr(dto.proxima_consulta_em),
    ultimaConsulta: formatDateTimeBr(dto.ultima_consulta_em),
    totalConsultas: dto.total_consultas,
    unidadeIds,
  };
}

export function formatDateBr(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}

export { maxAge25 };
