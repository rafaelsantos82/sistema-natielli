import { ApiClientError } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errorMessages';

export type ToastErrorAction =
  | 'criar'
  | 'salvar'
  | 'excluir'
  | 'carregar'
  | 'aprovar'
  | 'rejeitar'
  | 'importar'
  | 'assinar'
  | 'verificar'
  | 'enviar'
  | 'baixar'
  | 'alterar';

export type AuthErrorFlow = 'login' | 'password-reset' | 'password-change';

export type ToastErrorContext = {
  action?: ToastErrorAction;
  /** Nome amigável: "sala", "agendamento", "paciente" */
  entity?: string;
  /** Ajusta títulos em telas de autenticação */
  authFlow?: AuthErrorFlow;
};

export type FormattedToastError = {
  title: string;
  description: string;
};

const ACTION_LABELS: Record<ToastErrorAction, string> = {
  criar: 'criar',
  salvar: 'salvar',
  excluir: 'excluir',
  carregar: 'carregar',
  aprovar: 'aprovar',
  rejeitar: 'rejeitar',
  importar: 'importar',
  assinar: 'assinar',
  verificar: 'verificar',
  enviar: 'enviar',
  baixar: 'baixar',
  alterar: 'alterar',
};

const GENERIC_SERVER_MESSAGE =
  'Ocorreu um problema no servidor. Tente novamente em instantes.';

const OFFLINE_MESSAGE =
  'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.';

const KNOWN_CLIENT_ERROR_PATTERNS: { pattern: RegExp; description: string }[] = [
  {
    pattern: /invalid password/i,
    description: 'Senha do certificado digital incorreta.',
  },
  {
    pattern: /password required|senha.*obrigat/i,
    description: 'Informe a senha do certificado digital.',
  },
  {
    pattern: /certificate.*expired|certificado.*expirado/i,
    description: 'O certificado digital está expirado.',
  },
];

function isGenericServerMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower === 'erro interno' ||
    lower === 'internal error' ||
    lower.includes('erro interno.')
  );
}

function buildActionTitle(action: ToastErrorAction, entity?: string): string {
  const label = ACTION_LABELS[action];
  if (entity) {
    return `Não foi possível ${label} ${entity}`;
  }
  return `Não foi possível ${label}`;
}

