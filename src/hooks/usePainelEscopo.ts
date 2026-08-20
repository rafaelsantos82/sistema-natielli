import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUnidadeAtiva } from '@/contexts/UnidadeContext';

/**
 * Escopo de unidade compartilhado entre Meu Painel e Minha Agenda.
 * Admin/gestor: persiste `?unidade=` na URL (`all` ou slug da unidade).
 */
export function usePainelEscopo() {
  const { user } = useAuth();
  const { unidades, unidadeAtivaId } = useUnidadeAtiva();
  const [searchParams, setSearchParams] = useSearchParams();

  const podeVerTodas = user?.role === 'admin' || user?.role === 'gestor';
  const paramUnidade = searchParams.get('unidade');

  const unidadeFiltro = useMemo(() => {
    if (paramUnidade === 'all' && podeVerTodas) return 'all';
    if (paramUnidade && unidades.some((u) => u.id === paramUnidade)) {
      return paramUnidade;
    }
    return unidadeAtivaId;
  }, [paramUnidade, podeVerTodas, unidades, unidadeAtivaId]);

  const escopoUnidade = unidadeFiltro === 'all' ? null : unidadeFiltro;

  useEffect(() => {
    if (!podeVerTodas || paramUnidade) return;
    const next = new URLSearchParams(searchParams);
    next.set('unidade', unidadeAtivaId);
    setSearchParams(next, { replace: true });
  }, [
    podeVerTodas,
    paramUnidade,
    unidadeAtivaId,
    searchParams,
    setSearchParams,
  ]);

  const setUnidadeFiltro = useCallback(
    (value: string) => {
      const next = new URLSearchParams(searchParams);
      next.set('unidade', value);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const buildPainelQuery = useCallback(
    (profissionalId: string | null) => {
      const q = new URLSearchParams();
      if (profissionalId) q.set('profissionalId', profissionalId);
      if (podeVerTodas) q.set('unidade', unidadeFiltro);
      const s = q.toString();
      return s ? `?${s}` : '';
    },
    [podeVerTodas, unidadeFiltro],
  );

  return {
    unidades,
    unidadeFiltro,
    setUnidadeFiltro,
    escopoUnidade,
    podeVerTodas,
    buildPainelQuery,
  };
}
