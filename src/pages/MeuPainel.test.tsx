import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MeuPainel from './MeuPainel';
import { UnidadeProvider } from '@/contexts/UnidadeContext';
import type { Consulta } from '@/hooks/useConsultas';
import type { Profissional } from '@/hooks/useProfissionais';
import type { Lancamento } from '@/hooks/useFinanceiro';

vi.mock('@/lib/featureFlags', () => ({
  featureFlags: {
    profissionaisApiEnabled: false,
    pacientesApiEnabled: false,
    consultasApiEnabled: false,
    financeiroApiEnabled: false,
  },
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

const authState: { role: 'admin' | 'gestor' | 'funcionario' | 'terceiro'; email: string } = {
  role: 'funcionario',
  email: 'prof@clinica.com',
};
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'Profissional Teste', email: authState.email, role: authState.role },
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

const PROF_ID = 'prof-1';
const PROF_ID_2 = 'prof-2';

const seedProfissionais = (extra: Profissional[] = []) => {
  const p: Profissional = {
    id: PROF_ID,
    nome: 'Dra. Maria',
    email: 'prof@clinica.com',
    status: 'ativo',
    unidadeIds: ['unidade-catanduva'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem('profissionais', JSON.stringify([p, ...extra]));
};

const seedProfissional = () => seedProfissionais();

const isoHoje = (h: number) => {
  const d = new Date();
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
};

const baseConsulta = (over: Partial<Consulta>): Consulta => ({
  id: over.id ?? crypto.randomUUID(),
  pacienteId: 'pac1',
  pacienteNome: 'Paciente X',
  profissionalId: PROF_ID,
  profissionalNome: 'Dra. Maria',
  dataHora: isoHoje(14),
  duracao: 30,
  motivo: 'Consulta',
  status: 'agendada',
  status_atendimento: 'atendimento_pendente',
  dataCriacao: new Date().toISOString(),
  dataAtualizacao: new Date().toISOString(),
  ...over,
});

const renderPage = (initialEntry = '/meu-painel') => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <UnidadeProvider>
          <Routes>
            <Route path="/meu-painel" element={<MeuPainel />} />
          </Routes>
        </UnidadeProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('MeuPainel', () => {
  beforeEach(() => {
    localStorage.clear();
    navigateMock.mockReset();
    authState.role = 'funcionario';
    authState.email = 'prof@clinica.com';
    seedProfissional();
  });

  it('renderiza saudação com nome do profissional e ações rápidas', () => {
    localStorage.setItem('consultas', JSON.stringify([]));
    renderPage();

    expect(screen.getByText(/Olá, Dra. Maria/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Profissional/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Abrir Minha Agenda/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Prontuários/i })).toBeInTheDocument();
  });

  it('navega para /minha-agenda com profissionalId ao clicar em Abrir Minha Agenda', () => {
    localStorage.setItem('consultas', JSON.stringify([]));
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Abrir Minha Agenda/i }));
    expect(navigateMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/minha-agenda\?.*profissionalId=prof-1/),
    );
  });

  it('mostra próximo atendimento e botão Iniciar Atendimento navega para prontuário', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-28T10:00:00'));
    try {
      const c = baseConsulta({
        id: 'next1',
        pacienteNome: 'Paciente Futuro',
        dataHora: new Date('2026-05-28T14:00:00').toISOString(),
      });
      localStorage.setItem('consultas', JSON.stringify([c]));

      renderPage();

      expect(screen.getAllByText('Paciente Futuro').length).toBeGreaterThanOrEqual(1);
      fireEvent.click(screen.getByRole('button', { name: /Iniciar Atendimento/i }));
      expect(navigateMock).toHaveBeenCalledWith('/prontuario/next1');
    } finally {
      vi.useRealTimers();
    }
  });

  it('conta KPI de pendentes de prontuário (status aguardando_prontuario)', () => {
    localStorage.setItem(
      'consultas',
      JSON.stringify([
        baseConsulta({ id: 'a', status: 'concluida', status_atendimento: 'aguardando_prontuario' }),
        baseConsulta({ id: 'b', status: 'concluida', status_atendimento: 'aguardando_prontuario' }),
        baseConsulta({ id: 'c' }),
      ]),
    );

    renderPage();

    // Pega o título do KPI (primeiro match — card de KPI vem antes da lista rápida)
    const titulos = screen.getAllByText('Pendentes de prontuário');
    const kpiCard = titulos[0].closest('[class*="rounded-lg border"]') as HTMLElement;
    expect(within(kpiCard).getByText('2')).toBeInTheDocument();
  });

  it('lista rápida "Pendentes de prontuário" tem botão Abrir que navega', () => {
    localStorage.setItem(
      'consultas',
      JSON.stringify([
        baseConsulta({
          id: 'pend1',
          status: 'concluida',
          status_atendimento: 'aguardando_prontuario',
          pacienteNome: 'Pendente Y',
        }),
      ]),
    );

    renderPage();

    const botoes = screen.getAllByRole('button', { name: /^Abrir$/i });
    expect(botoes.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(botoes[0]);
    expect(navigateMock).toHaveBeenCalledWith('/prontuario/pend1');
  });

  it('faturamento agrega valor pago via referência ao consulta.id no lançamento', () => {
    const c = baseConsulta({
      id: 'aprov1',
      status: 'concluida',
      status_atendimento: 'aprovado',
      prontuario_evolucao_id: 'ev1',
    });
    localStorage.setItem('consultas', JSON.stringify([c]));
    const lanc: Lancamento = {
      id: 'l1',
      tipo: 'Receita',
      descricao: 'Atendimento',
      valor: 250,
      data_vencimento: new Date().toISOString(),
      categoria_id: 'cat1',
      categoria_nome: 'Consultas',
      documento: `consulta:${c.id}`,
      status: 'Pago',
      recorrente: false,
      conciliado: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('financeiro_lancamentos', JSON.stringify([lanc]));

    renderPage();

    // R$ 250,00 aparece em "Aprovado" e em "Pago"
    expect(screen.getAllByText(/R\$\s*250,00/).length).toBeGreaterThanOrEqual(2);
    // 0 valor em "A receber" (única transação foi paga)
    expect(screen.getByText(/R\$\s*0,00/)).toBeInTheDocument();
  });

  it('admin vê select de profissional e saudação do primeiro ativo por padrão', () => {
    authState.role = 'admin';
    authState.email = 'admin@x.com';
    localStorage.setItem('consultas', JSON.stringify([]));

    renderPage('/meu-painel?unidade=all');

    expect(screen.queryByText(/Profissional não vinculado/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Profissional/i)).toBeInTheDocument();
    expect(screen.getByText(/Olá, Dra. Maria/i)).toBeInTheDocument();
  });

  it('admin ao trocar profissional no select atualiza saudação e dados', async () => {
    authState.role = 'admin';
    authState.email = 'admin@x.com';
    const prof2: Profissional = {
      id: PROF_ID_2,
      nome: 'Dr. João',
      email: 'joao@clinica.com',
      status: 'ativo',
      unidadeIds: ['unidade-catanduva'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    seedProfissionais([prof2]);
    localStorage.setItem(
      'consultas',
      JSON.stringify([
        baseConsulta({ id: 'c1', pacienteNome: 'Paciente Maria' }),
        baseConsulta({
          id: 'c2',
          profissionalId: PROF_ID_2,
          profissionalNome: 'Dr. João',
          pacienteNome: 'Paciente João',
        }),
      ]),
    );

    renderPage(`/meu-painel?unidade=all&profissionalId=${PROF_ID}`);

    const main = screen.getByRole('main');
    await waitFor(() => {
      expect(main).toHaveTextContent(/Olá, Dra. Maria/);
      expect(within(main).getAllByText('Paciente Maria').length).toBeGreaterThan(0);
    });
    expect(within(main).queryByText('Paciente João')).not.toBeInTheDocument();

    fireEvent.click(within(main).getByLabelText(/Profissional/i));
    fireEvent.click(screen.getByRole('option', { name: /Dr. João/i }));

    await waitFor(() => {
      expect(main).toHaveTextContent(/Olá, Dr. João/);
      expect(within(main).getAllByText('Paciente João').length).toBeGreaterThan(0);
    });
    expect(within(main).queryByText('Paciente Maria')).not.toBeInTheDocument();
  });

  it('admin com profissionalId na URL mantém seleção', () => {
    authState.role = 'admin';
    authState.email = 'admin@x.com';
    const prof2: Profissional = {
      id: PROF_ID_2,
      nome: 'Dr. João',
      email: 'joao@clinica.com',
      status: 'ativo',
      unidadeIds: ['unidade-catanduva'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    seedProfissionais([prof2]);
    localStorage.setItem('consultas', JSON.stringify([]));

    renderPage(`/meu-painel?profissionalId=${PROF_ID_2}&unidade=all`);

    expect(screen.getByRole('main')).toHaveTextContent(/Olá, Dr. João/);
  });

  it('funcionario sem vínculo vê alerta destrutivo', () => {
    authState.role = 'funcionario';
    authState.email = 'desconhecido@x.com';
    localStorage.setItem('profissionais', JSON.stringify([]));
    localStorage.setItem('consultas', JSON.stringify([]));

    renderPage();

    expect(screen.getByText(/Profissional não vinculado/i)).toBeInTheDocument();
  });
});
