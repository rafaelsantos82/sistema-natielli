import { describe, it, expect } from 'vitest';
import { startOfDay, subDays, addDays } from 'date-fns';
import {
  getComodatoStatusLabel,
  isComodatoAtrasado,
  isComodatoAtivo,
  isComodatoDevolvido,
  partitionComodatos,
  parseDevolucaoPrevista,
} from './comodatoStatus';

const today = startOfDay(new Date());
const yesterdayIso = subDays(today, 1).toISOString().slice(0, 10);
const tomorrowIso = addDays(today, 1).toISOString().slice(0, 10);

describe('comodatoStatus', () => {
  it('parseDevolucaoPrevista aceita ISO e BR', () => {
    expect(parseDevolucaoPrevista('2026-05-27')).not.toBeNull();
    expect(parseDevolucaoPrevista('27/05/2026')).not.toBeNull();
  });

  it('Emprestado com data ontem é atrasado (bug: status literal Atrasado não vem da API)', () => {
    const c = { status: 'Emprestado', data_devolucao_prevista: yesterdayIso };
    expect(isComodatoAtrasado(c, today)).toBe(true);
    expect(c.status === 'Atrasado').toBe(false);
    expect(getComodatoStatusLabel(c)).toBe('Atrasado');
    expect(isComodatoAtivo(c, today)).toBe(false);
  });

  it('Emprestado com data BR ontem é atrasado', () => {
    const brYesterday = subDays(today, 1);
    const dd = String(brYesterday.getDate()).padStart(2, '0');
    const mm = String(brYesterday.getMonth() + 1).padStart(2, '0');
    const yyyy = brYesterday.getFullYear();
    const c = { status: 'Emprestado', data_devolucao_prevista: `${dd}/${mm}/${yyyy}` };
    expect(isComodatoAtrasado(c, today)).toBe(true);
    expect(isComodatoAtivo(c, today)).toBe(false);
  });

  it('Emprestado com data amanhã é ativo', () => {
    const c = { status: 'Emprestado', data_devolucao_prevista: tomorrowIso };
    expect(isComodatoAtivo(c, today)).toBe(true);
    expect(isComodatoAtrasado(c, today)).toBe(false);
  });

  it('Devolvido com data ontem não é atrasado', () => {
    const c = { status: 'Devolvido', data_devolucao_prevista: yesterdayIso };
    expect(isComodatoAtrasado(c, today)).toBe(false);
    expect(isComodatoDevolvido(c)).toBe(true);
  });

  it('status Atrasado sem data ainda conta como atrasado', () => {
    const c = { status: 'Atrasado' };
    expect(isComodatoAtrasado(c, today)).toBe(true);
    expect(isComodatoAtivo(c, today)).toBe(false);
  });

  it('partitionComodatos classifica vencidos sem confundir índice do Array.filter com refDate', () => {
    const overdue = { status: 'Emprestado', data_devolucao_prevista: yesterdayIso };
    const { ativos, atrasados } = partitionComodatos([overdue], today);
    expect(atrasados).toHaveLength(1);
    expect(ativos).toHaveLength(0);
  });

  it('particiona listagem como abas Ativos / Atrasados / Devolvidos', () => {
    const items = [
      { status: 'Emprestado', data_devolucao_prevista: yesterdayIso },
      { status: 'Emprestado', data_devolucao_prevista: yesterdayIso },
      { status: 'Emprestado', data_devolucao_prevista: tomorrowIso },
      { status: 'Devolvido', data_devolucao_prevista: yesterdayIso },
    ];

    const { ativos, atrasados, devolvidos } = partitionComodatos(items, today);

    expect(atrasados).toHaveLength(2);
    expect(ativos).toHaveLength(1);
    expect(devolvidos).toHaveLength(1);
  });
});
