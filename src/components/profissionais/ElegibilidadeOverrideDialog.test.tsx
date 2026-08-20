import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ElegibilidadeOverrideDialog } from './ElegibilidadeOverrideDialog';

let mockRole: 'admin' | 'gestor' | 'funcionario' | 'terceiro' = 'gestor';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'Gestor Teste', email: 'g@x', role: mockRole },
    login: vi.fn(),
    logout: vi.fn(),
    isLoading: false,
  }),
}));

const toastSpy = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastSpy }),
}));

describe('ElegibilidadeOverrideDialog', () => {
  beforeEach(() => {
    localStorage.clear();
    toastSpy.mockClear();
    mockRole = 'gestor';
  });

  const renderDialog = (overrides: Partial<React.ComponentProps<typeof ElegibilidadeOverrideDialog>> = {}) => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ElegibilidadeOverrideDialog
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        motivos={['Documentos obrigatórios pendentes: RG/CPF.']}
        acaoLabel="reagendar consulta"
        entidade="consulta"
        entidadeId="c-123"
        {...overrides}
      />,
    );
    return { onConfirm, onClose };
  };

  it('rejeita justificativa com menos de 10 caracteres', async () => {
    const { onConfirm } = renderDialog();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/Justificativa/i), 'curto');
    await user.click(screen.getByRole('button', { name: /Confirmar e registrar/i }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringMatching(/curta/i) }),
    );
    const audit = JSON.parse(localStorage.getItem('audit_log') ?? '[]');
    expect(audit).toHaveLength(0);
  });

  it('grava entrada de auditoria com justificativa, motivos e ação ao confirmar', async () => {
    const { onConfirm } = renderDialog();
    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText(/Justificativa/i),
      'Paciente em quadro clínico urgente, autorizado pelo gestor.',
    );
    await user.click(screen.getByRole('button', { name: /Confirmar e registrar/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ justificativa: expect.stringMatching(/urgente/i) }),
    );

    const audit = JSON.parse(localStorage.getItem('audit_log') ?? '[]');
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({
      actor_role: 'gestor',
      entidade: 'consulta',
      entidade_id: 'c-123',
      diff: {
        tipo: 'override_elegibilidade',
        acao_executada: 'reagendar consulta',
        motivos_bloqueio: ['Documentos obrigatórios pendentes: RG/CPF.'],
      },
    });
    expect(audit[0].diff.justificativa).toMatch(/urgente/i);
    expect(audit[0].timestamp_utc).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it('bloqueia override para roles sem permissão (funcionario)', () => {
    mockRole = 'funcionario';
    const { onConfirm } = renderDialog();
    expect(screen.getByText(/Permissão necessária/i)).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /Confirmar e registrar/i });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onConfirm).not.toHaveBeenCalled();
    const audit = JSON.parse(localStorage.getItem('audit_log') ?? '[]');
    expect(audit).toHaveLength(0);
  });
});
