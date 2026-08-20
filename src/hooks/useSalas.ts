import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { featureFlags } from '@/lib/featureFlags';
import { useUnidadeAtiva } from '@/contexts/UnidadeContext';
import { getUnidadeApiId } from '@/lib/unidades/apiIds';
import {
  createReserva as apiCreateReserva,
  createSala as apiCreateSala,
  deleteReserva as apiDeleteReserva,
  deleteSala as apiDeleteSala,
  listReservas,
  listSalas,
  updateReserva as apiUpdateReserva,
  updateSala as apiUpdateSala,
} from '@/lib/api/salas';
import { dtoToReserva, dtoToSala, salaToPayload } from '@/lib/mappers/salaMapper';
import { asReservaList } from '@/lib/reservasList';

export interface Sala {
  id: string;
  nome_sala: string;
  codigo?: string;
  especialidade_atendida?: string[];
  unidade: string;
  unidadeId?: string;
  capacidade?: number;
  recursos?: string[];
  status: 'Ativa' | 'Inativa';
  createdAt: string;
  updatedAt: string;
}

export interface Reserva {
  id: string;
  sala_id: string;
  data_hora_inicio: string;
  duracao: number;
  profissional_id: string;
  profissional_nome: string;
  consulta_id?: string;
  tipo_atendimento?: string;
  observacoes?: string;
  rrule?: string;
  createdAt: string;
}

const STORAGE_KEY = 'salas_atendimento';
const RESERVAS_KEY = 'reservas_salas';

async function fetchReservasForSalaApi(salaId: string): Promise<Reserva[]> {
  const items = await listReservas(salaId);
  return items.map(dtoToReserva);
}

function findReservaInCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  reservaId: string,
  bundledReservas: Reserva[],
): Reserva | undefined {
  const fromBundled = bundledReservas.find((r) => r.id === reservaId);
  if (fromBundled) return fromBundled;

  const queries = queryClient.getQueriesData<Reserva[]>({ queryKey: ['reservas'] });
  for (const [, data] of queries) {
    const list = asReservaList(data);
    const found = list.find((r) => r.id === reservaId);
    if (found) return found;
  }
  return undefined;
}

