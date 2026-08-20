import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchMe,
  inferRoleFromEmail,
  issueToken,
  loginWithPassword,
  logoutApi,
  shouldUseBootstrapAuth,
  shouldUseLoginApi,
} from '@/lib/api/auth';
import { ApiClientError, setOnUnauthorized } from '@/lib/api/client';
import { featureFlags } from '@/lib/featureFlags';
import {
  clearAuthStorage,
  getAccessToken,
  loadProfile,
  saveProfile,
  setAccessToken,
  type AuthProfile,
} from '@/lib/auth/tokenStore';
import { getValidToken } from '@/lib/auth/token';
import type { AuthLoginData, AuthMeData, UserDTO } from '@/lib/api/types';

export type UserRole =
  | 'admin'
  | 'gestor'
  | 'funcionario'
  | 'terceiro'
  | 'terapeuta'
  | 'responsavel';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** ID do paciente quando `role === 'responsavel'` */
  pacienteId?: string;
  /** ID do profissional quando `role === 'terapeuta'` */
  profissionalId?: string;
  unidadesPermitidas?: string[];
  permissions?: string[];
  mustChangePassword?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  canWritePacientes: boolean;
  refreshSessionAfterPasswordChange: (
    result: AuthLoginData,
    options?: { redirectTo?: string | false },
  ) => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  canRead: (resource: string) => boolean;
  canWrite: (resource: string) => boolean;
  canDelete: (resource: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const WRITE_PACIENTES_ROLES: UserRole[] = ['admin', 'gestor', 'funcionario', 'terapeuta'];

function meToProfile(me: AuthMeData | UserDTO, fallbackEmail?: string): AuthProfile {
  return {
    userId: me.id,
    name: me.name,
    email: me.email || fallbackEmail || '',
    role: me.role,
    pacienteId: me.paciente_id,
    profissionalId: me.profissional_id,
    unidadeIds: me.unidade_ids?.length ? me.unidade_ids : undefined,
    permissions: me.permissions ?? [],
    mustChangePassword: Boolean(me.must_change_password),
  };
}

function profileToUser(profile: AuthProfile): User {
  return {
    id: profile.userId,
    name: profile.name || profile.email.split('@')[0],
    email: profile.email,
    role: profile.role as UserRole,
    pacienteId: profile.pacienteId,
    profissionalId: profile.profissionalId,
    unidadesPermitidas: profile.unidadeIds,
    permissions: profile.permissions ?? [],
    mustChangePassword: profile.mustChangePassword,
  };
}

async function hydrateUserFromToken(emailFallback?: string): Promise<User | null> {
  const me = await fetchMe();
  const profile = meToProfile(me, emailFallback);
  saveProfile(profile);
  return profileToUser(profile);
}

function applyLoginResult(
  result: AuthLoginData,
  email: string,
): { profile: AuthProfile; user: User } {
  const profile = meToProfile(result.user, email);
  saveProfile(profile);
  return { profile, user: profileToUser(profile) };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const logout = useCallback(async () => {
    if (shouldUseLoginApi() && getAccessToken()) {
      try {
        await logoutApi();
      } catch {
        /* token expirado ou rede — limpar localmente */
      }
    }
    clearAuthStorage();
    setUser(null);
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    setOnUnauthorized(() => {
      void logout();
    });
  }, [logout]);

  const refreshProfile = useCallback(async () => {
    const u = await hydrateUserFromToken(user?.email);
    if (u) setUser(u);
  }, [user?.email]);

  const refreshSessionAfterPasswordChange = useCallback(
    async (result: AuthLoginData, options?: { redirectTo?: string | false }) => {
      setAccessToken(result.access_token);
      const { user: nextUser } = applyLoginResult(result, result.user.email);
      setUser(nextUser);
      const redirectTo = options?.redirectTo ?? '/';
      if (redirectTo !== false) {
        navigate(redirectTo);
      }
    },
    [navigate],
  );

  useEffect(() => {
    const init = async () => {
      const profile = loadProfile();
      if (!profile) {
        clearAuthStorage();
        setIsLoading(false);
        return;
      }

      let token = getValidToken(getAccessToken);

      if (!token && shouldUseBootstrapAuth()) {
        try {
          const role =
            (profile.role as UserRole) || inferRoleFromEmail(profile.email);
          const tokenData = await issueToken({
            user_id: profile.userId,
            email: profile.email,
            role,
          });
          setAccessToken(tokenData.access_token);
          token = tokenData.access_token;
        } catch {
          clearAuthStorage();
          setIsLoading(false);
          return;
        }
      }

      if (!token) {
        clearAuthStorage();
        setIsLoading(false);
        return;
      }

      setAccessToken(token);
      if (featureFlags.authBootstrapEnabled || featureFlags.pacientesApiEnabled || shouldUseLoginApi()) {
        try {
          const u = await hydrateUserFromToken(profile.email);
          if (u) setUser(u);
        } catch (err) {
          if (err instanceof ApiClientError && err.status === 401) {
            clearAuthStorage();
            setIsLoading(false);
            return;
          }
          setUser(profileToUser(profile));
        }
      } else {
        setUser(profileToUser(profile));
      }
      setIsLoading(false);
    };
    void init();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (shouldUseLoginApi() && !shouldUseBootstrapAuth()) {
        const result = await loginWithPassword(email, password);
        setAccessToken(result.access_token);
        const { user: nextUser } = applyLoginResult(result, email);
        setUser(nextUser);
        if (nextUser.mustChangePassword) {
          navigate('/conta/senha');
        } else {
          navigate('/');
        }
        return;
      }

      if (shouldUseBootstrapAuth()) {
        const role = inferRoleFromEmail(email);
        const tokenData = await issueToken({
          user_id: email,
          email,
          role,
        });
        setAccessToken(tokenData.access_token);
        try {
          const u = await hydrateUserFromToken(email);
          if (u) {
            setUser(u);
            navigate('/');
            return;
          }
        } catch {
          /* fallback profile below */
        }
        const profile: AuthProfile = {
          userId: email,
          name: email.split('@')[0],
          email,
          role,
        };
        saveProfile(profile);
        setUser(profileToUser(profile));
        navigate('/');
        return;
      }

      const result = await loginWithPassword(email, password);
      setAccessToken(result.access_token);
      const { user: nextUser } = applyLoginResult(result, email);
      setUser(nextUser);
      if (nextUser.mustChangePassword) {
        navigate('/conta/senha');
      } else {
        navigate('/');
      }
    } catch {
      throw new Error('Credenciais inválidas');
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions?.includes(permission) ?? false;
  };
  const canRead = (resource: string) => hasPermission(`api.${resource}.read`);
  const canWrite = (resource: string) => hasPermission(`api.${resource}.write`);
  const canDelete = (resource: string) => hasPermission(`api.${resource}.delete`);
  const canWritePacientes =
    user !== null && (user.role === 'admin' || canWrite('pacientes') || WRITE_PACIENTES_ROLES.includes(user.role));

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading,
        canWritePacientes,
        refreshSessionAfterPasswordChange,
        refreshProfile,
        hasPermission,
        canRead,
        canWrite,
        canDelete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
