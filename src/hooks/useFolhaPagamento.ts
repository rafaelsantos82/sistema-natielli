import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { featureFlags } from '@/lib/featureFlags';
import { useUnidadeAtiva } from '@/contexts/UnidadeContext';
import { getUnidadeApiId } from '@/lib/unidades/apiIds';
import { createResource, deleteResource, listResource, updateResource } from '@/lib/api/genericCrud';
import {
  apiToFolhaCLT,
  apiToFolhaPJ,
  apiToFuncionarioCLT,
  apiToFuncionarioPJ,
  folhaCLTToApiPayload,
  folhaPJToApiPayload,
  funcionarioCLTToApiPayload,
  funcionarioPJToApiPayload,
} from '@/lib/mappers/folhaPagamentoMapper';
import { calcularFolhaCLT } from '@/lib/utils/folhaCalculo';
import type {
  FolhaCLT,
  FolhaPJ,
  FuncionarioCLT,
  FuncionarioPJ,
} from '@/lib/validations/folhaPagamento.schema';

const STORAGE_CLT = 'funcionariosCLT';
const STORAGE_PJ = 'funcionariosPJ';
const STORAGE_FOLHAS_CLT = 'folhasCLT';
const STORAGE_FOLHAS_PJ = 'folhasPJ';

const readStored = <T,>(key: string): T[] => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as T[];
  } catch {
    return [];
  }
};

function requireUnidadeApiId(unidadeApiId: string | null): string {
  if (!unidadeApiId) {
    throw new Error('Selecione uma unidade ativa para continuar.');
  }
  return unidadeApiId;
}

