import type {
  FolhaCLT,
  FolhaPJ,
  FuncionarioCLT,
  FuncionarioPJ,
} from '@/lib/validations/folhaPagamento.schema';

function toDateOnly(value: unknown): string {
  if (typeof value !== 'string' || !value) return '';
  return value.slice(0, 10);
}

export function apiToFuncionarioCLT(raw: Record<string, unknown>): FuncionarioCLT {
  return {
    id: String(raw.id),
    nome: String(raw.nome ?? ''),
    cpf: String(raw.cpf ?? ''),
    cargo: String(raw.cargo ?? ''),
    salario_base: Number(raw.salario_base ?? 0),
    data_admissao: toDateOnly(raw.data_admissao),
    ativo: raw.ativo !== false,
    dependentes: Number(raw.dependentes ?? 0),
    vale_transporte: raw.vale_transporte !== false,
    vale_alimentacao: Number(raw.vale_alimentacao ?? 0),
  };
}

export function apiToFuncionarioPJ(raw: Record<string, unknown>): FuncionarioPJ {
  return {
    id: String(raw.id),
    nome: String(raw.nome ?? ''),
    cnpj: String(raw.cnpj ?? ''),
    razao_social: String(raw.razao_social ?? ''),
    servico: String(raw.servico ?? ''),
    valor_hora: Number(raw.valor_hora ?? 0),
    data_inicio: toDateOnly(raw.data_inicio),
    ativo: raw.ativo !== false,
  };
}

export function apiToFolhaCLT(raw: Record<string, unknown>): FolhaCLT {
  return {
    id: String(raw.id),
    funcionario_id: String(raw.funcionario_id),
    mes_referencia: String(raw.mes_referencia ?? ''),
    salario_base: Number(raw.salario_base ?? 0),
    horas_extras: Number(raw.horas_extras ?? 0),
    adicional_noturno: Number(raw.adicional_noturno ?? 0),
    outros_proventos: Number(raw.outros_proventos ?? 0),
    vale_transporte: Number(raw.vale_transporte ?? 0),
    vale_alimentacao: Number(raw.vale_alimentacao ?? 0),
    inss: Number(raw.inss ?? 0),
    fgts: Number(raw.fgts ?? 0),
    irrf: Number(raw.irrf ?? 0),
    outros_descontos: Number(raw.outros_descontos ?? 0),
    salario_liquido: Number(raw.salario_liquido ?? 0),
    data_pagamento: raw.data_pagamento ? toDateOnly(raw.data_pagamento) : undefined,
    status: (raw.status as FolhaCLT['status']) ?? 'pendente',
  };
}

export function apiToFolhaPJ(raw: Record<string, unknown>): FolhaPJ {
  return {
    id: String(raw.id),
    funcionario_id: String(raw.funcionario_id),
    mes_referencia: String(raw.mes_referencia ?? ''),
    horas_trabalhadas: Number(raw.horas_trabalhadas ?? 0),
    valor_hora: Number(raw.valor_hora ?? 0),
    valor_total: Number(raw.valor_total ?? 0),
    retencao_iss: Number(raw.retencao_iss ?? 0),
    retencao_ir: Number(raw.retencao_ir ?? 0),
    valor_liquido: Number(raw.valor_liquido ?? 0),
    data_pagamento: raw.data_pagamento ? toDateOnly(raw.data_pagamento) : undefined,
    status: (raw.status as FolhaPJ['status']) ?? 'pendente',
    descricao_servicos: raw.descricao_servicos ? String(raw.descricao_servicos) : undefined,
  };
}

export function funcionarioCLTToApiPayload(
  data: Omit<FuncionarioCLT, 'id'> | FuncionarioCLT,
  unidadeApiId: string,
) {
  return {
    unidade_id: unidadeApiId,
    nome: data.nome,
    cpf: data.cpf,
    cargo: data.cargo,
    salario_base: data.salario_base,
    data_admissao: data.data_admissao,
    ativo: data.ativo ?? true,
    dependentes: data.dependentes ?? 0,
    vale_transporte: data.vale_transporte ?? true,
    vale_alimentacao: data.vale_alimentacao ?? 0,
  };
}

export function funcionarioPJToApiPayload(
  data: Omit<FuncionarioPJ, 'id'> | FuncionarioPJ,
  unidadeApiId: string,
) {
  return {
    unidade_id: unidadeApiId,
    nome: data.nome,
    cnpj: data.cnpj,
    razao_social: data.razao_social,
    servico: data.servico,
    valor_hora: data.valor_hora,
    data_inicio: data.data_inicio,
    ativo: data.ativo ?? true,
  };
}

export function folhaCLTToApiPayload(data: FolhaCLT) {
  return {
    funcionario_id: data.funcionario_id,
    mes_referencia: data.mes_referencia,
    salario_base: data.salario_base,
    horas_extras: data.horas_extras ?? 0,
    adicional_noturno: data.adicional_noturno ?? 0,
    outros_proventos: data.outros_proventos ?? 0,
    vale_transporte: data.vale_transporte ?? 0,
    vale_alimentacao: data.vale_alimentacao ?? 0,
    inss: data.inss ?? 0,
    fgts: data.fgts ?? 0,
    irrf: data.irrf ?? 0,
    outros_descontos: data.outros_descontos ?? 0,
    salario_liquido: data.salario_liquido ?? 0,
    data_pagamento: data.data_pagamento || undefined,
    status: data.status ?? 'pendente',
  };
}

export function folhaPJToApiPayload(data: FolhaPJ) {
  return {
    funcionario_id: data.funcionario_id,
    mes_referencia: data.mes_referencia,
    horas_trabalhadas: data.horas_trabalhadas,
    valor_hora: data.valor_hora,
    valor_total: data.valor_total ?? 0,
    retencao_iss: data.retencao_iss ?? 0,
    retencao_ir: data.retencao_ir ?? 0,
    valor_liquido: data.valor_liquido ?? 0,
    data_pagamento: data.data_pagamento || undefined,
    status: data.status ?? 'pendente',
    descricao_servicos: data.descricao_servicos || undefined,
  };
}
