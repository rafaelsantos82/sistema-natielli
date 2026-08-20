export interface BalanceteAjudaSecao {
  id: string;
  titulo: string;
  paragrafos: string[];
  passos?: string[];
}

export interface BalanceteAjudaFaqItem {
  id: string;
  pergunta: string;
  resposta: string;
}

export const tituloModal = 'Ajuda — Balancete de verificação';

export const balanceteAjudaSecoes: BalanceteAjudaSecao[] = [
  {
    id: 'o-que-e',
    titulo: 'O que é um balancete de verificação?',
    paragrafos: [
      'O balancete de verificação é um relatório contábil que lista todas as contas do plano de contas com saldo anterior, movimentação (débitos e créditos) e saldo final em um período.',
      'Ele serve para conferir se a escrituração está correta: no método das partidas dobradas, a soma dos débitos deve ser igual à soma dos créditos no período.',
      'É uma ferramenta de uso interno, muito usada por contadores antes do fechamento mensal, da DRE, do balanço patrimonial e de obrigações como a ECD (SPED Contábil).',
    ],
  },
  {
    id: 'como-gerar',
    titulo: 'Como gerar nesta ferramenta',
    paragrafos: [
      'Siga os passos abaixo na seção "Gerar Balancete" desta página:',
    ],
    passos: [
      'Defina o período inicial e final (datas de início e fim da apuração).',
      'Opcional: informe um centro de custo para filtrar apenas lançamentos daquele centro.',
      'Confirme a unidade ativa no seletor do menu superior — o balancete considera essa unidade automaticamente.',
      'Ajuste as opções: ocultar contas sem movimento e saldo zero; escolha a visão em 4 ou 6 colunas (formato contador).',
      'Clique em "Gerar Balancete" e aguarde o carregamento dos dados contábeis.',
      'Se aparecer alerta de desbalanceamento, revise os lançamentos. Quando estiver correto, use Exportar PDF ou CSV se precisar enviar ao contador.',
    ],
  },
  {
    id: 'escrituracao',
    titulo: 'Por que fazer escrituração contábil?',
    paragrafos: [
      'O módulo Financeiro (Contas a Pagar e Contas a Receber) registra títulos do dia a dia: valor, vencimento, categoria, status Pago/Pendente. Isso é gestão de fluxo de caixa e cobrança.',
      'A escrituração contábil registra partidas no plano de contas (código da conta, débito ou crédito, histórico). O balancete usa apenas esses lançamentos contábeis — não os títulos do Financeiro.',
      'Sem contas e lançamentos contábeis cadastrados, o balancete ficará vazio ou sem movimentação no período. Use a seção "Escrituração contábil" abaixo para cadastrar o plano de contas e os lançamentos.',
      'Cada fato contábil deve ter contrapartida: por exemplo, ao pagar aluguel, registre débito em Despesa de aluguel e crédito em Banco (dois lançamentos, um em cada conta).',
      'No futuro, o sistema poderá integrar Financeiro e Contabilidade para gerar essas partidas automaticamente. Hoje essa integração ainda não existe — os dois módulos funcionam de forma independente.',
    ],
  },
];

export const balanceteAjudaFaq: BalanceteAjudaFaqItem[] = [
  {
    id: 'faq-financeiro',
    pergunta: 'É a mesma coisa que Contas a Pagar e Contas a Receber no Financeiro?',
    resposta:
      'Não. O Financeiro controla títulos a pagar e a receber (fluxo de caixa, vencimentos e status). O balancete usa a contabilidade formal (plano de contas e partidas a débito e crédito). Os dois se complementam, mas hoje não há sincronização automática entre eles.',
  },
  {
    id: 'faq-equilibrio',
    pergunta: 'Por que os totais de débitos e créditos precisam ser iguais?',
    resposta:
      'Porque a contabilidade segue o método das partidas dobradas: todo valor debitado em uma conta deve ter um crédito equivalente em outra. Se os totais do período não fecharem, há lançamento incompleto, duplicado ou com valor errado.',
  },
  {
    id: 'faq-vazio',
    pergunta: 'Gerei o balancete e não apareceu nada. O que fazer?',
    resposta:
      'Verifique se existem contas e lançamentos contábeis no período escolhido e se a unidade ativa está correta. Cadastre dados na seção "Escrituração contábil" ou peça ao administrador para rodar o seed em ambiente de testes. Se usou "Ocultar contas sem movimento", desmarque a opção para ver contas zeradas.',
  },
  {
    id: 'faq-duas-contas',
    pergunta: 'Preciso lançar em duas contas para cada movimento?',
    resposta:
      'Sim, para o balancete fechar. Cada linha que você cadastra afeta uma conta (débito ou crédito). Para um pagamento de R$ 100, por exemplo, registre R$ 100 a débito na conta de despesa e R$ 100 a crédito na conta de banco — dois lançamentos, em contas analíticas diferentes.',
  },
  {
    id: 'faq-colunas',
    pergunta: 'Qual a diferença entre a visão simplificada e a visão de 6 colunas?',
    resposta:
      'A visão simplificada mostra saldo inicial, débitos, créditos e saldo final em colunas únicas. A visão de 6 colunas separa saldo anterior, movimento e saldo atual em colunas Devedor e Credor — formato mais familiar para contadores e alinhado ao que muitos ERPs e a ECD utilizam no fechamento.',
  },
];
