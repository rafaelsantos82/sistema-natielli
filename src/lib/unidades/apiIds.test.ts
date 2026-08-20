import { describe, it, expect } from 'vitest';
import {
  getUnidadeApiId,
  buildUnidadeIdsPayload,
  resolveUnidadeApiIdFromContext,
} from '@/lib/unidades/apiIds';

describe('apiIds', () => {
  it('maps Natielli unit slugs to UUID', () => {
    expect(getUnidadeApiId('unidade-catanduva')).toBe(
      'a0000000-0000-4000-8000-000000000003'
    );
    expect(getUnidadeApiId('unidade-online')).toBe(
      'a0000000-0000-4000-8000-000000000006'
    );
  });

  it('builds principal link', () => {
    const links = buildUnidadeIdsPayload('unidade-londrina');
    expect(links[0].principal).toBe(true);
    expect(links[0].unidade_id).toBe('a0000000-0000-4000-8000-000000000004');
  });

  it('prefers apiId from unidade context over slug map', () => {
    const customUuid = 'b0000000-0000-4000-8000-000000000099';
    expect(resolveUnidadeApiIdFromContext('unidade-nova', customUuid)).toBe(customUuid);
    expect(resolveUnidadeApiIdFromContext('unidade-duque-caxias', null)).toBe(
      'a0000000-0000-4000-8000-000000000001',
    );
  });
});
