import type { QuestionItem } from '@/hooks/useAnamneses';

export interface AnamneseTemplate {
  id: string;
  nome: string;
  especialidade: string;
  versao: string;
  observacoes?: string;
  questionnaire: QuestionItem[];
}

const SIM_NAO: QuestionItem['options'] = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Não' },
  { value: 'nao_sei', label: 'Não sei' },
];

export const ANAMNESE_TEMPLATES: AnamneseTemplate[] = [
  // ============= CLÍNICO GERAL =============
  {
    id: 'tpl-clinico-geral',
    nome: 'Anamnese Clínico Geral',
    especialidade: 'Clínico Geral',
    versao: '1.0',
    observacoes: 'Modelo baseado na anamnese tradicional (7 itens) — Semiologia UFOP/UFF.',
    questionnaire: [
      { linkId: 'queixa_principal', text: 'Queixa principal (em poucas palavras)', type: 'text', required: true },
      { linkId: 'hma', text: 'História da moléstia atual (início, evolução, fatores de melhora/piora)', type: 'text', required: true },
      { linkId: 'rev_cardio', text: 'Sintomas cardiovasculares (dor torácica, palpitações, edema)?', type: 'text' },
      { linkId: 'rev_resp', text: 'Sintomas respiratórios (tosse, dispneia, chiado)?', type: 'text' },
      { linkId: 'rev_digestivo', text: 'Sintomas digestivos (azia, náusea, alteração de hábito intestinal)?', type: 'text' },
      { linkId: 'rev_urinario', text: 'Sintomas urinários (dor, frequência, incontinência)?', type: 'text' },
      { linkId: 'antecedentes', text: 'Doenças pré-existentes (HAS, DM, dislipidemia, etc.)', type: 'text' },
      { linkId: 'cirurgias', text: 'Já realizou cirurgias?', type: 'boolean', required: true },
      { linkId: 'cirurgias_quais', text: 'Quais cirurgias e quando?', type: 'text', enableWhen: [{ linkId: 'cirurgias', operator: 'equals', answerBoolean: true }] },
      { linkId: 'tabagismo', text: 'Fuma?', type: 'choice', options: [{ value: 'nao', label: 'Não' }, { value: 'ex', label: 'Ex-fumante' }, { value: 'sim', label: 'Sim' }], required: true },
      { linkId: 'alcool', text: 'Consome álcool?', type: 'choice', options: [{ value: 'nao', label: 'Não' }, { value: 'social', label: 'Social' }, { value: 'frequente', label: 'Frequente' }], required: true },
      { linkId: 'historico_familiar', text: 'Histórico familiar relevante (HAS, DM, câncer, cardiopatia)', type: 'text' },
    ],
  },

  // ============= PEDIATRIA =============
  {
    id: 'tpl-pediatria',
    nome: 'Anamnese Pediátrica',
    especialidade: 'Pediatria',
    versao: '1.0',
    observacoes: 'Inclui antecedentes gestacionais, neonatais e marcos do desenvolvimento.',
    questionnaire: [
      { linkId: 'queixa_principal', text: 'Queixa principal trazida pelos pais/responsáveis', type: 'text', required: true },
      { linkId: 'gestacao_planejada', text: 'A gestação foi planejada?', type: 'boolean' },
      { linkId: 'intercorrencias_gest', text: 'Houve intercorrências na gestação?', type: 'text' },
      { linkId: 'tipo_parto', text: 'Tipo de parto', type: 'choice', options: [{ value: 'normal', label: 'Normal' }, { value: 'cesarea', label: 'Cesárea' }, { value: 'forceps', label: 'Fórceps' }] },
      { linkId: 'idade_gestacional', text: 'Idade gestacional ao nascer (semanas)', type: 'integer' },
      { linkId: 'peso_nascimento', text: 'Peso ao nascer (gramas)', type: 'integer' },
      { linkId: 'apgar', text: 'Apgar (1º/5º minuto), se souber', type: 'string' },
      { linkId: 'aleitamento_materno', text: 'Recebeu aleitamento materno exclusivo?', type: 'choice', options: SIM_NAO },
      { linkId: 'aleitamento_tempo', text: 'Por quanto tempo (em meses)?', type: 'integer', enableWhen: [{ linkId: 'aleitamento_materno', operator: 'equals', answerString: 'sim' }] },
      { linkId: 'vacinas_em_dia', text: 'Vacinação em dia conforme PNI?', type: 'boolean', required: true },
      { linkId: 'sentou_idade', text: 'Idade que sentou sem apoio (meses)', type: 'integer' },
      { linkId: 'andou_idade', text: 'Idade que começou a andar (meses)', type: 'integer' },
      { linkId: 'falou_idade', text: 'Idade que disse as primeiras palavras (meses)', type: 'integer' },
      { linkId: 'alimentacao_atual', text: 'Como está a alimentação atual?', type: 'text' },
      { linkId: 'sono', text: 'Como é o sono da criança?', type: 'text' },
      { linkId: 'escolaridade', text: 'Frequenta escola/creche? Como é o desempenho?', type: 'text' },
    ],
  },

  // ============= NUTRIÇÃO =============
  {
    id: 'tpl-nutricao',
    nome: 'Anamnese Nutricional',
    especialidade: 'Nutrição',
    versao: '1.0',
    observacoes: 'Recordatório alimentar 24h, hábitos e objetivos.',
    questionnaire: [
      { linkId: 'objetivo', text: 'Objetivo do acompanhamento', type: 'choice', required: true, options: [
        { value: 'emagrecer', label: 'Emagrecer' },
        { value: 'ganhar', label: 'Ganhar massa' },
        { value: 'manter', label: 'Manter peso' },
        { value: 'saude', label: 'Melhorar saúde geral' },
      ]},
      { linkId: 'peso_atual', text: 'Peso atual (kg)', type: 'decimal', required: true },
      { linkId: 'peso_desejado', text: 'Peso desejado (kg)', type: 'decimal' },
      { linkId: 'altura', text: 'Altura (cm)', type: 'integer' },
      { linkId: 'refeicoes_dia', text: 'Quantas refeições faz por dia?', type: 'integer' },
      { linkId: 'recordatorio', text: 'Recordatório alimentar das últimas 24h', type: 'text', required: true },
      { linkId: 'agua_litros', text: 'Quantos litros de água por dia?', type: 'decimal' },
      { linkId: 'intolerancias', text: 'Possui intolerâncias ou restrições alimentares?', type: 'text' },
      { linkId: 'suplementos', text: 'Usa suplementos?', type: 'boolean' },
      { linkId: 'suplementos_quais', text: 'Quais suplementos?', type: 'text', enableWhen: [{ linkId: 'suplementos', operator: 'equals', answerBoolean: true }] },
      { linkId: 'atividade_fisica', text: 'Pratica atividade física? Qual e com que frequência?', type: 'text' },
      { linkId: 'habito_intestinal', text: 'Como é o hábito intestinal (frequência, consistência)?', type: 'text' },
      { linkId: 'compulsoes', text: 'Tem episódios de compulsão alimentar?', type: 'boolean' },
    ],
  },

  // ============= ALERGOLOGIA =============
  {
    id: 'tpl-alergologia',
    nome: 'Anamnese Alergologia e Imunologia',
    especialidade: 'Alergologia',
    versao: '1.0',
    observacoes: 'Avalia alergias respiratórias, cutâneas, alimentares e medicamentosas.',
    questionnaire: [
      { linkId: 'tipo_alergia', text: 'Tipo de alergia principal', type: 'choice', required: true, options: [
        { value: 'respiratoria', label: 'Respiratória (rinite/asma)' },
        { value: 'cutanea', label: 'Cutânea (urticária/dermatite)' },
        { value: 'alimentar', label: 'Alimentar' },
        { value: 'medicamentosa', label: 'Medicamentosa' },
        { value: 'multipla', label: 'Múltipla' },
      ]},
      { linkId: 'sint_espirros', text: 'Apresenta espirros em salva, coriza, prurido nasal?', type: 'boolean' },
      { linkId: 'sint_dispneia', text: 'Apresenta chiado no peito ou falta de ar?', type: 'boolean' },
      { linkId: 'sint_urticaria', text: 'Apresenta urticária ou prurido cutâneo?', type: 'boolean' },
      { linkId: 'sint_angioedema', text: 'Apresenta edema labial/palpebral?', type: 'boolean' },
      { linkId: 'sazonalidade', text: 'Os sintomas têm padrão sazonal?', type: 'choice', options: [
        { value: 'sim', label: 'Sim, pioram em estação específica' },
        { value: 'nao', label: 'Não, ocorrem o ano todo' },
      ]},
      { linkId: 'desencadeantes', text: 'Fatores desencadeantes percebidos (poeira, perfume, frio, exercício)', type: 'text' },
      { linkId: 'pets', text: 'Tem contato com animais (cães, gatos, aves)?', type: 'boolean' },
      { linkId: 'mofo_umidade', text: 'Há mofo ou umidade no ambiente?', type: 'boolean' },
      { linkId: 'historico_familiar_atopia', text: 'Histórico familiar de rinite, asma ou dermatite?', type: 'text' },
      { linkId: 'medicamento_alergia', text: 'Já teve reação a algum medicamento?', type: 'text' },
      { linkId: 'antihistaminicos', text: 'Faz uso atual de anti-histamínicos ou corticoides?', type: 'text' },
    ],
  },

  // ============= PSICOLOGIA =============
  {
    id: 'tpl-psicologia',
    nome: 'Anamnese Psicológica',
    especialidade: 'Psicologia',
    versao: '1.0',
    observacoes: 'Inclui rastreio de risco. Em caso de ideação suicida positiva, encaminhar imediatamente.',
    questionnaire: [
      { linkId: 'motivo_busca', text: 'O que motivou a busca por terapia?', type: 'text', required: true },
      { linkId: 'queixa_atual', text: 'Queixa atual em suas próprias palavras', type: 'text', required: true },
      { linkId: 'inicio_sintomas', text: 'Quando os sintomas começaram?', type: 'text' },
      { linkId: 'tratamentos_anteriores', text: 'Já fez terapia ou tratamento psiquiátrico antes?', type: 'boolean' },
      { linkId: 'tratamentos_quais', text: 'Descreva os tratamentos anteriores', type: 'text', enableWhen: [{ linkId: 'tratamentos_anteriores', operator: 'equals', answerBoolean: true }] },
      { linkId: 'medicacao_psiq', text: 'Faz uso de medicação psiquiátrica atualmente?', type: 'text' },
      { linkId: 'historico_familiar_psi', text: 'Histórico familiar de transtornos mentais', type: 'text' },
      { linkId: 'rede_apoio', text: 'Como é sua rede de apoio (família, amigos)?', type: 'text' },
      { linkId: 'sono_psi', text: 'Como está seu sono?', type: 'text' },
      { linkId: 'humor', text: 'Como descreveria seu humor nas últimas 2 semanas?', type: 'text' },
      { linkId: 'ideacao_suicida', text: 'Já teve pensamentos de se machucar ou tirar a própria vida?', type: 'boolean', required: true },
      { linkId: 'ideacao_detalhes', text: 'Pode falar mais sobre esses pensamentos?', type: 'text', enableWhen: [{ linkId: 'ideacao_suicida', operator: 'equals', answerBoolean: true }] },
      { linkId: 'substancias', text: 'Faz uso de álcool ou outras substâncias?', type: 'text' },
      { linkId: 'expectativas', text: 'Quais suas expectativas com a terapia?', type: 'text' },
    ],
  },

  // ============= TEA / AUTISMO =============
  {
    id: 'tpl-tea',
    nome: 'Anamnese para Avaliação de TEA (Autismo)',
    especialidade: 'TEA/Autismo',
    versao: '1.0',
    observacoes: 'Roteiro inspirado em M-CHAT-R/F e checklists de avaliação diagnóstica de TEA.',
    questionnaire: [
      { linkId: 'idade_atual', text: 'Idade atual da criança (meses)', type: 'integer', required: true },
      { linkId: 'idade_primeiros_sinais', text: 'Com que idade os pais notaram os primeiros sinais?', type: 'string' },
      { linkId: 'contato_visual', text: 'A criança faz contato visual de forma sustentada?', type: 'choice', options: SIM_NAO, required: true },
      { linkId: 'responde_nome', text: 'Responde quando chamada pelo nome?', type: 'choice', options: SIM_NAO, required: true },
      { linkId: 'aponta_interesse', text: 'Aponta para mostrar interesse (apontar protodeclarativo)?', type: 'choice', options: SIM_NAO },
      { linkId: 'brincar_simbolico', text: 'Tem brincadeira de faz-de-conta (ex.: dar comida ao boneco)?', type: 'choice', options: SIM_NAO },
      { linkId: 'interesses_restritos', text: 'Apresenta interesses muito restritos ou intensos por temas específicos?', type: 'text' },
      { linkId: 'estereotipias', text: 'Apresenta estereotipias (flapping, balanceio, girar)?', type: 'boolean' },
      { linkId: 'estereotipias_quais', text: 'Descreva as estereotipias', type: 'text', enableWhen: [{ linkId: 'estereotipias', operator: 'equals', answerBoolean: true }] },
      { linkId: 'sensibilidade_sensorial', text: 'Sensibilidades sensoriais (sons, luzes, texturas, cheiros)', type: 'text' },
      { linkId: 'seletividade_alimentar', text: 'Tem seletividade alimentar acentuada?', type: 'boolean' },
      { linkId: 'regressao', text: 'Houve perda/regressão de habilidades já adquiridas (fala, contato)?', type: 'boolean' },
      { linkId: 'comunicacao', text: 'Como é a comunicação atual (fala, ecolalia, gestos, ausência)?', type: 'text', required: true },
      { linkId: 'sono_tea', text: 'Como é o sono?', type: 'text' },
      { linkId: 'mchat_aplicado', text: 'M-CHAT-R/F já foi aplicado?', type: 'boolean' },
      { linkId: 'mchat_resultado', text: 'Resultado do M-CHAT (escore)', type: 'string', enableWhen: [{ linkId: 'mchat_aplicado', operator: 'equals', answerBoolean: true }] },
      { linkId: 'historico_familiar_tea', text: 'Histórico familiar de TEA, TDAH ou atraso de linguagem', type: 'text' },
    ],
  },
];
