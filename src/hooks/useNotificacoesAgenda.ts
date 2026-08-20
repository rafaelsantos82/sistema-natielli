import { useState, useEffect, useCallback } from 'react';

export type NotificacaoAgendaTipo =
  | 'alteracao_disponibilidade'
  | 'cancelamento'
  | 'bloqueio_manual';

export interface NotificacaoAgenda {
  id: string;
  tipo: NotificacaoAgendaTipo;
  profissionalId: string;
  profissionalNome?: string;
  payload: Record<string, unknown>;
  status: 'pendente' | 'enviado';
  canal: 'email';
  destinatario: string; // e-mail da clínica
  criadoEm: string;
  enviadoEm?: string;
}

const STORAGE_KEY = 'notificacoes_agenda';
const DESTINATARIO_PADRAO_KEY = 'notificacoes_agenda_destinatario';

const readStored = (): NotificacaoAgenda[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getDestinatarioPadrao = () =>
  localStorage.getItem(DESTINATARIO_PADRAO_KEY) ?? 'clinica@local';

export const setDestinatarioPadrao = (email: string) =>
  localStorage.setItem(DESTINATARIO_PADRAO_KEY, email);

export const useNotificacoesAgenda = () => {
  const [notificacoes, setNotificacoes] = useState<NotificacaoAgenda[]>([]);

  useEffect(() => {
    setNotificacoes(readStored());
  }, []);

  const persist = (next: NotificacaoAgenda[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setNotificacoes(next);
  };

  const enqueue = useCallback(
    (
      input: Omit<
        NotificacaoAgenda,
        'id' | 'status' | 'canal' | 'criadoEm' | 'enviadoEm' | 'destinatario'
      > & { destinatario?: string },
    ) => {
      const novo: NotificacaoAgenda = {
        ...input,
        id: crypto.randomUUID(),
        status: 'pendente',
        canal: 'email',
        destinatario: input.destinatario ?? getDestinatarioPadrao(),
        criadoEm: new Date().toISOString(),
      };
      persist([...readStored(), novo]);
      return novo;
    },
    [],
  );

  const listPendentes = useCallback(
    () => notificacoes.filter((n) => n.status === 'pendente'),
    [notificacoes],
  );

  const marcarEnviado = useCallback((id: string) => {
    const now = new Date().toISOString();
    const current = readStored();
    persist(
      current.map((n) => (n.id === id ? { ...n, status: 'enviado', enviadoEm: now } : n)),
    );
  }, []);

  return { notificacoes, enqueue, listPendentes, marcarEnviado };
};
