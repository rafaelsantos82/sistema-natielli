import { addMinutes, format, isSameDay, parseISO } from 'date-fns';
import type { Consulta } from '@/hooks/useConsultas';
import type { Reserva } from '@/hooks/useSalas';
import { UNIDADE_PADRAO_ID } from '@/hooks/useUnidades';

export interface AgendaEvento {
  id: string;
  tipo: 'consulta' | 'reserva';
  titulo: string;
  profissional: string;
  profissionalId?: string;
  occursAt: Date;
  horarioInicio: string;
  horarioFim: string;
  duracaoMinutos: number;
  status: string;
  unidadeId: string;
  salaId?: string;
  subtitulo?: string;
}

function formatHorario(date: Date): string {
  return format(date, 'HH:mm');
}

function resolveUnidadeId(unidadeId?: string): string {
  return unidadeId ?? UNIDADE_PADRAO_ID;
}

export function consultaToAgendaEvento(c: Consulta): AgendaEvento {
  const occursAt = parseISO(c.dataHora);
  const endAt = addMinutes(occursAt, c.duracao ?? 50);
  const profissional = c.profissionalNome || 'Profissional';
  const paciente = c.pacienteNome || 'Paciente';

  return {
    id: c.id,
    tipo: 'consulta',
    titulo: paciente,
    subtitulo: c.motivo || undefined,
    profissional,
    profissionalId: c.profissionalId,
    occursAt,
    horarioInicio: formatHorario(occursAt),
    horarioFim: formatHorario(endAt),
    duracaoMinutos: c.duracao ?? 50,
    status: c.status,
    unidadeId: resolveUnidadeId(c.unidadeId),
    salaId: c.salaId,
  };
}

export function reservaToAgendaEvento(
  r: Reserva,
  salaNome: string,
  unidadeId: string,
): AgendaEvento {
  const occursAt = parseISO(r.data_hora_inicio);
  const duracao = r.duracao ?? 50;
  const endAt = addMinutes(occursAt, duracao);

  return {
    id: r.id,
    tipo: 'reserva',
    titulo: `Reserva — ${salaNome}`,
    subtitulo: r.tipo_atendimento,
    profissional: r.profissional_nome || 'Profissional',
    profissionalId: r.profissional_id,
    occursAt,
    horarioInicio: formatHorario(occursAt),
    horarioFim: formatHorario(endAt),
    duracaoMinutos: duracao,
    status: 'reservada',
    unidadeId: resolveUnidadeId(unidadeId),
    salaId: r.sala_id,
  };
}

export function eventoNoDia(evento: AgendaEvento, day: Date): boolean {
  return isSameDay(evento.occursAt, day);
}

export function ordenarPorHorario(eventos: AgendaEvento[]): AgendaEvento[] {
  return [...eventos].sort((a, b) => a.occursAt.getTime() - b.occursAt.getTime());
}

export function eventoTerminaEm(evento: AgendaEvento): Date {
  return addMinutes(evento.occursAt, evento.duracaoMinutos);
}

export function horariosSobrepostos(a: AgendaEvento, b: AgendaEvento): boolean {
  if (!isSameDay(a.occursAt, b.occursAt)) return false;
  const aEnd = eventoTerminaEm(a);
  const bEnd = eventoTerminaEm(b);
  return a.occursAt < bEnd && aEnd > b.occursAt;
}

export function eventoNoMes(evento: AgendaEvento, monthStart: Date, monthEnd: Date): boolean {
  const t = evento.occursAt.getTime();
  return t >= monthStart.getTime() && t <= monthEnd.getTime();
}
