import { describe, it, expect } from 'vitest';
import { calcConciliacaoTotais, deriveNotaFiscalStatus } from './conciliacaoCalc';

describe('conciliacaoCalc', () => {
  it('calcula saldo em aberto e quitada', () => {
    const t = calcConciliacaoTotais(10000, 8000, 10000, 3);
    expect(t.quitada).toBe(true);
    expect(t.saldoEmAberto).toBe(0);
    expect(t.qtdNotas).toBe(3);
  });

  it('saldo em aberto quando pagamento parcial da ação', () => {
    const t = calcConciliacaoTotais(10000, 5000, 3000);
    expect(t.saldoEmAberto).toBe(7000);
    expect(t.quitada).toBe(false);
  });

  it('deriveNotaFiscalStatus', () => {
    expect(deriveNotaFiscalStatus(100, 100)).toBe('Pago');
    expect(deriveNotaFiscalStatus(100, 40)).toBe('Pago Parcial');
    expect(deriveNotaFiscalStatus(100, 0)).toBe('Pendente');
  });
});
