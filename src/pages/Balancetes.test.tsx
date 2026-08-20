import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Balancetes from './Balancetes';
import { tituloModal } from '@/lib/contabilidade/balanceteAjudaContent';

const gerarBalancete = vi.fn();

vi.mock('@/hooks/useBalancetes', () => ({
  useBalancetes: () => ({
    gerarBalancete,
    contas: [{ codigo: '1.1', nome: 'Caixa', tipo: 'Analítica', natureza: 'Devedora' }],
    lancamentos: [],
    isLoading: false,
    isError: false,
    addConta: vi.fn(),
    addLancamento: vi.fn(),
    refetch: vi.fn(),
  }),
}));

vi.mock('@/contexts/UnidadeContext', () => ({
  useUnidadeAtiva: () => ({
    unidadeAtivaId: 'unidade-duque-caxias',
    unidadeAtiva: { id: 'unidade-duque-caxias', nome: 'Duque de Caxias' },
  }),
}));

vi.mock('@/components/layout/MainLayout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('Balancetes page', () => {
  beforeEach(() => {
    gerarBalancete.mockReset();
  });

  it('chama gerarBalancete ao clicar em Gerar', async () => {
    gerarBalancete.mockResolvedValue({
      linhas: [
        {
          conta_codigo: '1.1',
          conta_nome: 'Caixa',
          tipo: 'Analítica',
          natureza: 'Devedora',
          nivel: 0,
          saldo_inicial: 0,
          debitos: 100,
          creditos: 0,
          saldo_final: 100,
          colunas: {
            saldoAnteriorDevedor: 0,
            saldoAnteriorCredor: 0,
            movimentoDevedor: 100,
            movimentoCredor: 0,
            saldoAtualDevedor: 100,
            saldoAtualCredor: 0,
          },
        },
      ],
      meta: {
        totalDebitos: 100,
        totalCreditos: 0,
        totalSaldoAnteriorDevedor: 0,
        totalSaldoAnteriorCredor: 0,
        totalSaldoAtualDevedor: 100,
        totalSaldoAtualCredor: 0,
        equilibrado: false,
        contasSemMovimento: 0,
      },
    });

    const qc = new QueryClient();
    render(
      <QueryClientProvider client={qc}>
        <Balancetes />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Gerar Balancete/i }));
    await waitFor(() => expect(gerarBalancete).toHaveBeenCalled());
    expect(await screen.findByText('Caixa')).toBeInTheDocument();
  });

  it('abre modal de ajuda ao clicar no botão ?', async () => {
    const qc = new QueryClient();
    render(
      <QueryClientProvider client={qc}>
        <Balancetes />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Ajuda/i }));
    expect(await screen.findByText(tituloModal)).toBeInTheDocument();
  });
});
