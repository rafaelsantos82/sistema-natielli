import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { featureFlags } from '@/lib/featureFlags';
import {
  createResource,
  deleteResource,
  listResource,
  updateResource,
} from '@/lib/api/genericCrud';

// Baseado em FHIR Questionnaire/QuestionnaireResponse
export interface QuestionItem {
  linkId: string;
  text: string;
  type: 'boolean' | 'string' | 'text' | 'integer' | 'decimal' | 'choice' | 'date';
  required?: boolean;
  options?: { value: string; label: string }[];
  enableWhen?: {
    linkId: string;
    operator: 'exists' | 'equals';
    answerBoolean?: boolean;
    answerString?: string;
  }[];
}

export interface Anamnese {
  id: string;
  nome: string;
  especialidade: string; // "Básica" para anamnese básica
  versao: string;
  status: 'Ativa' | 'Inativa';
  questionnaire: QuestionItem[];
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RespostaAnamnese {
  id: string;
  questionnaire_id: string;
  questionnaire_nome: string;
  patient_id: string;
  patient_nome: string;
  encounter_id?: string;
  respostas: Record<string, any>;
  data_hora: string;
  createdAt: string;
}

const STORAGE_KEY_ANAMNESES = 'anamneses';
const STORAGE_KEY_RESPOSTAS = 'respostas_anamneses';

export const useAnamneses = () => {
  const apiEnabled = featureFlags.anamnesesApiEnabled;
  const queryClient = useQueryClient();

  const [localAnamneses, setLocalAnamneses] = useState<Anamnese[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_ANAMNESES);
    return stored ? JSON.parse(stored) : [];
  });

  const { data: apiRespostas = [] } = useQuery({
    queryKey: ['respostas-anamnese'],
    enabled: apiEnabled,
    queryFn: async () => {
      const { items } = await listResource<RespostaAnamnese & { created_at?: string }>(
        '/respostas-anamnese',
        { page_size: 500 },
      );
      return items.map((r) => ({
        ...r,
        createdAt: (r as { created_at?: string }).created_at ?? r.createdAt,
      }));
    },
  });

  const { data: apiAnamneses = [] } = useQuery({
    queryKey: ['anamneses'],
    enabled: apiEnabled,
    queryFn: async () => {
      const { items } = await listResource<Anamnese & { created_at?: string; updated_at?: string }>(
        '/anamneses',
        { page_size: 200 },
      );
      return items.map((a) => ({
        ...a,
        createdAt: (a as { created_at?: string }).created_at ?? a.createdAt,
        updatedAt: (a as { updated_at?: string }).updated_at ?? a.updatedAt,
      }));
    },
  });

  const anamneses = apiEnabled ? apiAnamneses : localAnamneses;

  const [localRespostas, setLocalRespostas] = useState<RespostaAnamnese[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_RESPOSTAS);
    return stored ? JSON.parse(stored) : [];
  });

  const respostas = apiEnabled ? apiRespostas : localRespostas;

  useEffect(() => {
    if (!apiEnabled) {
      localStorage.setItem(STORAGE_KEY_ANAMNESES, JSON.stringify(localAnamneses));
      localStorage.setItem(STORAGE_KEY_RESPOSTAS, JSON.stringify(localRespostas));
    }
  }, [apiEnabled, localAnamneses, localRespostas]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['anamneses'] });
    void queryClient.invalidateQueries({ queryKey: ['respostas-anamnese'] });
  };

  const addAnamnese = async (anamneseData: Omit<Anamnese, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (apiEnabled) {
      const id = await createResource('/anamneses', {
        nome: anamneseData.nome,
        especialidade: anamneseData.especialidade,
        versao: anamneseData.versao,
        status: anamneseData.status,
        questionnaire: anamneseData.questionnaire,
        observacoes: anamneseData.observacoes,
      });
      await invalidate();
      return { ...anamneseData, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    }
    const newAnamnese: Anamnese = {
      ...anamneseData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setLocalAnamneses((prev) => [...prev, newAnamnese]);
    return newAnamnese;
  };

  const updateAnamnese = async (id: string, anamneseData: Partial<Omit<Anamnese, 'id' | 'createdAt'>>) => {
    if (apiEnabled) {
      const cur = anamneses.find((a) => a.id === id);
      if (!cur) return;
      await updateResource('/anamneses', id, { ...cur, ...anamneseData });
      await invalidate();
      return;
    }
    setLocalAnamneses((prev) =>
      prev.map((anamnese) =>
        anamnese.id === id
          ? { ...anamnese, ...anamneseData, updatedAt: new Date().toISOString() }
          : anamnese,
      ),
    );
  };

  const deleteAnamnese = async (id: string) => {
    if (id === 'basica') {
      throw new Error('Não é possível excluir a anamnese básica');
    }
    if (apiEnabled) {
      await deleteResource('/anamneses', id);
      await invalidate();
      return;
    }
    setLocalAnamneses((prev) => prev.filter((anamnese) => anamnese.id !== id));
  };

  const getAnamneseById = (id: string) => {
    return anamneses.find((anamnese) => anamnese.id === id);
  };

  const getAnamnesesByEspecialidade = (especialidade: string) => {
    return anamneses.filter(
      (anamnese) => anamnese.especialidade === especialidade && anamnese.status === 'Ativa'
    );
  };

  const getAnamneseBasica = () => {
    return anamneses.find((a) => a.especialidade === 'Básica' && a.status === 'Ativa');
  };

  // Gerenciamento de Respostas
  const addResposta = async (respostaData: Omit<RespostaAnamnese, 'id' | 'createdAt'>) => {
    if (apiEnabled) {
      const id = await createResource('/respostas-anamnese', {
        questionnaire_id: respostaData.questionnaire_id,
        questionnaire_nome: respostaData.questionnaire_nome,
        patient_id: respostaData.patient_id,
        patient_nome: respostaData.patient_nome,
        encounter_id: respostaData.encounter_id,
        respostas: respostaData.respostas,
        data_hora: respostaData.data_hora,
      });
      await invalidate();
      return { ...respostaData, id, createdAt: new Date().toISOString() };
    }
    const newResposta: RespostaAnamnese = {
      ...respostaData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setLocalRespostas((prev) => [...prev, newResposta]);
    return newResposta;
  };

  const getRespostasByPaciente = (patientId: string) => {
    return respostas.filter((resp) => resp.patient_id === patientId);
  };

  const getRespostasByEncounter = (encounterId: string) => {
    return respostas.filter((resp) => resp.encounter_id === encounterId);
  };

  // Validação de lógica condicional
  const shouldShowQuestion = (question: QuestionItem, respostasAtuais: Record<string, any>): boolean => {
    if (!question.enableWhen || question.enableWhen.length === 0) {
      return true;
    }

    return question.enableWhen.every((condition) => {
      const valorDependente = respostasAtuais[condition.linkId];
      
      if (condition.operator === 'exists') {
        return valorDependente !== undefined && valorDependente !== null && valorDependente !== '';
      }
      
      if (condition.operator === 'equals') {
        if (condition.answerBoolean !== undefined) {
          return valorDependente === condition.answerBoolean;
        }
        if (condition.answerString !== undefined) {
          return valorDependente === condition.answerString;
        }
      }
      
      return false;
    });
  };

  return {
    anamneses,
    respostas,
    addAnamnese,
    updateAnamnese,
    deleteAnamnese,
    getAnamneseById,
    getAnamnesesByEspecialidade,
    getAnamneseBasica,
    addResposta,
    getRespostasByPaciente,
    getRespostasByEncounter,
    shouldShowQuestion,
  };
};
