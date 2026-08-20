import type { ConsultaDTO } from '@/lib/api/consultas.types';
import type { Consulta } from '@/hooks/useConsultas';
import {
  getUnidadeSlugFromApiId,
  resolveUnidadeApiIdFromContext,
} from '@/lib/unidades/apiIds';

export function dtoToConsulta(d: ConsultaDTO): Consulta {
  return {
    id: d.id,
    pacienteId: d.paciente_id,
    pacienteNome: d.paciente_nome,
    profissionalId: d.profissional_id,
    profissionalNome: d.profissional_nome,
    unidadeId: d.unidade_id
      ? getUnidadeSlugFromApiId(d.unidade_id) ?? d.unidade_id
      : undefined,
    salaId: d.sala_id,
    salaNome: d.sala_nome,
    dataHora: d.data_hora,
    duracao: d.duracao,
    motivo: d.motivo,
    observacoes: d.observacoes,
    observacoes_anamnese: d.observacoes_anamnese,
    status: d.status,
    notificacaoEnviada: d.notificacao_enviada,
    confirmacaoPresenca: d.confirmacao_presenca,
    status_atendimento: d.status_atendimento as Consulta['status_atendimento'],
    prontuario_evolucao_id: d.prontuario_evolucao_id,
    aprovado_por: d.aprovado_por,
    aprovado_em: d.aprovado_em,
    rejeitado_por: d.rejeitado_por,
    rejeitado_em: d.rejeitado_em,
    motivo_rejeicao: d.motivo_rejeicao,
    dataCriacao: d.created_at,
    dataAtualizacao: d.updated_at,
  };
}

export function consultaToPayload(
  c: Partial<Consulta>,
  unidadeAtivaSlugId: string,
  unidadeAtivaApiId?: string | null,
): Record<string, unknown> {
  const slug = c.unidadeId ?? unidadeAtivaSlugId;
  const unidadeApiId = resolveUnidadeApiIdFromContext(
    slug,
    slug === unidadeAtivaSlugId ? unidadeAtivaApiId : null,
  );
  return {
    paciente_id: c.pacienteId,
    profissional_id: c.profissionalId,
    unidade_id: unidadeApiId,
    sala_id: c.salaId,
    data_hora: c.dataHora,
    duracao: c.duracao ?? 50,
    motivo: c.motivo,
    observacoes: c.observacoes || undefined,
    observacoes_anamnese: c.observacoes_anamnese || undefined,
    status: c.status ?? 'agendada',
  };
}
