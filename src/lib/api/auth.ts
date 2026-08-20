import { apiRequest } from '@/lib/api/client';
import type { AuthLoginData, AuthMeData, AuthTokenData } from '@/lib/api/types';
import { featureFlags } from '@/lib/featureFlags';

export interface IssueTokenBody {
  user_id: string;
  email: string;
  role:
    | 'admin'
    | 'gestor'
    | 'funcionario'
    | 'terceiro'
    | 'terapeuta'
    | 'responsavel';
}

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<AuthLoginData> {
  const { data } = await apiRequest<AuthLoginData>('/auth/login', {
    method: 'POST',
    body: { email, password },
    skipAuth: true,
  });
  return data;
}

export async function issueToken(body: IssueTokenBody): Promise<AuthTokenData> {
  const { data } = await apiRequest<AuthTokenData>('/auth/token', {
    method: 'POST',
    body,
    skipAuth: true,
  });
  return data;
}

export async function fetchMe(): Promise<AuthMeData> {
  const { data } = await apiRequest<AuthMeData>('/auth/me');
  return data;
}

export async function updateProfile(body: {
  name: string;
  email: string;
}): Promise<AuthMeData> {
  const { data } = await apiRequest<AuthMeData>('/auth/me', {
    method: 'PATCH',
    body,
  });
  return data;
}

export function inferRoleFromEmail(email: string): IssueTokenBody['role'] {
  const lower = email.toLowerCase();
  if (lower.includes('admin')) return 'admin';
  if (lower.includes('responsavel') || lower.includes('responsável')) return 'responsavel';
  if (lower.includes('terapeuta')) return 'terapeuta';
  if (lower.includes('terceiro')) return 'terceiro';
  if (lower.includes('funcionario')) return 'funcionario';
  return 'gestor';
}

export function shouldUseBootstrapAuth(): boolean {
  return featureFlags.authBootstrapEnabled;
}

export function shouldUseLoginApi(): boolean {
  return featureFlags.authLoginEnabled;
}

export async function logoutApi(): Promise<void> {
  await apiRequest<{ message: string }>('/auth/logout', { method: 'POST' });
}

export async function forgotPassword(email: string): Promise<void> {
  await apiRequest<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: { email },
    skipAuth: true,
  });
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<void> {
  await apiRequest<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: { token, password },
    skipAuth: true,
  });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<AuthLoginData> {
  const { data } = await apiRequest<AuthLoginData>('/auth/me/password', {
    method: 'PUT',
    body: { current_password: currentPassword, new_password: newPassword },
  });
  return data;
}
