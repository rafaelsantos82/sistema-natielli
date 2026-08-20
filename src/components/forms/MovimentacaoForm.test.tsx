import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MovimentacaoForm } from './MovimentacaoForm';

vi.mock('@/hooks/useEstoque', () => ({
  useEstoque: () => ({
    itens: [
      {
        id: 'item-1',
        codigo: 'TST01',
        nome: 'Item teste',
        categoria: 'Geral',
        unidade_medida: 'un',
        estoque_atual: 5,
        estoque_minimo: 1,
        status: 'Ativo',
        createdAt: '',
        updatedAt: '',
      },
    ],
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      name: 'Admin',
      email: 'admin@test.com',
      role: 'admin',
    },
  }),
}));

describe('MovimentacaoForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without throwing when isSubmitting is true', () => {
    render(
      <MovimentacaoForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isSubmitting
      />,
    );

    const submit = screen.getByRole('button', { name: 'Registrando...' });
    expect(submit).toBeDisabled();
  });

  it('shows default submit label when not submitting', () => {
    render(
      <MovimentacaoForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isSubmitting={false}
      />,
    );

    expect(screen.getByRole('button', { name: 'Registrar Movimentação' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeEnabled();
  });
});
