import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAgendaConflicts } from './useAgendaConflicts';

function tuesdayAt10() {
  const d = new Date(2026, 5, 2);
  return d;
}

describe('useAgendaConflicts', () => {
  const schedule = {
    diasAtendimento: ['segunda', 'terca', 'quarta', 'quinta', 'sexta'],
    horarioInicio: '08:00',
    horarioFim: '18:00',
  };

  it('allows weekday inside hours', () => {
    const { result } = renderHook(() => useAgendaConflicts([], schedule));
    const r = result.current.checkConflict({
      date: tuesdayAt10(),
      startTime: '10:00',
      endTime: '11:00',
    });
    expect(r.hasConflict).toBe(false);
  });

  it('rejects sunday', () => {
    const sunday = new Date(2026, 5, 7);
    const { result } = renderHook(() => useAgendaConflicts([], schedule));
    const r = result.current.checkConflict({
      date: sunday,
      startTime: '10:00',
      endTime: '11:00',
    });
    expect(r.conflicts.some((c) => c.type === 'no_attendance')).toBe(true);
  });

  it('normalizes legacy numeric dias', () => {
    const legacy = {
      diasAtendimento: ['1', '2', '3', '4', '5'],
      horarioInicio: '08:00',
      horarioFim: '18:00',
    };
    const { result } = renderHook(() => useAgendaConflicts([], legacy));
    const r = result.current.checkConflict({
      date: tuesdayAt10(),
      startTime: '10:00',
      endTime: '11:00',
    });
    expect(r.hasConflict).toBe(false);
  });

  it('flags outside hours', () => {
    const { result } = renderHook(() => useAgendaConflicts([], schedule));
    const r = result.current.checkConflict({
      date: tuesdayAt10(),
      startTime: '07:00',
      endTime: '08:00',
    });
    expect(r.conflicts.some((c) => c.type === 'outside_hours')).toBe(true);
  });

  it('does not duplicate no_schedule conflict when missing attendance days', () => {
    const empty = {
      diasAtendimento: [],
      horarioInicio: '08:00',
      horarioFim: '18:00',
      missingAttendanceDays: true,
    };
    const { result } = renderHook(() => useAgendaConflicts([], empty));
    const r = result.current.checkConflict({
      date: tuesdayAt10(),
      startTime: '10:00',
      endTime: '11:00',
    });
    expect(r.conflicts.some((c) => c.type === 'no_schedule')).toBe(false);
  });
});
