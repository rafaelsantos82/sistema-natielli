const DEFAULT_BASE = '/api/v1';

export function getApiBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_BASE;
  return base.replace(/\/$/, '');
}

export function isApiUrl(path: string): boolean {
  const base = getApiBaseUrl();
  if (path.startsWith('http')) {
    return path.startsWith(base) || path.includes('/api/v1');
  }
  return path.startsWith(base) || path.startsWith('/api/v1');
}

export const API_TIMEOUT_MS = 30_000;
