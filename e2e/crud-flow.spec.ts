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

const pacienteNome = `E2E Paciente ${uniqueSuffix()}`;
let pacienteNomeAtual = pacienteNome;
const profissionalNome = `E2E Profissional ${uniqueSuffix()}`;
let profissionalNomeAtual = profissionalNome;
const consultaMotivo = `Consulta E2E ${uniqueSuffix()}`;
let consultaId = '';

/** PageToolbar aplica debounce de 250ms no filtro de busca. */
async function filterTable(page: import('@playwright/test').Page, query: string) {
  const search = page.getByPlaceholder('Buscar...');
  await search.clear();
  await search.fill(query);
  await page.waitForTimeout(500);
}

test.describe('CRUD UI — Pacientes → Profissionais → Consultas', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('1. Pacientes — criar via cadastro rápido', async ({ page }) => {
    await gotoApp(page, '/pacientes', 'Pacientes');
    await expect(page.getByRole('button', { name: /cadastro rápido/i })).toBeVisible({
      timeout: 20_000,
    });

    await page.getByRole('button', { name: /cadastro rápido/i }).click();
    await expect(page.getByRole('heading', { name: /cadastro rápido de paciente/i })).toBeVisible();

    const createReq = page.waitForResponse(
      (r) => r.url().includes('/api/v1/pacientes') && r.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await fillPacienteQuickForm(page, pacienteNome);

    const res = await createReq;
    expect(res.status()).toBe(201);
    await page.getByPlaceholder('Buscar...').fill(pacienteNome);
    await expect(page.getByRole('row', { name: new RegExp(pacienteNome) })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('2. Pacientes — editar nome', async ({ page }) => {
    pacienteNomeAtual = `${pacienteNome} Editado`;
    await gotoApp(page, '/pacientes', 'Pacientes');
    await page.getByPlaceholder('Buscar...').fill(pacienteNome);
    await page.getByRole('row', { name: new RegExp(pacienteNome) }).getByLabel('Editar').click();
    await page.getByText(/carregando dados do paciente/i).waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});

    await page.getByLabel(/nome completo/i).fill(pacienteNomeAtual);
    const putReq = page.waitForResponse(
      (r) => r.url().includes('/api/v1/pacientes/') && r.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: /^salvar$/i }).click();
    expect((await putReq).status()).toBe(200);
    await expect(page.getByText(pacienteNomeAtual)).toBeVisible();
  });

  test('3. Profissionais — criar e editar nome', async ({ page }) => {
    await gotoApp(page, '/profissionais', 'Profissionais');
    await page.getByRole('button', { name: /adicionar profissional/i }).click();

    const createReq = page.waitForResponse(
      (r) => r.url().includes('/api/v1/profissionais') && r.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await fillProfissionalForm(page, profissionalNome);
    expect((await createReq).status()).toBe(201);
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 15_000 });

    const createdRow = page.locator('tbody tr').filter({ hasText: profissionalNome });
    await expect(createdRow).toHaveCount(1, { timeout: 20_000 });

    profissionalNomeAtual = `${profissionalNome} Editado`;
    await createdRow.getByLabel('Editar').click();

    const modal = page.getByRole('dialog');
    await modal.getByPlaceholder('Nome completo do profissional').fill(profissionalNomeAtual);

    const putReq = page.waitForResponse(
      (r) => r.url().includes('/api/v1/profissionais/') && r.request().method() === 'PUT',
      { timeout: 30_000 },
    );
    await modal.locator('form').evaluate((form: HTMLFormElement) => form.requestSubmit());
    expect((await putReq).ok()).toBeTruthy();
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 15_000 });
    await expect(
      page.locator('tbody tr').filter({ hasText: profissionalNomeAtual }),
    ).toHaveCount(1, { timeout: 20_000 });
  });

  test('4. Consultas — criar agendamento', async ({ page }) => {
    await gotoApp(page, '/consultas', 'Agendamentos', /agendamentos/i);
    await page.getByRole('button', { name: /novo agendamento/i }).click();

    const createReq = page.waitForResponse(
      (r) => r.url().includes('/consultas') && r.request().method() === 'POST',
      { timeout: 45_000 },
    );

    await fillConsultaForm(page, {
      pacienteNome: pacienteNomeAtual,
      profissionalNome: profissionalNomeAtual,
      motivo: consultaMotivo,
    });
    await confirmElegibilidadeOverride(page);

    const res = await createReq;
    expect([200, 201]).toContain(res.status());
    const body = (await res.json()) as { data?: { id?: string } };
    consultaId = body.data?.id ?? '';
    expect(consultaId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    await expect(
      page.getByText('Agendamento criado com sucesso', { exact: true }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('5. Consultas — excluir agendamento', async ({ page }) => {
    await gotoApp(page, '/consultas', 'Agendamentos', /agendamentos/i);
    await filterTable(page, consultaMotivo);
    const row = page.locator('tbody tr').filter({ hasText: consultaMotivo });
    await expect(row).toHaveCount(1, { timeout: 15_000 });
    const delReq = page.waitForResponse(
      (r) =>
        r.url().includes(`/consultas/${consultaId}`) && r.request().method() === 'DELETE',
      { timeout: 30_000 },
    );
    await row.getByLabel('Deletar').click();
    expect([200, 204]).toContain((await delReq).status());
    await expect(
      page.getByText('Agendamento excluído com sucesso', { exact: true }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('6. Pacientes — excluir (cleanup)', async ({ page }) => {
    await gotoApp(page, '/pacientes', 'Pacientes');
    await filterTable(page, pacienteNomeAtual);
    const pacRow = page.locator('tbody tr').filter({ hasText: pacienteNomeAtual });
    await expect(pacRow.first()).toBeVisible({ timeout: 15_000 });
    await pacRow.getByLabel('Deletar').click();

    const delReq = page.waitForResponse(
      (r) => r.url().includes('/pacientes/') && r.request().method() === 'DELETE',
      { timeout: 30_000 },
    );
    await page.getByRole('button', { name: /confirmar exclusão/i }).click();
    expect([200, 204]).toContain((await delReq).status());
  });

  test('7. Profissionais — excluir (cleanup)', async ({ page }) => {
    await gotoApp(page, '/profissionais', 'Profissionais');
    await filterTable(page, profissionalNomeAtual);
    const profRow = page.locator('tbody tr').filter({ hasText: profissionalNomeAtual });
    await expect(profRow.first()).toBeVisible({ timeout: 15_000 });
    await profRow.getByLabel('Deletar').click();

    const delReq = page.waitForResponse(
      (r) => r.url().includes('/profissionais/') && r.request().method() === 'DELETE',
      { timeout: 30_000 },
    );
    await page.getByRole('button', { name: /confirmar exclusão/i }).click();
    expect([200, 204]).toContain((await delReq).status());
  });
});
