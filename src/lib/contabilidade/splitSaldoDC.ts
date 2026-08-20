import type { NaturezaConta } from './types';

export interface SaldoDC {
  devedor: number;
  credor: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Separa saldo assinado em colunas Devedor/Credor conforme natureza da conta. */
export function splitSaldoDC(saldo: number, natureza: NaturezaConta): SaldoDC {
  const s = round2(saldo);
  if (s === 0) return { devedor: 0, credor: 0 };
  if (natureza === 'Credora') {
    return s > 0 ? { devedor: 0, credor: s } : { devedor: round2(-s), credor: 0 };
  }
  return s > 0 ? { devedor: s, credor: 0 } : { devedor: 0, credor: round2(-s) };
}

export function buildColunasDC(
  saldoInicial: number,
  debitos: number,
  creditos: number,
  saldoFinal: number,
  natureza: NaturezaConta,
): import('./types').BalanceteColunasDC {
  const ant = splitSaldoDC(saldoInicial, natureza);
  const atual = splitSaldoDC(saldoFinal, natureza);
  return {
    saldoAnteriorDevedor: ant.devedor,
    saldoAnteriorCredor: ant.credor,
    movimentoDevedor: round2(debitos),
    movimentoCredor: round2(creditos),
    saldoAtualDevedor: atual.devedor,
    saldoAtualCredor: atual.credor,
  };
}
