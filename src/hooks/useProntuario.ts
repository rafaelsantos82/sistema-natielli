import { useCallback, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { featureFlags } from '@/lib/featureFlags';
import {
  createAtestado,
  createDocumento,
  createEvolucao,
  createPrescricao,
  deleteAtestado,
  deleteDocumento,
  deleteEvolucao,
  deletePrescricao,
  getProntuarioPaciente,
} from '@/lib/api/prontuario';

export interface Evolucao {
  id: string;
  consultaId: string;
  data: string;
  queixaPrincipal: string;
  historiaDoenca: string;
  exameFisico: string;
  hipoteseDiagnostica: string;
  conduta: string;
  observacoes?: string;
}

export interface Prescricao {
  id: string;
  consultaId: string;
  data: string;
  medicamento: string;
  dosagem: string;
  frequencia: string;
  duracao: string;
  orientacoes?: string;
}

export interface Atestado {
  id: string;
  consultaId: string;
  data: string;
  cid: string;
  diasAfastamento: number;
  dataInicio: string;
  dataFim: string;
  observacoes?: string;
}

export interface Documento {
  id: string;
  consultaId: string;
  nome: string;
  tipo: string;
  tamanho: number;
  dataUpload: string;
  url: string;
}

export interface Prontuario {
  pacienteId: string;
  pacienteNome: string;
  evolucoes: Evolucao[];
  prescricoes: Prescricao[];
  atestados: Atestado[];
  documentos: Documento[];
}

const STORAGE_KEY = 'prontuarios';

const mapDtoToProntuario = (
  pacienteId: string,
  pacienteNome: string,
  dto: Awaited<ReturnType<typeof getProntuarioPaciente>>,
): Prontuario => ({
  pacienteId,
  pacienteNome,
  evolucoes: dto.evolucoes.map((e) => ({
    id: e.id,
    consultaId: e.consulta_id,
    data: e.data,
    queixaPrincipal: e.queixa_principal,
    historiaDoenca: e.historia_doenca,
    exameFisico: e.exame_fisico,
    hipoteseDiagnostica: e.hipotese_diagnostica,
    conduta: e.conduta,
    observacoes: e.observacoes,
  })),
  prescricoes: dto.prescricoes.map((p) => ({
    id: p.id,
    consultaId: p.consulta_id,
    data: p.data,
    medicamento: p.medicamento,
    dosagem: p.dosagem,
    frequencia: p.frequencia,
    duracao: p.duracao,
    orientacoes: p.orientacoes,
  })),
  atestados: dto.atestados.map((a) => ({
    id: a.id,
    consultaId: a.consulta_id,
    data: a.data,
    cid: a.cid,
    diasAfastamento: a.dias_afastamento,
    dataInicio: a.data_inicio,
    dataFim: a.data_fim,
    observacoes: a.observacoes,
  })),
  documentos: dto.documentos.map((d) => ({
    id: d.id,
    consultaId: d.consulta_id,
    nome: d.nome,
    tipo: d.tipo,
    tamanho: d.tamanho,
    dataUpload: d.data_upload,
    url: d.url,
  })),
});

export const useProntuario = () => {
  const apiEnabled = featureFlags.prontuarioApiEnabled;
  const queryClient = useQueryClient();
  const [prontuarios, setProntuarios] = useState<Record<string, Prontuario>>({});

  useEffect(() => {
    if (!apiEnabled) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setProntuarios(JSON.parse(stored));
    }
  }, [apiEnabled]);

  const saveProntuarios = (newProntuarios: Record<string, Prontuario>) => {
    if (!apiEnabled) {
      setProntuarios(newProntuarios);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProntuarios));
    }
  };

  const invalidatePaciente = (pacienteId: string) =>
    queryClient.invalidateQueries({ queryKey: ['prontuario', pacienteId] });

  const fetchPaciente = useCallback(
    async (pacienteId: string, pacienteNome = '') => {
      if (!apiEnabled) return prontuarios[pacienteId] ?? null;
      const dto = await getProntuarioPaciente(pacienteId);
      return mapDtoToProntuario(pacienteId, pacienteNome, dto);
    },
    [apiEnabled, prontuarios],
  );

  const getProntuario = (pacienteId: string): Prontuario | null => {
    if (apiEnabled) {
      const cached = queryClient.getQueryData<Prontuario>(['prontuario', pacienteId]);
      return cached ?? null;
    }
    return prontuarios[pacienteId] || null;
  };

  const useProntuarioQuery = (pacienteId: string | undefined, pacienteNome = '') =>
    useQuery({
      queryKey: ['prontuario', pacienteId],
      enabled: apiEnabled && !!pacienteId,
      queryFn: () => fetchPaciente(pacienteId!, pacienteNome),
    });

  const initProntuario = (pacienteId: string, pacienteNome: string) => {
    if (!prontuarios[pacienteId] && !apiEnabled) {
      const newProntuario: Prontuario = {
        pacienteId,
        pacienteNome,
        evolucoes: [],
        prescricoes: [],
        atestados: [],
        documentos: [],
      };
      saveProntuarios({ ...prontuarios, [pacienteId]: newProntuario });
      return newProntuario;
    }
    return prontuarios[pacienteId];
  };

  const addEvolucao = async (
    pacienteId: string,
    evolucao: Omit<Evolucao, 'id'> & { id?: string; pacienteId?: string },
    pacienteNome = '',
  ) => {
    if (apiEnabled) {
      await createEvolucao({
        consulta_id: evolucao.consultaId,
        paciente_id: pacienteId,
        queixa_principal: evolucao.queixaPrincipal,
        historia_doenca: evolucao.historiaDoenca,
        exame_fisico: evolucao.exameFisico,
        hipotese_diagnostica: evolucao.hipoteseDiagnostica,
        conduta: evolucao.conduta,
        observacoes: evolucao.observacoes,
      });
      await invalidatePaciente(pacienteId);
      const refreshed = await fetchPaciente(pacienteId, pacienteNome);
      const created = refreshed?.evolucoes.find((e) => e.consultaId === evolucao.consultaId);
      return created;
    }
    const prontuario = prontuarios[pacienteId];
    if (!prontuario) return;
    const newEvolucao: Evolucao = {
      ...evolucao,
      id: evolucao.id ?? crypto.randomUUID(),
    };
    saveProntuarios({
      ...prontuarios,
      [pacienteId]: { ...prontuario, evolucoes: [...prontuario.evolucoes, newEvolucao] },
    });
    return newEvolucao;
  };

  const deleteEvolucaoFn = async (pacienteId: string, evolucaoId: string) => {
    if (apiEnabled) {
      await deleteEvolucao(evolucaoId);
      await invalidatePaciente(pacienteId);
      return;
    }
    const prontuario = prontuarios[pacienteId];
    if (!prontuario) return;
    saveProntuarios({
      ...prontuarios,
      [pacienteId]: {
        ...prontuario,
        evolucoes: prontuario.evolucoes.filter((e) => e.id !== evolucaoId),
      },
    });
  };

  const addPrescricao = async (
    pacienteId: string,
    prescricao: Omit<Prescricao, 'id'>,
  ) => {
    if (apiEnabled) {
      await createPrescricao({
        consulta_id: prescricao.consultaId,
        paciente_id: pacienteId,
        medicamento: prescricao.medicamento,
        dosagem: prescricao.dosagem,
        frequencia: prescricao.frequencia,
        duracao: prescricao.duracao,
        orientacoes: prescricao.orientacoes,
      });
      await invalidatePaciente(pacienteId);
      return;
    }
    const prontuario = prontuarios[pacienteId];
    if (!prontuario) return;
    const newPrescricao: Prescricao = { ...prescricao, id: crypto.randomUUID() };
    saveProntuarios({
      ...prontuarios,
      [pacienteId]: {
        ...prontuario,
        prescricoes: [...prontuario.prescricoes, newPrescricao],
      },
    });
    return newPrescricao;
  };

  const deletePrescricaoFn = async (pacienteId: string, prescricaoId: string) => {
    if (apiEnabled) {
      await deletePrescricao(prescricaoId);
      await invalidatePaciente(pacienteId);
      return;
    }
    const prontuario = prontuarios[pacienteId];
    if (!prontuario) return;
    saveProntuarios({
      ...prontuarios,
      [pacienteId]: {
        ...prontuario,
        prescricoes: prontuario.prescricoes.filter((p) => p.id !== prescricaoId),
      },
    });
  };

  const addAtestado = async (pacienteId: string, atestado: Omit<Atestado, 'id'>) => {
    if (apiEnabled) {
      await createAtestado({
        consulta_id: atestado.consultaId,
        paciente_id: pacienteId,
        cid: atestado.cid,
        dias_afastamento: atestado.diasAfastamento,
        data_inicio: atestado.dataInicio,
        data_fim: atestado.dataFim,
        observacoes: atestado.observacoes,
      });
      await invalidatePaciente(pacienteId);
      return;
    }
    const prontuario = prontuarios[pacienteId];
    if (!prontuario) return;
    const newAtestado: Atestado = { ...atestado, id: crypto.randomUUID() };
    saveProntuarios({
      ...prontuarios,
      [pacienteId]: { ...prontuario, atestados: [...prontuario.atestados, newAtestado] },
    });
    return newAtestado;
  };

  const deleteAtestadoFn = async (pacienteId: string, atestadoId: string) => {
    if (apiEnabled) {
      await deleteAtestado(atestadoId);
      await invalidatePaciente(pacienteId);
      return;
    }
    const prontuario = prontuarios[pacienteId];
    if (!prontuario) return;
    saveProntuarios({
      ...prontuarios,
      [pacienteId]: {
        ...prontuario,
        atestados: prontuario.atestados.filter((a) => a.id !== atestadoId),
      },
    });
  };

  const addDocumento = async (
    pacienteId: string,
    documento: Omit<Documento, 'id'>,
  ) => {
    if (apiEnabled) {
      await createDocumento({
        consulta_id: documento.consultaId,
        paciente_id: pacienteId,
        nome: documento.nome,
        tipo: documento.tipo,
        tamanho: documento.tamanho,
        url: documento.url,
      });
      await invalidatePaciente(pacienteId);
      return;
    }
    const prontuario = prontuarios[pacienteId];
    if (!prontuario) return;
    const newDoc: Documento = { ...documento, id: crypto.randomUUID() };
    saveProntuarios({
      ...prontuarios,
      [pacienteId]: { ...prontuario, documentos: [...prontuario.documentos, newDoc] },
    });
    return newDoc;
  };

  const deleteDocumentoFn = async (pacienteId: string, documentoId: string) => {
    if (apiEnabled) {
      await deleteDocumento(documentoId);
      await invalidatePaciente(pacienteId);
      return;
    }
    const prontuario = prontuarios[pacienteId];
    if (!prontuario) return;
    saveProntuarios({
      ...prontuarios,
      [pacienteId]: {
        ...prontuario,
        documentos: prontuario.documentos.filter((d) => d.id !== documentoId),
      },
    });
  };

  return {
    getProntuario,
    useProntuarioQuery,
    initProntuario,
    addEvolucao,
    updateEvolucao: () => {},
    deleteEvolucao: deleteEvolucaoFn,
    addPrescricao,
    deletePrescricao: deletePrescricaoFn,
    addAtestado,
    deleteAtestado: deleteAtestadoFn,
    addDocumento,
    deleteDocumento: deleteDocumentoFn,
    prontuarios,
  };
};
