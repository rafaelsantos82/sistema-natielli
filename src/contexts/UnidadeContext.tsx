import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ensureUnidadesSeed,
  useUnidades,
  UNIDADE_PADRAO_ID,
  UNIDADE_TODAS_ID,
  type Unidade,
} from '@/hooks/useUnidades';
import { useAuth } from '@/contexts/AuthContext';
import { featureFlags } from '@/lib/featureFlags';

const STORAGE_KEY = 'unidade_ativa';
const STORAGE_SELETOR_KEY = 'unidade_seletor';
const SELETOR_TODAS = 'todas';

function readOperacionalId(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored || stored === UNIDADE_TODAS_ID) return UNIDADE_PADRAO_ID;
  return stored;
}

function readSeletorId(operacional: string): string {
  const stored = localStorage.getItem(STORAGE_SELETOR_KEY);
  if (stored === SELETOR_TODAS || stored === UNIDADE_TODAS_ID) return UNIDADE_TODAS_ID;
  return operacional;
}

interface UnidadeContextValue {
  /** Unidades visíveis ao usuário (já aplicou `unidadesPermitidas`). */
  unidades: Unidade[];
  /** Todas as unidades existentes (para admin/CRUD). */
  todasUnidades: Unidade[];
  /** Sempre uma unidade real (cadastro, agenda, salas). */
  unidadeAtivaId: string;
  unidadeAtiva: Unidade | null;
  /** O que o header mostra: unidade real ou TODAS. */
  seletorUnidadeId: string;
  isTodasUnidades: boolean;
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
  const [unidadeAtivaId, setUnidadeAtivaIdState] = useState<string>(() => readOperacionalId());
  const [seletorUnidadeId, setSeletorUnidadeIdState] = useState<string>(() =>
    readSeletorId(readOperacionalId()),
  );

  const todas = useMemo(
    () => (featureFlags.unidadesApiEnabled ? unidadesFromHook : ensureUnidadesSeed()),
    [unidadesFromHook],
  );

  const refresh = () => {
    if (featureFlags.unidadesApiEnabled) {
      void queryClient.invalidateQueries({ queryKey: ['unidades'] });
    }
  };

  const unidades = useMemo(() => {
    const ativas = todas.filter((u) => !u.deleted_at && u.status === 'ativa');
    const permitidas = user?.unidadesPermitidas;
    if (!permitidas || permitidas.length === 0) return ativas;
    return ativas.filter((u) => permitidas.includes(u.id));
  }, [todas, user]);

  const podeTrocarUnidade = unidades.length > 1;

  useEffect(() => {
    if (unidades.length === 0) return;

    let nextOperacional = unidadeAtivaId;
    if (!unidades.some((u) => u.id === unidadeAtivaId)) {
      nextOperacional = unidades[0].id;
      setUnidadeAtivaIdState(nextOperacional);
      localStorage.setItem(STORAGE_KEY, nextOperacional);
    }

    const seletorEhTodas = seletorUnidadeId === UNIDADE_TODAS_ID;
    if (seletorEhTodas && !podeTrocarUnidade) {
      setSeletorUnidadeIdState(nextOperacional);
      localStorage.removeItem(STORAGE_SELETOR_KEY);
      return;
    }
    if (!seletorEhTodas && seletorUnidadeId !== nextOperacional) {
      setSeletorUnidadeIdState(nextOperacional);
      localStorage.removeItem(STORAGE_SELETOR_KEY);
    }
  }, [unidades, unidadeAtivaId, seletorUnidadeId, podeTrocarUnidade]);

  const setUnidadeAtiva = (id: string) => {
    if (id === UNIDADE_TODAS_ID) {
      if (!podeTrocarUnidade) return;
      setSeletorUnidadeIdState(UNIDADE_TODAS_ID);
      localStorage.setItem(STORAGE_SELETOR_KEY, SELETOR_TODAS);
      if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, unidadeAtivaId);
      }
      return;
    }
    setUnidadeAtivaIdState(id);
    setSeletorUnidadeIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
    localStorage.removeItem(STORAGE_SELETOR_KEY);
    if (featureFlags.consultasApiEnabled) {
      void queryClient.refetchQueries({ queryKey: ['consultas'], type: 'active' });
    }
  };

  const value: UnidadeContextValue = {
    unidades,
    todasUnidades: todas,
    unidadeAtivaId,
    unidadeAtiva: unidades.find((u) => u.id === unidadeAtivaId) ?? null,
    seletorUnidadeId,
    isTodasUnidades: seletorUnidadeId === UNIDADE_TODAS_ID,
    setUnidadeAtiva,
    podeTrocarUnidade,
    refresh,
  };

  return <UnidadeContext.Provider value={value}>{children}</UnidadeContext.Provider>;
};

export const useUnidadeAtiva = (): UnidadeContextValue => {
  const ctx = useContext(UnidadeContext);
  if (!ctx) throw new Error('useUnidadeAtiva deve ser usado dentro de UnidadeProvider');
  return ctx;
};
