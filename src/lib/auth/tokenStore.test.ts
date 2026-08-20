import { beforeEach, describe, expect, it } from 'vitest';
import {
  AUTH_TOKEN_STORAGE_KEY,
  clearAuthStorage,
  getAccessToken,
  saveProfile,
  setAccessToken,
} from '@/lib/auth/tokenStore';

describe('tokenStore', () => {
  beforeEach(() => {
    sessionStorage.clear();
    clearAuthStorage();
  });

  it('persists access token in sessionStorage', () => {
    setAccessToken('jwt-abc');
    expect(sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe('jwt-abc');
    expect(getAccessToken()).toBe('jwt-abc');
  });

  it('restores token from sessionStorage after simulated reload', () => {
    setAccessToken('jwt-reload');
    clearAuthStorage();
    sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'jwt-reload');

    expect(getAccessToken()).toBe('jwt-reload');
  });

  it('clearAuthStorage removes profile and token', () => {
    setAccessToken('jwt-x');
    saveProfile({
      userId: 'u1',
      name: 'Test',
      email: 't@example.com',
      role: 'admin',
    });
    clearAuthStorage();
    expect(sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(getAccessToken()).toBeNull();
    expect(sessionStorage.getItem('auth_profile')).toBeNull();
  });

  it('setAccessToken(null) removes stored token', () => {
    setAccessToken('jwt-y');
    setAccessToken(null);
    expect(sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(getAccessToken()).toBeNull();
  });
});
