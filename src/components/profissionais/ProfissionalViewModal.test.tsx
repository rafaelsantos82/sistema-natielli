import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfissionalViewModal } from './ProfissionalViewModal';
import type { Profissional } from '@/hooks/useProfissionais';

vi.mock('@/hooks/useProfissionalDocumentos', () => ({
  useProfissionalDocumentos: () => ({
    ativosPorCategoria: vi.fn(() => []),
    download: vi.fn(),
    statusObrigatorios: () => ({ pendentes: [], completos: true }),
    isLoading: false,
  }),
  DOCUMENTO_CATEGORIA_LABEL: {
    documento_pessoal: 'Documento pessoal (RG/CPF)',
    registro_profissional: 'Registro profissional',
    comprovante: 'Comprovante',
    contrato: 'Contrato',
    outro: 'Outro',
  },
}));

vi.mock('@/hooks/useProfissionalConselhos', () => ({
  useProfissionalConselhos: () => ({
    listByProfissional: () => [],
  }),
}));

vi.mock('@/lib/featureFlags', () => ({
  featureFlags: { profissionaisApiEnabled: true },
}));

const mockProfissional: Profissional = {
  id: 'prof-1',
  nome: 'Dr. Maria Silva',
  email: 'maria@clinica.com',
  status: 'ativo',
  conselho: 'CRP',
  numeroRegistro: '12345',
  ufRegistro: 'SP',
  especialidades: ['Psicólogo Clínico'],
  diasAtendimento: ['segunda', 'quarta'],
  horarioInicio: '08:00',
  horarioFim: '18:00',
  duracaoConsulta: 50,
  consentimentoLGPD: true,
  compartilhamentoDados: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('ProfissionalViewModal', () => {
  it('exibe nome do profissional e seções de documentos por categoria', () => {
    render(
      <ProfissionalViewModal
        isOpen
        onClose={() => {}}
        profissional={mockProfissional}
        onEdit={() => {}}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getAllByText('Dr. Maria Silva').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Documento pessoal/i)).toBeInTheDocument();
    expect(screen.getByText(/Registro profissional/i)).toBeInTheDocument();
    expect(screen.getByText(/Comprovante/i)).toBeInTheDocument();
  });

  it('chama onEdit ao clicar em Editar', () => {
    const onEdit = vi.fn();
    render(
      <ProfissionalViewModal
        isOpen
        onClose={() => {}}
        profissional={mockProfissional}
        onEdit={onEdit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /^Editar$/i }));
    expect(onEdit).toHaveBeenCalledWith(mockProfissional);
  });

  it('oculta Editar quando canEdit é false', () => {
    render(
      <ProfissionalViewModal
        isOpen
        onClose={() => {}}
        profissional={{ ...mockProfissional, deleted_at: '2024-06-01T00:00:00Z' }}
        canEdit={false}
      />,
    );

    expect(screen.queryByRole('button', { name: /^Editar$/i })).not.toBeInTheDocument();
  });
});
