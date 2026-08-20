/**
 * Perfil e JWT em sessionStorage (mesma aba): sobrevivem F5; somem ao fechar o browser.
 * Memória mantém o token em runtime; sessionStorage restaura após reload.
 * Mesmo vetor XSS que o perfil — evolução futura: refresh em cookie HttpOnly.
 */

const PROFILE_KEY = 'auth_profile';
const TOKEN_KEY = 'auth_access_token';

let accessToken: string | null = null;

export interface AuthProfile {
  userId: string;
  name: string;
  email: string;
  role: string;
  /** Paciente vinculado (perfil responsável). */
  pacienteId?: string;
  /** Profissional vinculado (perfil terapeuta — identidade, não carteira). */
  profissionalId?: string;
  unidadeIds?: string[];
  permissions?: string[];
  mustChangePassword?: boolean;
}

function readTokenFromSession(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeTokenToSession(token: string | null): void {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    /* quota / private mode */
  }
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  writeTokenToSession(token);
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  const stored = readTokenFromSession();
  if (stored) {
    accessToken = stored;
    return stored;
  }
  return null;
}

export function clearAccessToken(): void {
  accessToken = null;
  writeTokenToSession(null);
}

export function saveProfile(profile: AuthProfile): void {
  try {
    sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* quota / private mode */
  }
}

export function loadProfile(): AuthProfile | null {
  try {
    const raw = sessionStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthProfile;
  } catch {
    return null;
  }
}

export function clearProfile(): void {
  try {
    sessionStorage.removeItem(PROFILE_KEY);
  } catch {
    /* ignore */
  }
}

export function clearAuthStorage(): void {
  clearAccessToken();
  clearProfile();
}

/** Expõe chave de token para testes (não usar em produção). */
export const AUTH_TOKEN_STORAGE_KEY = TOKEN_KEY;
