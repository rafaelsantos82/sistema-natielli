import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Configuracoes from './Configuracoes';

vi.mock('@/components/layout/MainLayout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/hooks/useUnidades', () => ({
  useUnidades: () => ({ unidades: [] }),
}));

const useUsersList = vi.fn();

vi.mock('@/hooks/useUsers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useUsers')>();
  return {
    ...actual,
    useUsersList: (...args: unknown[]) => useUsersList(...args),
    useUserMutations: () => ({
      createMutation: { mutateAsync: vi.fn(), isPending: false },
      updateMutation: { mutateAsync: vi.fn(), isPending: false },
      deleteMutation: { mutateAsync: vi.fn(), isPending: false },
      restoreMutation: { mutateAsync: vi.fn(), isPending: false },
    }),
  };
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Configuracoes />
    </QueryClientProvider>,
  );
}

describe('Configuracoes', () => {
  beforeEach(() => {
    useUsersList.mockReturnValue({
      data: {
        items: [
          {
            id: 'u1',
            name: 'Inativo User',
            email: 'inativo@example.com',
            role: 'funcionario',
            unidade_ids: [],
            deleted_at: '2026-01-01T00:00:00Z',
            excluido: true,
          },
        ],
      },
      isLoading: false,
      isError: false,
    });
  });

  it('exibe usuário excluído como inativo e botão Restaurar', () => {
    renderPage();
    expect(screen.getByText('inativo (excluído)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Restaurar/i })).toBeInTheDocument();
  });
});
