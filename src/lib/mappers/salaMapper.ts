import type { ReservaDTO, SalaDTO } from '@/lib/api/salas.types';
import type { Reserva, Sala } from '@/hooks/useSalas';
import { getUnidadeApiId, getUnidadeSlugFromApiId } from '@/lib/unidades/apiIds';

export function dtoToSala(d: SalaDTO, unidadeNome?: string): Sala {
  const slug = getUnidadeSlugFromApiId(d.unidade_id) ?? d.unidade_id;
  return {
    id: d.id,
    nome_sala: d.nome_sala,
    codigo: d.codigo,
    especialidade_atendida: d.especialidades ?? [],
    unidade: unidadeNome ?? slug,
    unidadeId: slug,
    capacidade: d.capacidade,
    recursos: d.recursos ?? [],
    status: d.status === 'Inativa' ? 'Inativa' : 'Ativa',
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  };
}

export function salaToPayload(s: Partial<Sala>, unidadeAtivaSlugId: string): Record<string, unknown> {
  const unidadeId = getUnidadeApiId(s.unidadeId ?? unidadeAtivaSlugId);
  return {
    nome_sala: s.nome_sala,
    codigo: s.codigo || undefined,
    unidade_id: unidadeId,
    capacidade: s.capacidade || undefined,
    status: s.status ?? 'Ativa',
    especialidades: s.especialidade_atendida ?? [],
    recursos: s.recursos ?? [],
  };
}

export function dtoToReserva(d: ReservaDTO): Reserva {
  return {
    id: d.id,
    sala_id: d.sala_id,
    data_hora_inicio: d.data_hora_inicio,
    duracao: d.duracao,
    profissional_id: d.profissional_id,
    profissional_nome: d.profissional_nome,
    consulta_id: d.consulta_id,
    tipo_atendimento: d.tipo_atendimento,
    observacoes: d.observacoes,
    rrule: d.rrule,
    createdAt: d.created_at,
  };
}
