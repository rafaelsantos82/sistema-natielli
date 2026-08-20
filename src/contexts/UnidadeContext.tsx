import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ensureUnidadesSeed, useUnidades, UNIDADE_PADRAO_ID, type Unidade } from '@/hooks/useUnidades';
import { useAuth } from '@/contexts/AuthContext';
import { featureFlags } from '@/lib/featureFlags';

const STORAGE_KEY = 'unidade_ativa';

interface UnidadeContextValue {
  /** Unidades visíveis ao usuário (já aplicou `unidadesPermitidas`). */
  unidades: Unidade[];
  /** Todas as unidades existentes (para admin/CRUD). */
  todasUnidades: Unidade[];
  unidadeAtivaId: string;
  unidadeAtiva: Unidade | null;
  setUnidadeAtiva: (id: string) => void;
  /** True quando o usuário tem acesso a múltiplas unidades. */
  podeTrocarUnidade: boolean;
  refresh: () => void;
}

const UnidadeContext = createContext<UnidadeContextValue | undefined>(undefined);

export const UnidadeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { unidades: unidadesFromHook } = useUnidades();
  const [unidadeAtivaId, setUnidadeAtivaIdState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || UNIDADE_PADRAO_ID;
  });

  const todas = useMemo(
    () => (featureFlags.unidadesApiEnabled ? unidadesFromHook : ensureUnidadesSeed()),
    [unidadesFromHook],
  );

  const refresh = () => {
    if (featureFlags.unidadesApiEnabled) {
      void queryClient.invalidateQueries({ queryKey: ['unidades'] });
    }
  };

  // Filtra unidades visíveis ao usuário.
  const unidades = useMemo(() => {
    const ativas = todas.filter((u) => !u.deleted_at && u.status === 'ativa');
    const permitidas = user?.unidadesPermitidas;
    if (!permitidas || permitidas.length === 0) return ativas;
    return ativas.filter((u) => permitidas.includes(u.id));
  }, [todas, user]);

  // Garantir que a unidade ativa seja válida para o usuário.
  useEffect(() => {
    if (unidades.length === 0) return;
    if (!unidades.some((u) => u.id === unidadeAtivaId)) {
      const fallback = unidades[0].id;
      setUnidadeAtivaIdState(fallback);
      localStorage.setItem(STORAGE_KEY, fallback);
    }
  }, [unidades, unidadeAtivaId]);

  const setUnidadeAtiva = (id: string) => {
    setUnidadeAtivaIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
    if (featureFlags.consultasApiEnabled) {
      void queryClient.refetchQueries({ queryKey: ['consultas'], type: 'active' });
    }
  };

  const value: UnidadeContextValue = {
    unidades,
    todasUnidades: todas,
    unidadeAtivaId,
    unidadeAtiva: unidades.find((u) => u.id === unidadeAtivaId) ?? null,
    setUnidadeAtiva,
    podeTrocarUnidade: unidades.length > 1,
    refresh,
  };

  return <UnidadeContext.Provider value={value}>{children}</UnidadeContext.Provider>;
};

export const useUnidadeAtiva = (): UnidadeContextValue => {
  const ctx = useContext(UnidadeContext);
  if (!ctx) throw new Error('useUnidadeAtiva deve ser usado dentro de UnidadeProvider');
  return ctx;
};
