import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ChaveDigital from './ChaveDigital';

vi.mock('@/components/layout/MainLayout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/contexts/UnidadeContext', () => ({
  useUnidadeAtiva: () => ({
    unidadeAtiva: { id: 'u1', nome: 'Unidade Teste' },
    unidadeAtivaId: 'u1',
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    canWrite: () => true,
  }),
}));

const useChaveDigital = vi.fn();
const useChaveDigitalMutations = vi.fn();

vi.mock('@/hooks/useChaveDigital', () => ({
  useChaveDigital: (...args: unknown[]) => useChaveDigital(...args),
  useChaveDigitalMutations: () => useChaveDigitalMutations(),
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ChaveDigital />
    </QueryClientProvider>,
  );
}

describe('ChaveDigital', () => {
  beforeEach(() => {
    useChaveDigitalMutations.mockReturnValue({
      registerMutation: { mutate: vi.fn(), isPending: false },
      revokeMutation: { mutate: vi.fn(), isPending: false },
    });
  });

  it('exibe formulário de cadastro quando não há chave', () => {
    useChaveDigital.mockReturnValue({ data: null, isLoading: false, isError: false });
    renderPage();
    expect(screen.getByText(/Cadastrar certificado/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha do certificado/i)).toBeInTheDocument();
  });

  it('exibe metadados quando há chave ativa', () => {
    useChaveDigital.mockReturnValue({
      data: {
        id: 'k1',
        unidade_id: 'u1',
        signer_common_name: 'João Silva',
        cert_valid_from: '2025-01-01T00:00:00Z',
        cert_valid_to: '2027-01-01T00:00:00Z',
        cert_issuer: 'AC Teste',
        cert_serial: 'ABC123',
        algoritmo: 'SHA256withRSA',
        is_icp_brasil: true,
        is_valid: true,
      },
      isLoading: false,
      isError: false,
    });
    renderPage();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText(/Substituir certificado/i)).toBeInTheDocument();
  });
});
