import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { featureFlags } from '@/lib/featureFlags';
import { listResource } from '@/lib/api/genericCrud';

export type AuditAcao =
  | 'documento.upload'
  | 'documento.exclusao'
  | 'documento.visualizacao'
  | 'documento.download'
  | 'agenda.alteracao'
  | 'agenda.bloqueio'
  | 'atendimento.aprovacao'
  | 'atendimento.rejeicao'
  | 'atendimento.vinculo_prontuario'
  | 'evolucao.criacao'
  | 'evolucao.edicao'
  | 'profissional.criacao'
  | 'profissional.edicao'
  | 'profissional.exclusao';

export interface AuditEntry {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  acao: AuditAcao;
  entidade: string;
  entidade_id: string;
  diff?: Record<string, unknown>;
  ip?: string;
  user_agent?: string;
  timestamp_utc: string;
}

const STORAGE_KEY = 'audit_log';

const readStored = (): AuditEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const useAuditLog = () => {
  const apiEnabled = featureFlags.auditApiEnabled;
  const queryClient = useQueryClient();

  const { data: apiEntries = [] } = useQuery({
    queryKey: ['audit-log'],
    enabled: apiEnabled,
    queryFn: async () => {
      const { items } = await listResource<Record<string, unknown>>('/audit-log', { page_size: 500 });
      return items.map(
        (e) =>
          ({
            id: String(e.id),
            actor_id: String(e.actor_id ?? ''),
            actor_name: String(e.actor_name ?? ''),
            actor_role: String(e.actor_role ?? ''),
            acao: e.acao as AuditAcao,
            entidade: String(e.entidade ?? ''),
            entidade_id: String(e.entidade_id ?? ''),
            diff: e.diff as Record<string, unknown> | undefined,
            ip: e.ip as string | undefined,
            user_agent: e.user_agent as string | undefined,
            timestamp_utc: String(e.timestamp_utc ?? e.created_at ?? new Date().toISOString()),
          }) as AuditEntry,
      );
    },
  });

  const entries = apiEnabled ? apiEntries : readStored();

  const append = useCallback(
    (entry: Omit<AuditEntry, 'id' | 'timestamp_utc'> & { timestamp_utc?: string }) => {
      if (apiEnabled) {
        void queryClient.invalidateQueries({ queryKey: ['audit-log'] });
        return;
      }
      const next: AuditEntry = {
        ...entry,
        id: crypto.randomUUID(),
        timestamp_utc: entry.timestamp_utc ?? new Date().toISOString(),
      };
      const stored = readStored();
      localStorage.setItem(STORAGE_KEY, JSON.stringify([next, ...stored]));
    },
    [apiEnabled, queryClient],
  );

  const list = useCallback(() => entries, [entries]);

  return { entries, list, append, log: append };
};
