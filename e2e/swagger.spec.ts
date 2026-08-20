import { test, expect } from '@playwright/test';

const apiURL = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:8080/api/v1';
const bootstrapToken = process.env.BOOTSTRAP_AUTH_TOKEN ?? 'change-bootstrap-token';

const REQUIRED_PATH_PREFIXES = [
  '/pacientes',
  '/profissionais',
  '/consultas',
  '/salas',
  '/unidades',
  '/terapias',
  '/anamneses',
  '/financeiro/categorias',
  '/relatorios-operacionais',
  '/notification-settings',
  '/rh/funcionarios-clt',
  '/estoque/itens',
  '/comodatos',
  '/contratos',
  '/marketing/manuais',
  '/contabilidade/contas',
  '/audit-log',
];

test.describe('Swagger / rotas registradas', () => {
  test('API responde em todos os módulos obrigatórios (fonte da verdade)', async ({ request }) => {
    const tokenRes = await request.post(`${apiURL}/auth/token`, {
      headers: { 'X-Bootstrap-Token': bootstrapToken },
      data: {
        user_id: 'e2e-routes',
        email: 'admin@routes.test',
        role: 'admin',
      },
    });
    expect(tokenRes.ok()).toBeTruthy();
    const { data } = (await tokenRes.json()) as { data: { access_token: string } };
    const headers = { Authorization: `Bearer ${data.access_token}` };

    for (const prefix of REQUIRED_PATH_PREFIXES) {
      const path = prefix.startsWith('/') ? prefix : `/${prefix}`;
      const res = await request.get(`${apiURL}${path}`, { headers });
      expect(res.status(), `GET ${path}`).not.toBe(404);
      expect(res.ok(), `GET ${path}`).toBeTruthy();
    }
  });

  test('Swagger não está preso só em /pacientes (quando habilitado)', async ({ request }) => {
    const docRes = await request.get(`${apiURL}/swagger/doc.json`);
    if (docRes.status() === 404) {
      test.skip(true, 'SWAGGER_ENABLED=false');
    }
    const doc = (await docRes.json()) as { paths?: Record<string, unknown> };
    const paths = Object.keys(doc.paths ?? {});
    const onlyPacientes =
      paths.length > 0 && paths.every((p) => p.startsWith('/pacientes'));
    expect(onlyPacientes).toBeFalsy();
    expect(paths.length).toBeGreaterThanOrEqual(50);
    expect(paths.some((p) => p.startsWith('/consultas'))).toBeTruthy();
    expect(paths.some((p) => p.startsWith('/profissionais'))).toBeTruthy();
    expect(paths.some((p) => p.startsWith('/unidades'))).toBeTruthy();
  });

});
