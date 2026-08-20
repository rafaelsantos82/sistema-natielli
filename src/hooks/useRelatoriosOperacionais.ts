import { featureFlags } from '@/lib/featureFlags';
import { useGenericApiResource } from '@/hooks/useGenericApiResource';
import { getUnidadeApiId } from '@/lib/unidades/apiIds';
import { useUnidadeAtiva } from '@/contexts/UnidadeContext';

export interface RelatorioOperacional {
  id: string;
  numero: string;
  paciente: string;
  profissional: string;
  terapia: string;
  periodo: string;
  valor: number;
  status: 'rascunho' | 'aguardando_aprovacao' | 'aprovado' | 'rejeitado' | 'integrado';
  unidadeId?: string;
  dataSubmissao?: string;
  dataAprovacao?: string;
  aprovadoPor?: string;
  observacoes?: string;
  historicoVersoes?: Array<{
    versao: number;
    data: string;
    status: string;
    alteradoPor: string;
    observacao: string;
  }>;
}

const STORAGE_KEY = 'relatorios';

const readStored = (): RelatorioOperacional[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const mapFromApi = (r: Record<string, unknown>): RelatorioOperacional => ({
  id: String(r.id),
  numero: String(r.numero ?? ''),
  paciente: String(r.paciente_nome ?? r.paciente ?? ''),
  profissional: String(r.profissional_nome ?? r.profissional ?? ''),
  terapia: String(r.terapia ?? ''),
  periodo: String(r.periodo ?? ''),
  valor: Number(r.valor ?? 0),
  status: (r.status as RelatorioOperacional['status']) ?? 'rascunho',
  unidadeId: r.unidade_id ? String(r.unidade_id) : undefined,
  dataSubmissao: r.data_submissao as string | undefined,
  dataAprovacao: r.data_aprovacao as string | undefined,
  aprovadoPor: r.aprovado_por as string | undefined,
  observacoes: r.observacoes as string | undefined,
  historicoVersoes: r.historico_versoes as RelatorioOperacional['historicoVersoes'],
});

export const useRelatoriosOperacionais = () => {
  const { unidadeAtivaId } = useUnidadeAtiva();
  const unidadeApiId = getUnidadeApiId(unidadeAtivaId);
  const apiEnabled = featureFlags.relatoriosApiEnabled;

  const { items, isLoading, isError, create, update, remove } =
    useGenericApiResource<RelatorioOperacional>({
      queryKey: 'relatorios-operacionais',
      path: '/relatorios-operacionais',
      apiEnabled,
      listParams: unidadeApiId ? { unidade_id: unidadeApiId } : undefined,
      local: {
        read: readStored,
        write: (next) => localStorage.setItem(STORAGE_KEY, JSON.stringify(next)),
      },
      mapFromApi: (r) => mapFromApi(r as unknown as Record<string, unknown>),
      mapToCreate: (r) => ({
        numero: r.numero,
        paciente_nome: r.paciente,
        profissional_nome: r.profissional,
        terapia: r.terapia,
        periodo: r.periodo,
        valor: r.valor,
        status: r.status,
        unidade_id: unidadeApiId,
        observacoes: r.observacoes,
      }),
      mapToUpdate: (r) => ({
        numero: r.numero,
        paciente_nome: r.paciente,
        profissional_nome: r.profissional,
        terapia: r.terapia,
        periodo: r.periodo,
        valor: r.valor,
        status: r.status,
        unidade_id: unidadeApiId,
        observacoes: r.observacoes,
      }),
    });

  const getById = (id: string) => items.find((r) => r.id === id || String(r.id) === id);

  return {
    relatorios: items,
    isLoading,
    isError,
    getById,
    addRelatorio: (data: Omit<RelatorioOperacional, 'id'>) => create(data),
    updateRelatorio: (id: string, patch: Partial<RelatorioOperacional>) => update(id, patch),
    deleteRelatorio: remove,
    saveRelatorios: (next: RelatorioOperacional[]) => {
      if (!apiEnabled) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
    },
  };
};
