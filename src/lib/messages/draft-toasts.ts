/**
 * Mensagens padronizadas de toast para fluxos de rascunho (autosave / restore /
 * discard / mantém / fecha) em todo o sistema.
 *
 * Use estas constantes em qualquer módulo que tenha rascunho local
 * (Anamnese, Prontuário, futuros editores), para garantir consistência
 * de copywriting e facilitar tradução / testes de snapshot.
 *
 * Convenção:
 *   import { DRAFT_TOASTS } from '@/lib/messages/draft-toasts';
 *   toast(DRAFT_TOASTS.restored(savedAt));
 */

export type ToastVariant = 'default' | 'destructive';

export interface ToastPayload {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

export const DRAFT_TOASTS = {
  /** Rascunho recuperado do storage e aplicado ao formulário. */
  restored: (savedAtIso: string): ToastPayload => ({
    title: 'Rascunho restaurado',
    description: `Continuando de ${new Date(savedAtIso).toLocaleString('pt-BR')}.`,
  }),

  /** Usuário optou por iniciar do zero, descartando o rascunho existente. */
  startedFresh: (): ToastPayload => ({
    title: 'Começando do zero',
    description: 'O rascunho anterior foi descartado.',
  }),

  /** Rascunho descartado manualmente dentro do editor (botão dedicado). */
  discarded: (): ToastPayload => ({
    title: 'Rascunho descartado',
    description: 'O formulário foi restaurado ao estado inicial.',
  }),

  /** Modal fechado mantendo o rascunho para retomada futura. */
  kept: (): ToastPayload => ({
    title: 'Rascunho mantido',
    description: 'Suas alterações ficarão disponíveis ao reabrir o modal.',
  }),

  /** Modal fechado descartando alterações pendentes definitivamente. */
  closedDiscarding: (): ToastPayload => ({
    title: 'Alterações descartadas',
    description: 'O rascunho foi removido permanentemente.',
    variant: 'destructive',
  }),
} as const;

export type DraftToastKey = keyof typeof DRAFT_TOASTS;