export const useFolhaPagamento = () => {
  const apiEnabled = featureFlags.rhApiEnabled;
  const { unidadeAtivaId } = useUnidadeAtiva();
  const unidadeApiId = getUnidadeApiId(unidadeAtivaId);
  const queryClient = useQueryClient();

  const [localFuncionariosCLT, setLocalFuncionariosCLT] = useState<FuncionarioCLT[]>(() =>
    apiEnabled ? [] : readStored<FuncionarioCLT>(STORAGE_CLT),
  );
  const [localFuncionariosPJ, setLocalFuncionariosPJ] = useState<FuncionarioPJ[]>(() =>
    apiEnabled ? [] : readStored<FuncionarioPJ>(STORAGE_PJ),
  );
  const [localFolhasCLT, setLocalFolhasCLT] = useState<FolhaCLT[]>(() =>
    apiEnabled ? [] : readStored<FolhaCLT>(STORAGE_FOLHAS_CLT),
  );
  const [localFolhasPJ, setLocalFolhasPJ] = useState<FolhaPJ[]>(() =>
    apiEnabled ? [] : readStored<FolhaPJ>(STORAGE_FOLHAS_PJ),
  );

  const {
    data: apiFuncionariosCLT = [],
    isLoading: loadingCLT,
    isError: isErrorCLT,
  } = useQuery({
    queryKey: ['rh-funcionarios-clt', unidadeApiId],
    enabled: apiEnabled && !!unidadeApiId,
    queryFn: async () => {
      const { items } = await listResource<Record<string, unknown>>('/rh/funcionarios-clt', {
        unidade_id: unidadeApiId!,
        page_size: 500,
      });
      return items.map(apiToFuncionarioCLT);
    },
  });

  const {
    data: apiFuncionariosPJ = [],
    isLoading: loadingPJ,
    isError: isErrorPJ,
  } = useQuery({
    queryKey: ['rh-funcionarios-pj', unidadeApiId],
    enabled: apiEnabled && !!unidadeApiId,
    queryFn: async () => {
      const { items } = await listResource<Record<string, unknown>>('/rh/funcionarios-pj', {
        unidade_id: unidadeApiId!,
        page_size: 500,
      });
      return items.map(apiToFuncionarioPJ);
    },
  });

  const { data: apiFolhasCLT = [], isLoading: loadingFolhasCLT } = useQuery({
    queryKey: ['rh-folhas-clt', unidadeApiId],
    enabled: apiEnabled && !!unidadeApiId,
    queryFn: async () => {
      const { items } = await listResource<Record<string, unknown>>('/rh/folhas-clt', {
        page_size: 500,
      });
      return items.map(apiToFolhaCLT);
    },
  });

  const { data: apiFolhasPJ = [], isLoading: loadingFolhasPJ } = useQuery({
    queryKey: ['rh-folhas-pj', unidadeApiId],
    enabled: apiEnabled && !!unidadeApiId,
    queryFn: async () => {
      const { items } = await listResource<Record<string, unknown>>('/rh/folhas-pj', {
        page_size: 500,
      });
      return items.map(apiToFolhaPJ);
    },
  });

  const funcionariosCLT = apiEnabled ? apiFuncionariosCLT : localFuncionariosCLT;
  const funcionariosPJ = apiEnabled ? apiFuncionariosPJ : localFuncionariosPJ;

  const funcionarioCLTIds = useMemo(
    () => new Set(funcionariosCLT.map((f) => f.id).filter(Boolean)),
    [funcionariosCLT],
  );
  const funcionarioPJIds = useMemo(
    () => new Set(funcionariosPJ.map((f) => f.id).filter(Boolean)),
    [funcionariosPJ],
  );

  const folhasCLT = useMemo(() => {
    const source = apiEnabled ? apiFolhasCLT : localFolhasCLT;
    return source.filter((f) => funcionarioCLTIds.has(f.funcionario_id));
  }, [apiEnabled, apiFolhasCLT, localFolhasCLT, funcionarioCLTIds]);

  const folhasPJ = useMemo(() => {
    const source = apiEnabled ? apiFolhasPJ : localFolhasPJ;
    return source.filter((f) => funcionarioPJIds.has(f.funcionario_id));
  }, [apiEnabled, apiFolhasPJ, localFolhasPJ, funcionarioPJIds]);

  const loading =
    (apiEnabled && (!unidadeApiId || loadingCLT || loadingPJ || loadingFolhasCLT || loadingFolhasPJ)) ||
    (!apiEnabled && false);

  const invalidateFuncionarios = () => {
    void queryClient.invalidateQueries({ queryKey: ['rh-funcionarios-clt'] });
    void queryClient.invalidateQueries({ queryKey: ['rh-funcionarios-pj'] });
  };

  const invalidateFolhas = () => {
    void queryClient.invalidateQueries({ queryKey: ['rh-folhas-clt'] });
    void queryClient.invalidateQueries({ queryKey: ['rh-folhas-pj'] });
  };

  const addFuncionarioCLT = async (data: FuncionarioCLT) => {
    if (apiEnabled) {
      const uid = requireUnidadeApiId(unidadeApiId);
      await createResource('/rh/funcionarios-clt', funcionarioCLTToApiPayload(data, uid));
      invalidateFuncionarios();
      return;
    }
    const next = [...localFuncionariosCLT, { ...data, id: crypto.randomUUID() }];
    setLocalFuncionariosCLT(next);
    localStorage.setItem(STORAGE_CLT, JSON.stringify(next));
  };

  const updateFuncionarioCLT = async (id: string, data: FuncionarioCLT) => {
    if (apiEnabled) {
      const uid = requireUnidadeApiId(unidadeApiId);
      await updateResource('/rh/funcionarios-clt', id, funcionarioCLTToApiPayload(data, uid));
      invalidateFuncionarios();
      return;
    }
    const next = localFuncionariosCLT.map((f) => (f.id === id ? { ...data, id } : f));
    setLocalFuncionariosCLT(next);
    localStorage.setItem(STORAGE_CLT, JSON.stringify(next));
  };

  const deleteFuncionarioCLT = async (id: string) => {
    if (apiEnabled) {
      await deleteResource('/rh/funcionarios-clt', id);
      invalidateFuncionarios();
      invalidateFolhas();
      return;
    }
    const next = localFuncionariosCLT.filter((f) => f.id !== id);
    setLocalFuncionariosCLT(next);
    localStorage.setItem(STORAGE_CLT, JSON.stringify(next));
    const folhasNext = localFolhasCLT.filter((f) => f.funcionario_id !== id);
    setLocalFolhasCLT(folhasNext);
    localStorage.setItem(STORAGE_FOLHAS_CLT, JSON.stringify(folhasNext));
  };

  const addFuncionarioPJ = async (data: FuncionarioPJ) => {
    if (apiEnabled) {
      const uid = requireUnidadeApiId(unidadeApiId);
      await createResource('/rh/funcionarios-pj', funcionarioPJToApiPayload(data, uid));
      invalidateFuncionarios();
      return;
    }
    const next = [...localFuncionariosPJ, { ...data, id: crypto.randomUUID() }];
    setLocalFuncionariosPJ(next);
    localStorage.setItem(STORAGE_PJ, JSON.stringify(next));
  };

  const updateFuncionarioPJ = async (id: string, data: FuncionarioPJ) => {
    if (apiEnabled) {
      const uid = requireUnidadeApiId(unidadeApiId);
      await updateResource('/rh/funcionarios-pj', id, funcionarioPJToApiPayload(data, uid));
      invalidateFuncionarios();
      return;
    }
    const next = localFuncionariosPJ.map((f) => (f.id === id ? { ...data, id } : f));
    setLocalFuncionariosPJ(next);
    localStorage.setItem(STORAGE_PJ, JSON.stringify(next));
  };

  const deleteFuncionarioPJ = async (id: string) => {
    if (apiEnabled) {
      await deleteResource('/rh/funcionarios-pj', id);
      invalidateFuncionarios();
      invalidateFolhas();
      return;
    }
    const next = localFuncionariosPJ.filter((f) => f.id !== id);
    setLocalFuncionariosPJ(next);
    localStorage.setItem(STORAGE_PJ, JSON.stringify(next));
    const folhasNext = localFolhasPJ.filter((f) => f.funcionario_id !== id);
    setLocalFolhasPJ(folhasNext);
    localStorage.setItem(STORAGE_FOLHAS_PJ, JSON.stringify(folhasNext));
  };

  const addFolhaCLT = async (data: FolhaCLT) => {
    if (apiEnabled) {
      requireUnidadeApiId(unidadeApiId);
      await createResource('/rh/folhas-clt', folhaCLTToApiPayload(data));
      invalidateFolhas();
      return;
    }
    const next = [...localFolhasCLT, { ...data, id: crypto.randomUUID() }];
    setLocalFolhasCLT(next);
    localStorage.setItem(STORAGE_FOLHAS_CLT, JSON.stringify(next));
  };

  const updateFolhaCLT = async (id: string, data: FolhaCLT) => {
    if (apiEnabled) {
      requireUnidadeApiId(unidadeApiId);
      await updateResource('/rh/folhas-clt', id, folhaCLTToApiPayload(data));
      invalidateFolhas();
      return;
    }
    const next = localFolhasCLT.map((f) => (f.id === id ? { ...data, id } : f));
    setLocalFolhasCLT(next);
    localStorage.setItem(STORAGE_FOLHAS_CLT, JSON.stringify(next));
  };

  const deleteFolhaCLT = async (id: string) => {
    if (apiEnabled) {
      await deleteResource('/rh/folhas-clt', id);
      invalidateFolhas();
      return;
    }
    const next = localFolhasCLT.filter((f) => f.id !== id);
    setLocalFolhasCLT(next);
    localStorage.setItem(STORAGE_FOLHAS_CLT, JSON.stringify(next));
  };

  const addFolhaPJ = async (data: FolhaPJ) => {
    if (apiEnabled) {
      requireUnidadeApiId(unidadeApiId);
      await createResource('/rh/folhas-pj', folhaPJToApiPayload(data));
      invalidateFolhas();
      return;
    }
    const next = [...localFolhasPJ, { ...data, id: crypto.randomUUID() }];
    setLocalFolhasPJ(next);
    localStorage.setItem(STORAGE_FOLHAS_PJ, JSON.stringify(next));
  };

  const updateFolhaPJ = async (id: string, data: FolhaPJ) => {
    if (apiEnabled) {
      requireUnidadeApiId(unidadeApiId);
      await updateResource('/rh/folhas-pj', id, folhaPJToApiPayload(data));
      invalidateFolhas();
      return;
    }
    const next = localFolhasPJ.map((f) => (f.id === id ? { ...data, id } : f));
    setLocalFolhasPJ(next);
    localStorage.setItem(STORAGE_FOLHAS_PJ, JSON.stringify(next));
  };

  const deleteFolhaPJ = async (id: string) => {
    if (apiEnabled) {
      await deleteResource('/rh/folhas-pj', id);
      invalidateFolhas();
      return;
    }
    const next = localFolhasPJ.filter((f) => f.id !== id);
    setLocalFolhasPJ(next);
    localStorage.setItem(STORAGE_FOLHAS_PJ, JSON.stringify(next));
  };

  const calcularFolhaCLTHandler = useCallback(
    (
      funcionario: FuncionarioCLT,
      horasExtras = 0,
      adicionalNoturno = 0,
      outrosProventos = 0,
      outrosDescontos = 0,
    ) => calcularFolhaCLT(funcionario, horasExtras, adicionalNoturno, outrosProventos, outrosDescontos),
    [],
  );

  return {
    funcionariosCLT,
    funcionariosPJ,
    folhasCLT,
    folhasPJ,
    loading,
    isError: isErrorCLT || isErrorPJ,
    addFuncionarioCLT,
    updateFuncionarioCLT,
    deleteFuncionarioCLT,
    addFuncionarioPJ,
    updateFuncionarioPJ,
    deleteFuncionarioPJ,
    addFolhaCLT,
    updateFolhaCLT,
    deleteFolhaCLT,
    addFolhaPJ,
    updateFolhaPJ,
    deleteFolhaPJ,
    calcularFolhaCLT: calcularFolhaCLTHandler,
  };
};

// Re-export types for consumers that imported from the hook
export type { FuncionarioCLT, FuncionarioPJ, FolhaCLT, FolhaPJ };
