import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AUTH_TOKEN_STORAGE_KEY } from '@/lib/auth/tokenStore';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  );
  return { ...actual, useNavigate: () => navigateMock };
});

const issueTokenMock = vi.fn();
const fetchMeMock = vi.fn();

vi.mock('@/lib/api/auth', () => ({
  issueToken: (...args: unknown[]) => issueTokenMock(...args),
  fetchMe: (...args: unknown[]) => fetchMeMock(...args),
  loginWithPassword: vi.fn(),
  inferRoleFromEmail: () => 'admin' as const,
  shouldUseBootstrapAuth: () => false,
  shouldUseLoginApi: () => true,
  logoutApi: vi.fn(),
}));

vi.mock('@/lib/featureFlags', () => ({
  featureFlags: { authBootstrapEnabled: false, pacientesApiEnabled: true },
}));

function makeValidJwt(): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: 'user-uuid',
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  );
  return `${header}.${payload}.sig`;
}

function TestConsumer() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div>loading</div>;
  return <div>{user ? `ok:${user.email}` : 'no-user'}</div>;
}

describe('AuthProvider init with login API (F5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    const token = makeValidJwt();
    sessionStorage.setItem(
      'auth_profile',
      JSON.stringify({
        userId: 'user-uuid',
        name: 'Maria',
        email: 'maria@example.com',
        role: 'gestor',
      }),
    );
    sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);

    fetchMeMock.mockResolvedValue({
      id: 'user-uuid',
      name: 'Maria',
      email: 'maria@example.com',
      role: 'gestor',
      unidade_ids: [],
      permissions: ['api.pacientes.read'],
    });
  });

  it('restaura sessão do sessionStorage sem reemitir bootstrap token', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/ok:maria@example.com/)).toBeTruthy();
    });

    expect(issueTokenMock).not.toHaveBeenCalled();
    expect(fetchMeMock).toHaveBeenCalled();
  });
});
