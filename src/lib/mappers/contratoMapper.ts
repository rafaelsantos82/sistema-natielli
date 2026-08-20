import type { ContratoDTO, ContratoMetadataPayload } from '@/lib/api/contratos.types';
import type { ContratoFormValues } from '@/lib/validations/contrato.schema';

export interface ContratoListRow {
  id: string;
  titulo: string;
  tipo: string;
  status: string;
  paciente_id?: string;
  paciente_nome?: string;
  profissional_id?: string;
  profissional_nome?: string;
  conteudo?: string;
  arquivo_nome?: string;
  arquivo_mime?: string;
  arquivo_tamanho_bytes?: number;
  tem_arquivo?: boolean;
  criado_em: string;
  atualizado_em: string;
  criado_por?: string;
}

export function dtoToContratoRow(dto: ContratoDTO): ContratoListRow {
  return {
    id: dto.id,
    titulo: dto.titulo,
    tipo: dto.tipo,
    status: dto.status,
    paciente_id: dto.paciente_id,
    paciente_nome: dto.paciente_nome,
    profissional_id: dto.profissional_id,
    profissional_nome: dto.profissional_nome,
    conteudo: dto.conteudo,
    arquivo_nome: dto.arquivo_nome,
    arquivo_mime: dto.arquivo_mime,
    arquivo_tamanho_bytes: dto.arquivo_tamanho_bytes,
    tem_arquivo: dto.tem_arquivo,
    criado_em: dto.criado_em,
    atualizado_em: dto.atualizado_em,
    criado_por: dto.criado_por,
  };
}

export function formToMetadataPayload(data: ContratoFormValues): ContratoMetadataPayload {
  return {
    titulo: data.titulo,
    tipo: data.tipo,
    paciente_id: data.paciente_id || undefined,
    paciente_nome: data.paciente_nome || undefined,
    profissional_id: data.profissional_id || undefined,
    profissional_nome: data.profissional_nome || undefined,
    status: 'Rascunho',
  };
}

export function appendMetadataToFormData(fd: FormData, meta: ContratoMetadataPayload): void {
  fd.append('titulo', meta.titulo);
  fd.append('tipo', meta.tipo);
  if (meta.paciente_id) fd.append('paciente_id', meta.paciente_id);
  if (meta.paciente_nome) fd.append('paciente_nome', meta.paciente_nome);
  if (meta.profissional_id) fd.append('profissional_id', meta.profissional_id);
  if (meta.profissional_nome) fd.append('profissional_nome', meta.profissional_nome);
  if (meta.status) fd.append('status', meta.status);
}

export function rowToFormDefaults(row: ContratoListRow): Partial<ContratoFormValues> {
  return {
    titulo: row.titulo,
    tipo: row.tipo as ContratoFormValues['tipo'],
    paciente_id: row.paciente_id ?? '',
    paciente_nome: row.paciente_nome ?? '',
    profissional_id: row.profissional_id ?? '',
    profissional_nome: row.profissional_nome ?? '',
  };
}
