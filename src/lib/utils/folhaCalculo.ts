import type { FolhaCLT, FuncionarioCLT } from '@/lib/validations/folhaPagamento.schema';

const FAIXA_INSS = [
  { limite: 1412.0, aliquota: 0.075 },
  { limite: 2666.68, aliquota: 0.09 },
  { limite: 4000.03, aliquota: 0.12 },
  { limite: 7786.02, aliquota: 0.14 },
];

const FAIXA_IR = [
  { limite: 2112.0, aliquota: 0, deducao: 0 },
  { limite: 2826.65, aliquota: 0.075, deducao: 158.4 },
  { limite: 3751.05, aliquota: 0.15, deducao: 370.4 },
  { limite: 4664.68, aliquota: 0.225, deducao: 651.73 },
  { limite: Infinity, aliquota: 0.275, deducao: 884.96 },
];

const DEDUCAO_DEPENDENTE_IR = 189.59;
const ALIQUOTA_FGTS = 0.08;

export function calcularINSS(salarioBruto: number): number {
  let inss = 0;
  let salarioRestante = salarioBruto;

  for (let i = 0; i < FAIXA_INSS.length; i++) {
    const faixaAnterior = i > 0 ? FAIXA_INSS[i - 1].limite : 0;
    const valorFaixa = Math.min(salarioRestante, FAIXA_INSS[i].limite - faixaAnterior);

    if (valorFaixa > 0) {
      inss += valorFaixa * FAIXA_INSS[i].aliquota;
      salarioRestante -= valorFaixa;
    }

    if (salarioRestante <= 0) break;
  }

  return Math.min(
    inss,
    FAIXA_INSS[FAIXA_INSS.length - 1].limite * FAIXA_INSS[FAIXA_INSS.length - 1].aliquota,
  );
}

export function calcularIRRF(salarioBruto: number, inss: number, dependentes: number): number {
  const baseCalculo = salarioBruto - inss - dependentes * DEDUCAO_DEPENDENTE_IR;

  for (const faixa of FAIXA_IR) {
    if (baseCalculo <= faixa.limite) {
      const ir = baseCalculo * faixa.aliquota - faixa.deducao;
      return Math.max(ir, 0);
    }
  }

  return 0;
}

export function calcularFGTS(salarioBruto: number): number {
  return salarioBruto * ALIQUOTA_FGTS;
}

export function calcularFolhaCLT(
  funcionario: FuncionarioCLT,
  horasExtras = 0,
  adicionalNoturno = 0,
  outrosProventos = 0,
  outrosDescontos = 0,
): Omit<FolhaCLT, 'id' | 'funcionario_id' | 'mes_referencia' | 'data_pagamento' | 'status'> {
  const salarioBruto =
    funcionario.salario_base + horasExtras + adicionalNoturno + outrosProventos;
  const inss = calcularINSS(salarioBruto);
  const fgts = calcularFGTS(salarioBruto);
  const irrf = calcularIRRF(salarioBruto, inss, funcionario.dependentes);

  const valeTransporte = funcionario.vale_transporte ? salarioBruto * 0.06 : 0;
  const valeAlimentacao = funcionario.vale_alimentacao;

  const totalDescontos = inss + irrf + valeTransporte + outrosDescontos;
  const salarioLiquido = salarioBruto - totalDescontos;

  return {
    salario_base: funcionario.salario_base,
    horas_extras: horasExtras,
    adicional_noturno: adicionalNoturno,
    outros_proventos: outrosProventos,
    vale_transporte: valeTransporte,
    vale_alimentacao: valeAlimentacao,
    inss,
    fgts,
    irrf,
    outros_descontos: outrosDescontos,
    salario_liquido: salarioLiquido,
  };
}
