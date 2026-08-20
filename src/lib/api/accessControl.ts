import { apiRequest } from '@/lib/api/client';

export type AccessRole =
  | 'admin'
  | 'gestor'
  | 'funcionario'
  | 'terceiro'
  | 'terapeuta'
  | 'responsavel';

export interface PermissionDTO {
  code: string;
  resource: string;
  action: string;
  description: string;
}

export interface DataScopeDTO {
  code: string;
  description: string;
}

export interface RoleResourceScopeDTO {
  resource: string;
  scope_code: string;
}

export interface RolePermissionsDTO {
  role: AccessRole;
  permission_codes: string[];
  resource_scopes?: RoleResourceScopeDTO[];
}

export const CLINICAL_RESOURCES = ['pacientes', 'consultas', 'prontuario', 'anamneses', 'terapias'] as const;
export type ClinicalResource = (typeof CLINICAL_RESOURCES)[number];

export const PERMISSION_ACTIONS = ['read', 'write', 'delete', 'manage'] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export async function listPermissions(): Promise<PermissionDTO[]> {
  const { data } = await apiRequest<PermissionDTO[]>('/access-control/permissions');
  const rows = (data ?? []) as Array<PermissionDTO & { Code?: string; Resource?: string; Action?: string; Description?: string }>;
  return rows.map((item) => ({
    code: item.code ?? item.Code ?? '',
    resource: item.resource ?? item.Resource ?? '',
    action: item.action ?? item.Action ?? '',
    description: item.description ?? item.Description ?? '',
  }));
}

export async function listDataScopes(): Promise<DataScopeDTO[]> {
  const { data } = await apiRequest<DataScopeDTO[]>('/access-control/data-scopes');
  return (data ?? []) as DataScopeDTO[];
}

export async function getRolePermissions(role: AccessRole): Promise<RolePermissionsDTO> {
  const { data } = await apiRequest<RolePermissionsDTO>(`/access-control/roles/${role}`);
  return data;
}

export async function replaceRolePermissions(
  role: AccessRole,
  permissionCodes: string[],
  resourceScopes: RoleResourceScopeDTO[],
): Promise<RolePermissionsDTO> {
  const { data } = await apiRequest<RolePermissionsDTO>(`/access-control/roles/${role}`, {
    method: 'PUT',
    body: {
      permission_codes: permissionCodes,
      resource_scopes: resourceScopes,
    },
  });
  return data;
}

export function apiPermissionCode(resource: string, action: PermissionAction): string {
  return `api.${resource}.${action}`;
}

export function menuPermissionCode(resource: string): string {
  return `menu.${resource}.view`;
}
