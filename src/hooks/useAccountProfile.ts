import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMe, updateProfile } from '@/lib/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import type { ProfileFormData } from '@/lib/validations/account.schema';

export function useAccountProfile() {
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();

  const profileQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const current = profileQuery.data;
      if (!current?.email) {
        throw new Error('Perfil não carregado');
      }
      return updateProfile({ name: data.name, email: current.email });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      await refreshProfile();
    },
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    error: profileQuery.error,
    refetch: profileQuery.refetch,
    updateProfile: updateMutation.mutateAsync,
    isSaving: updateMutation.isPending,
  };
}
