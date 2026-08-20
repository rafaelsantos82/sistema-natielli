import { useState, useEffect } from 'react';

export interface TermoConsentimento {
  id: string;
  tipo: 'Atendimento' | 'Dados_LGPD' | 'Imagem' | 'Pesquisa';
  titulo: string;
  versao: string;
  texto: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegistroConsentimento {
  id: string;
  paciente_id: string;
  paciente_nome: string;
  termo_id: string;
  termo_versao: string;
  tipo: string;
  aceito: boolean;
  aceito_em: string;
  ip_address?: string;
  user_agent?: string;
  responsavel_legal?: {
    nome: string;
    cpf: string;
    parentesco: string;
    assinatura: string;
  };
  revogado?: boolean;
  revogado_em?: string;
  createdAt: string;
}

export interface CarimboAtendimento {
  id: string;
  atendimento_id: string;
  paciente_id: string;
  paciente_nome: string;
  profissional_id: string;
  profissional_nome: string;
  tipo: 'inicio' | 'fim';
  timestamp: string;
  hash?: string;
  observacoes?: string;
  createdAt: string;
}

const STORAGE_KEY_TERMOS = 'termos_consentimento';
const STORAGE_KEY_REGISTROS = 'registros_consentimento';
const STORAGE_KEY_CARIMBOS = 'carimbos_atendimento';

// Termos padrão LGPD
const TERMOS_PADRAO: TermoConsentimento[] = [
  {
    id: 'termo_atendimento',
    tipo: 'Atendimento',
    titulo: 'Termo de Consentimento de Atendimento',
    versao: '1.0',
    texto: `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO PARA ATENDIMENTO

Por meio deste termo, declaro que:

1. Fui informado(a) sobre os procedimentos, objetivos e métodos que serão utilizados durante o atendimento.
2. Compreendo que o atendimento será realizado por profissional qualificado e habilitado.
3. Autorizo a realização dos procedimentos necessários para o adequado atendimento.
4. Fui informado(a) sobre os meus direitos e deveres durante o atendimento.
5. Tive a oportunidade de esclarecer todas as minhas dúvidas.

Este consentimento pode ser revogado a qualquer momento mediante solicitação expressa.`,
    ativo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'termo_lgpd',
    tipo: 'Dados_LGPD',
    titulo: 'Termo de Concordância de Dados - LGPD',
    versao: '1.0',
    texto: `TERMO DE CONSENTIMENTO PARA TRATAMENTO DE DADOS PESSOAIS - LGPD

Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), declaro que:

1. AUTORIZO o tratamento dos meus dados pessoais para as seguintes finalidades:
   - Realização de atendimentos clínicos e terapêuticos
   - Emissão de documentos e relatórios
   - Comunicação sobre agendamentos e resultados
   - Cumprimento de obrigações legais e regulatórias

2. FUI INFORMADO(A) sobre:
   - Os dados que serão coletados e tratados
   - A finalidade do tratamento dos dados
   - Meus direitos como titular de dados
   - Como exercer meus direitos (acesso, correção, exclusão, portabilidade)

3. COMPREENDO que:
   - Meus dados serão mantidos em segurança
   - Posso revogar este consentimento a qualquer momento
   - A revogação não afeta tratamentos realizados anteriormente
   - Tenho direito a solicitar cópia dos meus dados

4. DIREITOS DO TITULAR:
   - Confirmação da existência de tratamento
   - Acesso aos dados
   - Correção de dados incompletos, inexatos ou desatualizados
   - Anonimização, bloqueio ou eliminação de dados desnecessários
   - Portabilidade dos dados
   - Informação sobre compartilhamento
   - Revogação do consentimento

Para exercer seus direitos, entre em contato através dos canais oficiais da instituição.`,
    ativo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const useConsentimentos = () => {
  const [termos, setTermos] = useState<TermoConsentimento[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_TERMOS);
    return stored ? JSON.parse(stored) : TERMOS_PADRAO;
  });

  const [registros, setRegistros] = useState<RegistroConsentimento[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_REGISTROS);
    return stored ? JSON.parse(stored) : [];
  });

  const [carimbos, setCarimbos] = useState<CarimboAtendimento[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_CARIMBOS);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TERMOS, JSON.stringify(termos));
  }, [termos]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_REGISTROS, JSON.stringify(registros));
  }, [registros]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CARIMBOS, JSON.stringify(carimbos));
  }, [carimbos]);

  // Gerenciamento de Termos
  const getTermoAtivo = (tipo: TermoConsentimento['tipo']) => {
    return termos.find((t) => t.tipo === tipo && t.ativo);
  };

  // Gerenciamento de Registros de Consentimento
  const registrarConsentimento = (data: Omit<RegistroConsentimento, 'id' | 'createdAt'>) => {
    const newRegistro: RegistroConsentimento = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setRegistros((prev) => [...prev, newRegistro]);
    return newRegistro;
  };

  const revogarConsentimento = (registroId: string) => {
    setRegistros((prev) =>
      prev.map((reg) =>
        reg.id === registroId
          ? { ...reg, revogado: true, revogado_em: new Date().toISOString() }
          : reg
      )
    );
  };

  const getConsentimentosPaciente = (pacienteId: string) => {
    return registros.filter((reg) => reg.paciente_id === pacienteId && !reg.revogado);
  };

  const verificarConsentimentoValido = (pacienteId: string, tipoTermo: string): boolean => {
    const consentimentos = getConsentimentosPaciente(pacienteId);
    return consentimentos.some((c) => c.tipo === tipoTermo && c.aceito);
  };

  // Gerenciamento de Carimbos de Atendimento
  const registrarCarimbo = (data: Omit<CarimboAtendimento, 'id' | 'createdAt' | 'hash'>) => {
    // Gerar hash simples para auditoria (em produção usar crypto adequado)
    const hash = btoa(
      `${data.atendimento_id}-${data.timestamp}-${data.tipo}`
    );

    const newCarimbo: CarimboAtendimento = {
      ...data,
      id: Date.now().toString(),
      hash,
      createdAt: new Date().toISOString(),
    };
    setCarimbos((prev) => [...prev, newCarimbo]);
    return newCarimbo;
  };

  const iniciarAtendimento = (
    atendimentoId: string,
    pacienteId: string,
    pacienteNome: string,
    profissionalId: string,
    profissionalNome: string
  ) => {
    return registrarCarimbo({
      atendimento_id: atendimentoId,
      paciente_id: pacienteId,
      paciente_nome: pacienteNome,
      profissional_id: profissionalId,
      profissional_nome: profissionalNome,
      tipo: 'inicio',
      timestamp: new Date().toISOString(),
    });
  };

  const encerrarAtendimento = (
    atendimentoId: string,
    pacienteId: string,
    pacienteNome: string,
    profissionalId: string,
    profissionalNome: string,
    observacoes?: string
  ) => {
    return registrarCarimbo({
      atendimento_id: atendimentoId,
      paciente_id: pacienteId,
      paciente_nome: pacienteNome,
      profissional_id: profissionalId,
      profissional_nome: profissionalNome,
      tipo: 'fim',
      timestamp: new Date().toISOString(),
      observacoes,
    });
  };

  const getCarimbosByAtendimento = (atendimentoId: string) => {
    return carimbos.filter((c) => c.atendimento_id === atendimentoId);
  };

  return {
    termos,
    registros,
    carimbos,
    getTermoAtivo,
    registrarConsentimento,
    revogarConsentimento,
    getConsentimentosPaciente,
    verificarConsentimentoValido,
    iniciarAtendimento,
    encerrarAtendimento,
    getCarimbosByAtendimento,
  };
};
