import { describe, it, expect } from 'vitest';
import { DRAFT_TOASTS } from './draft-toasts';

describe('DRAFT_TOASTS — snapshots de mensagens padronizadas', () => {
  it('restored() — usa data ISO formatada em pt-BR (UTC fixo)', () => {
    // Data fixa em UTC para snapshot determinístico independente do TZ do CI.
    // Renderizamos apenas título + variant (a description varia por TZ).
    const payload = DRAFT_TOASTS.restored('2026-05-04T12:00:00.000Z');
    expect({ title: payload.title, variant: payload.variant }).toMatchInlineSnapshot(`
      {
        "title": "Rascunho restaurado",
        "variant": undefined,
      }
    `);
    expect(payload.description).toMatch(/^Continuando de .+\.$/);
  });

  it('startedFresh() — snapshot estável', () => {
    expect(DRAFT_TOASTS.startedFresh()).toMatchInlineSnapshot(`
      {
        "description": "O rascunho anterior foi descartado.",
        "title": "Começando do zero",
      }
    `);
  });

  it('discarded() — snapshot estável', () => {
    expect(DRAFT_TOASTS.discarded()).toMatchInlineSnapshot(`
      {
        "description": "O formulário foi restaurado ao estado inicial.",
        "title": "Rascunho descartado",
      }
    `);
  });

  it('kept() — snapshot estável', () => {
    expect(DRAFT_TOASTS.kept()).toMatchInlineSnapshot(`
      {
        "description": "Suas alterações ficarão disponíveis ao reabrir o modal.",
        "title": "Rascunho mantido",
      }
    `);
  });

  it('closedDiscarding() — snapshot estável (variant destructive)', () => {
    expect(DRAFT_TOASTS.closedDiscarding()).toMatchInlineSnapshot(`
      {
        "description": "O rascunho foi removido permanentemente.",
        "title": "Alterações descartadas",
        "variant": "destructive",
      }
    `);
  });

  it('expõe exatamente as chaves esperadas', () => {
    expect(Object.keys(DRAFT_TOASTS).sort()).toMatchInlineSnapshot(`
      [
        "closedDiscarding",
        "discarded",
        "kept",
        "restored",
        "startedFresh",
      ]
    `);
  });
});