function titleForCode(
  code: string,
  status: number,
  ctx?: ToastErrorContext,
): string {
  if (status === 401 || code === 'UNAUTHORIZED') {
    if (ctx?.authFlow === 'login') {
      return 'Credenciais inválidas';
    }
    if (ctx?.authFlow === 'password-reset') {
      return 'Link inválido ou expirado';
    }
    if (ctx?.authFlow === 'password-change') {
      return 'Não foi possível alterar a senha';
    }
    return 'Sessão expirada';
  }
  if (status === 0) {
    return 'Sem conexão';
  }
  if (status === 408 || code === 'TIMEOUT') {
    return 'Tempo esgotado';
  }
  if (status >= 500) {
    return 'Problema no servidor';
  }

  switch (code) {
    case 'BUSINESS_RULE_VIOLATION':
      return ctx?.action
        ? buildActionTitle(ctx.action, ctx.entity)
        : 'Ação não permitida';
    case 'CONFLICT':
      return 'Conflito de dados';
    case 'VALIDATION_ERROR':
    case 'REQUIRED_FIELD':
    case 'INVALID_FORMAT':
    case 'INVALID_VALUE':
    case 'INVALID_SALA':
      return ctx?.action
        ? buildActionTitle(ctx.action, ctx.entity)
        : 'Verifique os dados';
    case 'NOT_FOUND':
      return ctx?.entity
        ? `${capitalize(ctx.entity)} não encontrado(a)`
        : 'Registro não encontrado';
    case 'FORBIDDEN':
      return 'Sem permissão';
    case 'UNAUTHORIZED':
      if (ctx?.authFlow === 'login') return 'Credenciais inválidas';
      if (ctx?.authFlow === 'password-reset') return 'Link inválido ou expirado';
      if (ctx?.authFlow === 'password-change') return 'Não foi possível alterar a senha';
      return 'Sessão expirada';
    case 'TOO_MANY_REQUESTS':
      return 'Muitas tentativas';
    case 'PASSWORD_CHANGE_REQUIRED':
      return 'Alteração de senha necessária';
    default:
      return ctx?.action
        ? buildActionTitle(ctx.action, ctx.entity)
        : 'Não foi possível concluir';
  }
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function descriptionFromDetails(
  details: { field?: string; message: string }[],
): string | null {
  if (details.length === 0) return null;
  const parts = details
    .map((d) => d.message?.trim())
    .filter((m): m is string => !!m);
  if (parts.length === 0) return null;
  return parts.join(' ');
}

function descriptionForApiError(
  err: ApiClientError,
  ctx?: ToastErrorContext,
): string {
  const fromDetails = descriptionFromDetails(err.details);
  if (fromDetails) return fromDetails;

  const backendMessage = err.message?.trim();
  const hasUsefulBackendMessage =
    backendMessage &&
    !isGenericServerMessage(backendMessage) &&
    err.status < 500;

  if (hasUsefulBackendMessage) {
    return backendMessage;
  }

  if (err.status === 0) {
    return OFFLINE_MESSAGE;
  }
  if (err.status === 408 || err.code === 'TIMEOUT') {
    return getErrorMessage('TIMEOUT');
  }
  if (err.status >= 500) {
    return GENERIC_SERVER_MESSAGE;
  }

  if (err.status === 401 || err.code === 'UNAUTHORIZED') {
    if (ctx?.authFlow === 'login') {
      return 'E-mail ou senha incorretos. Verifique os dados e tente novamente.';
    }
    if (ctx?.authFlow === 'password-reset') {
      return 'Solicite um novo link em "Esqueci minha senha".';
    }
    if (ctx?.authFlow === 'password-change') {
      return 'Verifique se a senha atual está correta.';
    }
  }

  return getErrorMessage(err.code, getErrorMessage('INTERNAL_ERROR'));
}

function descriptionForClientError(message: string): string {
  for (const { pattern, description } of KNOWN_CLIENT_ERROR_PATTERNS) {
    if (pattern.test(message)) {
      return description;
    }
  }
  if (message.length > 200 || /[{[\]stack|sql|undefined]/i.test(message)) {
    return 'Não foi possível concluir a operação. Tente novamente.';
  }
  return message;
}

export function formatApiErrorForToast(
  error: unknown,
  ctx?: ToastErrorContext,
): FormattedToastError {
  if (error instanceof ApiClientError) {
    return {
      title: titleForCode(error.code, error.status, ctx),
      description: descriptionForApiError(error, ctx),
    };
  }

  if (error instanceof Error) {
    const msg = error.message?.trim();
    const description = msg
      ? descriptionForClientError(msg)
      : 'Não foi possível concluir a operação. Tente novamente.';
    return {
      title: ctx?.action
        ? buildActionTitle(ctx.action, ctx.entity)
        : 'Não foi possível concluir',
      description,
    };
  }

  return {
    title: ctx?.action
      ? buildActionTitle(ctx.action, ctx.entity)
      : 'Não foi possível concluir',
    description: getErrorMessage('INTERNAL_ERROR'),
  };
}

/** Mensagem única para Alert de falha em listagem (React Query). */
export function formatQueryError(error: unknown, entity?: string): string {
  const { title, description } = formatApiErrorForToast(error, {
    action: 'carregar',
    entity,
  });
  if (title === description) return title;
  return `${title}. ${description}`;
}

/** Compatível com getPacientesListErrorMessage legado. */
export function formatListLoadError(error: unknown, entity = 'dados'): string {
  return formatQueryError(error, entity);
}
