import { describe, it, expect } from 'vitest';
import {
  consultaToAgendaEvento,
  eventoNoDia,
  horariosSobrepostos,
  ordenarPorHorario,
} from '@/lib/mappers/agendaMapper';
import type { Consulta } from '@/hooks/useConsultas';

const baseConsulta = (overrides: Partial<Consulta> = {}): Consulta => ({
  id: 'c1',
  pacienteId: 'p1',
  pacienteNome: 'Maria Silva',
  profissionalId: 'prof1',
  profissionalNome: 'Dr. João',
  dataHora: '2026-05-26T14:30:00.000Z',
  duracao: 50,
  motivo: 'Avaliação',
  status: 'agendada',
  dataCriacao: '',
  dataAtualizacao: '',
  ...overrides,
});

describe('agendaMapper', () => {
  it('maps consulta ISO to occursAt and HH:mm range', () => {
    const evento = consultaToAgendaEvento(baseConsulta());
    expect(evento.titulo).toBe('Maria Silva');
    expect(evento.horarioInicio).toMatch(/^\d{2}:\d{2}$/);
    expect(evento.horarioFim).toMatch(/^\d{2}:\d{2}$/);
    expect(evento.duracaoMinutos).toBe(50);
  });

  it('eventoNoDia matches same calendar day', () => {
    const evento = consultaToAgendaEvento(baseConsulta());
    expect(eventoNoDia(evento, evento.occursAt)).toBe(true);
    expect(eventoNoDia(evento, new Date('2020-01-01'))).toBe(false);
  });

  it('ordenarPorHorario sorts by start time', () => {
    const late = consultaToAgendaEvento(
      baseConsulta({ id: 'late', dataHora: '2026-05-26T18:00:00.000Z' }),
    );
    const early = consultaToAgendaEvento(
      baseConsulta({ id: 'early', dataHora: '2026-05-26T09:00:00.000Z' }),
    );
    const sorted = ordenarPorHorario([late, early]);
    expect(sorted[0].id).toBe('early');
    expect(sorted[1].id).toBe('late');
  });

  it('horariosSobrepostos detects overlap on same day', () => {
    const a = consultaToAgendaEvento(
      baseConsulta({ id: 'a', dataHora: '2026-05-26T10:00:00.000Z', duracao: 60 }),
    );
    const b = consultaToAgendaEvento(
      baseConsulta({
        id: 'b',
        profissionalId: 'prof2',
        dataHora: '2026-05-26T10:30:00.000Z',
        duracao: 30,
      }),
    );
    expect(horariosSobrepostos(a, b)).toBe(true);
  });

  it('horariosSobrepostos ignores different days', () => {
    const a = consultaToAgendaEvento(baseConsulta());
    const b = consultaToAgendaEvento(
      baseConsulta({ dataHora: '2026-05-27T14:30:00.000Z' }),
    );
    expect(horariosSobrepostos(a, b)).toBe(false);
  });
});
