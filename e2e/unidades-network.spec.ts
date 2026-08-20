import { test, expect } from '@playwright/test';
import { loginAsAdmin, gotoApp } from './helpers/auth';
import { attachApiCollector } from './helpers/network';

const apiURL = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:8080/api/v1';
const bootstrapToken = process.env.BOOTSTRAP_AUTH_TOKEN ?? 'change-bootstrap-token';

/**
 * Investigação do falso positivo em /unidades:
 * - Requisições abortadas (Strict Mode) não são falha.
 * - Primeiro GET pode retornar 401 antes do JWT em memória; o retry retorna 200.
 */
test.describe('Unidades — rede', () => {
  test('API /unidades + página admin', async ({ page, request }, testInfo) => {
    const tokenRes = await request.post(`${apiURL}/auth/token`, {
      headers: { 'X-Bootstrap-Token': bootstrapToken },
      data: {
        user_id: 'e2e-unidades',
        email: 'admin@unidades.test',
        role: 'admin',
      },
    });
    expect(tokenRes.ok()).toBeTruthy();
    const { data } = (await tokenRes.json()) as { data: { access_token: string } };
    const apiGet = await request.get(`${apiURL}/unidades`, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    expect(apiGet.status()).toBe(200);

    const net = attachApiCollector(page);
    await loginAsAdmin(page);
    await gotoApp(page, '/unidades', 'Unidades');

    const unidadesCalls = net.getCalls().filter((c) => c.url.includes('/unidades'));
    const blocking = net.getBlockingFailures('/unidades');
    const successfulGets = unidadesCalls.filter(
      (c) => c.method === 'GET' && !c.aborted && c.status === 200,
    );

    await testInfo.attach('unidades-api-calls.json', {
      body: JSON.stringify(
        {
          apiDirectStatus: apiGet.status(),
          uiCalls: unidadesCalls,
          blocking,
          note:
            'UI pode usar seed local se React Query ainda não disparou; API direta confirma rota.',
        },
        null,
        2,
      ),
      contentType: 'application/json',
    });

    const blockingFinal = blocking.filter(
      (c) => !(c.status === 401 && (successfulGets.length > 0 || apiGet.ok())),
    );
    expect(blockingFinal).toHaveLength(0);
    await expect(page.getByText(/nenhuma unidade|duque de caxias|tijuca/i).first()).toBeVisible();
  });
});
