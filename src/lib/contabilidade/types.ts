export type NaturezaConta = 'Devedora' | 'Credora';
export type TipoConta = 'Sintética' | 'Analítica';

export interface ContaContabil {
  id?: string;
  codigo: string;
  nome: string;
  tipo: TipoConta;
  natureza: NaturezaConta;
  pai?: string | null;
}

export interface LancamentoContabil {
  id: string;
  data: string;
  conta_codigo: string;
  conta_nome?: string;
  debito: number;
  credito: number;
  historico?: string;
  centro_custo?: string | null;
  unidade_id?: string | null;
}

export interface BalanceteFiltros {
  periodo_inicio: string;
  periodo_fim: string;
  centro_custo?: string;
  unidade_id?: string;
  ocultar_zeradas?: boolean;
}

export interface BalanceteColunasDC {
  saldoAnteriorDevedor: number;
  saldoAnteriorCredor: number;
  movimentoDevedor: number;
  movimentoCredor: number;
  saldoAtualDevedor: number;
  saldoAtualCredor: number;
}

export interface BalanceteLinha {
  conta_codigo: string;
  conta_nome: string;
  tipo: TipoConta;
  natureza: NaturezaConta;
  nivel: number;
  saldo_inicial: number;
  debitos: number;
  creditos: number;
  saldo_final: number;
  colunas: BalanceteColunasDC;
}

export interface BalanceteMeta {
  totalDebitos: number;
  totalCreditos: number;
  totalSaldoAnteriorDevedor: number;
  totalSaldoAnteriorCredor: number;
  totalSaldoAtualDevedor: number;
  totalSaldoAtualCredor: number;
  equilibrado: boolean;
  contasSemMovimento: number;
}

export interface BalanceteResultado {
  linhas: BalanceteLinha[];
  meta: BalanceteMeta;
}

/** @deprecated Use ContaContabil */
export type BalanceteConfig = ContaContabil;
