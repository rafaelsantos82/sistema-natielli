import { expect, request as playwrightRequest, type APIRequestContext, type Page } from '@playwright/test';

export function getAdminEmail(): string {
  return process.env.ADMIN_EMAIL ?? 'admin@espacoterapia.local';
}

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? 'change-me-admin';
}

/** @deprecated use getAdminEmail() — lido em tempo de execução nos testes */
export const ADMIN_EMAIL = getAdminEmail();
/** @deprecated use getAdminPassword() */
export const ADMIN_PASSWORD = getAdminPassword();

const API_URL = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:8080/api/v1';
const BOOTSTRAP_TOKEN = process.env.BOOTSTRAP_AUTH_TOKEN ?? 'change-bootstrap-token';
/** Usuário sistema da migration 000003 — UUID válido para /auth/me em modo bootstrap. */
const BOOTSTRAP_SYSTEM_USER_ID = '00000000-0000-4000-8000-000000000099';
const BOOTSTRAP_SYSTEM_EMAIL = 'sistema@espacoterapia.local';

const AUTH_TOKEN_KEY = 'auth_access_token';
const AUTH_PROFILE_KEY = 'auth_profile';

type ApiEnvelope<T> = { data?: T };

/** Injeta header bootstrap no POST /auth/token (proxy Vite pode não ter o token). */
export async function installBootstrapProxy(page: Page) {
  await page.route('**/api/v1/auth/token', async (route) => {
    const headers = {
      ...route.request().headers(),
      'X-Bootstrap-Token': BOOTSTRAP_TOKEN,
    };
    await route.continue({ headers });
  });
}

function extractAccessToken(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const data = (body as ApiEnvelope<{ access_token?: string }>).data;
  if (data?.access_token) return data.access_token;
  const flat = body as { access_token?: string };
  return flat.access_token ?? null;
}

/** Obtém JWT via login real ou bootstrap (não depende do Vite em modo bootstrap). */
export async function obtainE2EAccessToken(api: APIRequestContext): Promise<string> {
  const email = getAdminEmail();
  const password = getAdminPassword();

  const loginRes = await api.post(`${API_URL}/auth/login`, {
    data: { email, password },
  });

  if (loginRes.ok()) {
    const token = extractAccessToken(await loginRes.json());
    if (token) return token;
  }

  const bootstrapRes = await api.post(`${API_URL}/auth/token`, {
    headers: { 'X-Bootstrap-Token': BOOTSTRAP_TOKEN },
    data: {
      user_id: BOOTSTRAP_SYSTEM_USER_ID,
      email: BOOTSTRAP_SYSTEM_EMAIL,
      role: 'admin',
    },
  });

  if (bootstrapRes.ok()) {
    const token = extractAccessToken(await bootstrapRes.json());
    if (token) return token;
  }

  const loginStatus = loginRes.status();
  const bootstrapStatus = bootstrapRes.status();
  throw new Error(
    [
      'Falha ao autenticar nos testes E2E.',
      `POST /auth/login → ${loginStatus}`,
      `POST /auth/token (bootstrap) → ${bootstrapStatus}`,
      'Verifique: backend com `make up`, `BOOTSTRAP_AUTH_ENABLED=true` e token alinhado,',
      'ou rode `cd backend && make seed-admin` com ADMIN_EMAIL/ADMIN_PASSWORD iguais ao teste.',
      'Se `npm run dev` estiver aberto com VITE_AUTH_BOOTSTRAP=false, pare o servidor',
      'ou use `PW_REUSE_DEV_SERVER=true` apenas após `make seed-admin`.',
    ].join(' '),
  );
}

async function fetchMeProfile(api: APIRequestContext, token: string) {
  const meRes = await api.get(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!meRes.ok()) return null;
  const body = (await meRes.json()) as ApiEnvelope<{
    id: string;
    name: string;
    email: string;
    role: string;
    paciente_id?: string;
    profissional_id?: string;
    unidade_ids?: string[];
    permissions?: string[];
    must_change_password?: boolean;
  }>;
  const me = body.data;
  if (!me) return null;
  return {
    userId: me.id,
    name: me.name,
    email: me.email,
    role: me.role,
    pacienteId: me.paciente_id,
    profissionalId: me.profissional_id,
    unidadeIds: me.unidade_ids,
    permissions: me.permissions ?? [],
    mustChangePassword: Boolean(me.must_change_password),
  };
}

/**
 * Autentica como admin: token via API + sessão no browser (funciona com ou sem bootstrap no Vite).
 */
export async function loginAsAdmin(page: Page) {
  const api = await playwrightRequest.newContext();
  try {
    const token = await obtainE2EAccessToken(api);
    const profile =
      (await fetchMeProfile(api, token)) ?? {
        userId: BOOTSTRAP_SYSTEM_USER_ID,
        name: 'Sistema',
        email: BOOTSTRAP_SYSTEM_EMAIL,
        role: 'admin',
        permissions: [] as string[],
      };

    await page.addInitScript(
      ({ token, profile, tokenKey, profileKey }) => {
        sessionStorage.setItem(tokenKey, token);
        sessionStorage.setItem(profileKey, JSON.stringify(profile));
      },
      {
        token,
        profile,
        tokenKey: AUTH_TOKEN_KEY,
        profileKey: AUTH_PROFILE_KEY,
      },
    );

    const mePromise = page.waitForResponse(
      (r) => r.url().includes('/api/v1/auth/me'),
      { timeout: 25_000 },
    );

    await page.goto('/');

    const meRes = await mePromise;
    if (!meRes.ok()) {
      throw new Error(
        `Sessão E2E rejeitada pelo backend (GET /auth/me → ${meRes.status()}). ` +
          'Confira ADMIN_EMAIL/ADMIN_PASSWORD em backend/.env e rode make seed-admin.',
      );
    }

    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10_000 });
    await page
      .locator('.min-h-screen .animate-spin')
      .waitFor({ state: 'hidden', timeout: 25_000 })
      .catch(() => {});

    const onPasswordChange = page.url().includes('/conta/senha');
    if (!onPasswordChange) {
      await expect(page.getByRole('heading', { name: /^dashboard$/i })).toBeVisible({
        timeout: 15_000,
      });
    }
  } finally {
    await api.dispose();
  }
}

/** Navegação client-side (NavLink) — não usar page.goto após login. */
export async function gotoApp(
  page: Page,
  path: string,
  linkLabel: string,
  headingMatch?: RegExp | string,
) {
  const link = page.locator(`a[href="${path}"]`).first();
  const sidebarContent = page.locator('[data-sidebar="content"]');
  if (await sidebarContent.isVisible().catch(() => false)) {
    await sidebarContent.evaluate((el, href) => {
      const anchor = el.querySelector(`a[href="${href}"]`);
      anchor?.scrollIntoView({ block: 'center', behavior: 'instant' });
    }, path);
  }
  await expect(link).toBeVisible({ timeout: 15_000 });
  await link.click();
  await page.waitForURL((url) => url.pathname === path || url.pathname.startsWith(`${path}/`), {
    timeout: 15_000,
  });
  const heading =
    headingMatch instanceof RegExp
      ? headingMatch
      : new RegExp(
          typeof headingMatch === 'string' ? `^${headingMatch}$` : `^${linkLabel}$`,
          'i',
        );
  await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({
    timeout: 15_000,
  });
}
