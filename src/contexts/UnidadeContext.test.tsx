import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { UnidadeProvider, useUnidadeAtiva } from './UnidadeContext';

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
  const { unidades, unidadeAtivaId, unidadeAtiva, podeTrocarUnidade, setUnidadeAtiva } =
    useUnidadeAtiva();
  return (
    <div>
      <div data-testid="ativa-id">{unidadeAtivaId}</div>
      <div data-testid="ativa-nome">{unidadeAtiva?.nome ?? '—'}</div>
      <div data-testid="qtd">{unidades.length}</div>
      <div data-testid="pode-trocar">{podeTrocarUnidade ? 'sim' : 'nao'}</div>
      <button onClick={() => setUnidadeAtiva('unidade-tijuca')}>trocar-tijuca</button>
    </div>
  );
};

describe('UnidadeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    authState.unidadesPermitidas = undefined;
  });

  it('faz seed das unidades padrão e ativa Duque de Caxias por default', () => {
    render(
      <UnidadeProvider>
        <Probe />
      </UnidadeProvider>,
    );
    expect(screen.getByTestId('ativa-id').textContent).toBe('unidade-duque-caxias');
    expect(screen.getByTestId('ativa-nome').textContent).toBe('Duque de Caxias');
    expect(Number(screen.getByTestId('qtd').textContent)).toBeGreaterThanOrEqual(2);
    expect(screen.getByTestId('pode-trocar').textContent).toBe('sim');
  });

  it('persiste a unidade ativa em localStorage ao trocar', () => {
    render(
      <UnidadeProvider>
        <Probe />
      </UnidadeProvider>,
    );
    act(() => {
      screen.getByText('trocar-tijuca').click();
    });
    expect(screen.getByTestId('ativa-id').textContent).toBe('unidade-tijuca');
    expect(localStorage.getItem('unidade_ativa')).toBe('unidade-tijuca');
  });

  it('lê a unidade ativa do localStorage no mount', () => {
    localStorage.setItem('unidade_ativa', 'unidade-tijuca');
    render(
      <UnidadeProvider>
        <Probe />
      </UnidadeProvider>,
    );
    expect(screen.getByTestId('ativa-id').textContent).toBe('unidade-tijuca');
  });

  it('restringe unidades visíveis quando o usuário tem unidadesPermitidas', () => {
    authState.unidadesPermitidas = ['unidade-tijuca'];
    render(
      <UnidadeProvider>
        <Probe />
      </UnidadeProvider>,
    );
    expect(screen.getByTestId('qtd').textContent).toBe('1');
    expect(screen.getByTestId('ativa-id').textContent).toBe('unidade-tijuca');
    expect(screen.getByTestId('pode-trocar').textContent).toBe('nao');
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
