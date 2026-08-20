import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { featureFlags } from '@/lib/featureFlags';
import { useUnidadeAtiva } from '@/contexts/UnidadeContext';
import { resolveUnidadeApiIdFromContext } from '@/lib/unidades/apiIds';
import {
  aprovarAtendimentoConsulta,
  cancelarConsulta as apiCancelar,
  concluirConsulta as apiConcluir,
  confirmarConsulta as apiConfirmar,
  createConsulta,
  deleteConsulta as apiDelete,
  listConsultas,
  rejeitarAtendimentoConsulta,
  updateConsulta as apiUpdate,
  vincularProntuarioConsulta,
} from '@/lib/api/consultas';
import { getNotificationSettings, putNotificationSettings } from '@/lib/api/notification';
import { consultaToPayload, dtoToConsulta } from '@/lib/mappers/consultaMapper';

export type StatusAtendimento =
  | 'atendimento_pendente'
  | 'aguardando_prontuario'
  | 'pronto_para_aprovacao'
  | 'aprovado'
  | 'rejeitado';

export interface Consulta {
  id: string;
  pacienteId: string;
  pacienteNome: string;
  profissionalId: string;
  profissionalNome: string;
  unidadeId?: string;
  salaId?: string;
  salaNome?: string;
  dataHora: string;
  duracao: number;
  motivo: string;
  observacoes?: string;
  observacoes_anamnese?: string;
  status: 'agendada' | 'confirmada' | 'cancelada' | 'concluida';
  notificacaoEnviada?: boolean;
  confirmacaoPresenca?: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
  status_atendimento?: StatusAtendimento;
  prontuario_evolucao_id?: string;
  aprovado_por?: string;
  aprovado_em?: string;
  rejeitado_por?: string;
  rejeitado_em?: string;
  motivo_rejeicao?: string;
}

export const isElegivelPagamento = (c: Consulta): boolean =>
  c.status_atendimento === 'aprovado' && !!c.prontuario_evolucao_id;

const STORAGE_KEY = 'consultas';
const NOTIFICATION_SETTINGS_KEY = 'notification_settings';

export interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  horasAntecedencia: number;
}

