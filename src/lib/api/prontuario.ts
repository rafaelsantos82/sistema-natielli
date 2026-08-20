import { apiRequest } from '@/lib/api/client';

export interface ProntuarioPacienteDTO {
  paciente_id: string;
  evolucoes: Array<{
    id: string;
    consulta_id: string;
    paciente_id: string;
    data: string;
    queixa_principal: string;
    historia_doenca: string;
    exame_fisico: string;
    hipotese_diagnostica: string;
    conduta: string;
    observacoes?: string;
  }>;
  prescricoes: Array<{
    id: string;
    consulta_id: string;
    paciente_id: string;
    data: string;
    medicamento: string;
    dosagem: string;
    frequencia: string;
    duracao: string;
    orientacoes?: string;
  }>;
  atestados: Array<{
    id: string;
    consulta_id: string;
    paciente_id: string;
    data: string;
    cid: string;
    dias_afastamento: number;
    data_inicio: string;
    data_fim: string;
    observacoes?: string;
  }>;
  documentos: Array<{
    id: string;
    consulta_id: string;
    paciente_id: string;
    nome: string;
    tipo: string;
    tamanho: number;
    data_upload: string;
    url: string;
  }>;
}

export async function getProntuarioPaciente(pacienteId: string): Promise<ProntuarioPacienteDTO> {
  const { data } = await apiRequest<ProntuarioPacienteDTO>(
    `/prontuario/pacientes/${encodeURIComponent(pacienteId)}`,
  );
  return data;
}

export async function createEvolucao(body: unknown) {
  const { data } = await apiRequest<{ id: string }>('/prontuario/evolucoes', {
    method: 'POST',
    body,
  });
  return data;
}

export async function deleteEvolucao(id: string) {
  await apiRequest(`/prontuario/evolucoes/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function createPrescricao(body: unknown) {
  const { data } = await apiRequest<{ id: string }>('/prontuario/prescricoes', {
    method: 'POST',
    body,
  });
  return data;
}

export async function deletePrescricao(id: string) {
  await apiRequest(`/prontuario/prescricoes/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function createAtestado(body: unknown) {
  const { data } = await apiRequest<{ id: string }>('/prontuario/atestados', {
    method: 'POST',
    body,
  });
  return data;
}

export async function deleteAtestado(id: string) {
  await apiRequest(`/prontuario/atestados/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function createDocumento(body: unknown) {
  const { data } = await apiRequest<{ id: string }>('/prontuario/documentos', {
    method: 'POST',
    body,
  });
  return data;
}

export async function deleteDocumento(id: string) {
  await apiRequest(`/prontuario/documentos/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
