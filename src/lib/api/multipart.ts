import { getValidToken } from '@/lib/auth/token';
import { getAccessToken } from '@/lib/auth/tokenStore';
import { API_TIMEOUT_MS, getApiBaseUrl, isApiUrl } from '@/lib/api/env';
import {
  ApiClientError,
  triggerUnauthorized,
} from '@/lib/api/client';
import type { ApiSuccessEnvelope } from '@/lib/api/types';

export function resolveApiUrl(path: string): string {
  if (path.startsWith('http')) return path;
  const base = getApiBaseUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized.startsWith(base)) return normalized;
  return `${base}${normalized}`;
}

export function apiAuthHeaders(): HeadersInit {
  const token = getValidToken(getAccessToken);
  const h: Record<string, string> = { Accept: 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

type FetchAuthOptions = {
  skipAuth?: boolean;
  logoutOn401?: boolean;
};

function applyAuthHeaders(
  url: string,
  headers: Headers,
  opts: FetchAuthOptions,
): boolean {
  if (opts.skipAuth || !isApiUrl(url)) return false;
  const token = getValidToken(getAccessToken);
  if (!token) return false;
  headers.set('Authorization', `Bearer ${token}`);
  return true;
}

async function handleResponse(
  res: Response,
  sentBearer: boolean,
  logoutOn401: boolean,
): Promise<void> {
  if (res.status === 401) {
    if (logoutOn401 && sentBearer) triggerUnauthorized();
    throw await ApiClientError.fromResponse(res);
  }
  if (!res.ok && res.status !== 204) {
    throw await ApiClientError.fromResponse(res);
  }
}

function wrapFetchError(err: unknown): never {
  if (err instanceof ApiClientError) throw err;
  if (err instanceof Error && err.name === 'AbortError') {
    throw new ApiClientError(408, 'TIMEOUT', 'Tempo de requisição esgotado');
  }
  throw new ApiClientError(0, 'INTERNAL_ERROR', 'Falha de conexão com o servidor');
}

/** FormData exige boundary automático do browser — nunca enviar Content-Type manual. */
export function prepareMultipartHeaders(base?: HeadersInit): Headers {
  const headers = new Headers(base);
  headers.delete('Content-Type');
  return headers;
}

export async function apiMultipartPost<T>(
  path: string,
  form: FormData,
  options?: { requireDataId?: boolean; skipAuth?: boolean; logoutOn401?: boolean },
): Promise<T> {
  const url = resolveApiUrl(path);
  const headers = new Headers(apiAuthHeaders());
  const sentBearer = applyAuthHeaders(url, headers, options ?? {});
  const logoutOn401 = options?.logoutOn401 !== false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: form,
      signal: controller.signal,
    });
    await handleResponse(res, sentBearer, logoutOn401);
    const body = (await res.json()) as ApiSuccessEnvelope<T>;
    if (options?.requireDataId) {
      const row = body.data as { id?: string } | undefined;
      if (!row?.id) {
        throw new ApiClientError(500, 'INTERNAL_ERROR', 'Resposta inválida do servidor');
      }
    }
    return body.data;
  } catch (err) {
    wrapFetchError(err);
  } finally {
    clearTimeout(timeout);
  }
}

export async function apiFetchDelete(
  path: string,
  options?: FetchAuthOptions,
): Promise<void> {
  const url = resolveApiUrl(path);
  const headers = new Headers(apiAuthHeaders());
  const sentBearer = applyAuthHeaders(url, headers, options ?? {});
  const logoutOn401 = options?.logoutOn401 !== false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers,
      signal: controller.signal,
    });
    await handleResponse(res, sentBearer, logoutOn401);
  } catch (err) {
    wrapFetchError(err);
  } finally {
    clearTimeout(timeout);
  }
}

export async function apiFetchBlob(path: string, options?: FetchAuthOptions): Promise<Blob> {
  const url = resolveApiUrl(path);
  const headers = new Headers();
  const sentBearer = applyAuthHeaders(url, headers, options ?? {});
  const logoutOn401 = options?.logoutOn401 !== false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    if (res.status === 401) {
      if (logoutOn401 && sentBearer) triggerUnauthorized();
      throw await ApiClientError.fromResponse(res);
    }
    if (!res.ok) throw await ApiClientError.fromResponse(res);
    return res.blob();
  } catch (err) {
    wrapFetchError(err);
  } finally {
    clearTimeout(timeout);
  }
}

export async function apiMultipartPut<T>(path: string, form: FormData): Promise<T> {
  const url = resolveApiUrl(path);
  const headers = prepareMultipartHeaders();
  const sentBearer = applyAuthHeaders(url, headers, {});

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body: form,
      signal: controller.signal,
    });
    await handleResponse(res, sentBearer, true);
    const body = (await res.json()) as ApiSuccessEnvelope<T>;
    return body.data;
  } catch (err) {
    wrapFetchError(err);
  } finally {
    clearTimeout(timeout);
  }
}
