/**
 * Migração legada desativada após remoção de dados demo.
 * Unidades ativas vêm de ensureUnidadesSeed() no UnidadeContext.
 */
const FLAG = 'migrations_unidade_v2';

export const runUnidadesMigration = (): void => {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(FLAG)) {
    localStorage.setItem(FLAG, 'done');
  }
};
