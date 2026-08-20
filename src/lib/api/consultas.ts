import { apiRequest } from '@/lib/api/client';
import type { ListMeta } from '@/lib/api/types';
import type { ConsultaDTO, ListConsultasParams } from '@/lib/api/consultas.types';

function buildQuery(params: ListConsultasParams): string {
  const q = new URLSearchParams();
  if (params.unidade_id) q.set('unidade_id', params.unidade_id);
  if (params.profissional_id) q.set('profissional_id', params.profissional_id);
  if (params.data_inicio) q.set('data_inicio', params.data_inicio);
  if (params.data_fim) q.set('data_fim', params.data_fim);
  if (params.status) q.set('status', params.status);
  if (params.page) q.set('page', String(params.page));
  if (params.page_size) q.set('page_size', String(params.page_size));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export async function listConsultas(
  params: ListConsultasParams = {}
): Promise<{ items: ConsultaDTO[]; meta: ListMeta }> {
  const { data, meta } = await apiRequest<ConsultaDTO[]>(
    `/consultas${buildQuery(params)}`
  );
  return {
    items: data ?? [],
    meta: (meta as ListMeta) ?? { page: 1, page_size: 50, total: 0, total_pages: 0 },
  };
}

export async function createConsulta(payload: unknown): Promise<string> {
  const { data } = await apiRequest<{ id: string }>('/consultas', {
    method: 'POST',
    body: payload,
  });
  return data.id;
}

export async function updateConsulta(id: string, payload: unknown): Promise<ConsultaDTO> {
  const { data } = await apiRequest<ConsultaDTO>(`/consultas/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: payload,
  });
  return data;
}

export async function deleteConsulta(id: string): Promise<void> {
  await apiRequest(`/consultas/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function confirmarConsulta(id: string): Promise<ConsultaDTO> {
  const { data } = await apiRequest<ConsultaDTO>(
    `/consultas/${encodeURIComponent(id)}/confirmar`,
    { method: 'POST' }
  );
  return data;
}

export async function cancelarConsulta(id: string): Promise<ConsultaDTO> {
  const { data } = await apiRequest<ConsultaDTO>(
    `/consultas/${encodeURIComponent(id)}/cancelar`,
    { method: 'POST' }
  );
  return data;
}

export async function concluirConsulta(id: string): Promise<ConsultaDTO> {
  const { data } = await apiRequest<ConsultaDTO>(
    `/consultas/${encodeURIComponent(id)}/concluir`,
    { method: 'POST' }
  );
  return data;
}

export async function vincularProntuarioConsulta(
  id: string,
  evolucaoId: string,
): Promise<ConsultaDTO> {
  const { data } = await apiRequest<ConsultaDTO>(
    `/consultas/${encodeURIComponent(id)}/vincular-prontuario`,
    { method: 'POST', body: { evolucao_id: evolucaoId } },
  );
  return data;
}

export async function aprovarAtendimentoConsulta(id: string): Promise<ConsultaDTO> {
  const { data } = await apiRequest<ConsultaDTO>(
    `/consultas/${encodeURIComponent(id)}/aprovar-atendimento`,
    { method: 'POST' },
  );
  return data;
}

export async function rejeitarAtendimentoConsulta(
  id: string,
  motivo: string,
): Promise<ConsultaDTO> {
  const { data } = await apiRequest<ConsultaDTO>(
    `/consultas/${encodeURIComponent(id)}/rejeitar-atendimento`,
    { method: 'POST', body: { motivo } },
  );
  return data;
}
