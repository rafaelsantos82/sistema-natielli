import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MeuPainel from './MeuPainel';
import { UnidadeProvider } from '@/contexts/UnidadeContext';
import { UNIDADE_PADRAO_ID } from '@/hooks/useUnidades';
import type { Consulta } from '@/hooks/useConsultas';
import type { Profissional } from '@/hooks/useProfissionais';

vi.mock('@/lib/featureFlags', () => ({
  featureFlags: {
    profissionaisApiEnabled: false,
    pacientesApiEnabled: false,
    consultasApiEnabled: false,
    financeiroApiEnabled: false,
  },
}));

const LONDRINA_ID = 'unidade-londrina';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

const authState: { role: 'admin' | 'gestor' | 'funcionario'; email: string } = {
  role: 'admin',
  email: 'admin@x.com',
};
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'u1',
      name: 'Admin',
      email: authState.email,
      role: authState.role,
      // Admin acessa todas as unidades
      unidadesPermitidas: undefined,
    },
    login: vi.fn(),
    logout: vi.fn(),
    isLoading: false,
    hasPermission: () => true,
    canRead: () => true,
    canWrite: () => true,
    canDelete: () => true,
    canWritePacientes: true,
  }),
}));

const PROF_ID = 'prof-multi';

const seedProfissional = () => {
  const p: Profissional = {
    id: PROF_ID,
    nome: 'Dra. Multi',
    email: 'admin@x.com',
    status: 'ativo',
    unidadeIds: [UNIDADE_PADRAO_ID, LONDRINA_ID],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Profissional;
  localStorage.setItem('profissionais', JSON.stringify([p]));
};

const isoHoje = (h: number) => {
  const d = new Date();
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
};

const baseConsulta = (over: Partial<Consulta>): Consulta => ({
  id: over.id ?? crypto.randomUUID(),
  pacienteId: 'pac1',
  pacienteNome: 'Paciente',
  profissionalId: PROF_ID,
  profissionalNome: 'Dra. Multi',
  dataHora: isoHoje(14),
  duracao: 30,
  motivo: 'Consulta',
  status: 'agendada',
  status_atendimento: 'atendimento_pendente',
  dataCriacao: new Date().toISOString(),
  dataAtualizacao: new Date().toISOString(),
  ...over,
});

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/meu-painel']}>
        <UnidadeProvider>
          <Routes>
            <Route path="/meu-painel" element={<MeuPainel />} />
          </Routes>
        </UnidadeProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('MeuPainel — filtro por unidade', () => {
  beforeEach(() => {
    localStorage.clear();
    authState.role = 'admin';
    authState.email = 'admin@x.com';
    seedProfissional();

    localStorage.setItem(
      'consultas',
      JSON.stringify([
        baseConsulta({
          id: 'cdc-1',
          pacienteNome: 'Paciente Catanduva',
          unidadeId: UNIDADE_PADRAO_ID,
          dataHora: isoHoje(10),
        }),
        baseConsulta({
          id: 'cdc-2',
          pacienteNome: 'Paciente Catanduva 2',
          unidadeId: UNIDADE_PADRAO_ID,
          dataHora: isoHoje(11),
        }),
        baseConsulta({
          id: 'ctj-1',
          pacienteNome: 'Paciente Londrina',
          unidadeId: LONDRINA_ID,
          dataHora: isoHoje(15),
        }),
      ]),
    );
  });

  it('exibe título com a unidade ativa por padrão (Catanduva)', () => {
    renderPage();
    expect(screen.getAllByText(/Meu Painel — Catanduva/i).length).toBeGreaterThan(0);
  });

  it('lista apenas consultas da unidade ativa por padrão', () => {
    renderPage();
    expect(screen.getAllByText('Paciente Catanduva').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Paciente Catanduva 2').length).toBeGreaterThan(0);
    expect(screen.queryByText('Paciente Londrina')).not.toBeInTheDocument();
  });

  it('admin pode escolher "Todas as unidades" e ver consultas de Catanduva e Londrina', () => {
    renderPage();
    const select = screen.getByLabelText(/Filtrar por unidade/i);
    fireEvent.click(select);
    fireEvent.click(screen.getByRole('option', { name: /Todas as unidades/i }));

    expect(screen.getAllByText('Paciente Catanduva').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Paciente Londrina').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Meu Painel — Todas as unidades/i).length).toBeGreaterThan(0);
  });

  it('ao escolher Londrina lista apenas consultas dessa unidade', () => {
    renderPage();
    const select = screen.getByLabelText(/Filtrar por unidade/i);
    fireEvent.click(select);
    fireEvent.click(screen.getByRole('option', { name: /^Londrina$/i }));

    expect(screen.getAllByText('Paciente Londrina').length).toBeGreaterThan(0);
    expect(screen.queryByText('Paciente Catanduva')).not.toBeInTheDocument();
    expect(screen.queryByText('Paciente Catanduva 2')).not.toBeInTheDocument();
    expect(screen.getAllByText(/Meu Painel — Londrina/i).length).toBeGreaterThan(0);
  });

  it('funcionario não vê opção "Todas as unidades"', () => {
    authState.role = 'funcionario';
    renderPage();
    const select = screen.getByLabelText(/Filtrar por unidade/i);
    fireEvent.click(select);
    expect(screen.queryByRole('option', { name: /Todas as unidades/i })).not.toBeInTheDocument();
  });
});
