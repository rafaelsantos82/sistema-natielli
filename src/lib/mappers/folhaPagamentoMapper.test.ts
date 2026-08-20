import { describe, it, expect } from 'vitest';
import {
  funcionarioCLTToApiPayload,
  funcionarioPJToApiPayload,
  folhaCLTToApiPayload,
  apiToFuncionarioCLT,
} from '@/lib/mappers/folhaPagamentoMapper';

const UNIDADE_ID = 'a0000000-0000-4000-8000-000000000001';

describe('folhaPagamentoMapper', () => {
  it('funcionarioCLTToApiPayload includes unidade_id and required fields', () => {
    const payload = funcionarioCLTToApiPayload(
      {
        nome: 'Maria Silva',
        cpf: '123.456.789-00',
        cargo: 'Recepcionista',
        salario_base: 3500,
        data_admissao: '2024-03-15',
        ativo: true,
        dependentes: 1,
        vale_transporte: true,
        vale_alimentacao: 500,
      },
      UNIDADE_ID,
    );

    expect(payload).toEqual({
      unidade_id: UNIDADE_ID,
      nome: 'Maria Silva',
      cpf: '123.456.789-00',
      cargo: 'Recepcionista',
      salario_base: 3500,
      data_admissao: '2024-03-15',
      ativo: true,
      dependentes: 1,
      vale_transporte: true,
      vale_alimentacao: 500,
    });
  });

  it('funcionarioPJToApiPayload includes unidade_id', () => {
    const payload = funcionarioPJToApiPayload(
      {
        nome: 'João ME',
        cnpj: '12.345.678/0001-90',
        razao_social: 'João Serviços LTDA',
        servico: 'Consultoria',
        valor_hora: 150,
        data_inicio: '2024-01-01',
        ativo: true,
      },
      UNIDADE_ID,
    );

    expect(payload.unidade_id).toBe(UNIDADE_ID);
    expect(payload.nome).toBe('João ME');
    expect(payload.cnpj).toBe('12.345.678/0001-90');
  });

  it('folhaCLTToApiPayload maps funcionario_id and payroll fields', () => {
    const payload = folhaCLTToApiPayload({
      funcionario_id: 'f1',
      mes_referencia: '2024-05',
      salario_base: 3500,
      horas_extras: 100,
      adicional_noturno: 0,
      outros_proventos: 0,
      vale_transporte: 210,
      vale_alimentacao: 500,
      inss: 300,
      fgts: 280,
      irrf: 50,
      outros_descontos: 0,
      salario_liquido: 2940,
      status: 'pendente',
    });

    expect(payload.funcionario_id).toBe('f1');
    expect(payload.mes_referencia).toBe('2024-05');
    expect(payload.salario_liquido).toBe(2940);
    expect(payload.status).toBe('pendente');
  });

  it('apiToFuncionarioCLT normalizes id and date fields', () => {
    const row = apiToFuncionarioCLT({
      id: 'uuid-1',
      nome: 'Test',
      cpf: '111.222.333-44',
      cargo: 'Dev',
      salario_base: 5000,
      data_admissao: '2020-06-01T00:00:00Z',
      ativo: true,
      dependentes: 0,
      vale_transporte: false,
      vale_alimentacao: 0,
    });

    expect(row.id).toBe('uuid-1');
    expect(row.data_admissao).toBe('2020-06-01');
    expect(row.salario_base).toBe(5000);
  });
});
