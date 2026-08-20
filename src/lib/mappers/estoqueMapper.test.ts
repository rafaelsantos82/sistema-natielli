import { describe, it, expect } from 'vitest';
import {
  movimentacaoToApiPayload,
  movimentacaoFromApi,
  movimentacaoFormToInput,
} from '@/lib/mappers/estoqueMapper';

const ITEM_ID = 'b0000000-0000-4000-8000-000000000002';
const USER_ID = 'c0000000-0000-4000-8000-000000000003';

describe('estoqueMapper', () => {
  it('movimentacaoToApiPayload maps Entrada with ISO data_hora', () => {
    const payload = movimentacaoToApiPayload({
      item_id: ITEM_ID,
      item_nome: 'Teste',
      tipo: 'Entrada',
      quantidade: 10,
      data_hora: '2026-05-29T13:31:00.000Z',
      motivo: 'compras',
      responsavel_id: USER_ID,
      responsavel_nome: 'Admin',
    });

    expect(payload).toEqual({
      item_id: ITEM_ID,
      item_nome: 'Teste',
      tipo: 'Entrada',
      quantidade: 10,
      data_hora: '2026-05-29T13:31:00.000Z',
      motivo: 'compras',
      responsavel_id: USER_ID,
      responsavel_nome: 'Admin',
    });
  });

  it('movimentacaoToApiPayload omits empty documento', () => {
    const payload = movimentacaoToApiPayload({
      item_id: ITEM_ID,
      item_nome: 'Teste',
      tipo: 'Saída',
      quantidade: 2,
      data_hora: '2026-05-29T13:31:00.000Z',
      documento: '  ',
      motivo: 'uso',
      responsavel_id: USER_ID,
      responsavel_nome: 'Admin',
    });

    expect(payload.documento).toBeUndefined();
    expect(payload.tipo).toBe('Saída');
  });

  it('movimentacaoToApiPayload includes saldo_atual for Ajuste', () => {
    const payload = movimentacaoToApiPayload({
      item_id: ITEM_ID,
      item_nome: 'Teste',
      tipo: 'Ajuste',
      quantidade: 5,
      data_hora: '2026-05-29T13:31:00.000Z',
      motivo: 'inventário',
      responsavel_id: USER_ID,
      responsavel_nome: 'Admin',
      saldo_alvo: 12,
    });

    expect(payload.saldo_atual).toBe(12);
  });

  it('movimentacaoFromApi maps snake_case fields', () => {
    const mov = movimentacaoFromApi({
      id: 'd0000000-0000-4000-8000-000000000004',
      item_id: ITEM_ID,
      item_nome: 'Item A',
      tipo: 'Entrada',
      quantidade: 10,
      data_hora: '2026-05-29T10:00:00Z',
      motivo: 'compras',
      responsavel_id: USER_ID,
      responsavel_nome: 'Admin',
      saldo_anterior: 0,
      saldo_atual: 10,
      created_at: '2026-05-29T10:00:01Z',
    });

    expect(mov.id).toBe('d0000000-0000-4000-8000-000000000004');
    expect(mov.saldo_atual).toBe(10);
    expect(mov.createdAt).toBe('2026-05-29T10:00:01Z');
  });

  it('movimentacaoFormToInput copies form fields', () => {
    const input = movimentacaoFormToInput({
      item_id: ITEM_ID,
      item_nome: 'Teste',
      tipo: 'Entrada',
      quantidade: 3,
      data_hora: '2026-05-29T13:31:00.000Z',
      documento: 'NF-1',
      motivo: 'compras',
      responsavel_id: USER_ID,
      responsavel_nome: 'Admin',
    });

    expect(input.item_id).toBe(ITEM_ID);
    expect(input.documento).toBe('NF-1');
  });
});
