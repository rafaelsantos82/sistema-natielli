import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Pacientes from '@/pages/Pacientes';
import { listPacientes } from '@/lib/api/pacientes';
import type { PacienteDTO } from '@/lib/api/pacientes.types';

vi.mock('@/lib/featureFlags', () => ({
  featureFlags: {
    pacientesApiEnabled: true,
    authBootstrapEnabled: false,
    unidadesApiEnabled: false,
    consultasApiEnabled: false,
  },
}));

vi.mock('@/lib/api/pacientes', () => ({
  listPacientes: vi.fn(),
  getPaciente: vi.fn(),
  createPaciente: vi.fn(),
  updatePaciente: vi.fn(),
  deletePaciente: vi.fn(),
  restorePaciente: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'Admin', email: 'a@x.com', role: 'admin' },
    canWritePacientes: true,
    canWrite: () => true,
    canDelete: () => true,
  }),
}));

vi.mock('@/contexts/UnidadeContext', () => ({
  useUnidadeAtiva: () => ({
    isTodasUnidades: true,
    unidadeAtivaId: 'unidade-catanduva',
    unidadeAtiva: { id: 'unidade-catanduva', nome: 'Catanduva' },
    unidades: [
      {
        id: 'unidade-catanduva',
        apiId: 'a0000000-0000-4000-8000-000000000003',
        nome: 'Catanduva',
      },
      {
        id: 'unidade-londrina',
        apiId: 'a0000000-0000-4000-8000-000000000004',
        nome: 'Londrina',
      },
    ],
  }),
}));

vi.mock('@/components/layout/MainLayout', () => ({
  MainLayout: ({ children, title }: { children: ReactNode; title: string }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock('@/components/common/ClinicalScopeBanner', () => ({
  ClinicalScopeBanner: () => null,
}));

vi.mock('@/components/forms/PacienteForm', () => ({ PacienteForm: () => null }));
vi.mock('@/components/forms/PacienteQuickForm', () => ({ PacienteQuickForm: () => null }));
vi.mock('@/components/pacientes/PacienteViewModal', () => ({
  PacienteViewModal: () => null,
}));

function dto(over: Partial<PacienteDTO> & { id: string; nome_completo: string }): PacienteDTO {
  return {
    data_nascimento: '2015-01-01',
    sexo_biologico: 'masculino',
    tel_principal: '11999999999',
    uf: 'SP',
    cep: '01310100',
    responsavel_nome: 'Resp',
    consentimento_lgpd: true,
    autorizacao_uso_imagem: false,
    status: 'ativo',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...over,
  };
}

function wrap(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Pacientes — paginação TODAS', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listPacientes).mockImplementation(async (params) => {
      if (params.page === 2) {
        return {
          items: [dto({ id: 'p-p2', nome_completo: 'Paciente Página Dois' })],
          meta: { page: 2, page_size: 20, total: 270, total_pages: 14 },
        };
      }
      return {
        items: [
          dto({
            id: 'p-p1',
            nome_completo: 'Paciente Página Um',
            unidades: [
              {
                unidade_id: 'a0000000-0000-4000-8000-000000000004',
                principal: true,
                ativo: true,
              },
            ],
          }),
        ],
        meta: { page: 1, page_size: 20, total: 270, total_pages: 14 },
      };
    });
  });

  it('mostra contagem, pager e avança para a página 2', async () => {
    const user = userEvent.setup();
    render(wrap(<Pacientes />));

    await waitFor(() => {
      expect(screen.getByText('Mostrando 1–20 de 270 pacientes')).toBeInTheDocument();
    });
    expect(screen.getByText('Paciente Página Um')).toBeInTheDocument();
    expect(screen.getByText('Londrina')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Próxima página' }));

    await waitFor(() => {
      expect(screen.getByText('Paciente Página Dois')).toBeInTheDocument();
    });
    expect(listPacientes).toHaveBeenCalledWith(expect.objectContaining({ page: 2, page_size: 20 }));
    expect(screen.getByText('Mostrando 21–40 de 270 pacientes')).toBeInTheDocument();
  });
});
