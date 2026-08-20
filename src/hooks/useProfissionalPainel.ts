import { useCallback, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfissionalAtual } from '@/hooks/useProfissionalAtual';
import { useProfissionais, type Profissional } from '@/hooks/useProfissionais';
import { featureFlags } from '@/lib/featureFlags';
import { listProfissionais } from '@/lib/api/profissionais';
import type { ListProfissionaisParams } from '@/lib/api/profissionais.types';
import { dtoToProfissional } from '@/lib/mappers/profissionalMapper';
import { resolveUnidadeApiIdFromContext } from '@/lib/unidades/apiIds';
import { useUnidadeAtiva } from '@/contexts/UnidadeContext';

function sortByNome(profissionais: Profissional[]): Profissional[] {
  return [...profissionais].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

function filterAtivos(profissionais: Profissional[]): Profissional[] {
  return profissionais.filter((p) => !p.deleted_at && p.status === 'ativo');
}

/**
 * Resolve o profissional exibido no Meu Painel e na Minha Agenda.
 * Admin/gestor: select explícito + `?profissionalId=` na URL.
 * Demais papéis: delega a {@link useProfissionalAtual}.
 */
export function useProfissionalPainel(escopoUnidadeSlug: string | null) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const vinculoAtual = useProfissionalAtual();
  const { list: listLocal } = useProfissionais();
  const { unidades } = useUnidadeAtiva();

  const podeSelecionarProfissional =
    user?.role === 'admin' || user?.role === 'gestor';

  const unidadeApiId = useMemo(() => {
    if (!escopoUnidadeSlug) return null;
    const u = unidades.find((x) => x.id === escopoUnidadeSlug);
    return resolveUnidadeApiIdFromContext(escopoUnidadeSlug, u?.apiId);
  }, [escopoUnidadeSlug, unidades]);
  const apiEnabled = featureFlags.profissionaisApiEnabled;

  const { data: apiOptions = [], isLoading: isLoadingApi } = useQuery({
    queryKey: ['profissionais-painel', escopoUnidadeSlug, unidadeApiId],
    enabled: podeSelecionarProfissional && apiEnabled,
    queryFn: async () => {
      const params: ListProfissionaisParams = {
        page_size: 500,
        status: 'ativo',
      };
      if (unidadeApiId) {
        params.unidade_id = unidadeApiId;
      }
      const { items } = await listProfissionais(params);
      return filterAtivos(items.map(dtoToProfissional));
    },
  });

  const profissionaisOpcoes = useMemo(() => {
    if (!podeSelecionarProfissional) return [];

    if (apiEnabled) {
      return sortByNome(apiOptions);
    }

    const local = filterAtivos(listLocal());
    const filtered =
      escopoUnidadeSlug == null
        ? local
        : local.filter((p) => p.unidadeIds?.includes(escopoUnidadeSlug));
    return sortByNome(filtered);
  }, [
    podeSelecionarProfissional,
    apiEnabled,
    apiOptions,
    listLocal,
    escopoUnidadeSlug,
  ]);

  const paramId = searchParams.get('profissionalId');

  const profissionalIdSelecionado = useMemo(() => {
    if (!podeSelecionarProfissional) {
      return vinculoAtual.profissionalId;
    }
    if (profissionaisOpcoes.length === 0) return null;
    const fromUrl = profissionaisOpcoes.find((p) => p.id === paramId);
    return fromUrl?.id ?? profissionaisOpcoes[0].id;
  }, [
    podeSelecionarProfissional,
    vinculoAtual.profissionalId,
    profissionaisOpcoes,
    paramId,
  ]);

  useEffect(() => {
    if (!podeSelecionarProfissional || profissionaisOpcoes.length === 0) return;
    const id = profissionalIdSelecionado;
    if (!id || paramId === id) return;
    const next = new URLSearchParams(searchParams);
    next.set('profissionalId', id);
    setSearchParams(next, { replace: true });
  }, [
    podeSelecionarProfissional,
    profissionaisOpcoes.length,
    profissionalIdSelecionado,
    paramId,
    searchParams,
    setSearchParams,
  ]);

  const selecionarProfissional = useCallback(
    (id: string) => {
      const next = new URLSearchParams(searchParams);
      next.set('profissionalId', id);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const profissional = useMemo(() => {
    if (podeSelecionarProfissional) {
      return (
        profissionaisOpcoes.find((p) => p.id === profissionalIdSelecionado) ?? null
      );
    }
    return vinculoAtual.profissional;
  }, [
    podeSelecionarProfissional,
    profissionaisOpcoes,
    profissionalIdSelecionado,
    vinculoAtual.profissional,
  ]);

  return {
    profissional,
    profissionalId: profissional?.id ?? null,
    isResolved: !!profissional,
    podeSelecionarProfissional,
    profissionaisOpcoes,
    selecionarProfissional,
    isLoadingProfissionais:
      podeSelecionarProfissional && apiEnabled && isLoadingApi,
  };
}
