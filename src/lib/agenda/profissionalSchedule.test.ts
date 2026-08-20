import { describe, it, expect } from 'vitest';
import {
  buildProfissionalSchedule,
  normalizeTime,
  endTimeFromStartAndDuration,
} from './profissionalSchedule';
import type { Profissional } from '@/hooks/useProfissionais';

const baseProf: Profissional = {
  id: 'p1',
  nome: 'Dr. Teste',
  email: 't@test.com',
  status: 'ativo',
  createdAt: '',
  updatedAt: '',
  diasAtendimento: ['segunda', 'terca', 'quarta', 'quinta', 'sexta'],
  horarioInicio: '08:00:00',
  horarioFim: '18:00:00',
  duracaoConsulta: 45,
};

describe('normalizeTime', () => {
  it('strips seconds from Postgres TIME', () => {
    expect(normalizeTime('08:30:00')).toBe('08:30');
  });
});

describe('buildProfissionalSchedule', () => {
  it('maps profissional fields', () => {
    const s = buildProfissionalSchedule(baseProf);
    expect(s?.diasAtendimento).toEqual(baseProf.diasAtendimento);
    expect(s?.horarioInicio).toBe('08:00');
    expect(s?.horarioFim).toBe('18:00');
    expect(s?.duracaoConsulta).toBe(45);
    expect(s?.missingAttendanceDays).toBe(false);
  });

  it('flags missing days', () => {
    const s = buildProfissionalSchedule({ ...baseProf, diasAtendimento: [] });
    expect(s?.missingAttendanceDays).toBe(true);
  });

  it('returns undefined without profissional', () => {
    expect(buildProfissionalSchedule(undefined)).toBeUndefined();
  });

  it('treats partial select option without dias as missing days', () => {
    const partial = { id: 'p1', nome: 'Dr.', email: 't@t.com', status: 'ativo' as const, createdAt: '', updatedAt: '' };
    const s = buildProfissionalSchedule(partial);
    expect(s?.missingAttendanceDays).toBe(true);
  });
});

describe('endTimeFromStartAndDuration', () => {
  it('adds duration to start', () => {
    expect(endTimeFromStartAndDuration('10:00', 60)).toBe('11:00');
  });
});
