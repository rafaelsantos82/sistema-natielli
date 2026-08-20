import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnamneseFormModal } from './AnamneseFormModal';
import type { Anamnese } from '@/hooks/useAnamneses';

// Toast — singleton spy para asserções por ação
const toastSpy = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastSpy }),
}));

const DRAFT_KEY = 'anamnese_draft_v1:new';

const renderModal = (overrides: Partial<Parameters<typeof AnamneseFormModal>[0]> = {}) => {
  const onClose = vi.fn();
  const onSave = vi.fn();
  const utils = render(
    <AnamneseFormModal
      isOpen
      onClose={onClose}
      onSave={onSave}
      initialData={null}
      {...overrides}
    />
  );
  return { ...utils, onClose, onSave };
};

const buildDraft = (overrides: Partial<Anamnese> = {}) => ({
  form: {
    nome: 'Rascunho Pediatria',
    especialidade: 'Pediatria',
    versao: '1.0',
    status: 'Ativa',
    observacoes: 'em andamento',
    ...overrides,
  },
  questions: [
    { linkId: 'q1', text: 'Idade gestacional?', type: 'integer', required: true },
    { linkId: 'q2', text: 'Vacinação em dia?', type: 'boolean', required: true },
  ],
  savedAt: '2026-05-04T12:00:00.000Z',
});

beforeEach(() => {
  localStorage.clear();
  toastSpy.mockClear();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
  localStorage.clear();
});

describe('AnamneseFormModal — autosave de rascunho', () => {
  it('persiste o rascunho no localStorage após edição (debounced)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderModal();

    // Aguarda hidratação inicial (setTimeout 0)
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    const nomeInput = screen.getByLabelText(/Nome da anamnese/i);
    await user.type(nomeInput, 'Minha Anamnese');

    // Avança debounce de 600ms
    await act(async () => {
      vi.advanceTimersByTime(800);
    });

    await waitFor(() => {
      const raw = localStorage.getItem(DRAFT_KEY);
      expect(raw).not.toBeNull();
      const draft = JSON.parse(raw!);
      expect(draft.form.nome).toBe('Minha Anamnese');
      expect(typeof draft.savedAt).toBe('string');
    });

    expect(screen.getByText(/Rascunho salvo automaticamente/i)).toBeInTheDocument();
  });
});

describe('AnamneseFormModal — restauração de rascunho', () => {
  it('exibe banner "Continuar rascunho" quando há rascunho salvo e NÃO restaura automaticamente', async () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(buildDraft()));

    renderModal();
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    expect(screen.getByTestId('draft-resume-banner')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar rascunho/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Começar do zero/i })).toBeInTheDocument();

    // Form não foi pré-preenchido com o rascunho ainda
    const nomeInput = screen.getByLabelText(/Nome da anamnese/i) as HTMLInputElement;
    expect(nomeInput.value).toBe('');
  });

  it('restaura os dados do rascunho ao clicar em "Continuar rascunho"', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    localStorage.setItem(DRAFT_KEY, JSON.stringify(buildDraft()));

    renderModal();
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    await user.click(screen.getByRole('button', { name: /Continuar rascunho/i }));

    const nomeInput = screen.getByLabelText(/Nome da anamnese/i) as HTMLInputElement;
    await waitFor(() => expect(nomeInput.value).toBe('Rascunho Pediatria'));
    expect(screen.getByDisplayValue('Idade gestacional?')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Vacinação em dia?')).toBeInTheDocument();
    // Banner some
    expect(screen.queryByTestId('draft-resume-banner')).not.toBeInTheDocument();
  });
});

describe('AnamneseFormModal — descarte de rascunho', () => {
  it('limpa o rascunho do localStorage ao clicar em "Começar do zero"', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    localStorage.setItem(DRAFT_KEY, JSON.stringify(buildDraft()));

    renderModal();
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    await user.click(screen.getByRole('button', { name: /Começar do zero/i }));

    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
    expect(screen.queryByTestId('draft-resume-banner')).not.toBeInTheDocument();
    const nomeInput = screen.getByLabelText(/Nome da anamnese/i) as HTMLInputElement;
    expect(nomeInput.value).toBe('');
  });

  it('limpa o rascunho ao clicar em "Descartar rascunho" no rodapé', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderModal();

    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    await user.type(screen.getByLabelText(/Nome da anamnese/i), 'X');
    await act(async () => {
      vi.advanceTimersByTime(800);
    });
    await waitFor(() => expect(localStorage.getItem(DRAFT_KEY)).not.toBeNull());

    await user.click(screen.getByRole('button', { name: /Descartar rascunho/i }));

    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });
});

