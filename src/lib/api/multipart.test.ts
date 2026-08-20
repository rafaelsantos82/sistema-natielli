import { describe, expect, it } from 'vitest';
import { prepareMultipartHeaders } from '@/lib/api/multipart';

describe('prepareMultipartHeaders', () => {
  it('remove Content-Type para o browser definir boundary do FormData', () => {
    const headers = prepareMultipartHeaders({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Bearer token',
    });
    expect(headers.get('Content-Type')).toBeNull();
    expect(headers.get('Accept')).toBe('application/json');
    expect(headers.get('Authorization')).toBe('Bearer token');
  });
});
