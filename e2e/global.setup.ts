import { test as setup } from '@playwright/test';
import { obtainE2EAccessToken } from './helpers/auth';

const apiURL = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:8080/api/v1';

setup('backend health', async ({ request }) => {
  const health = await request.get(`${apiURL}/health`);
  if (!health.ok()) {
    throw new Error(
      `Backend indisponível em ${apiURL}. Execute: cd backend && make up && make migrate-up`,
    );
  }
});

setup('e2e auth', async ({ request }) => {
  try {
    await obtainE2EAccessToken(request);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`${msg}\n\nDica: cd backend && make seed-admin`);
  }
});
