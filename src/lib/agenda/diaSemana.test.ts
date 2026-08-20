import { describe, it, expect } from 'vitest';
import { normalizeDiaSemana, normalizeDiasAtendimento } from './diaSemana';

describe('normalizeDiaSemana', () => {
  it('accepts form slugs', () => {
    expect(normalizeDiaSemana('segunda')).toBe('segunda');
  });

  it('accepts API codes', () => {
    expect(normalizeDiaSemana('seg')).toBe('segunda');
  });

  it('accepts legacy numeric strings', () => {
    expect(normalizeDiaSemana('1')).toBe('segunda');
  });
});

describe('normalizeDiasAtendimento', () => {
  it('deduplicates mixed formats', () => {
    const dias = normalizeDiasAtendimento(['seg', 'segunda', '1']);
    expect(dias).toEqual(['segunda']);
  });
});
