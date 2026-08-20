const MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: 'Dados inválidos. Verifique os campos e tente novamente.',
  REQUIRED_FIELD: 'Preencha todos os campos obrigatórios.',
  INVALID_FORMAT: 'Formato de dados inválido.',
  INVALID_VALUE: 'Valor inválido.',
  INVALID_SALA: 'A sala selecionada não está disponível nesta unidade.',
  NOT_FOUND: 'Registro não encontrado.',
  CONFLICT: 'Este registro já existe ou está em uso em outro lugar.',
  BUSINESS_RULE_VIOLATION:
    'Esta ação não pode ser concluída com os dados atuais.',
  UNAUTHORIZED: 'Sessão expirada. Faça login novamente.',
  FORBIDDEN: 'Você não tem permissão para esta ação.',
  TOO_MANY_REQUESTS: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  PASSWORD_CHANGE_REQUIRED: 'É necessário alterar sua senha antes de continuar.',
  INTERNAL_ERROR: 'Ocorreu um problema no servidor. Tente novamente em instantes.',
  DATABASE_ERROR: 'Não foi possível processar os dados. Tente novamente.',
  TIMEOUT: 'A operação demorou demais. Verifique sua conexão e tente novamente.',
  SERVICE_MISCONFIGURED: 'Serviço temporariamente indisponível. Contate o suporte.',
  SERVICE_UNAVAILABLE: 'Serviço temporariamente indisponível. Tente mais tarde.',
};

export function getErrorMessage(code: string, fallback?: string): string {
  return MESSAGES[code] ?? fallback ?? 'Ocorreu um erro. Tente novamente.';
}
