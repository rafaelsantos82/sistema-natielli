import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AssinarDocumentoDialog } from './AssinarDocumentoDialog';

vi.mock('@/contexts/UnidadeContext', () => ({
  useUnidadeAtiva: () => ({
    unidadeAtiva: { id: 'u1', nome: 'Unidade A' },
    unidadeAtivaId: 'u1',
  }),
}));

const useChaveDigital = vi.fn();
const assinarMutation = { mutateAsync: vi.fn(), isPending: false };

vi.mock('@/hooks/useChaveDigital', () => ({
  useChaveDigital: (...args: unknown[]) => useChaveDigital(...args),
}));

vi.mock('@/hooks/useDocumentosAssinados', () => ({
  useDocumentosAssinadosMutations: () => ({
    assinarMutation,
    verificarMutation: { mutateAsync: vi.fn() },
    downloadMutation: { mutate: vi.fn() },
  }),
}));

function renderDialog(open = true) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AssinarDocumentoDialog
          isOpen={open}
          onClose={vi.fn()}
          documentBytes={new Uint8Array([0x25, 0x50, 0x44, 0x46])}
          documentName="doc-test"
          documentType="prontuario"
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AssinarDocumentoDialog', () => {
  beforeEach(() => {
    assinarMutation.mutateAsync.mockReset();
  });

  it('mostra alerta quando não há chave cadastrada', () => {
    useChaveDigital.mockReturnValue({ data: null, isLoading: false });
    renderDialog();
    expect(screen.getByText(/Não há chave digital cadastrada/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Chave Digital/i })).toHaveAttribute(
      'href',
      '/configuracoes/chave-digital',
    );
  });

  it('habilita assinar quando há chave', () => {
    useChaveDigital.mockReturnValue({
      data: {
        signer_common_name: 'Titular',
        cert_valid_to: '2027-01-01T00:00:00Z',
      },
      isLoading: false,
    });
    renderDialog();
    expect(screen.getByText('Titular')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Assinar$/i })).not.toBeDisabled();
  });
});
