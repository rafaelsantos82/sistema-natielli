import { getValidToken } from '@/lib/auth/token';
import { getAccessToken } from '@/lib/auth/tokenStore';
import { API_TIMEOUT_MS, getApiBaseUrl, isApiUrl } from '@/lib/api/env';
import type { ApiErrorEnvelope, ApiSuccessEnvelope } from '@/lib/api/types';
import { getErrorMessage } from '@/lib/api/errorMessages';

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: { field?: string; message: string }[];

  constructor(
    status: number,
    code: string,
    message: string,
    details: { field?: string; message: string }[] = []
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static async fromResponse(res: Response): Promise<ApiClientError> {
    let code = 'INTERNAL_ERROR';
    let message = getErrorMessage(code);
    let details: { field?: string; message: string }[] = [];

    try {
      const body = (await res.json()) as ApiErrorEnvelope;
      if (body?.error) {
        code = body.error.code ?? code;
        message = body.error.message ?? getErrorMessage(code);
        details = body.error.details ?? [];
      }
    } catch {
      message = res.statusText || message;
    }

    return new ApiClientError(res.status, code, message, details);
  }
}

type OnUnauthorized = () => void;

let onUnauthorized: OnUnauthorized | null = null;

export function setOnUnauthorized(handler: OnUnauthorized): void {
  onUnauthorized = handler;
}

export function triggerUnauthorized(): void {
  onUnauthorized?.();
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuth?: boolean;
  /** Se false, 401 não dispara logout global (uso raro; padrão true quando Bearer foi enviado). */
  logoutOn401?: boolean;
}

function resolveUrl(path: string): string {
  if (path.startsWith('http')) return path;
  const base = getApiBaseUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized.startsWith(base)) return normalized;
  return `${base}${normalized}`;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<{ data: T; meta: unknown }> {
  const url = resolveUrl(path);
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  let sentBearer = false;
  if (!options.skipAuth && isApiUrl(url)) {
    const token = getValidToken(getAccessToken);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
      sentBearer = true;
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal ?? controller.signal,
    });

    if (res.status === 401) {
      const shouldLogout =
        options.logoutOn401 !== false && sentBearer;
      if (shouldLogout) {
        onUnauthorized?.();
      }
      throw await ApiClientError.fromResponse(res);
    }

    if (!res.ok) {
      throw await ApiClientError.fromResponse(res);
    }

    if (res.status === 204) {
      return { data: undefined as T, meta: null };
    }

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      throw new ApiClientError(
        res.status,
        'INTERNAL_ERROR',
        'Resposta inválida do servidor'
      );
    }

    const envelope = (await res.json()) as ApiSuccessEnvelope<T>;
    return { data: envelope.data, meta: envelope.meta ?? null };
  } catch (err) {
    if (err instanceof ApiClientError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiClientError(408, 'TIMEOUT', 'Tempo de requisição esgotado');
    }
    throw new ApiClientError(
      0,
      'INTERNAL_ERROR',
      'Falha de conexão com o servidor'
    );
  } finally {
    clearTimeout(timeout);
  }
}
