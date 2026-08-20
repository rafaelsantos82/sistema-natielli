import { featureFlags } from '@/lib/featureFlags';
import { useGenericApiResource } from '@/hooks/useGenericApiResource';
import type { NotaFiscalFormData } from '@/lib/validations/planoseSaude.schema';
import { conciliarNotaApi } from '@/lib/api/conciliacao';
import { deriveNotaFiscalStatus } from '@/lib/conciliacao/conciliacaoCalc';
import { useQueryClient } from '@tanstack/react-query';

export interface NotaFiscal {
  id: string;
  /** Legado; espelha `numero_nota` quando disponível */
  numero: string;
  numero_nota: string;
  paciente_nome: string;
  plano_saude_nome: string;
  paciente_id?: string;
  valor: number;
  valor_servico: number;
  valor_pago?: number;
  plano_saude_id?: string;
  acao_judicial_id?: string;
  status: string;
  data_emissao?: string;
  data_vencimento?: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

type NotaFiscalRow = {
  numero?: string;
  numero_nota?: string;
  paciente_id?: string;
  paciente_nome?: string;
  plano_saude_id?: string;
  plano_saude_nome?: string;
  valor?: number;
  valor_servico?: number;
  valor_pago?: number;
  status?: string;
  acao_judicial_id?: string;
  data_emissao?: string;
  data_vencimento?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
};

function mapToApiBody(n: NotaFiscal | Omit<NotaFiscal, 'id' | 'createdAt' | 'updatedAt'>) {
  return {
    numero_nota: n.numero_nota || n.numero,
    plano_saude_id: n.plano_saude_id,
    plano_saude_nome: n.plano_saude_nome,
    paciente_nome: n.paciente_nome,
    data_emissao: n.data_emissao,
    data_vencimento: n.data_vencimento,
    valor_servico: n.valor_servico ?? n.valor,
    valor_pago: n.valor_pago,
    status: n.status,
    acao_judicial_id: n.acao_judicial_id || undefined,
    observacoes: n.observacoes,
  };
}

export function normalizeNotaFiscal(
  n: { id: string } & NotaFiscalRow,
): NotaFiscal {
  const valorServico = Number(n.valor_servico ?? n.valor ?? 0);
  const numeroNota = String(n.numero_nota ?? n.numero ?? '');
  return {
    id: String(n.id),
    numero: numeroNota,
    numero_nota: numeroNota,
    paciente_nome: String(n.paciente_nome ?? ''),
    plano_saude_nome: String(n.plano_saude_nome ?? ''),
    paciente_id: n.paciente_id,
    valor: valorServico,
    valor_servico: valorServico,
    valor_pago: n.valor_pago != null ? Number(n.valor_pago) : undefined,
    status: String(n.status ?? 'Pendente'),
    plano_saude_id: n.plano_saude_id,
    acao_judicial_id: n.acao_judicial_id,
    data_emissao: n.data_emissao,
    data_vencimento: n.data_vencimento,
    observacoes: n.observacoes,
    createdAt: String(n.created_at ?? n.createdAt ?? new Date().toISOString()),
    updatedAt: String(n.updated_at ?? n.updatedAt ?? new Date().toISOString()),
  };
}

function formToNotaInput(
  data: NotaFiscalFormData | Omit<NotaFiscal, 'id' | 'createdAt' | 'updatedAt'>,
): Omit<NotaFiscal, 'id' | 'createdAt' | 'updatedAt'> {
  const row = data as NotaFiscalFormData & NotaFiscalRow;
  const valorServico = Number(row.valor_servico ?? row.valor ?? 0);
  const numeroNota = String(row.numero_nota ?? row.numero ?? '');
  return {
    numero: numeroNota,
    numero_nota: numeroNota,
    paciente_nome: String(row.paciente_nome ?? ''),
    plano_saude_nome: String(row.plano_saude_nome ?? ''),
    paciente_id: row.paciente_id,
    valor: valorServico,
    valor_servico: valorServico,
    valor_pago: row.valor_pago != null ? Number(row.valor_pago) : undefined,
    status: String(row.status ?? 'Pendente'),
    plano_saude_id: row.plano_saude_id,
    acao_judicial_id: row.acao_judicial_id || undefined,
    data_emissao: row.data_emissao,
    data_vencimento: row.data_vencimento,
    observacoes: row.observacoes,
  };
}

const STORAGE_KEY = 'notasFiscais';

export const useNotasFiscais = () => {
  const queryClient = useQueryClient();
  const apiEnabled = featureFlags.planosApiEnabled;
  const { items, create, update, remove, invalidate } = useGenericApiResource<NotaFiscal>({
    queryKey: 'notas-fiscais',
    path: '/notas-fiscais',
    apiEnabled,
    local: {
      read: () => {
        try {
          const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Array<
            { id: string } & NotaFiscalRow
          >;
          return raw.map(normalizeNotaFiscal);
        } catch {
          return [];
        }
      },
      write: (next) => localStorage.setItem(STORAGE_KEY, JSON.stringify(next)),
    },
    mapFromApi: (n) => normalizeNotaFiscal(n as { id: string } & NotaFiscalRow),
    mapToCreate: (data) => mapToApiBody(formToNotaInput(data)),
    mapToUpdate: (n) => mapToApiBody(n),
  });

  const addNotaFiscal = (
    data: NotaFiscalFormData | Omit<NotaFiscal, 'id' | 'createdAt' | 'updatedAt'>,
  ) => create(formToNotaInput(data));

  const updateNotaFiscal = (
    id: string,
    data: NotaFiscalFormData | Partial<NotaFiscal>,
  ) => update(id, formToNotaInput(data as NotaFiscalFormData));

  const conciliarNota = async (id: string, acaoJudicialId: string, valorPago = 0) => {
    if (apiEnabled) {
      const result = await conciliarNotaApi(id, {
        acao_judicial_id: acaoJudicialId,
        valor_pago: valorPago,
      });
      await Promise.all([
        invalidate(),
        queryClient.invalidateQueries({ queryKey: ['conciliacao-resumo'] }),
        queryClient.invalidateQueries({ queryKey: ['conciliacao-acao'] }),
      ]);
      return result;
    }
    const current = items.find((n) => n.id === id);
    if (!current) {
      throw new Error('Nota fiscal não encontrada');
    }
    const vp = valorPago > 0 ? valorPago : 0;
    const patch: Partial<NotaFiscal> = {
      acao_judicial_id: acaoJudicialId,
      valor_pago: vp,
      status: deriveNotaFiscalStatus(Number(current.valor_servico ?? current.valor ?? 0), vp),
    };
    await update(id, patch);
  };

  return {
    notasFiscais: items,
    addNota: addNotaFiscal,
    updateNota: update,
    deleteNota: remove,
    addNotaFiscal,
    updateNotaFiscal,
    deleteNotaFiscal: remove,
    conciliarNota,
  };
};
