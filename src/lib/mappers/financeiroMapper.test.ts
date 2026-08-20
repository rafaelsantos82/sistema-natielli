import { describe, expect, it } from 'vitest';
import { mapLancamento, lancamentoToPayload } from '@/lib/mappers/financeiroMapper';
import { UNIDADE_API_IDS } from '@/lib/unidades/apiIds';

const baseDto = {
  id: '11111111-1111-4111-8111-111111111111',
  tipo: 'Despesa',
  descricao: 'Aluguel',
  valor: 1500,
  data_vencimento: '2026-06-01',
  categoria_id: '22222222-2222-4222-8222-222222222222',
  categoria_nome: 'Operacional',
  status: 'Pendente',
  recorrente: false,
  conciliado: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('financeiroMapper', () => {
  it('mapLancamento converte unidade_id UUID para slug', () => {
    const mapped = mapLancamento({
      ...baseDto,
      unidade_id: UNIDADE_API_IDS['unidade-duque-caxias'],
    });
    expect(mapped.unidadeId).toBe('unidade-duque-caxias');
  });

  it('lancamentoToPayload converte slug de unidade para UUID da API', () => {
    const payload = lancamentoToPayload({
      tipo: 'Despesa',
      descricao: 'Teste',
      valor: 100,
      data_vencimento: '2026-06-01',
      categoria_id: baseDto.categoria_id,
      categoria_nome: 'Teste',
      unidadeId: 'unidade-duque-caxias',
    });
    expect(payload.unidade_id).toBe(UNIDADE_API_IDS['unidade-duque-caxias']);
  });

  it('mapLancamento mantém slug desconhecido quando não há mapeamento', () => {
    const mapped = mapLancamento({
      ...baseDto,
      unidade_id: 'custom-slug',
    });
    expect(mapped.unidadeId).toBe('custom-slug');
  });
});
