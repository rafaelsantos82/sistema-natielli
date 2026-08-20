import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { UnidadeProvider, useUnidadeAtiva } from './UnidadeContext';
import { UNIDADE_TODAS_ID } from '@/hooks/useUnidades';

// Mock auth para controlar `unidadesPermitidas`.
const authState: { unidadesPermitidas?: string[] } = { unidadesPermitidas: undefined };
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'u1',
      name: 'User',
      email: 'u@x.com',
      role: 'admin',
      unidadesPermitidas: authState.unidadesPermitidas,
    },
    login: vi.fn(),
    logout: vi.fn(),
    isLoading: false,
  }),
}));

const Probe = () => {
  const {
    unidades,
    unidadeAtivaId,
    unidadeAtiva,
    podeTrocarUnidade,
    setUnidadeAtiva,
    seletorUnidadeId,
    isTodasUnidades,
  } = useUnidadeAtiva();
  return (
    <div>
      <div data-testid="ativa-id">{unidadeAtivaId}</div>
      <div data-testid="ativa-nome">{unidadeAtiva?.nome ?? '—'}</div>
      <div data-testid="seletor-id">{seletorUnidadeId}</div>
      <div data-testid="is-todas">{isTodasUnidades ? 'sim' : 'nao'}</div>
      <div data-testid="qtd">{unidades.length}</div>
      <div data-testid="pode-trocar">{podeTrocarUnidade ? 'sim' : 'nao'}</div>
      <button onClick={() => setUnidadeAtiva('unidade-londrina')}>trocar-londrina</button>
      <button onClick={() => setUnidadeAtiva(UNIDADE_TODAS_ID)}>trocar-todas</button>
    </div>
  );
};

const renderUnidade = (ui: ReactNode) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
};

describe('UnidadeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    authState.unidadesPermitidas = undefined;
  });

  it('faz seed das unidades padrão e ativa Catanduva por default', () => {
    renderUnidade(
      <UnidadeProvider>
        <Probe />
      </UnidadeProvider>,
    );
    expect(screen.getByTestId('ativa-id').textContent).toBe('unidade-catanduva');
    expect(screen.getByTestId('ativa-nome').textContent).toBe('Catanduva');
    expect(Number(screen.getByTestId('qtd').textContent)).toBe(4);
    expect(screen.getByTestId('pode-trocar').textContent).toBe('sim');
  });

  it('persiste a unidade ativa em localStorage ao trocar', () => {
    renderUnidade(
      <UnidadeProvider>
        <Probe />
      </UnidadeProvider>,
    );
    act(() => {
      screen.getByText('trocar-londrina').click();
    });
    expect(screen.getByTestId('ativa-id').textContent).toBe('unidade-londrina');
    expect(localStorage.getItem('unidade_ativa')).toBe('unidade-londrina');
    expect(localStorage.getItem('unidade_seletor')).toBeNull();
  });

  it('selecionar TODAS não troca a unidade operacional', () => {
    renderUnidade(
      <UnidadeProvider>
        <Probe />
      </UnidadeProvider>,
    );
    act(() => {
      screen.getByText('trocar-todas').click();
    });
    expect(screen.getByTestId('ativa-id').textContent).toBe('unidade-catanduva');
    expect(screen.getByTestId('seletor-id').textContent).toBe(UNIDADE_TODAS_ID);
    expect(screen.getByTestId('is-todas').textContent).toBe('sim');
    expect(localStorage.getItem('unidade_ativa')).toBe('unidade-catanduva');
    expect(localStorage.getItem('unidade_seletor')).toBe('todas');
  });

  it('lê TODAS do localStorage sem alterar a unidade operacional', () => {
    localStorage.setItem('unidade_ativa', 'unidade-londrina');
    localStorage.setItem('unidade_seletor', 'todas');
    renderUnidade(
      <UnidadeProvider>
        <Probe />
      </UnidadeProvider>,
    );
    expect(screen.getByTestId('ativa-id').textContent).toBe('unidade-londrina');
    expect(screen.getByTestId('seletor-id').textContent).toBe(UNIDADE_TODAS_ID);
  });

  it('lê a unidade ativa do localStorage no mount', () => {
    localStorage.setItem('unidade_ativa', 'unidade-londrina');
    renderUnidade(
      <UnidadeProvider>
        <Probe />
      </UnidadeProvider>,
    );
    expect(screen.getByTestId('ativa-id').textContent).toBe('unidade-londrina');
  });

  it('cai no fallback quando localStorage aponta para unidade removida', () => {
    localStorage.setItem('unidade_ativa', 'unidade-duque-caxias');
    renderUnidade(
      <UnidadeProvider>
        <Probe />
      </UnidadeProvider>,
    );
    expect(screen.getByTestId('ativa-id').textContent).toBe('unidade-catanduva');
    expect(localStorage.getItem('unidade_ativa')).toBe('unidade-catanduva');
  });

  it('restringe unidades visíveis quando o usuário tem unidadesPermitidas', () => {
    authState.unidadesPermitidas = ['unidade-londrina'];
    renderUnidade(
      <UnidadeProvider>
        <Probe />
      </UnidadeProvider>,
    );
    expect(screen.getByTestId('qtd').textContent).toBe('1');
    expect(screen.getByTestId('ativa-id').textContent).toBe('unidade-londrina');
    expect(screen.getByTestId('pode-trocar').textContent).toBe('nao');
  });

  it('remove TODAS do seletor quando o usuário não pode trocar unidade', () => {
    localStorage.setItem('unidade_ativa', 'unidade-londrina');
    localStorage.setItem('unidade_seletor', 'todas');
    authState.unidadesPermitidas = ['unidade-londrina'];
    renderUnidade(
      <UnidadeProvider>
        <Probe />
      </UnidadeProvider>,
    );
    expect(screen.getByTestId('ativa-id').textContent).toBe('unidade-londrina');
    expect(screen.getByTestId('seletor-id').textContent).toBe('unidade-londrina');
    expect(screen.getByTestId('is-todas').textContent).toBe('nao');
  });

  it('lança erro quando useUnidadeAtiva é usado fora do Provider', () => {
    const Bad = () => {
      useUnidadeAtiva();
      return null;
    };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Bad />)).toThrow(/UnidadeProvider/);
    spy.mockRestore();
  });
});
