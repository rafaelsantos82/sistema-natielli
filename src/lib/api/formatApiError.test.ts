import { describe, expect, it } from 'vitest';
import { ApiClientError } from '@/lib/api/client';
import { formatApiErrorForToast, formatQueryError } from '@/lib/api/formatApiError';

describe('formatApiErrorForToast', () => {
  it('uses backend message for business rule violation', () => {
    const err = new ApiClientError(
      400,
      'BUSINESS_RULE_VIOLATION',
      'Não é possível excluir a sala: existem agendamentos vinculados.',
    );
    const result = formatApiErrorForToast(err, {
      action: 'excluir',
      entity: 'a sala',
    });
    expect(result.title).toBe('Não foi possível excluir a sala');
    expect(result.description).toContain('agendamentos vinculados');
  });

  it('maps criar action for validation errors', () => {
    const err = new ApiClientError(400, 'VALIDATION_ERROR', 'arquivo é obrigatório');
    const result = formatApiErrorForToast(err, { action: 'criar', entity: 'o contrato' });
    expect(result.title).toBe('Não foi possível criar o contrato');
    expect(result.description).toBe('arquivo é obrigatório');
  });

  it('prefers details over message for validation', () => {
    const err = new ApiClientError(400, 'VALIDATION_ERROR', 'Dados inválidos', [
      { field: 'cpf', message: 'CPF já cadastrado para outro paciente.' },
    ]);
    const result = formatApiErrorForToast(err, { action: 'salvar', entity: 'o paciente' });
    expect(result.description).toBe('CPF já cadastrado para outro paciente.');
  });

  it('maps 401 to session expired', () => {
    const err = new ApiClientError(401, 'UNAUTHORIZED', 'Token inválido');
    const result = formatApiErrorForToast(err);
    expect(result.title).toBe('Sessão expirada');
    expect(result.description).toContain('login');
  });

  it('maps 401 on login flow to invalid credentials', () => {
    const err = new ApiClientError(401, 'UNAUTHORIZED', 'Token inválido');
    const result = formatApiErrorForToast(err, { authFlow: 'login' });
    expect(result.title).toBe('Credenciais inválidas');
    expect(result.description).toContain('senha');
  });

  it('maps offline status 0', () => {
    const err = new ApiClientError(0, 'INTERNAL_ERROR', 'Falha de conexão');
    const result = formatApiErrorForToast(err);
    expect(result.title).toBe('Sem conexão');
    expect(result.description).toContain('conectar');
  });

  it('hides generic 500 message', () => {
    const err = new ApiClientError(500, 'INTERNAL_ERROR', 'Erro interno');
    const result = formatApiErrorForToast(err, { action: 'salvar', entity: 'o paciente' });
    expect(result.title).toBe('Problema no servidor');
    expect(result.description).not.toBe('Erro interno');
    expect(result.description).toContain('servidor');
  });

  it('maps conflict code', () => {
    const err = new ApiClientError(409, 'CONFLICT', 'E-mail já cadastrado');
    const result = formatApiErrorForToast(err);
    expect(result.title).toBe('Conflito de dados');
    expect(result.description).toBe('E-mail já cadastrado');
  });

  it('sanitizes crypto invalid password', () => {
    const result = formatApiErrorForToast(new Error('Invalid password'));
    expect(result.description).toContain('certificado');
    expect(result.description).not.toContain('Invalid password');
  });
});

describe('formatQueryError', () => {
  it('combines title and description for alerts', () => {
    const err = new ApiClientError(0, 'INTERNAL_ERROR', 'Falha');
    const msg = formatQueryError(err, 'pacientes');
    expect(msg).toContain('Sem conexão');
    expect(msg).toContain('conectar');
  });
});
