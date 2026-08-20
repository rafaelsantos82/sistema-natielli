const CLEAR_FLAG = 'legacy_demo_data_cleared_v2';

/** Chaves preservadas após limpeza de dados de demonstração. */
const PRESERVED_KEYS = new Set(['auth_profile', 'unidade_ativa', 'unidades']);

/**
 * Chaves de localStorage preenchidas por seeds/mocks de demonstração (Lovable).
 * Removidas uma vez por navegador para não mascarar o estado real da API.
 */
const LEGACY_DEMO_KEYS = [
  'consultas',
  'notification_settings',
  'profissionais',
  'profissional_conselhos',
  'profissional_documentos',
  'salas_atendimento',
  'reservas_salas',
  'financeiro_categorias',
  'financeiro_centros_custo',
  'financeiro_lancamentos',
  'funcionariosCLT',
  'funcionariosPJ',
  'folhasCLT',
  'folhasPJ',
  'anamneses',
  'respostas_anamneses',
  'anamneses_seeded_v1',
  'prontuarios',
  'comodatos',
  'estoque_itens',
  'estoque_movimentacoes',
  'estoque_inventarios',
  'marketing_manuais',
  'marketing_materiais',
  'contratos',
  'compartilhamentos_contratos',
  'solicitacoes_assinatura',
  'relatorios',
  'notasFiscais',
  'acoesJudiciais',
  'planosSaude',
  'aniversariantes',
  'audit_log',
  'mock_multiunidade_v1',
  'migrations_unidade_v1',
  'pacientes_extras',
  'signed_documents',
  'notificacoes_agenda',
  'notificacoes_agenda_destinatario',
  'termos_consentimento',
  'registros_consentimento',
  'carimbos_atendimento',
];

export function clearLegacyMockStorage(): void {
  try {
    if (localStorage.getItem(CLEAR_FLAG) === 'done') {
      return;
    }
    for (const key of LEGACY_DEMO_KEYS) {
      localStorage.removeItem(key);
    }
    // Remove rascunhos de anamnese por paciente (prefixo draft_)
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || PRESERVED_KEYS.has(key)) continue;
      if (key.startsWith('anamnese_draft_') || key.startsWith('evolucao_draft_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(CLEAR_FLAG, 'done');
  } catch {
    /* private mode / quota */
  }
}
