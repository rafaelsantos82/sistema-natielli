import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ApiClientError } from '@/lib/api/client';
import {
  getPacientesListErrorMessage,
  usePacienteMutations,
  usePacientesList,
} from '@/hooks/usePacientes';
import { deletePaciente, listPacientes } from '@/lib/api/pacientes';

vi.mock('@/lib/featureFlags', () => ({
  featureFlags: { pacientesApiEnabled: true, authBootstrapEnabled: false },
}));

vi.mock('@/lib/api/pacientes', () => ({
  listPacientes: vi.fn(),
  getPaciente: vi.fn(),
  createPaciente: vi.fn(),
  updatePaciente: vi.fn(),
  deletePaciente: vi.fn(),
  restorePaciente: vi.fn(),
}));

vi.mock('@/contexts/UnidadeContext', () => ({
  useUnidadeAtiva: () => ({ unidadeAtivaId: 'unidade-catanduva' }),
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('usePacientesList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('propaga erro 401 sem retornar mocks', async () => {
    vi.mocked(listPacientes).mockRejectedValue(
      new ApiClientError(401, 'UNAUTHORIZED', 'Não autorizado')
    );

    const { result } = renderHook(() => usePacientesList(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
    expect(getPacientesListErrorMessage(result.current.error)).toMatch(/sessão expirada/i);
  });

  it('retorna linhas da API em sucesso', async () => {
    vi.mocked(listPacientes).mockResolvedValue({
      items: [
        {
          id: 'uuid-1',
          nome_completo: 'Paciente API',
          data_nascimento: '2015-01-01',
          sexo_biologico: 'masculino',
          tel_principal: '11999999999',
          uf: 'SP',
          cep: '01310100',
          responsavel_nome: 'Resp',
          consentimento_lgpd: true,
          status: 'ativo',
        },
      ],
      meta: { page: 1, page_size: 20, total: 1, total_pages: 1 },
    });

    const { result } = renderHook(() => usePacientesList(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.rows).toHaveLength(1);
    expect(result.current.data?.rows[0].nome).toBe('Paciente API');
    expect(listPacientes).toHaveBeenCalledWith(
      expect.objectContaining({
        unidade_id: 'a0000000-0000-4000-8000-000000000003',
      }),
    );
  });

  it('omite unidade_id quando todasUnidades', async () => {
    vi.mocked(listPacientes).mockResolvedValue({
      items: [],
      meta: { page: 1, page_size: 20, total: 0, total_pages: 0 },
    });

    const { result } = renderHook(
      () => usePacientesList('', 1, 20, { todasUnidades: true }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listPacientes).toHaveBeenCalledTimes(1);
    const params = vi.mocked(listPacientes).mock.calls[0][0] as Record<string, unknown>;
    expect(params.unidade_id).toBeUndefined();
  });

  it('envia page=2 na query da API', async () => {
    vi.mocked(listPacientes).mockResolvedValue({
      items: [],
      meta: { page: 2, page_size: 20, total: 40, total_pages: 2 },
    });

    const { result } = renderHook(() => usePacientesList('', 2, 20), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listPacientes).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, page_size: 20 }),
    );
  });

  it('não reutiliza cache de outro pageSize', async () => {
    vi.mocked(listPacientes).mockImplementation(async (params) => ({
      items:
        params.page_size === 20
          ? [
              {
                id: 'p-20',
                nome_completo: 'Um',
                data_nascimento: '2015-01-01',
                sexo_biologico: 'masculino',
                tel_principal: '11999999999',
                uf: 'SP',
                cep: '01310100',
                responsavel_nome: 'Resp',
                consentimento_lgpd: true,
                status: 'ativo',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              },
            ]
          : [
              {
                id: 'p-100-a',
                nome_completo: 'A',
                data_nascimento: '2015-01-01',
                sexo_biologico: 'masculino',
                tel_principal: '11999999999',
                uf: 'SP',
                cep: '01310100',
                responsavel_nome: 'Resp',
                consentimento_lgpd: true,
                status: 'ativo',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              },
              {
                id: 'p-100-b',
                nome_completo: 'B',
                data_nascimento: '2015-01-01',
                sexo_biologico: 'masculino',
                tel_principal: '11999999999',
                uf: 'SP',
                cep: '01310100',
                responsavel_nome: 'Resp',
                consentimento_lgpd: true,
                status: 'ativo',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              },
            ],
      meta: {
        page: 1,
        page_size: params.page_size ?? 20,
        total: 2,
        total_pages: 1,
      },
    }));

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const shared = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result: r20 } = renderHook(() => usePacientesList('', 1, 20), { wrapper: shared });
    const { result: r100 } = renderHook(() => usePacientesList('', 1, 100), {
      wrapper: shared,
    });

    await waitFor(() => {
      expect(r20.current.isSuccess).toBe(true);
      expect(r100.current.isSuccess).toBe(true);
    });
    expect(r20.current.data?.rows).toHaveLength(1);
    expect(r100.current.data?.rows).toHaveLength(2);
    expect(listPacientes).toHaveBeenCalledTimes(2);
  });
});

describe('usePacienteMutations delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('chama a API ao excluir paciente', async () => {
    vi.mocked(listPacientes).mockResolvedValue({
      items: [
        {
          id: 'p-1',
          nome_completo: 'Paciente API',
          data_nascimento: '2015-01-01',
          sexo_biologico: 'masculino',
          tel_principal: '11999999999',
          uf: 'SP',
          cep: '01310100',
          responsavel_nome: 'Resp',
          consentimento_lgpd: true,
          status: 'ativo',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
      meta: { page: 1, page_size: 20, total: 1, total_pages: 1 },
    });
    vi.mocked(deletePaciente).mockResolvedValue(undefined);

    const { result: listResult } = renderHook(() => usePacientesList(), { wrapper });
    await waitFor(() => expect(listResult.current.isSuccess).toBe(true));

    const { result: mutResult } = renderHook(() => usePacienteMutations(), { wrapper });
    await mutResult.current.deleteMutation.mutateAsync('p-1');

    expect(deletePaciente).toHaveBeenCalledWith('p-1');
  });
});

describe('getPacientesListErrorMessage', () => {
  it('mapeia falha de conexão', () => {
    const msg = getPacientesListErrorMessage(
      new ApiClientError(0, 'INTERNAL_ERROR', 'Falha')
    );
    expect(msg).toMatch(/conexão/i);
  });
});
