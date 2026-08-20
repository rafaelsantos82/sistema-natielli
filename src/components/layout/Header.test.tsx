import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from './Header';
import { UnidadeProvider } from '@/contexts/UnidadeContext';
import { SidebarProvider } from '@/components/ui/sidebar';

const authState: { unidadesPermitidas?: string[]; role: 'admin' | 'gestor' | 'funcionario' } = {
  unidadesPermitidas: undefined,
  role: 'admin',
};
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'u1',
      name: 'User',
      email: 'u@x.com',
      role: authState.role,
      unidadesPermitidas: authState.unidadesPermitidas,
    },
    login: vi.fn(),
    logout: vi.fn(),
    isLoading: false,
  }),
}));

const renderHeader = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <UnidadeProvider>
          <SidebarProvider>
            <Header title="Pacientes" />
          </SidebarProvider>
        </UnidadeProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('Header — seletor de unidade', () => {
  beforeEach(() => {
    localStorage.clear();
    authState.unidadesPermitidas = undefined;
    authState.role = 'admin';
  });

  it('exibe o título da página', () => {
    renderHeader();
    expect(screen.getByRole('heading', { name: 'Pacientes' })).toBeInTheDocument();
  });

  it('renderiza o Select de unidade quando há mais de uma unidade visível', () => {
    renderHeader();
    expect(screen.getByLabelText('Unidade')).toBeInTheDocument();
  });

  it('persiste a troca de unidade via Select', () => {
    renderHeader();
    const trigger = screen.getByLabelText('Unidade');
    // Força via API do Select (Radix) testando o estado em localStorage:
    // disparamos abertura e clique no item Londrina.
    fireEvent.click(trigger);
    const item = screen.getByText('Londrina');
    fireEvent.click(item);
    expect(localStorage.getItem('unidade_ativa')).toBe('unidade-londrina');
  });

  it('mostra Badge (sem Select) quando o usuário tem apenas uma unidade permitida', () => {
    authState.unidadesPermitidas = ['unidade-londrina'];
    renderHeader();
    expect(screen.queryByLabelText('Unidade')).not.toBeInTheDocument();
    expect(screen.getByText('Londrina')).toBeInTheDocument();
  });
});
