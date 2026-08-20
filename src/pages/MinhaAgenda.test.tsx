import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MinhaAgenda from './MinhaAgenda';
import { UnidadeProvider } from '@/contexts/UnidadeContext';
import { UNIDADE_PADRAO_ID } from '@/hooks/useUnidades';
import type { Consulta } from '@/hooks/useConsultas';
import type { Profissional } from '@/hooks/useProfissionais';
import type { RespostaAnamnese } from '@/hooks/useAnamneses';

vi.mock('@/lib/featureFlags', () => ({
  featureFlags: {
    profissionaisApiEnabled: false,
    pacientesApiEnabled: false,
    consultasApiEnabled: false,
  },
}));

// ---- Mocks: navegação ----
const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

// ---- Mock Auth (default: funcionario) ----
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
const TIJUCA_ID = 'unidade-tijuca';

const seedProfissionais = (extra: Profissional[] = []) => {
  const profissional: Profissional = {
    id: PROF_ID,
    nome: 'Dra. Maria',
    email: 'prof@clinica.com',
    status: 'ativo',
    unidadeIds: ['unidade-duque-caxias'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem('profissionais', JSON.stringify([profissional, ...extra]));
};

const seedProfissional = () => seedProfissionais();

const isoHoje = (h = 14, m = 0) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};
const isoDias = (deltaDias: number, h = 10) => {
  const d = new Date();
  d.setDate(d.getDate() + deltaDias);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
};

const baseConsulta = (over: Partial<Consulta>): Consulta => ({
  id: over.id ?? crypto.randomUUID(),
  pacienteId: 'pac1',
  pacienteNome: 'Paciente X',
  profissionalId: PROF_ID,
  profissionalNome: 'Dra. Maria',
  dataHora: isoHoje(),
  duracao: 30,
  motivo: 'Consulta',
  status: 'agendada',
  status_atendimento: 'atendimento_pendente',
  dataCriacao: new Date().toISOString(),
  dataAtualizacao: new Date().toISOString(),
  ...over,
});

const seedConsultas = (lista: Consulta[]) => {
  localStorage.setItem('consultas', JSON.stringify(lista));
};

const seedRespostasAnamnese = (consultaIds: string[]) => {
  const respostas: RespostaAnamnese[] = consultaIds.map((id) => ({
    id: crypto.randomUUID(),
    questionnaire_id: 'basica',
    questionnaire_nome: 'Anamnese Básica',
    patient_id: 'pac1',
    patient_nome: 'Paciente X',
    encounter_id: id,
    respostas: {},
    data_hora: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }));
  localStorage.setItem('respostas_anamneses', JSON.stringify(respostas));
};

const renderPage = (initialEntry = '/minha-agenda') => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <UnidadeProvider>
          <Routes>
            <Route path="/minha-agenda" element={<MinhaAgenda />} />
          </Routes>
        </UnidadeProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('MinhaAgenda', () => {
  beforeEach(() => {
    localStorage.clear();
    navigateMock.mockReset();
    authState.role = 'funcionario';
    authState.email = 'prof@clinica.com';
    seedProfissional();
  });

  it('agrupa atendimentos em Hoje, Próximos e Passados', () => {
    const cHoje = baseConsulta({ id: 'h1', pacienteNome: 'Paciente Hoje', dataHora: isoHoje(15) });
    const cFuturo = baseConsulta({
      id: 'f1',
      pacienteNome: 'Paciente Futuro',
      dataHora: isoDias(2),
    });
    const cPassado = baseConsulta({
      id: 'p1',
      pacienteNome: 'Paciente Passado',
      dataHora: isoDias(-3),
    });
    seedConsultas([cHoje, cFuturo, cPassado]);

    renderPage();

    // Cada card de seção é a Card raiz contendo o título
    const hojeCard = screen.getByText('Hoje').closest('[class*="rounded-lg border"]') as HTMLElement;
    const futurosCard = screen
      .getByText('Próximos dias')
      .closest('[class*="rounded-lg border"]') as HTMLElement;
    const passadosCard = screen
      .getByText('Passados')
      .closest('[class*="rounded-lg border"]') as HTMLElement;

    expect(within(hojeCard).getByText('Paciente Hoje')).toBeInTheDocument();
    expect(within(futurosCard).getByText('Paciente Futuro')).toBeInTheDocument();
    expect(within(passadosCard).getByText('Paciente Passado')).toBeInTheDocument();

    // Cross-checks: cada paciente aparece apenas em sua seção
    expect(within(hojeCard).queryByText('Paciente Futuro')).not.toBeInTheDocument();
    expect(within(futurosCard).queryByText('Paciente Hoje')).not.toBeInTheDocument();
  });

  it('filtra por profissional logado e ignora consultas de outros', () => {
    const minha = baseConsulta({ id: 'm1', pacienteNome: 'Meu Paciente', dataHora: isoHoje(9) });
    const deOutro = baseConsulta({
      id: 'o1',
      pacienteNome: 'Paciente Alheio',
      profissionalId: 'outro-prof',
      dataHora: isoHoje(10),
    });
    seedConsultas([minha, deOutro]);

    renderPage();

    expect(screen.getByText('Meu Paciente')).toBeInTheDocument();
    expect(screen.queryByText('Paciente Alheio')).not.toBeInTheDocument();
  });

  it('semáforo verde para aprovado, vermelho para aguardando_prontuario, amarelo para pronto_para_aprovacao', () => {
    seedConsultas([
      baseConsulta({
        id: 'aprov',
        status: 'concluida',
        status_atendimento: 'aprovado',
        prontuario_evolucao_id: 'ev1',
        dataHora: isoHoje(8),
      }),
      baseConsulta({
        id: 'aguard',
        status: 'concluida',
        status_atendimento: 'aguardando_prontuario',
        dataHora: isoHoje(9),
      }),
      baseConsulta({
        id: 'pronto',
        status: 'concluida',
        status_atendimento: 'pronto_para_aprovacao',
        prontuario_evolucao_id: 'ev2',
        dataHora: isoHoje(10),
      }),
    ]);

    const { container } = renderPage();

    // Conta cada classe de semáforo (regra de negócio do componente)
    expect(container.querySelectorAll('.bg-success').length).toBeGreaterThanOrEqual(1);
    expect(container.querySelectorAll('.bg-destructive').length).toBeGreaterThanOrEqual(1);
    expect(container.querySelectorAll('.bg-warning').length).toBeGreaterThanOrEqual(1);
  });

  it('marca anamnese e prontuário corretamente nos indicadores', () => {
    const c = baseConsulta({
      id: 'c1',
      dataHora: isoHoje(11),
      prontuario_evolucao_id: 'ev1',
    });
    seedConsultas([c]);
    seedRespostasAnamnese(['c1']);

    renderPage();

    const item = screen.getByText('Paciente X').closest('div')!.parentElement!.parentElement!;
    const anamneseBadge = within(item).getByText('Anamnese').closest('div')!;
    const prontuarioBadge = within(item).getByText('Prontuário').closest('div')!;
    expect(anamneseBadge.className).toMatch(/text-success/);
    expect(prontuarioBadge.className).toMatch(/text-success/);
  });

  it('Iniciar leva ao prontuário e confirma presença em consulta agendada', () => {
    const c = baseConsulta({ id: 'init1', status: 'agendada', dataHora: isoHoje(16) });
    seedConsultas([c]);

    renderPage();

    const btn = screen.getByRole('button', { name: /Iniciar/i });
    fireEvent.click(btn);

    expect(navigateMock).toHaveBeenCalledWith('/prontuario/init1');
    const stored = JSON.parse(localStorage.getItem('consultas') ?? '[]') as Consulta[];
    expect(stored[0].status).toBe('confirmada');
    expect(stored[0].confirmacaoPresenca).toBe(true);
  });

  it('mostra alerta quando profissional não está vinculado', () => {
    authState.email = 'desconhecido@x.com';
    authState.role = 'funcionario';
    localStorage.removeItem('profissionais');
    seedConsultas([]);

    renderPage();

    expect(screen.getByText(/Profissional não vinculado/i)).toBeInTheDocument();
  });

  it('admin vê select de profissional e de unidade', () => {
    authState.role = 'admin';
    authState.email = 'admin@x.com';
    seedConsultas([]);

    renderPage('/minha-agenda?unidade=all');

    const main = screen.getByRole('main');
    expect(within(main).getByLabelText(/Profissional/i)).toBeInTheDocument();
    expect(within(main).getByLabelText(/Filtrar por unidade/i)).toBeInTheDocument();
    expect(main).toHaveTextContent(/Visualizando agenda de Dra. Maria/);
  });

  it('admin ao trocar profissional no select atualiza consultas listadas', async () => {
    authState.role = 'admin';
    authState.email = 'admin@x.com';
    const prof2: Profissional = {
      id: PROF_ID_2,
      nome: 'Dr. João',
      email: 'joao@clinica.com',
      status: 'ativo',
      unidadeIds: ['unidade-duque-caxias'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    seedProfissionais([prof2]);
    seedConsultas([
      baseConsulta({ id: 'c1', pacienteNome: 'Paciente Maria', dataHora: isoHoje(9) }),
      baseConsulta({
        id: 'c2',
        profissionalId: PROF_ID_2,
        profissionalNome: 'Dr. João',
        pacienteNome: 'Paciente João',
        dataHora: isoHoje(10),
      }),
    ]);

    renderPage(`/minha-agenda?unidade=all&profissionalId=${PROF_ID}`);

    const main = screen.getByRole('main');
    await waitFor(() => {
      expect(within(main).getByText('Paciente Maria')).toBeInTheDocument();
    });
    expect(within(main).queryByText('Paciente João')).not.toBeInTheDocument();

    fireEvent.click(within(main).getByLabelText(/Profissional/i));
    fireEvent.click(screen.getByRole('option', { name: /Dr. João/i }));

    await waitFor(() => {
      expect(within(main).getByText('Paciente João')).toBeInTheDocument();
    });
    expect(within(main).queryByText('Paciente Maria')).not.toBeInTheDocument();
  });

  it('admin com profissionalId na URL mantém profissional na agenda', () => {
    authState.role = 'admin';
    authState.email = 'admin@x.com';
    const prof2: Profissional = {
      id: PROF_ID_2,
      nome: 'Dr. João',
      email: 'joao@clinica.com',
      status: 'ativo',
      unidadeIds: ['unidade-duque-caxias'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    seedProfissionais([prof2]);
    seedConsultas([
      baseConsulta({
        id: 'c2',
        profissionalId: PROF_ID_2,
        pacienteNome: 'Paciente João',
        dataHora: isoHoje(11),
      }),
    ]);

    renderPage(`/minha-agenda?profissionalId=${PROF_ID_2}&unidade=all`);

    const main = screen.getByRole('main');
    expect(main).toHaveTextContent(/Visualizando agenda de Dr. João/);
    expect(within(main).getByText('Paciente João')).toBeInTheDocument();
  });

  it('admin filtra consultas pela unidade selecionada', () => {
    authState.role = 'admin';
    authState.email = 'admin@x.com';
    seedProfissionais([
      {
        id: PROF_ID,
        nome: 'Dra. Maria',
        email: 'admin@x.com',
        status: 'ativo',
        unidadeIds: [UNIDADE_PADRAO_ID, TIJUCA_ID],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Profissional,
    ]);
    seedConsultas([
      baseConsulta({
        id: 'cdc',
        pacienteNome: 'Paciente DC',
        unidadeId: UNIDADE_PADRAO_ID,
        dataHora: isoHoje(8),
      }),
      baseConsulta({
        id: 'ctj',
        pacienteNome: 'Paciente Tijuca',
        unidadeId: TIJUCA_ID,
        dataHora: isoHoje(9),
      }),
    ]);

    renderPage(`/minha-agenda?profissionalId=${PROF_ID}&unidade=${UNIDADE_PADRAO_ID}`);

    expect(screen.getByText('Paciente DC')).toBeInTheDocument();
    expect(screen.queryByText('Paciente Tijuca')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/Filtrar por unidade/i));
    fireEvent.click(screen.getByRole('option', { name: /^Tijuca$/i }));

    expect(screen.getByText('Paciente Tijuca')).toBeInTheDocument();
    expect(screen.queryByText('Paciente DC')).not.toBeInTheDocument();
  });

  it('funcionário não vê select de profissional', () => {
    authState.role = 'funcionario';
    seedConsultas([baseConsulta({ id: 'c1', dataHora: isoHoje(12) })]);

    renderPage();

    const main = screen.getByRole('main');
    expect(within(main).queryByLabelText(/Profissional/i)).not.toBeInTheDocument();
    expect(main).toHaveTextContent(/Visualizando agenda de Dra. Maria/);
  });
});