/** Reservas de uma sala — sempre retorna array (use em páginas de agenda). */
export function useReservasBySala(
  salaId: string | undefined,
  bundledReservas: Reserva[] = [],
) {
  const apiEnabled = featureFlags.salasApiEnabled;

  const query = useQuery({
    queryKey: ['reservas', salaId],
    enabled: apiEnabled && !!salaId,
    queryFn: () => fetchReservasForSalaApi(salaId!),
  });

  const reservasLocal = useMemo(() => {
    if (!salaId) return [];
    return asReservaList(bundledReservas).filter((r) => r.sala_id === salaId);
  }, [bundledReservas, salaId]);

  return {
    reservas: apiEnabled ? asReservaList(query.data) : reservasLocal,
    isLoading: apiEnabled && !!salaId && query.isLoading,
    isError: apiEnabled && query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export const useSalas = () => {
  const apiEnabled = featureFlags.salasApiEnabled;
  const { unidadeAtivaId, unidadeAtiva } = useUnidadeAtiva();
  const unidadeApiId = getUnidadeApiId(unidadeAtivaId);
  const queryClient = useQueryClient();

  const [localSalas, setLocalSalas] = useState<Sala[]>([]);
  const [localReservas, setLocalReservas] = useState<Reserva[]>([]);

  useEffect(() => {
    if (!apiEnabled) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setLocalSalas(JSON.parse(stored));
      const r = localStorage.getItem(RESERVAS_KEY);
      if (r) setLocalReservas(JSON.parse(r));
    }
  }, [apiEnabled]);

  const {
    data: apiSalas = [],
    isLoading: salasLoading,
    isFetched: salasFetched,
  } = useQuery({
    queryKey: ['salas', unidadeApiId],
    enabled: apiEnabled && !!unidadeApiId,
    queryFn: async () => {
      const { items } = await listSalas({ unidade_id: unidadeApiId!, page_size: 200 });
      return items.map((d) => dtoToSala(d, unidadeAtiva?.nome));
    },
  });

  const salaIds = apiSalas.map((s) => s.id).join(',');

  const { data: apiReservas = [] } = useQuery({
    queryKey: ['reservas', unidadeApiId, salaIds],
    enabled: apiEnabled && apiSalas.length > 0,
    queryFn: async () => {
      const all: Reserva[] = [];
      for (const sala of apiSalas) {
        const items = await listReservas(sala.id);
        all.push(...items.map(dtoToReserva));
      }
      return all;
    },
  });

  const salas = apiEnabled ? apiSalas : localSalas;
  const reservas = apiEnabled ? apiReservas : localReservas;

  const invalidateSalas = async () => {
    await queryClient.invalidateQueries({ queryKey: ['salas'] });
    await queryClient.invalidateQueries({ queryKey: ['reservas'] });
  };

  const invalidateReservasForSala = async (salaId: string) => {
    await queryClient.invalidateQueries({ queryKey: ['reservas', salaId] });
    await queryClient.invalidateQueries({ queryKey: ['reservas'] });
  };

  const persistLocalSalas = (next: Sala[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setLocalSalas(next);
  };

  const persistLocalReservas = (next: Reserva[]) => {
    localStorage.setItem(RESERVAS_KEY, JSON.stringify(next));
    setLocalReservas(next);
  };

  const addSala = async (salaData: Omit<Sala, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (apiEnabled) {
      const newId = await apiCreateSala(salaToPayload(salaData, unidadeAtivaId));
      await invalidateSalas();
      return { ...salaData, id: newId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Sala;
    }
    const newSala: Sala = {
      ...salaData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    persistLocalSalas([...localSalas, newSala]);
    return newSala;
  };

  const updateSala = async (id: string, salaData: Partial<Omit<Sala, 'id' | 'createdAt'>>) => {
    if (apiEnabled) {
      const current = salas.find((s) => s.id === id);
      if (!current) return;
      await apiUpdateSala(id, salaToPayload({ ...current, ...salaData }, unidadeAtivaId));
      await invalidateSalas();
      return;
    }
    persistLocalSalas(
      localSalas.map((sala) =>
        sala.id === id
          ? { ...sala, ...salaData, updatedAt: new Date().toISOString() }
          : sala,
      ),
    );
  };

  const deleteSala = async (id: string) => {
    if (apiEnabled) {
      await apiDeleteSala(id);
      await invalidateSalas();
      return;
    }
    persistLocalSalas(localSalas.filter((sala) => sala.id !== id));
    persistLocalReservas(localReservas.filter((reserva) => reserva.sala_id !== id));
  };

  const getSalaById = (id: string) => salas.find((sala) => sala.id === id);

  const addReserva = async (reservaData: Omit<Reserva, 'id' | 'createdAt'>) => {
    if (apiEnabled) {
      const newId = await apiCreateReserva(reservaData.sala_id, {
        data_hora_inicio: reservaData.data_hora_inicio,
        duracao: reservaData.duracao,
        profissional_id: reservaData.profissional_id,
        profissional_nome: reservaData.profissional_nome,
        consulta_id: reservaData.consulta_id,
        tipo_atendimento: reservaData.tipo_atendimento,
        observacoes: reservaData.observacoes,
        rrule: reservaData.rrule,
      });
      await invalidateReservasForSala(reservaData.sala_id);
      return { ...reservaData, id: newId, createdAt: new Date().toISOString() };
    }
    const newReserva: Reserva = {
      ...reservaData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    persistLocalReservas([...localReservas, newReserva]);
    return newReserva;
  };

  const updateReserva = async (
    id: string,
    reservaData: Partial<Omit<Reserva, 'id' | 'createdAt'>>,
    salaIdHint?: string,
  ) => {
    if (apiEnabled) {
      const current = findReservaInCaches(queryClient, id, reservas);
      const salaId = current?.sala_id ?? reservaData.sala_id ?? salaIdHint;
      if (!salaId) return;
      await apiUpdateReserva(salaId, id, reservaData);
      await invalidateReservasForSala(salaId);
      return;
    }
    persistLocalReservas(
      localReservas.map((reserva) =>
        reserva.id === id ? { ...reserva, ...reservaData } : reserva,
      ),
    );
  };

  const deleteReserva = async (id: string, salaId?: string) => {
    if (apiEnabled) {
      const resolvedSalaId =
        salaId ?? findReservaInCaches(queryClient, id, reservas)?.sala_id;
      if (!resolvedSalaId) return;
      await apiDeleteReserva(resolvedSalaId, id);
      await invalidateReservasForSala(resolvedSalaId);
      return;
    }
    persistLocalReservas(localReservas.filter((reserva) => reserva.id !== id));
  };

  const checkConflict = (
    salaId: string,
    startTime: string,
    duration: number,
    excludeReservaId?: string,
  ): boolean => {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000);
    const cached = queryClient.getQueryData<Reserva[]>(['reservas', salaId]);
    const salaReservas = apiEnabled
      ? asReservaList(cached).length > 0
        ? asReservaList(cached)
        : asReservaList(reservas).filter((r) => r.sala_id === salaId)
      : localReservas.filter((r) => r.sala_id === salaId);

    return salaReservas.some((reserva) => {
      if (reserva.id === excludeReservaId) return false;
      const reservaStart = new Date(reserva.data_hora_inicio);
      const reservaEnd = new Date(reservaStart.getTime() + reserva.duracao * 60000);
      return start < reservaEnd && end > reservaStart;
    });
  };

  return {
    salas,
    reservas,
    salasLoading: apiEnabled && salasLoading,
    salasFetched: apiEnabled ? salasFetched : true,
    addSala,
    updateSala,
    deleteSala,
    getSalaById,
    addReserva,
    updateReserva,
    deleteReserva,
    checkConflict,
  };
};
