import { buildColunasDC } from './splitSaldoDC';
import type {
  BalanceteFiltros,
  BalanceteLinha,
  BalanceteMeta,
  BalanceteResultado,
  ContaContabil,
  LancamentoContabil,
  NaturezaConta,
} from './types';

const TOLERANCIA = 0.01;

const round2 = (n: number) => Math.round(n * 100) / 100;

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function signedSaldo(debito: number, credito: number, natureza: NaturezaConta): number {
  if (natureza === 'Credora') return credito - debito;
  return debito - credito;
}

function matchesFiltros(l: LancamentoContabil, filtros: BalanceteFiltros): boolean {
  if (filtros.centro_custo?.trim()) {
    const cc = (l.centro_custo ?? '').trim();
    if (cc !== filtros.centro_custo.trim()) return false;
  }
  if (filtros.unidade_id?.trim()) {
    const uid = (l.unidade_id ?? '').trim();
    if (uid !== filtros.unidade_id.trim()) return false;
  }
  return true;
}

function getNivel(codigo: string, contas: ContaContabil[]): number {
  const byCodigo = new Map(contas.map((c) => [c.codigo, c]));
  let nivel = 0;
  let current = byCodigo.get(codigo);
  while (current?.pai) {
    nivel += 1;
    current = byCodigo.get(current.pai);
  }
  return nivel;
}

function emptyLinha(conta: ContaContabil, nivel: number): BalanceteLinha {
  const colunas = buildColunasDC(0, 0, 0, 0, conta.natureza);
  return {
    conta_codigo: conta.codigo,
    conta_nome: conta.nome,
    tipo: conta.tipo,
    natureza: conta.natureza,
    nivel,
    saldo_inicial: 0,
    debitos: 0,
    creditos: 0,
    saldo_final: 0,
    colunas,
  };
}

function addLinhas(a: BalanceteLinha, b: BalanceteLinha): BalanceteLinha {
  const saldoInicial = round2(a.saldo_inicial + b.saldo_inicial);
  const debitos = round2(a.debitos + b.debitos);
  const creditos = round2(a.creditos + b.creditos);
  const saldoFinal = round2(a.saldo_final + b.saldo_final);
  return {
    ...a,
    saldo_inicial: saldoInicial,
    debitos,
    creditos,
    saldo_final: saldoFinal,
    colunas: buildColunasDC(saldoInicial, debitos, creditos, saldoFinal, a.natureza),
  };
}

function rollupSinteticas(
  linhasMap: Map<string, BalanceteLinha>,
  contas: ContaContabil[],
): void {
  const sinteticas = contas
    .filter((c) => c.tipo === 'Sintética')
    .sort((a, b) => b.codigo.length - a.codigo.length);

  for (const conta of sinteticas) {
    const filhos = [...linhasMap.values()].filter((l) => {
      const c = contas.find((x) => x.codigo === l.conta_codigo);
      return c?.pai === conta.codigo;
    });
    if (filhos.length === 0) continue;
    const base = emptyLinha(conta, getNivel(conta.codigo, contas));
    const agregada = filhos.reduce((acc, f) => addLinhas(acc, f), base);
    linhasMap.set(conta.codigo, { ...agregada, conta_nome: conta.nome, tipo: conta.tipo });
  }
}

