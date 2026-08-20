import { test, expect } from '@playwright/test';
import { loginAsAdmin, gotoApp } from './helpers/auth';
import {
  fillPacienteQuickForm,
  fillProfissionalForm,
  fillConsultaForm,
  confirmElegibilidadeOverride,
  uniqueSuffix,
} from './helpers/forms';

test.describe.configure({ mode: 'serial' });

const pacienteNome = `E2E Agenda Pac ${uniqueSuffix()}`;
const profissionalNome = `E2E Agenda Prof ${uniqueSuffix()}`;
const consultaMotivo = `Consulta Agenda E2E ${uniqueSuffix()}`;

let profissionalId = '';
let consultaId = '';

test.describe('Agenda — sincronização após novo agendamento', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('1. preparar paciente e profissional', async ({ page }) => {
    await gotoApp(page, '/pacientes', 'Pacientes');
    await page.getByRole('button', { name: /cadastro rápido/i }).click();
    const pacReq = page.waitForResponse(
      (r) => r.url().includes('/api/v1/pacientes') && r.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await fillPacienteQuickForm(page, pacienteNome);
    expect((await pacReq).status()).toBe(201);

    await gotoApp(page, '/profissionais', 'Profissionais');
    await page.getByRole('button', { name: /adicionar profissional/i }).click();
    const profReq = page.waitForResponse(
      (r) => r.url().includes('/api/v1/profissionais') && r.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await fillProfissionalForm(page, profissionalNome);
    const profRes = await profReq;
    expect(profRes.status()).toBe(201);
    const profBody = (await profRes.json()) as { data?: { id?: string } };
    profissionalId = profBody.data?.id ?? '';
    expect(profissionalId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  test('2. criar agendamento e validar na agenda geral', async ({ page }) => {
    await gotoApp(page, '/consultas', 'Agendamentos', /agendamentos/i);
    await page.getByRole('button', { name: /novo agendamento/i }).click();

    const createReq = page.waitForResponse(
      (r) => r.url().includes('/consultas') && r.request().method() === 'POST',
      { timeout: 45_000 },
    );
    await fillConsultaForm(page, {
      pacienteNome,
      profissionalNome,
      motivo: consultaMotivo,
    });
    await confirmElegibilidadeOverride(page);

    const res = await createReq;
    const bodyText = await res.text();
    expect(
      [200, 201],
      `POST /consultas → ${res.status()}: ${bodyText.slice(0, 500)}`,
    ).toContain(res.status());
    const body = JSON.parse(bodyText) as { data?: { id?: string } };
    consultaId = body.data?.id ?? '';
    expect(consultaId).toBeTruthy();

    await expect(
      page.getByText('Agendamento criado com sucesso', { exact: true }).first(),
    ).toBeVisible({ timeout: 10_000 });

    await gotoApp(page, '/agenda', 'Agenda', /agenda/i);

    const nextWeek = page
      .locator('button')
      .filter({ has: page.locator('svg.lucide-chevron-right') });
    for (let i = 0; i < 8; i++) {
      if (await page.getByText(consultaMotivo).first().isVisible().catch(() => false)) {
        break;
      }
      await nextWeek.click();
      await page.waitForTimeout(400);
    }

    await expect(page.getByText(consultaMotivo).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(pacienteNome).first()).toBeVisible({ timeout: 20_000 });
  });

  test('3. validar na minha agenda do profissional', async ({ page }) => {
    test.skip(!profissionalId, 'profissionalId não definido no teste anterior');

    await page.goto(`/minha-agenda?profissionalId=${profissionalId}&unidade=unidade-catanduva`);
    await page.waitForResponse(
      (r) =>
        r.url().includes('/consultas') &&
        r.request().method() === 'GET' &&
        r.status() === 200,
      { timeout: 30_000 },
    );

    await expect(page.getByRole('heading', { name: /minha agenda/i }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(consultaMotivo).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(pacienteNome).first()).toBeVisible({ timeout: 20_000 });
  });

  test('4. cleanup', async ({ page }) => {
    if (consultaId) {
      await gotoApp(page, '/consultas', 'Agendamentos', /agendamentos/i);
      await page.getByPlaceholder('Buscar...').fill(consultaMotivo);
      const row = page.locator('tbody tr').filter({ hasText: consultaMotivo });
      if ((await row.count()) > 0) {
        const delReq = page.waitForResponse(
          (r) =>
            r.url().includes(`/consultas/${consultaId}`) &&
            r.request().method() === 'DELETE',
          { timeout: 30_000 },
        );
        await row.getByLabel('Deletar').click();
        expect([200, 204, 409]).toContain((await delReq).status());
      }
    }

    if (profissionalId) {
      await gotoApp(page, '/profissionais', 'Profissionais');
      await page.getByPlaceholder('Buscar...').fill(profissionalNome);
      const profRow = page.locator('tbody tr').filter({ hasText: profissionalNome });
      if ((await profRow.count()) > 0) {
        await profRow.getByLabel('Deletar').click();
        const delReq = page.waitForResponse(
          (r) => r.url().includes('/profissionais/') && r.request().method() === 'DELETE',
          { timeout: 30_000 },
        );
        await page.getByRole('button', { name: /confirmar exclusão/i }).click();
        expect([200, 204]).toContain((await delReq).status());
      }
    }

    await gotoApp(page, '/pacientes', 'Pacientes');
    await page.getByPlaceholder('Buscar...').fill(pacienteNome);
    const pacRow = page.locator('tbody tr').filter({ hasText: pacienteNome });
    if ((await pacRow.count()) > 0) {
      await pacRow.getByLabel('Deletar').click();
      const delReq = page.waitForResponse(
        (r) => r.url().includes('/pacientes/') && r.request().method() === 'DELETE',
        { timeout: 30_000 },
      );
      await page.getByRole('button', { name: /confirmar exclusão/i }).click();
      expect([200, 204]).toContain((await delReq).status());
    }
  });
});
