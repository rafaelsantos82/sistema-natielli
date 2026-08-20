/**
 * Gera capturas de tela para o Manual de Utilização (docs/manual-usuario/screenshots/).
 * Executar: npx playwright test e2e/manual-usuario-screenshots.spec.ts --project=manual-usuario
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(rootDir, '..', 'docs', 'manual-usuario', 'screenshots');

function ensureDir(rel: string) {
  const dir = path.join(OUT, path.dirname(rel));
  fs.mkdirSync(dir, { recursive: true });
}

async function capture(page: import('@playwright/test').Page, rel: string) {
  ensureDir(rel);
  const full = path.join(OUT, rel);
  await page.locator('.min-h-screen .animate-spin').waitFor({ state: 'hidden', timeout: 20_000 }).catch(() => {});
  await page.waitForTimeout(400);
  await page.screenshot({ path: full, fullPage: true });
}

async function clickTab(page: import('@playwright/test').Page, name: RegExp | string) {
  const tab = page.getByRole('tab', { name: name });
  if (await tab.isVisible().catch(() => false)) {
    await tab.click();
    await page.waitForTimeout(500);
  }
}

test.describe.configure({ mode: 'serial' });

test('capturar telas do manual de utilização', async ({ page }) => {
  fs.mkdirSync(OUT, { recursive: true });

  await loginAsAdmin(page);

  // Dashboard
  await capture(page, 'geral/dashboard.png');

  const routes: { path: string; file: string; tabs?: (RegExp | string)[] }[] = [
    { path: '/agenda', file: 'recepcao/agenda.png' },
    { path: '/consultas', file: 'recepcao/agendamentos.png' },
    { path: '/pacientes', file: 'recepcao/pacientes.png' },
    { path: '/terapias', file: 'recepcao/terapias.png' },
    { path: '/salas', file: 'recepcao/salas.png' },
    { path: '/prontuarios', file: 'clinico/prontuarios.png' },
    { path: '/anamneses', file: 'clinico/anamneses.png' },
    {
      path: '/atendimentos/aprovacoes',
      file: 'clinico/aprovacao-atendimentos.png',
      tabs: [/Aprovação/i, /Aguardando/i, /Aprovados/i, /Rejeitados/i],
    },
    { path: '/documentos-assinados', file: 'clinico/docs-assinados.png' },
    { path: '/meu-painel', file: 'profissionais/meu-painel.png' },
    { path: '/minha-agenda', file: 'profissionais/minha-agenda.png' },
    { path: '/profissionais', file: 'profissionais/profissionais.png' },
    {
      path: '/financeiro',
      file: 'financeiro/financeiro-dashboard.png',
      tabs: ['Dashboard', /Contas a Pagar/i, /Contas a Receber/i, 'Categorias', /Centros de Custo/i],
    },
    { path: '/balancetes', file: 'financeiro/balancetes.png' },
    { path: '/relatorios-conciliacao', file: 'financeiro/relatorios-conciliacao.png' },
    { path: '/auditoria-notas', file: 'financeiro/auditoria-notas.png' },
    { path: '/contratos', file: 'rh/contratos.png' },
    {
      path: '/folha-pagamento',
      file: 'rh/folha-clt.png',
      tabs: [/CLT/i, /PJ/i],
    },
    { path: '/planos-saude', file: 'planos/planos-saude.png' },
    { path: '/acoes-judiciais', file: 'planos/acoes-judiciais.png' },
    {
      path: '/estoque',
      file: 'estoque/estoque-dashboard.png',
      tabs: ['Dashboard', 'Itens', /Movimentações/i, /Relatórios/i, /Inventário/i],
    },
    {
      path: '/comodato',
      file: 'estoque/comodato-ativos.png',
      tabs: [/Ativos/i, /Atrasados/i, /Devolvidos/i],
    },
    { path: '/relatorios', file: 'relatorios/relatorios.png' },
    { path: '/relatorios-avancados', file: 'relatorios/relatorios-avancados.png' },
    {
      path: '/marketing',
      file: 'marketing/marketing-manuais.png',
      tabs: [/Manuais de Conduta/i, /Materiais de Marketing/i],
    },
    {
      path: '/documentos',
      file: 'documentos/documentos-arquivos.png',
      tabs: ['Arquivos', 'Categorias'],
    },
    { path: '/configuracoes/usuarios', file: 'admin/usuarios.png' },
    {
      path: '/configuracoes/controles-acesso',
      file: 'admin/controles-acesso-api.png',
      tabs: [/API/i, /Escopo de dados/i, 'Menu'],
    },
    { path: '/configuracoes/chave-digital', file: 'admin/chave-digital.png' },
  ];

  for (const r of routes) {
    await page.goto(r.path);
    await page.waitForURL((url) => url.pathname.startsWith(r.path.split('?')[0]), { timeout: 20_000 });
    const baseName = r.file.replace(/\.png$/, '');
    await capture(page, r.file);

    if (r.tabs?.length) {
      for (let i = 0; i < r.tabs.length; i++) {
        await clickTab(page, r.tabs[i]);
        const slug = String(r.tabs[i])
          .replace(/[^a-z0-9]+/gi, '-')
          .replace(/^-|-$/g, '')
          .toLowerCase()
          .slice(0, 40);
        await capture(page, `${baseName}-aba-${i + 1}-${slug}.png`);
      }
    }
  }

  // Sidebar (menu visível)
  await page.goto('/');
  await capture(page, 'geral/menu-lateral.png');
});
