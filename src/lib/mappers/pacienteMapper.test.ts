import { describe, it, expect } from 'vitest';
import { dtoToListRow } from '@/lib/mappers/pacienteMapper';
import type { PacienteDTO } from '@/lib/api/pacientes.types';

const baseDto: PacienteDTO = {
  id: 'uuid-1',
  nome_completo: 'Paciente Teste',
  data_nascimento: '2015-01-01',
  sexo_biologico: 'masculino',
  tel_principal: '11999999999',
  uf: 'RJ',
  cep: '20000000',
  responsavel_nome: 'Resp',
  consentimento_lgpd: true,
  autorizacao_uso_imagem: false,
  status: 'ativo',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('dtoToListRow', () => {
  it('marca excluido e status inativo quando deleted_at presente', () => {
    const row = dtoToListRow({
      ...baseDto,
      deleted_at: '2024-06-01T12:00:00Z',
      status: 'ativo',
    });
    expect(row.excluido).toBe(true);
    expect(row.status).toBe('inativo');
  });

  it('mantém status da API quando não excluído', () => {
    const row = dtoToListRow(baseDto);
    expect(row.excluido).toBe(false);
    expect(row.status).toBe('ativo');
  });

  it('mapeia unidadeIds ativas com a principal primeiro', () => {
    const row = dtoToListRow({
      ...baseDto,
      unidades: [
        { unidade_id: 'u-londrina', principal: false, ativo: true },
        { unidade_id: 'u-catanduva', principal: true, ativo: true },
        { unidade_id: 'u-offline', principal: false, ativo: false },
      ],
    });
    expect(row.unidadeIds).toEqual(['u-catanduva', 'u-londrina']);
  });
});
