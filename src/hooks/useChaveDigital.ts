import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getChaveDigital,
  registerChaveDigital,
  revokeChaveDigital,
} from '@/lib/api/chaveDigital';
import type { ChaveDigitalDTO } from '@/lib/api/chaveDigital.types';
import { featureFlags } from '@/lib/featureFlags';
import { resolveUnidadeApiId } from '@/lib/unidades/apiIds';
import { showErrorToast } from '@/lib/ui/showErrorToast';
import { toast } from 'sonner';

export type { ChaveDigitalDTO };

export function useChaveDigital(unidadeSlugOrId: string | undefined) {
  const unidadeApiId = resolveUnidadeApiId(unidadeSlugOrId);
  return useQuery({
    queryKey: ['chave-digital', unidadeSlugOrId],
    enabled: featureFlags.chaveDigitalApiEnabled && !!unidadeApiId,
    queryFn: () => getChaveDigital(unidadeApiId!),
  });
}

export function useChaveDigitalMutations(unidadeSlugOrId: string | undefined) {
  const qc = useQueryClient();
  const unidadeApiId = resolveUnidadeApiId(unidadeSlugOrId);

  const invalidate = () => {
    if (unidadeSlugOrId) {
      void qc.invalidateQueries({ queryKey: ['chave-digital', unidadeSlugOrId] });
    }
  };

  const registerMutation = useMutation({
    mutationFn: ({ file, password }: { file: File; password: string }) => {
      if (!unidadeApiId) {
        return Promise.reject(new Error('Unidade ativa sem identificador válido para a API'));
      }
      return registerChaveDigital(unidadeApiId, file, password);
    },
    onSuccess: () => {
      invalidate();
      toast.success('Chave digital cadastrada com sucesso');
    },
    onError: (err) => showErrorToast(err, { action: 'cadastrar', entity: 'a chave digital' }),
  });

  const revokeMutation = useMutation({
    mutationFn: () => {
      if (!unidadeApiId) {
        return Promise.reject(new Error('Unidade ativa sem identificador válido para a API'));
      }
      return revokeChaveDigital(unidadeApiId);
    },
    onSuccess: () => {
      invalidate();
      toast.success('Chave digital revogada');
    },
    onError: (err) => showErrorToast(err, { action: 'revogar', entity: 'a chave digital' }),
  });

  return { registerMutation, revokeMutation, unidadeApiId };
}