// Helpers de asserção de toast
const expectToastTitle = (title: RegExp | string) => {
  const matched = toastSpy.mock.calls.some(([arg]) =>
    typeof arg === 'object' &&
    arg !== null &&
    typeof (arg as { title?: unknown }).title === 'string' &&
    (typeof title === 'string'
      ? (arg as { title: string }).title === title
      : title.test((arg as { title: string }).title))
  );
  expect(matched).toBe(true);
};

const countToastsWithTitle = (title: RegExp | string) =>
  toastSpy.mock.calls.filter(([arg]) =>
    typeof arg === 'object' &&
    arg !== null &&
    typeof (arg as { title?: unknown }).title === 'string' &&
    (typeof title === 'string'
      ? (arg as { title: string }).title === title
      : title.test((arg as { title: string }).title))
  ).length;

describe('AnamneseFormModal — toasts por ação de rascunho', () => {
  it('exibe toast "Rascunho restaurado" ao continuar rascunho', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    localStorage.setItem(DRAFT_KEY, JSON.stringify(buildDraft()));
    renderModal();
    await act(async () => { vi.advanceTimersByTime(10); });

    await user.click(screen.getByRole('button', { name: /Continuar rascunho/i }));

    expectToastTitle(/Rascunho restaurado/i);
    expect(countToastsWithTitle(/Rascunho restaurado/i)).toBe(1);
  });

  it('exibe toast "Começando do zero" ao optar por começar do zero', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    localStorage.setItem(DRAFT_KEY, JSON.stringify(buildDraft()));
    renderModal();
    await act(async () => { vi.advanceTimersByTime(10); });

    await user.click(screen.getByRole('button', { name: /Começar do zero/i }));

    expectToastTitle(/Começando do zero/i);
    expect(countToastsWithTitle(/Começando do zero/i)).toBe(1);
  });

  it('exibe toast "Rascunho mantido" e fecha ao manter alterações', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { onClose } = renderModal();
    await act(async () => { vi.advanceTimersByTime(10); });

    // Cria uma alteração para acionar a confirmação no fechamento
    await user.type(screen.getByLabelText(/Nome da anamnese/i), 'Teste');
    await act(async () => { vi.advanceTimersByTime(800); });

    toastSpy.mockClear(); // limpa toasts do autosave/edição

    await user.click((() => { const els = screen.getAllByRole("button", { name: /^Cancelar$/i }); return els[els.length - 1]; })());
    expect(await screen.findByTestId('confirm-close-dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Fechar e manter rascunho/i }));

    expectToastTitle(/Rascunho mantido/i);
    expect(countToastsWithTitle(/Rascunho mantido/i)).toBe(1);
    // Não deve aparecer toast de "descartado" no fluxo de manter
    expect(countToastsWithTitle(/descartad/i)).toBe(0);
    expect(onClose).toHaveBeenCalled();
  });

  it('exibe toast "Alterações descartadas" ao descartar e fechar (sem duplicar)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { onClose } = renderModal();
    await act(async () => { vi.advanceTimersByTime(10); });

    await user.type(screen.getByLabelText(/Nome da anamnese/i), 'Teste');
    await act(async () => { vi.advanceTimersByTime(800); });

    toastSpy.mockClear();

    await user.click((() => { const els = screen.getAllByRole("button", { name: /^Cancelar$/i }); return els[els.length - 1]; })());
    await user.click(screen.getByRole('button', { name: /Descartar e fechar/i }));

    expectToastTitle(/Alterações descartadas/i);
    expect(countToastsWithTitle(/Alterações descartadas/i)).toBe(1);
    expect(countToastsWithTitle(/Rascunho mantido/i)).toBe(0);
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
    expect(onClose).toHaveBeenCalled();
  });

  it('NÃO exibe toast quando "Continuar editando" é escolhido na confirmação', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { onClose } = renderModal();
    await act(async () => { vi.advanceTimersByTime(10); });

    await user.type(screen.getByLabelText(/Nome da anamnese/i), 'Teste');
    await act(async () => { vi.advanceTimersByTime(800); });

    toastSpy.mockClear();

    await user.click((() => { const els = screen.getAllByRole("button", { name: /^Cancelar$/i }); return els[els.length - 1]; })());
    await user.click(screen.getByRole('button', { name: /Continuar editando/i }));

    expect(toastSpy).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('fecha sem confirmação nem toast quando não há alterações', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { onClose } = renderModal();
    await act(async () => { vi.advanceTimersByTime(10); });

    toastSpy.mockClear();
    await user.click((() => { const els = screen.getAllByRole("button", { name: /^Cancelar$/i }); return els[els.length - 1]; })());

    expect(screen.queryByTestId('confirm-close-dialog')).not.toBeInTheDocument();
    expect(toastSpy).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
