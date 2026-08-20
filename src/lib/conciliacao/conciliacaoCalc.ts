export const QUITADA_TOLERANCE = 0.01;

export type ConciliacaoTotais = {
  valorAcao: number;
  valorNotasVinculadas: number;
  valorPagoTotal: number;
  saldoEmAberto: number;
  percentualPago: number;
  quitada: boolean;
  qtdNotas: number;
};

export function calcConciliacaoTotais(
  valorAcao: number,
  valorNotasVinculadas: number,
  valorPagoTotal: number,
  qtdNotas = 0,
): ConciliacaoTotais {
  const saldoEmAberto = Math.max(0, valorAcao - valorPagoTotal);
  const percentualPago = valorAcao > 0 ? (valorPagoTotal / valorAcao) * 100 : 0;
  return {
    valorAcao,
    valorNotasVinculadas,
    valorPagoTotal,
    saldoEmAberto,
    percentualPago,
    quitada: valorPagoTotal >= valorAcao - QUITADA_TOLERANCE,
    qtdNotas,
  };
}

export function deriveNotaFiscalStatus(valorServico: number, valorPago: number): string {
  if (valorPago >= valorServico - QUITADA_TOLERANCE) {
    return 'Pago';
  }
  if (valorPago > 0) {
    return 'Pago Parcial';
  }
  return 'Pendente';
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
