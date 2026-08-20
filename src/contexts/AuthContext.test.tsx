import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
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
  shouldUseBootstrapAuth: () => true,
  shouldUseLoginApi: () => false,
}));

vi.mock('@/lib/featureFlags', () => ({
  featureFlags: { authBootstrapEnabled: true, pacientesApiEnabled: true },
}));

const setAccessTokenMock = vi.fn();
const saveProfileMock = vi.fn();
const clearAuthStorageMock = vi.fn();

vi.mock('@/lib/auth/tokenStore', () => ({
  loadProfile: () => ({
    userId: 'admin@espacoterapia.com.br',
    name: 'admin',
    email: 'admin@espacoterapia.com.br',
    role: 'admin',
  }),
  getAccessToken: () => null,
  setAccessToken: (...args: unknown[]) => setAccessTokenMock(...args),
  saveProfile: (...args: unknown[]) => saveProfileMock(...args),
  clearAuthStorage: () => clearAuthStorageMock(),
  clearProfile: vi.fn(),
}));

function TestConsumer() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div>loading</div>;
  return <div>{user ? `ok:${user.email}` : 'no-user'}</div>;
}

describe('AuthProvider init', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    issueTokenMock.mockResolvedValue({ access_token: 'jwt-test', expires_in: 3600 });
    fetchMeMock.mockResolvedValue({
      id: 'admin@espacoterapia.com.br',
      name: 'Admin',
      email: 'admin@espacoterapia.com.br',
      role: 'admin',
      unidade_ids: [],
    });
  });

  it('reemite token bootstrap após F5 quando há perfil sem JWT em memória', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/ok:admin@espacoterapia.com.br/)).toBeTruthy();
    });

    expect(issueTokenMock).toHaveBeenCalledWith({
      user_id: 'admin@espacoterapia.com.br',
      email: 'admin@espacoterapia.com.br',
      role: 'admin',
    });
    expect(setAccessTokenMock).toHaveBeenCalledWith('jwt-test');
    expect(fetchMeMock).toHaveBeenCalled();
    expect(clearAuthStorageMock).not.toHaveBeenCalled();
  });
});
