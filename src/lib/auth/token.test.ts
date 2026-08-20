import { describe, it, expect } from 'vitest';
import { decodeJwtPayload, isTokenExpired } from '@/lib/auth/token';

describe('token', () => {
  it('detects expired JWT', () => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({ sub: 'u1', exp: Math.floor(Date.now() / 1000) - 60 })
    );
    const token = `${header}.${payload}.sig`;
    expect(isTokenExpired(token)).toBe(true);
  });

  it('decodes payload sub', () => {
    const header = btoa(JSON.stringify({ alg: 'HS256' }));
    const payload = btoa(
      JSON.stringify({ sub: 'user-1', role: 'admin', exp: Math.floor(Date.now() / 1000) + 3600 })
    );
    const token = `${header}.${payload}.sig`;
    const decoded = decodeJwtPayload(token);
    expect(decoded?.sub).toBe('user-1');
    expect(decoded?.role).toBe('admin');
  });
});
