import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Estoque from './Estoque';

vi.mock('@/components/layout/MainLayout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/hooks/useEstoque', () => ({
  useEstoque: () => ({
    itens: [
      {
        id: 'item-1',
        codigo: 'A01',
        nome: 'Item A',
        categoria: 'Geral',
        unidade_medida: 'un',
        estoque_atual: 5,
        estoque_minimo: 2,
        status: 'Ativo',
        createdAt: '',
        updatedAt: '',
      },
    ],
    movimentacoes: [],
    inventarios: [],
    getItensComEstoqueBaixo: () => [],
    addItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    getItemById: vi.fn(),
    addMovimentacao: vi.fn(),
    getMovimentacoesByItem: () => [],
    addInventario: vi.fn(),
  }),
  SALDO_INSUFICIENTE_MSG: 'Quantidade de saída excede o saldo disponível',
}));

vi.mock('@/lib/utils/estoqueReportGenerator', () => ({
  generateEstoquePDF: vi.fn(() => ({ save: vi.fn() })),
  generateMovimentacoesCSV: vi.fn(() => ''),
  downloadCSV: vi.fn(),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <Estoque />
    </MemoryRouter>,
  );
}

describe('Estoque — aba Relatórios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('monta filtros de relatório sem erro ao abrir a aba', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('tab', { name: /Relatórios/i }));

    await waitFor(() => {
      expect(screen.getByText('Filtros de Relatório')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Exportar PDF/i })).toBeInTheDocument();
  });
});
