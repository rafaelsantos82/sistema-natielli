import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SalaViewModal } from './SalaViewModal';
import type { Sala } from '@/hooks/useSalas';

const mockSala: Sala = {
  id: 'sala-1',
  nome_sala: 'Sala Girassol',
  codigo: 'SL-01',
  unidade: 'Unidade Centro',
  unidadeId: 'u-1',
  capacidade: 4,
  especialidade_atendida: ['Psicologia'],
  recursos: ['Ar-condicionado', 'Projetor'],
  status: 'Ativa',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
};

describe('SalaViewModal', () => {
  it('renderiza modal com dados da sala', () => {
    render(
      <SalaViewModal
        isOpen
        onClose={() => {}}
        sala={mockSala}
        onEdit={() => {}}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getAllByText('Sala Girassol').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Identificação/i)).toBeInTheDocument();
    expect(screen.getByText(/Operacional/i)).toBeInTheDocument();
    expect(screen.getByText(/Recursos da sala/i)).toBeInTheDocument();
  });

  it('chama onEdit ao clicar em Editar', () => {
    const onEdit = vi.fn();
    render(
      <SalaViewModal
        isOpen
        onClose={() => {}}
        sala={mockSala}
        onEdit={onEdit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Editar/i }));
    expect(onEdit).toHaveBeenCalledWith(mockSala);
  });
});

