import { apiRequest } from '@/lib/api/client';
import type { ListMeta, UserDTO } from '@/lib/api/types';

export interface ListUsersParams {
  search?: string;
  page?: number;
  limit?: number;
  include_deleted?: boolean;
}

export interface ListUsersResult {
  items: UserDTO[];
  meta: ListMeta;
}

export interface CreateUserBody {
  name: string;
  email: string;
  password: string;
  role: UserDTO['role'];
  paciente_id?: string;
  profissional_id?: string;
  unidade_ids?: string[];
}

export interface UpdateUserBody {
  name: string;
  email: string;
  password?: string;
  role: UserDTO['role'];
  paciente_id?: string;
  profissional_id?: string;
  unidade_ids?: string[];
}

export async function listUsers(params: ListUsersParams = {}): Promise<ListUsersResult> {
  const q = new URLSearchParams();
  if (params.search) q.set('search', params.search);
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.include_deleted) q.set('include_deleted', 'true');
  const suffix = q.toString() ? `?${q}` : '';
  const { data, meta } = await apiRequest<UserDTO[]>(`/users${suffix}`);
  return { items: data ?? [], meta: (meta as ListMeta) ?? { page: 1, page_size: 20, total: 0, total_pages: 0 } };
}

export async function createUser(body: CreateUserBody): Promise<UserDTO> {
  const { data } = await apiRequest<UserDTO>('/users', { method: 'POST', body });
  return data;
}

export async function updateUser(id: string, body: UpdateUserBody): Promise<UserDTO> {
  const { data } = await apiRequest<UserDTO>(`/users/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body,
  });
  return data;
}

export async function deleteUser(id: string): Promise<void> {
  await apiRequest<null>(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function restoreUser(id: string): Promise<UserDTO> {
  const { data } = await apiRequest<UserDTO>(`/users/${encodeURIComponent(id)}/restore`, {
    method: 'POST',
  });
  return data;
}
