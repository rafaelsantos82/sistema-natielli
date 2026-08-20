import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Contratos from '@/pages/Contratos';

vi.mock('@/hooks/useContratos', () => ({
  useContratosList: () => ({
    data: { items: [{ id: '1', titulo: 'Teste', tipo: 'Atendimento', status: 'Rascunho', criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() }] },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useContratoDetail: () => ({ data: undefined, isLoading: false }),
  useContratosMutations: () => ({
    createMutation: { mutateAsync: vi.fn(), isPending: false },
    updateMutation: { mutateAsync: vi.fn(), isPending: false },
    replaceArquivoMutation: { mutateAsync: vi.fn(), isPending: false },
    deleteMutation: { mutateAsync: vi.fn(), isPending: false },
    compartilharMutation: { mutateAsync: vi.fn(), isPending: false },
    solicitarAssinaturaMutation: { mutateAsync: vi.fn(), isPending: false },
  }),
}));

vi.mock('@/hooks/usePacientes', () => ({
  usePacientesOptions: () => ({ options: [] }),
}));

vi.mock('@/hooks/useProfissionais', () => ({
  useProfissionais: () => ({ list: () => [] }),
}));

vi.mock('@/components/layout/MainLayout', () => ({
  MainLayout: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock('@/components/contratos/ContratoViewModal', () => ({
  ContratoViewModal: () => null,
}));

function wrap(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Contratos page', () => {
  it('renderiza título e contrato na tabela', () => {
    render(wrap(<Contratos />));
    expect(screen.getByText('Contratos')).toBeInTheDocument();
    expect(screen.getByText('Teste')).toBeInTheDocument();
    expect(screen.getByText('Novo Contrato')).toBeInTheDocument();
  });
});
