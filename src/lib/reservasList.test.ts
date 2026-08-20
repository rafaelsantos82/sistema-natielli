import { describe, expect, it } from 'vitest';
import { asReservaList } from '@/lib/reservasList';

describe('asReservaList', () => {
  it('returns array as-is', () => {
    const list = [{ id: '1', sala_id: 's' }];
    expect(asReservaList(list)).toBe(list);
  });

  it('returns empty array for Promise', async () => {
    const p = Promise.resolve([]);
    expect(asReservaList(p)).toEqual([]);
  });

  it('returns empty array for null or object', () => {
    expect(asReservaList(null)).toEqual([]);
    expect(asReservaList({})).toEqual([]);
  });
});