function computeMeta(linhas: BalanceteLinha[]): BalanceteMeta {
  let totalDebitos = 0;
  let totalCreditos = 0;
  let totalSaldoAnteriorDevedor = 0;
  let totalSaldoAnteriorCredor = 0;
  let totalSaldoAtualDevedor = 0;
  let totalSaldoAtualCredor = 0;
  let contasSemMovimento = 0;

  for (const l of linhas) {
    if (l.tipo === 'Sintética') continue;
    totalDebitos += l.debitos;
    totalCreditos += l.creditos;
    totalSaldoAnteriorDevedor += l.colunas.saldoAnteriorDevedor;
    totalSaldoAnteriorCredor += l.colunas.saldoAnteriorCredor;
    totalSaldoAtualDevedor += l.colunas.saldoAtualDevedor;
    totalSaldoAtualCredor += l.colunas.saldoAtualCredor;
    if (l.debitos === 0 && l.creditos === 0 && l.saldo_inicial === 0 && l.saldo_final === 0) {
      contasSemMovimento += 1;
    }
  }

  totalDebitos = round2(totalDebitos);
  totalCreditos = round2(totalCreditos);

  return {
    totalDebitos,
    totalCreditos,
    totalSaldoAnteriorDevedor: round2(totalSaldoAnteriorDevedor),
    totalSaldoAnteriorCredor: round2(totalSaldoAnteriorCredor),
    totalSaldoAtualDevedor: round2(totalSaldoAtualDevedor),
    totalSaldoAtualCredor: round2(totalSaldoAtualCredor),
    equilibrado: Math.abs(totalDebitos - totalCreditos) <= TOLERANCIA,
    contasSemMovimento,
  };
}

export function gerarBalancete(
  contas: ContaContabil[],
  lancamentos: LancamentoContabil[],
  filtros: BalanceteFiltros,
): BalanceteResultado {
  const inicio = parseDate(filtros.periodo_inicio);
  const fim = parseDate(filtros.periodo_fim);
  if (inicio > fim) {
    throw new Error('Período inicial não pode ser posterior ao período final.');
  }

  const filtrados = lancamentos.filter((l) => matchesFiltros(l, filtros));
  const linhasMap = new Map<string, BalanceteLinha>();

  for (const conta of contas) {
    const natureza = conta.natureza;
    const movs = filtrados.filter((l) => l.conta_codigo === conta.codigo);
    let debAntes = 0;
    let credAntes = 0;
    let debPeriodo = 0;
    let credPeriodo = 0;

    for (const m of movs) {
      const data = parseDate(m.data.slice(0, 10));
      const deb = Number(m.debito) || 0;
      const cred = Number(m.credito) || 0;
      if (data < inicio) {
        debAntes += deb;
        credAntes += cred;
      } else if (data <= fim) {
        debPeriodo += deb;
        credPeriodo += cred;
      }
    }

    const saldoInicial = round2(signedSaldo(debAntes, credAntes, natureza));
    const debitos = round2(debPeriodo);
    const creditos = round2(credPeriodo);
    const sf = round2(saldoInicial + signedSaldo(debitos, creditos, natureza));

    const linha: BalanceteLinha = {
      conta_codigo: conta.codigo,
      conta_nome: conta.nome,
      tipo: conta.tipo,
      natureza,
      nivel: getNivel(conta.codigo, contas),
      saldo_inicial: saldoInicial,
      debitos,
      creditos,
      saldo_final: sf,
      colunas: buildColunasDC(saldoInicial, debitos, creditos, sf, natureza),
    };

    const zerada =
      linha.saldo_inicial === 0 &&
      linha.debitos === 0 &&
      linha.creditos === 0 &&
      linha.saldo_final === 0;

    if (filtros.ocultar_zeradas && zerada && conta.tipo === 'Analítica') {
      continue;
    }
    linhasMap.set(conta.codigo, linha);
  }

  rollupSinteticas(linhasMap, contas);

  let linhas = [...linhasMap.values()].sort((a, b) =>
    a.conta_codigo.localeCompare(b.conta_codigo, undefined, { numeric: true }),
  );

  if (filtros.ocultar_zeradas) {
    linhas = linhas.filter(
      (l) =>
        l.saldo_inicial !== 0 ||
        l.debitos !== 0 ||
        l.creditos !== 0 ||
        l.saldo_final !== 0 ||
        l.tipo === 'Sintética',
    );
  }

  const meta = computeMeta(linhas);
  return { linhas, meta };
}
