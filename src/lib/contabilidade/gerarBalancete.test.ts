import { describe, expect, it } from 'vitest';
import { gerarBalancete } from './gerarBalancete';
import { splitSaldoDC } from './splitSaldoDC';
import type { ContaContabil, LancamentoContabil } from './types';

const contas: ContaContabil[] = [
  { codigo: '1', nome: 'Ativo', tipo: 'Sintética', natureza: 'Devedora' },
  { codigo: '1.1', nome: 'Caixa', tipo: 'Analítica', natureza: 'Devedora', pai: '1' },
  { codigo: '2', nome: 'Passivo', tipo: 'Sintética', natureza: 'Credora' },
  { codigo: '2.1', nome: 'Fornecedores', tipo: 'Analítica', natureza: 'Credora', pai: '2' },
];

const lancamentos: LancamentoContabil[] = [
  {
    id: '1',
    data: '2026-05-01',
    conta_codigo: '1.1',
    debito: 100,
    credito: 0,
  },
  {
    id: '2',
    data: '2026-05-15',
    conta_codigo: '1.1',
    debito: 0,
    credito: 30,
  },
  {
    id: '3',
    data: '2026-05-10',
    conta_codigo: '2.1',
    debito: 0,
    credito: 50,
  },
  {
    id: '4',
    data: '2026-04-20',
    conta_codigo: '1.1',
    debito: 20,
    credito: 0,
  },
];

describe('splitSaldoDC', () => {
  it('coloca saldo positivo devedor na coluna D para conta devedora', () => {
    expect(splitSaldoDC(100, 'Devedora')).toEqual({ devedor: 100, credor: 0 });
  });

  it('coloca saldo positivo credor na coluna C para conta credora', () => {
    expect(splitSaldoDC(50, 'Credora')).toEqual({ devedor: 0, credor: 50 });
  });
});

describe('gerarBalancete', () => {
  const filtros = {
    periodo_inicio: '2026-05-01',
    periodo_fim: '2026-05-31',
  };

  it('agrega movimentação e saldo inicial por conta analítica', () => {
    const { linhas } = gerarBalancete(contas, lancamentos, filtros);
    const caixa = linhas.find((l) => l.conta_codigo === '1.1');
    expect(caixa).toBeDefined();
    expect(caixa!.saldo_inicial).toBe(20);
    expect(caixa!.debitos).toBe(100);
    expect(caixa!.creditos).toBe(30);
    expect(caixa!.saldo_final).toBe(90);
  });

  it('marca equilíbrio quando débitos e créditos do período são iguais', () => {
    const { meta } = gerarBalancete(contas, lancamentos, filtros);
    expect(meta.totalDebitos).toBe(100);
    expect(meta.totalCreditos).toBe(80);
    expect(meta.equilibrado).toBe(false);
  });

  it('equilibra quando totais de movimento coincidem', () => {
    const balanceados: LancamentoContabil[] = [
      { id: 'a', data: '2026-05-05', conta_codigo: '1.1', debito: 50, credito: 0 },
      { id: 'b', data: '2026-05-05', conta_codigo: '2.1', debito: 0, credito: 50 },
    ];
    const { meta } = gerarBalancete(contas, balanceados, filtros);
    expect(meta.equilibrado).toBe(true);
  });

  it('filtra por unidade_id', () => {
    const comUnidade: LancamentoContabil[] = [
      {
        id: 'u1',
        data: '2026-05-05',
        conta_codigo: '1.1',
        debito: 10,
        credito: 0,
        unidade_id: 'uuid-a',
      },
      {
        id: 'u2',
        data: '2026-05-05',
        conta_codigo: '1.1',
        debito: 99,
        credito: 0,
        unidade_id: 'uuid-b',
      },
    ];
    const { linhas } = gerarBalancete(contas, comUnidade, {
      ...filtros,
      unidade_id: 'uuid-a',
    });
    const caixa = linhas.find((l) => l.conta_codigo === '1.1');
    expect(caixa!.debitos).toBe(10);
  });

  it('rejeita período inválido', () => {
    expect(() =>
      gerarBalancete(contas, lancamentos, {
        periodo_inicio: '2026-06-01',
        periodo_fim: '2026-05-01',
      }),
    ).toThrow(/Período inicial/);
  });

  it('rollup sintética soma filhas', () => {
    const { linhas } = gerarBalancete(contas, lancamentos, filtros);
    const ativo = linhas.find((l) => l.conta_codigo === '1');
    expect(ativo).toBeDefined();
    expect(ativo!.debitos).toBe(100);
    expect(ativo!.creditos).toBe(30);
  });
});