const readStoredConsultas = (): Consulta[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const readStoredNotificationSettings = (): NotificationSettings | null => {
  try {
    const raw = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useConsultas = () => {
  const apiEnabled = featureFlags.consultasApiEnabled;
  const { unidadeAtivaId, unidadeAtiva } = useUnidadeAtiva();
  const unidadeApiId = resolveUnidadeApiIdFromContext(
    unidadeAtivaId,
    unidadeAtiva?.apiId,
  );
  const queryClient = useQueryClient();

  const refetchConsultas = () =>
    queryClient.refetchQueries({ queryKey: ['consultas'], type: 'active' });

  const [localConsultas, setLocalConsultas] = useState<Consulta[]>(() =>
    apiEnabled ? [] : readStoredConsultas(),
  );
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    const stored = readStoredNotificationSettings();
    return (
      stored ?? {
        emailEnabled: true,
        smsEnabled: false,
        horasAntecedencia: 24,
      }
    );
  });

  useEffect(() => {
    if (!apiEnabled) {
      setLocalConsultas(readStoredConsultas());
      const storedSettings = readStoredNotificationSettings();
      if (storedSettings) setNotificationSettings(storedSettings);
    }
  }, [apiEnabled]);

  useQuery({
    queryKey: ['notification-settings', unidadeApiId],
    enabled: apiEnabled && !!unidadeApiId,
    queryFn: async () => {
      const dto = await getNotificationSettings(unidadeApiId!);
      const settings: NotificationSettings = {
        emailEnabled: dto.email_enabled,
        smsEnabled: dto.sms_enabled,
        horasAntecedencia: dto.horas_antecedencia,
      };
      setNotificationSettings(settings);
      return settings;
    },
  });

  const { data: apiConsultas = [], isLoading } = useQuery({
    queryKey: ['consultas', unidadeApiId],
    enabled: apiEnabled && !!unidadeApiId,
    queryFn: async () => {
      const { items } = await listConsultas({
        unidade_id: unidadeApiId!,
        page_size: 500,
      });
      return items.map(dtoToConsulta);
    },
  });

  const consultas = apiEnabled ? apiConsultas : localConsultas;

  const syncConsultas = async () => {
    await refetchConsultas();
  };

  const saveConsultas = (newConsultas: Consulta[]) => {
    setLocalConsultas(newConsultas);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConsultas));
  };

  const addConsulta = async (
    consulta: Omit<Consulta, 'id' | 'dataCriacao' | 'dataAtualizacao'>,
  ) => {
    if (apiEnabled) {
      const id = await createConsulta(
        consultaToPayload(consulta, unidadeAtivaId, unidadeAtiva?.apiId),
      );
      await syncConsultas();
      return {
        ...consulta,
        id,
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString(),
      };
    }
    const newConsulta: Consulta = {
      ...consulta,
      id: crypto.randomUUID(),
      status_atendimento: consulta.status_atendimento ?? 'atendimento_pendente',
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
    };
    saveConsultas([...consultas, newConsulta]);
    scheduleNotification(newConsulta);
    return newConsulta;
  };

  const updateConsulta = async (id: string, updates: Partial<Consulta>) => {
    if (apiEnabled) {
      const current = consultas.find((c) => c.id === id);
      if (!current) return;
      await apiUpdate(
        id,
        consultaToPayload({ ...current, ...updates }, unidadeAtivaId, unidadeAtiva?.apiId),
      );
      await syncConsultas();
      return;
    }
    const updated = consultas.map((c) =>
      c.id === id ? { ...c, ...updates, dataAtualizacao: new Date().toISOString() } : c,
    );
    saveConsultas(updated);
  };

  const deleteConsulta = async (id: string) => {
    if (apiEnabled) {
      await apiDelete(id);
      await syncConsultas();
      return;
    }
    saveConsultas(consultas.filter((c) => c.id !== id));
  };

  const confirmarPresenca = async (id: string) => {
    if (apiEnabled) {
      await apiConfirmar(id);
      await syncConsultas();
      return;
    }
    updateConsulta(id, { confirmacaoPresenca: true, status: 'confirmada' });
  };

  const cancelarConsulta = async (id: string) => {
    if (apiEnabled) {
      await apiCancelar(id);
      await syncConsultas();
      return;
    }
    updateConsulta(id, { status: 'cancelada' });
  };

  const concluirConsulta = async (id: string) => {
    if (apiEnabled) {
      await apiConcluir(id);
      await syncConsultas();
      return;
    }
    updateConsulta(id, {
      status: 'concluida',
      status_atendimento: 'aguardando_prontuario',
    });
  };

  const vincularProntuario = useCallback(
    async (consultaId: string, evolucaoId: string) => {
      if (apiEnabled) {
        await vincularProntuarioConsulta(consultaId, evolucaoId);
        await syncConsultas();
        return;
      }
      const apply = (current: Consulta[]) =>
        current.map((c) =>
          c.id === consultaId
            ? {
                ...c,
                prontuario_evolucao_id: evolucaoId,
                status_atendimento:
                  c.status_atendimento === 'aprovado' || c.status_atendimento === 'rejeitado'
                    ? c.status_atendimento
                    : ('pronto_para_aprovacao' as StatusAtendimento),
                dataAtualizacao: new Date().toISOString(),
              }
            : c,
        );
      saveConsultas(apply(consultas));
    },
    [apiEnabled, consultas, syncConsultas],
  );

  const aprovarAtendimento = useCallback(
    async (id: string, actor: { id: string; name: string }) => {
      const target = consultas.find((c) => c.id === id);
      if (!target) throw new Error('Consulta não encontrada');
      if (!target.prontuario_evolucao_id) {
        throw new Error('Atendimento sem prontuário vinculado não pode ser aprovado.');
      }
      if (apiEnabled) {
        await aprovarAtendimentoConsulta(id);
        await syncConsultas();
        return;
      }
      const next = consultas.map((c) =>
        c.id === id
          ? {
              ...c,
              status_atendimento: 'aprovado' as StatusAtendimento,
              aprovado_por: actor.name,
              aprovado_em: new Date().toISOString(),
              motivo_rejeicao: undefined,
              rejeitado_por: undefined,
              rejeitado_em: undefined,
              dataAtualizacao: new Date().toISOString(),
            }
          : c,
      );
      saveConsultas(next);
    },
    [consultas, apiEnabled, syncConsultas],
  );

  const rejeitarAtendimento = useCallback(
    async (id: string, motivo: string, actor: { id: string; name: string }) => {
      if (!motivo.trim()) throw new Error('Informe um motivo para rejeitar.');
      if (apiEnabled) {
        await rejeitarAtendimentoConsulta(id, motivo);
        await syncConsultas();
        return;
      }
      const next = consultas.map((c) =>
        c.id === id
          ? {
              ...c,
              status_atendimento: 'rejeitado' as StatusAtendimento,
              rejeitado_por: actor.name,
              rejeitado_em: new Date().toISOString(),
              motivo_rejeicao: motivo,
              dataAtualizacao: new Date().toISOString(),
            }
          : c,
      );
      saveConsultas(next);
    },
    [consultas, apiEnabled, syncConsultas],
  );

  const listarParaAprovacao = useCallback(
    () => consultas.filter((c) => c.status_atendimento === 'pronto_para_aprovacao'),
    [consultas],
  );

  const listarElegiveisPagamento = useCallback(
    () => consultas.filter(isElegivelPagamento),
    [consultas],
  );

  const scheduleNotification = (consulta: Consulta) => {
    if (!('Notification' in window)) return;
    const consultaTime = new Date(consulta.dataHora).getTime();
    const notificationTime =
      consultaTime - notificationSettings.horasAntecedencia * 60 * 60 * 1000;
    const now = Date.now();
    if (notificationTime > now && notificationTime - now < 2147483647) {
      setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification('Lembrete de Consulta', {
            body: `Consulta com ${consulta.pacienteNome} em ${notificationSettings.horasAntecedencia}h`,
          });
        }
      }, notificationTime - now);
    }
  };

  const updateNotificationSettings = async (settings: NotificationSettings) => {
    setNotificationSettings(settings);
    if (apiEnabled && unidadeApiId) {
      await putNotificationSettings({
        unidade_id: unidadeApiId,
        email_enabled: settings.emailEnabled,
        sms_enabled: settings.smsEnabled,
        horas_antecedencia: settings.horasAntecedencia,
      });
      await queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      return;
    }
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const consultasApiUnavailable =
    apiEnabled && !unidadeApiId;

  return {
    consultas,
    isLoading: apiEnabled ? isLoading : false,
    consultasApiUnavailable,
    unidadeApiId,
    addConsulta,
    updateConsulta,
    deleteConsulta,
    confirmarPresenca,
    cancelarConsulta,
    concluirConsulta,
    vincularProntuario,
    aprovarAtendimento,
    rejeitarAtendimento,
    listarParaAprovacao,
    listarElegiveisPagamento,
    notificationSettings,
    updateNotificationSettings,
    requestNotificationPermission,
  };
};
