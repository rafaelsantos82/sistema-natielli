import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import {
  createUser,
  deleteUser,
  listUsers,
  restoreUser,
  updateUser,
  type CreateUserBody,
  type UpdateUserBody,
} from '@/lib/api/users';
import type { UserDTO } from '@/lib/api/types';
import { toast } from 'sonner';
import { showErrorToast } from '@/lib/ui/showErrorToast';

export interface UserListRow extends UserDTO {
  excluido: boolean;
}

export type UsersListCache = {
  items: UserListRow[];
};

function dtoToListRow(dto: UserDTO): UserListRow {
  return {
    ...dto,
    excluido: Boolean(dto.deleted_at),
  };
}

function patchUsersListRows(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
  patch: Partial<UserListRow>,
) {
  queryClient.setQueriesData<UsersListCache>({ queryKey: ['users'] }, (old) => {
    if (!old) return old;
    return {
      items: old.items.map((row) =>
        row.id === userId ? { ...row, ...patch } : row,
      ),
    };
  });
}

export function useUsersList(search: string) {
  return useQuery({
    queryKey: ['users', search],
    queryFn: async () => {
      const { items, meta } = await listUsers({
        search,
        limit: 100,
        include_deleted: true,
      });
      return {
        items: items.map(dtoToListRow),
        meta,
      };
    },
  });
}

export function useUserMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['users'] });

  const createMutation = useMutation({
    mutationFn: (body: CreateUserBody) => createUser(body),
    onSuccess: () => {
      invalidate();
      toast.success('Usuário criado com sucesso');
    },
    onError: (err: unknown) => {
      showErrorToast(err, { action: 'salvar', entity: 'o usuário' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateUserBody }) => updateUser(id, body),
    onSuccess: () => {
      invalidate();
      toast.success('Usuário atualizado com sucesso');
    },
    onError: (err: unknown) => {
      showErrorToast(err, { action: 'salvar', entity: 'o usuário' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['users'] });
      const snapshots = queryClient.getQueriesData<UsersListCache>({
        queryKey: ['users'],
      });
      patchUsersListRows(queryClient, id, {
        excluido: true,
        deleted_at: new Date().toISOString(),
      });
      return { snapshots };
    },
    onError: (err: unknown, _id, context) => {
      context?.snapshots.forEach(([key, data]) => {
        queryClient.setQueryData(key as QueryKey, data);
      });
      showErrorToast(err, { action: 'excluir', entity: 'o usuário' });
    },
    onSuccess: () => {
      toast.success('Usuário removido com sucesso');
    },
    onSettled: () => {
      invalidate();
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreUser(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['users'] });
      const snapshots = queryClient.getQueriesData<UsersListCache>({
        queryKey: ['users'],
      });
      patchUsersListRows(queryClient, id, {
        excluido: false,
        deleted_at: undefined,
      });
      return { snapshots };
    },
    onError: (err: unknown, _id, context) => {
      context?.snapshots.forEach(([key, data]) => {
        queryClient.setQueryData(key as QueryKey, data);
      });
      showErrorToast(err, { action: 'restaurar', entity: 'o usuário' });
    },
    onSuccess: () => {
      toast.success('Usuário restaurado com sucesso');
    },
    onSettled: () => {
      invalidate();
    },
  });

  return { createMutation, updateMutation, deleteMutation, restoreMutation };
}

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  funcionario: 'Funcionário',
  terapeuta: 'Terapeuta',
  responsavel: 'Responsável',
  terceiro: 'Terceiro',
};
