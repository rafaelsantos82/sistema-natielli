import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Consultas from './Consultas';
import { UnidadeProvider } from '@/contexts/UnidadeContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import type { Consulta } from '@/hooks/useConsultas';

vi.mock('@/lib/featureFlags', () => ({
  featureFlags: {
    profissionaisApiEnabled: false,
    pacientesApiEnabled: false,
    consultasApiEnabled: false,
    salasApiEnabled: false,
    unidadesApiEnabled: false,
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

const authState = {
  role: 'admin' as 'admin' | 'gestor' | 'funcionario',
  unidadesPermitidas: undefined as string[] | undefined,
};
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'u1',
      name: 'Admin',
      email: 'admin@x.com',
      role: authState.role,
      unidadesPermitidas: authState.unidadesPermitidas,
    },
    login: vi.fn(),
    logout: vi.fn(),
    isLoading: false,
    hasPermission: () => true,
    canRead: () => true,
    canWrite: () => true,
    canDelete: () => true,
  }),
}));

const baseConsulta = (over: Partial<Consulta> & { unidadeId?: string }): Consulta =>
  ({
    id: over.id ?? crypto.randomUUID(),
    pacienteId: 'p1',
    pacienteNome: over.pacienteNome ?? 'Paciente X',
    profissionalId: 'pr1',
    profissionalNome: 'Dr. Y',
    dataHora: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    duracao: 30,
    motivo: 'Consulta',
    status: 'agendada',
    status_atendimento: 'atendimento_pendente',
    dataCriacao: new Date().toISOString(),
    dataAtualizacao: new Date().toISOString(),
    ...over,
  } as Consulta);

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <UnidadeProvider>
          <SidebarProvider>
            <Consultas />
          </SidebarProvider>
        </UnidadeProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('Consultas — filtro por unidade', () => {
  beforeEach(() => {
    localStorage.clear();
    authState.role = 'admin';
    authState.unidadesPermitidas = undefined;
  });

  it('lista somente consultas da unidade ativa por padrão', () => {
    localStorage.setItem(
      'consultas',
      JSON.stringify([
        baseConsulta({ id: 'c1', pacienteNome: 'Maria Catanduva', unidadeId: 'unidade-catanduva' }),
        baseConsulta({ id: 'c2', pacienteNome: 'João Londrina', unidadeId: 'unidade-londrina' }),
      ]),
    );
    renderPage();
    expect(screen.getByText('Maria Catanduva')).toBeInTheDocument();
    expect(screen.queryByText('João Londrina')).not.toBeInTheDocument();
  });

  it('ao alternar "Ver todas as unidades" exibe consultas de todas as unidades', () => {
    localStorage.setItem(
      'consultas',
      JSON.stringify([
        baseConsulta({ id: 'c1', pacienteNome: 'Maria Catanduva', unidadeId: 'unidade-catanduva' }),
        baseConsulta({ id: 'c2', pacienteNome: 'João Londrina', unidadeId: 'unidade-londrina' }),
      ]),
    );
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Ver todas as unidades/i }));
    expect(screen.getByText('Maria Catanduva')).toBeInTheDocument();
    expect(screen.getByText('João Londrina')).toBeInTheDocument();
  });

  it('consulta legada sem unidadeId é tratada como Catanduva', () => {
    localStorage.setItem(
      'consultas',
      JSON.stringify([
        baseConsulta({ id: 'c1', pacienteNome: 'Legado Sem Unidade' }),
      ]),
    );
    // remove unidadeId do registro persistido
    const arr = JSON.parse(localStorage.getItem('consultas')!);
    delete arr[0].unidadeId;
    localStorage.setItem('consultas', JSON.stringify(arr));

    renderPage();
    // unidade ativa default = catanduva → registro legado deve aparecer
    expect(screen.getByText('Legado Sem Unidade')).toBeInTheDocument();
  });
});
