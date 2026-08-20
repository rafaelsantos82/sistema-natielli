import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BalanceteAjudaModal } from './BalanceteAjudaModal';
import { tituloModal, balanceteAjudaFaq } from '@/lib/contabilidade/balanceteAjudaContent';

describe('BalanceteAjudaModal', () => {
  it('exibe título e primeira pergunta da FAQ quando aberto', () => {
    render(<BalanceteAjudaModal open onOpenChange={vi.fn()} />);
    expect(screen.getByText(tituloModal)).toBeInTheDocument();
    expect(screen.getByText(balanceteAjudaFaq[0].pergunta)).toBeInTheDocument();
  });

  it('expande FAQ e mostra resposta ao clicar na pergunta', () => {
    render(<BalanceteAjudaModal open onOpenChange={vi.fn()} />);
    const trigger = screen.getByText(balanceteAjudaFaq[0].pergunta);
    fireEvent.click(trigger);
    expect(screen.getByText(balanceteAjudaFaq[0].resposta)).toBeInTheDocument();
  });

  it('chama onOpenChange(false) ao clicar em Entendi', () => {
    const onOpenChange = vi.fn();
    render(<BalanceteAjudaModal open onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Entendi/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('não renderiza conteúdo visível quando fechado', () => {
    render(<BalanceteAjudaModal open={false} onOpenChange={vi.fn()} />);
    expect(screen.queryByText(tituloModal)).not.toBeInTheDocument();
  });
});
