import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getRolePermissions,
  listDataScopes,
  listPermissions,
  replaceRolePermissions,
  type AccessRole,
  type RoleResourceScopeDTO,
} from '@/lib/api/accessControl';
import { toast } from 'sonner';
import { showErrorToast } from '@/lib/ui/showErrorToast';

export function usePermissionsCatalog() {
  return useQuery({
    queryKey: ['access-control', 'permissions'],
    queryFn: listPermissions,
  });
}

export function useDataScopesCatalog() {
  return useQuery({
    queryKey: ['access-control', 'data-scopes'],
    queryFn: listDataScopes,
  });
}

export function useRolePermissions(role: AccessRole) {
  return useQuery({
    queryKey: ['access-control', 'roles', role],
    queryFn: () => getRolePermissions(role),
  });
}

export function useReplaceRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      role,
      permissionCodes,
      resourceScopes,
    }: {
      role: AccessRole;
      permissionCodes: string[];
      resourceScopes: RoleResourceScopeDTO[];
    }) => replaceRolePermissions(role, permissionCodes, resourceScopes),
    onSuccess: (_, variables) => {
      toast.success('Permissões atualizadas com sucesso');
      void queryClient.invalidateQueries({ queryKey: ['access-control', 'roles', variables.role] });
    },
    onError: (err: unknown) => {
      showErrorToast(err, { action: 'salvar', entity: 'as permissões' });
    },
  });
}
