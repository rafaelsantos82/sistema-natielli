import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfissionais, type Profissional } from '@/hooks/useProfissionais';

/**
 * Resolve o profissional vinculado ao usuário logado.
 * Terapeuta: usa `profissional_id` do perfil (/me); fallback por e-mail.
 * Admin/gestor: override via query `?profissionalId=` (preferir {@link useProfissionalPainel} no Meu Painel).
 */
export const useProfissionalAtual = () => {
  const { user } = useAuth();
  const { list } = useProfissionais();

  return useMemo(() => {
    const profissionais = list();
    const overrideId =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('profissionalId')
        : null;

    let profissional: Profissional | null = null;

    if (overrideId && (user?.role === 'admin' || user?.role === 'gestor')) {
      profissional = profissionais.find((p) => p.id === overrideId) ?? null;
    }

    if (!profissional && user?.profissionalId) {
      profissional = profissionais.find((p) => p.id === user.profissionalId) ?? null;
    }

    if (!profissional && user?.email) {
      profissional =
        profissionais.find(
          (p) => p.email?.toLowerCase() === user.email.toLowerCase(),
        ) ?? null;
    }

    if (!profissional && (user?.role === 'admin' || user?.role === 'gestor')) {
      profissional = profissionais.find((p) => p.status === 'ativo') ?? null;
    }

    return {
      profissional,
      profissionalId: profissional?.id ?? null,
      isResolved: !!profissional,
    };
  }, [list, user]);
};
