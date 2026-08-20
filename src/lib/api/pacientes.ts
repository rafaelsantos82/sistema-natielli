import { apiRequest } from '@/lib/api/client';
import type { ListMeta } from '@/lib/api/types';
import type {
  CreatePacientePayload,
  ListPacientesParams,
  PacienteDTO,
  UpdatePacientePayload,
} from '@/lib/api/pacientes.types';

function buildQuery(params: ListPacientesParams): string {
  const q = new URLSearchParams();
  if (params.unidade_id) q.set('unidade_id', params.unidade_id);
  if (params.q) q.set('q', params.q);
  if (params.cpf) q.set('cpf', params.cpf);
  if (params.status) q.set('status', params.status);
  if (params.include_deleted) q.set('include_deleted', 'true');
  if (params.page) q.set('page', String(params.page));
  if (params.page_size) q.set('page_size', String(params.page_size));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export async function listPacientes(
  params: ListPacientesParams = {}
): Promise<{ items: PacienteDTO[]; meta: ListMeta }> {
  const { data, meta } = await apiRequest<PacienteDTO[]>(
    `/pacientes${buildQuery(params)}`
  );
  return {
    items: data ?? [],
    meta: (meta as ListMeta) ?? {
      page: 1,
      page_size: 20,
      total: 0,
      total_pages: 0,
    },
  };
}

export async function getPaciente(id: string): Promise<PacienteDTO> {
  const { data } = await apiRequest<PacienteDTO>(`/pacientes/${encodeURIComponent(id)}`);
  return data;
}

export async function createPaciente(
  payload: CreatePacientePayload
): Promise<string> {
  const { data } = await apiRequest<{ id: string }>('/pacientes', {
    method: 'POST',
    body: payload,
  });
  return data.id;
}

export async function updatePaciente(
  id: string,
  payload: UpdatePacientePayload
): Promise<PacienteDTO> {
  const { data } = await apiRequest<PacienteDTO>(
    `/pacientes/${encodeURIComponent(id)}`,
    { method: 'PUT', body: payload }
  );
  return data;
}

export async function deletePaciente(id: string): Promise<void> {
  await apiRequest<void>(`/pacientes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function restorePaciente(id: string): Promise<PacienteDTO> {
  const { data } = await apiRequest<PacienteDTO>(
    `/pacientes/${encodeURIComponent(id)}/restore`,
    { method: 'POST' },
  );
  return data;
}
