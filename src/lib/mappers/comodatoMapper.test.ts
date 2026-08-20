import { describe, it, expect } from 'vitest';
import {
  mapComodatoDevolucaoPatch,
  mapComodatoFromApi,
  mapComodatoToApiBody,
  type ComodatoMapped,
} from './comodatoMapper';

const baseComodato: ComodatoMapped = {
  id: 'c1',
  item_id: 'item-1',
  item_nome: 'Cadeira',
  paciente_id: 'p1',
  paciente_nome: 'João',
  data_emprestimo: '2026-05-01',
  data_devolucao_prevista: '2026-05-15',
  status: 'Emprestado',
  condicao_entrega: 'Bom',
  responsavel_id: 'r1',
  responsavel_nome: 'Maria',
  quantidade: 1,
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
};

describe('comodatoMapper', () => {
  it('mapComodatoFromApi preserva campos obrigatórios do PUT', () => {
    const mapped = mapComodatoFromApi({
      id: 'uuid-1',
      item_nome: 'Item',
      paciente_id: 'p1',
      paciente_nome: 'Paciente',
      data_emprestimo: '2026-05-01',
      data_devolucao_prevista: '2026-05-20',
      status: 'Emprestado',
      condicao_entrega: 'Novo',
      responsavel_id: 'prof-1',
      responsavel_nome: 'Prof',
      quantidade: 2,
      created_at: '2026-05-01T12:00:00Z',
      updated_at: '2026-05-02T12:00:00Z',
    });

    expect(mapped.condicao_entrega).toBe('Novo');
    expect(mapped.responsavel_id).toBe('prof-1');
    expect(mapped.responsavel_nome).toBe('Prof');
    expect(mapped.quantidade).toBe(2);
  });

  it('mapComodatoToApiBody inclui campos required do ComodatoRequest', () => {
    const body = mapComodatoToApiBody(baseComodato);

    expect(body.item_nome).toBe('Cadeira');
    expect(body.paciente_id).toBe('p1');
    expect(body.condicao_entrega).toBe('Bom');
    expect(body.responsavel_id).toBe('r1');
    expect(body.responsavel_nome).toBe('Maria');
    expect(body.status).toBe('Emprestado');
    expect(body.quantidade).toBe(1);
  });

  it('mapComodatoDevolucaoPatch define status Devolvido e data real', () => {
    const patch = mapComodatoDevolucaoPatch(baseComodato, {
      data_devolucao_real: '2026-05-28',
      condicao_devolucao: 'Bom',
      observacoes: 'Devolvido em dia',
    });

    expect(patch.status).toBe('Devolvido');
    expect(patch.data_devolucao_real).toBe('2026-05-28');
    expect(patch.condicao_devolucao).toBe('Bom');
    expect(patch.observacoes).toBe('Devolvido em dia');
  });

  it('mapComodatoToApiBody após patch de devolução envia status Devolvido', () => {
    const patch = mapComodatoDevolucaoPatch(baseComodato, {
      data_devolucao_real: '2026-05-28',
      condicao_devolucao: 'Regular',
    });
    const body = mapComodatoToApiBody({ ...baseComodato, ...patch });

    expect(body.status).toBe('Devolvido');
    expect(body.data_devolucao_real).toBe('2026-05-28');
    expect(body.condicao_devolucao).toBe('Regular');
    expect(body.condicao_entrega).toBe('Bom');
    expect(body.responsavel_id).toBe('r1');
  });
});
