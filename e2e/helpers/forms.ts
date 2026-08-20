import type { Page } from '@playwright/test';

const VALID_CPF_RESPONSAVEL = '111.444.777-35';

export function uniqueSuffix() {
  return String(Date.now()).slice(-8);
}

/** Gera CPF válido (dígitos verificadores corretos) para evitar 500 por UNIQUE no banco. */
export function generateValidCpfFormatted(): string {
  const rand = () => Math.floor(Math.random() * 9);
  const n = Array.from({ length: 9 }, rand);
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += n[i] * (len + 1 - i);
    const d = (sum * 10) % 11;
    return d === 10 ? 0 : d;
  };
  n.push(calc(9));
  n.push(calc(10));
  const raw = n.join('');
  return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`;
}

export async function fillPacienteQuickForm(page: Page, nome: string) {
  await page.getByLabel(/nome completo/i).fill(nome);
  await page.getByLabel(/data de nascimento/i).fill('2018-06-15');
  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: /masculino/i }).click();
  await page.getByLabel(/^cpf do paciente/i).fill('');
  await page.getByLabel(/cpf do responsável/i).fill(VALID_CPF_RESPONSAVEL);
  await page.getByLabel(/cep/i).fill('20040-020');
  await page.getByLabel(/^uf/i).fill('RJ');
  await page.getByLabel(/telefone principal/i).fill('21987654321');
  await page.getByLabel(/nome do responsável/i).fill('Responsável E2E');
  await page.getByLabel(/consentimento lgpd/i).click();
  await page.getByRole('button', { name: /salvar cadastro/i }).click();
}

export async function fillProfissionalForm(page: Page, nome: string) {
  const email = `e2e.prof.${uniqueSuffix()}@test.local`;
  const modal = page.getByRole('dialog');

  await modal.getByPlaceholder('Nome completo do profissional').fill(nome);
  await modal.locator('input[type="date"]').first().fill('1985-03-20');
  await modal.getByPlaceholder('000.000.000-00').fill(generateValidCpfFormatted());
  await modal.getByPlaceholder('email@exemplo.com').fill(email);
  await modal.getByPlaceholder('(00) 0000-0000').fill('2133334444');
  await modal.getByPlaceholder('(00) 00000-0000').fill('21988887777');

  await modal.getByRole('button', { name: 'Registro Profissional', exact: true }).click();
  await modal.getByPlaceholder('123456').fill(`E2E${uniqueSuffix()}`);
  await modal.getByPlaceholder('SP', { exact: true }).fill('RJ');

  await modal.getByRole('button', { name: 'Especialidades', exact: true }).click();
  await modal.getByText('Selecione uma especialidade').click();
  await page.getByRole('option', { name: 'Psicólogo Clínico' }).click();
  await modal
    .locator('button')
    .filter({ has: page.locator('svg.lucide-plus') })
    .first()
    .click();

  await modal.getByRole('button', { name: 'Agenda de Atendimento', exact: true }).click();
  await modal.getByRole('checkbox', { name: /segunda-feira/i }).click();

  await modal.getByRole('button', { name: 'Configurações LGPD', exact: true }).click();
  await modal
    .getByRole('checkbox', { name: /profissional concorda com o tratamento de dados pessoais/i })
    .click();

  await modal.locator('form').evaluate((form: HTMLFormElement) => form.requestSubmit());
}

export async function fillConsultaForm(
  page: Page,
  opts: { pacienteNome: string; profissionalNome: string; motivo: string },
) {
  const modal = page.getByRole('dialog');
  const comboboxes = modal.getByRole('combobox');
  await comboboxes.nth(0).click();
  await page.getByRole('option', { name: new RegExp(opts.pacienteNome, 'i') }).click();

  // índice 1 = unidade (já preenchida); 2 = profissional
  await comboboxes.nth(2).click();
  await page.getByRole('option', { name: new RegExp(opts.profissionalNome, 'i') }).click();

  // índice 3 = sala (0 paciente, 1 unidade, 2 profissional)
  await comboboxes.nth(3).click();
  const salaOption = page.getByRole('option').first();
  await salaOption.waitFor({ state: 'visible', timeout: 10_000 });
  await salaOption.click();

  // Próxima segunda 10:00 — alinhado ao checkbox "segunda-feira" em fillProfissionalForm
  const slot = new Date();
  const day = slot.getDay();
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 7 : (8 - day) % 7;
  slot.setDate(slot.getDate() + daysUntilMonday);
  // Backend faz ParseDateTime sem fuso (UTC). 13:00 no campo ≈ 10:00 em America/Sao_Paulo.
  slot.setHours(13, 0, 0, 0);
  const local = new Date(slot.getTime() - slot.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  await modal.getByLabel(/data e hora/i).fill(local);
  await modal.getByLabel(/motivo da consulta/i).fill(opts.motivo);
  await modal.locator('form').evaluate((form: HTMLFormElement) => form.requestSubmit());
}

const OVERRIDE_TEXT = 'E2E override automatizado para validar fluxo CRUD.';

export async function confirmElegibilidadeOverride(page: Page) {
  const dialog = page.getByRole('dialog', { name: /forçar/i });
  if (!(await dialog.isVisible({ timeout: 5_000 }).catch(() => false))) {
    return;
  }
  await page.evaluate((text) => {
    const ta = document.getElementById('justificativa') as HTMLTextAreaElement | null;
    if (!ta) return;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value',
    )?.set;
    setter?.call(ta, text);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.dispatchEvent(new Event('change', { bubbles: true }));
  }, OVERRIDE_TEXT);

  const testBtn = page.getByTestId('elegibilidade-override-confirm');
  if (await testBtn.isVisible().catch(() => false)) {
    await testBtn.click();
  } else {
    await dialog.getByRole('button', { name: /confirmar e registrar/i }).click({ force: true });
  }
}
