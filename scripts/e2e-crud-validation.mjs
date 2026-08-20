/**
 * Validação E2E: API CRUD + smoke UI das páginas integradas.
 * Uso: BOOTSTRAP_AUTH_TOKEN=... node scripts/e2e-crud-validation.mjs
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const API = process.env.API_BASE_URL || 'http://localhost:8080/api/v1';
const FE = process.env.FE_BASE_URL || 'http://localhost:5173';
const BOOTSTRAP = process.env.BOOTSTRAP_AUTH_TOKEN || 'change-bootstrap-token';
const UNIDADE_ID = 'a0000000-0000-4000-8000-000000000001';
const ts = Date.now();

const report = {
  generatedAt: new Date().toISOString(),
  environment: { API, FE },
  api: [],
  ui: [],
  summary: {},
};

async function getToken() {
  const res = await fetch(`${API}/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Bootstrap-Token': BOOTSTRAP,
    },
    body: JSON.stringify({
      user_id: 'e2e-admin',
      email: 'admin@e2e.test',
      role: 'admin',
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`auth/token ${res.status}: ${JSON.stringify(json)}`);
  return json.data.access_token;
}

async function api(method, path, token, body) {
  const url = `${API}${path}`;
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  let json = null;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, ok: res.ok, json };
}

function recordApi(module, verb, path, result, note = '') {
  report.api.push({
    module,
    verb,
    path,
    status: result.status,
    pass: result.ok,
    note: note || (result.ok ? '' : result.json?.error?.message || result.json?.error?.code || ''),
  });
}

async function runApiCrud(token) {
  const listOnly = [
    ['Unidades', 'GET', '/unidades'],
    ['Audit log', 'GET', '/audit-log'],
    ['Notification settings', 'GET', '/notification-settings'],
    ['Financeiro categorias', 'GET', '/financeiro/categorias'],
    ['Financeiro centros', 'GET', '/financeiro/centros-custo'],
    ['Financeiro lançamentos', 'GET', '/financeiro/lancamentos'],
    ['RH CLT', 'GET', '/rh/funcionarios-clt'],
    ['RH PJ', 'GET', '/rh/funcionarios-pj'],
    ['Folha CLT', 'GET', '/rh/folhas-clt'],
    ['Folha PJ', 'GET', '/rh/folhas-pj'],
    ['Estoque itens', 'GET', '/estoque/itens'],
    ['Estoque mov', 'GET', '/estoque/movimentacoes'],
    ['Estoque inventários', 'GET', '/estoque/inventarios'],
    ['Planos saúde', 'GET', '/planos-saude'],
    ['Ações judiciais', 'GET', '/acoes-judiciais'],
    ['Notas fiscais', 'GET', '/notas-fiscais'],
    ['Marketing manuais', 'GET', '/marketing/manuais'],
    ['Marketing materiais', 'GET', '/marketing/materiais'],
    ['Contabilidade contas', 'GET', '/contabilidade/contas'],
    ['Contabilidade lançamentos', 'GET', '/contabilidade/lancamentos'],
    ['Comodatos', 'GET', '/comodatos'],
    ['Contratos', 'GET', '/contratos'],
    ['Relatórios operacionais', 'GET', '/relatorios-operacionais'],
    ['Profissionais', 'GET', '/profissionais'],
    ['Consultas', 'GET', '/consultas'],
    ['Salas', 'GET', '/salas'],
    ['Terapias', 'GET', '/terapias'],
    ['Anamneses', 'GET', '/anamneses'],
    ['Respostas anamnese', 'GET', '/respostas-anamnese'],
    ['Pacientes', 'GET', '/pacientes?limit=5'],
  ];

  for (const [mod, verb, path] of listOnly) {
    const r = await api(verb, path, token);
    recordApi(mod, verb, path, r);
  }

  // Paciente CRUD completo
  const cpf = String(10000000000 + (ts % 89999999999)).padStart(11, '0').slice(0, 11);
  const pacienteBody = {
    nome_completo: `E2E Paciente ${ts}`,
    data_nascimento: '2018-05-15',
    sexo_biologico: 'masculino',
    cpf: '52998224725',
    tel_principal: '21988887777',
    uf: 'RJ',
    cep: '20000000',
    responsavel_nome: 'Resp E2E',
    consentimento_lgpd: true,
    unidade_ids: [{ unidade_id: UNIDADE_ID, principal: true }],
  };
  let createdPacienteId = null;
  {
    const create = await api('POST', '/pacientes', token, pacienteBody);
    recordApi('Pacientes', 'POST', '/pacientes', create);
    if (create.ok && create.json?.data?.id) {
      createdPacienteId = create.json.data.id;
      const get = await api('GET', `/pacientes/${createdPacienteId}`, token);
      recordApi('Pacientes', 'GET', `/pacientes/:id`, get);
      const upd = await api('PUT', `/pacientes/${createdPacienteId}`, token, {
        ...pacienteBody,
        nome_completo: `E2E Paciente Updated ${ts}`,
      });
      recordApi('Pacientes', 'PUT', '/pacientes/:id', upd);
      const del = await api('DELETE', `/pacientes/${createdPacienteId}`, token);
      recordApi('Pacientes', 'DELETE', '/pacientes/:id', { status: del.status, ok: del.status === 204 || del.ok, json: del.json });
    }
  }

  // Terapia CRUD
  const tratBody = {
    nome_terapia: `E2E Trat ${ts}`,
    objetivo_terapeutico: 'Objetivo teste',
    diretriz_protocolar: 'Protocolo Clinico',
    itens_regime: [{
      medicamento: 'E2E Med',
      via: 'VO',
      dose: 1,
      dose_unidade: 'mg',
      frequencia: '1x/dia',
    }],
    status: 'Ativo',
    versao: 1,
  };
  let tratId = null;
  {
    const create = await api('POST', '/terapias', token, tratBody);
    recordApi('Terapias', 'POST', '/terapias', create);
    if (create.ok && create.json?.data?.id) {
      tratId = create.json.data.id;
      const upd = await api('PUT', `/terapias/${tratId}`, token, { ...tratBody, nome_terapia: `E2E Trat Upd ${ts}` });
      recordApi('Terapias', 'PUT', '/terapias/:id', upd);
      const del = await api('DELETE', `/terapias/${tratId}`, token);
      recordApi('Terapias', 'DELETE', '/terapias/:id', { status: del.status, ok: del.status === 204 || del.ok, json: del.json });
    }
  }

  // Notification PUT
  const notifGet = await api('GET', '/notification-settings', token);
  if (notifGet.ok) {
    const put = await api('PUT', '/notification-settings', token, notifGet.json?.data ?? {});
    recordApi('Notification settings', 'PUT', '/notification-settings', put);
  }
}

const UI_PAGES = [
  { path: '/pacientes', name: 'Pacientes', expectApi: '/pacientes' },
  { path: '/profissionais', name: 'Profissionais', expectApi: '/profissionais' },
  { path: '/consultas', name: 'Consultas', expectApi: '/consultas' },
  { path: '/agenda', name: 'Agenda', expectApi: '/consultas' },
  { path: '/salas', name: 'Salas', expectApi: '/salas' },
  { path: '/terapias', name: 'Terapias', expectApi: '/terapias' },
  { path: '/anamneses', name: 'Anamneses', expectApi: '/anamneses' },
  { path: '/prontuarios', name: 'Prontuários', expectApi: '/consultas' },
  { path: '/financeiro', name: 'Financeiro', expectApi: '/financeiro' },
  { path: '/faturas', name: 'Faturas', expectApi: '/financeiro' },
  { path: '/relatorios', name: 'Relatórios', expectApi: '/relatorios-operacionais' },
  { path: '/estoque', name: 'Estoque', expectApi: '/estoque' },
  { path: '/comodato', name: 'Comodato', expectApi: '/comodatos' },
  { path: '/marketing', name: 'Marketing', expectApi: '/marketing' },
  { path: '/balancetes', name: 'Balancetes', expectApi: '/contabilidade' },
  { path: '/folha-pagamento', name: 'Folha pagamento', expectApi: '/rh' },
  { path: '/planos-saude', name: 'Planos saúde', expectApi: '/planos-saude' },
  { path: '/acoes-judiciais', name: 'Ações judiciais', expectApi: '/acoes-judiciais' },
  { path: '/contratos', name: 'Contratos', expectApi: '/contratos' },
  { path: '/unidades', name: 'Unidades', expectApi: '/unidades' },
  { path: '/documentos', name: 'Documentos (placeholder)', expectApi: null },
  { path: '/configuracoes', name: 'Configurações (placeholder)', expectApi: null },
];

async function runUiSmoke() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const apiFailures = [];

  page.on('response', async (response) => {
    const url = response.url();
    if (!url.includes('/api/v1')) return;
    const status = response.status();
    if (status >= 400) {
      let body = '';
      try {
        body = (await response.text()).slice(0, 120);
      } catch {
        body = '';
      }
      apiFailures.push({ url, status, body });
    }
  });

  try {
    await page.goto(`${FE}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.fill('#email, input[type="email"]', 'admin@espacoterapia.test');
    await page.fill('#password, input[type="password"]', 'e2e-password');
    await page.click('button[type="submit"]');
    await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 15000 });
  } catch (e) {
    report.ui.push({ page: 'Login', path: '/login', pass: false, note: `Falha login: ${e.message}` });
    await browser.close();
    return;
  }

  report.ui.push({ page: 'Login', path: '/login', pass: true, note: 'Bootstrap auth OK' });

  for (const p of UI_PAGES) {
    apiFailures.length = 0;
    const errors = [];
    try {
      await page.goto(`${FE}${p.path}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500);
      const alertCount = await page.locator('[role="alert"]').count();
      const relevant = p.expectApi
        ? apiFailures.filter((f) => f.url.includes(p.expectApi))
        : [];
      const blocking = relevant.filter((f) => f.status >= 400);
      const pass = blocking.length === 0;
      const alertTexts = [];
      if (alertCount > 0) {
        for (let i = 0; i < Math.min(alertCount, 2); i++) {
          const t = await page.locator('[role="alert"]').nth(i).innerText().catch(() => '');
          if (t) alertTexts.push(t.slice(0, 80));
        }
      }
      report.ui.push({
        page: p.name,
        path: p.path,
        pass,
        apiErrors: blocking.slice(0, 5),
        alertCount,
        alerts: alertTexts,
        note: pass
          ? ''
          : blocking.length
            ? `${blocking.length} API(s) com erro`
            : alertTexts.length
              ? `Alertas: ${alertTexts.join(' | ')}`
              : 'Falha desconhecida',
      });
    } catch (e) {
      report.ui.push({ page: p.name, path: p.path, pass: false, note: e.message });
    }
  }

  await browser.close();
}

function buildMarkdown() {
  const apiPass = report.api.filter((r) => r.pass).length;
  const apiTotal = report.api.length;
  const uiPass = report.ui.filter((r) => r.pass).length;
  const uiTotal = report.ui.length;
  report.summary = { apiPass, apiTotal, uiPass, uiTotal };

  let md = `# Relatório E2E — CRUD e páginas\n\n`;
  md += `**Gerado em:** ${report.generatedAt}\n\n`;
  md += `**Ambiente:** API \`${API}\` · Frontend \`${FE}\`\n\n`;
  md += `## Resumo\n\n`;
  md += `| Camada | Passou | Total |\n|--------|--------|-------|\n`;
  md += `| API (HTTP direto) | ${apiPass} | ${apiTotal} |\n`;
  md += `| UI (smoke + rede) | ${uiPass} | ${uiTotal} |\n\n`;

  md += `## API — por módulo\n\n`;
  md += `| Módulo | Verbo | Path | Status | Resultado | Nota |\n`;
  md += `|--------|-------|------|--------|-----------|------|\n`;
  for (const r of report.api) {
    md += `| ${r.module} | ${r.verb} | \`${r.path}\` | ${r.status} | ${r.pass ? '✅' : '❌'} | ${r.note || '-'} |\n`;
  }

  md += `\n## UI — por página\n\n`;
  md += `| Página | Rota | Resultado | Alertas | Nota |\n`;
  md += `|--------|------|-----------|---------|------|\n`;
  for (const r of report.ui) {
    const errs = r.apiErrors?.length ? `${r.apiErrors.length} erro(s) API` : '-';
    md += `| ${r.page} | \`${r.path}\` | ${r.pass ? '✅' : '❌'} | ${r.alertCount ?? '-'} | ${r.note || errs} |\n`;
  }

  md += `\n## Legenda\n\n`;
  md += `- **API:** CRUD completo em Pacientes e Terapias; demais módulos validados com GET (listagem) + PUT notification quando aplicável.\n`;
  md += `- **UI:** login bootstrap, navegação e ausência de respostas \`4xx/5xx\` nas APIs esperadas por página.\n`;
  md += `- Páginas placeholder (\`/documentos\`, \`/configuracoes\`) não consomem API.\n`;
  return md;
}

async function main() {
  console.log('Obtendo token...');
  const token = await getToken();
  console.log('Testando API...');
  await runApiCrud(token);
  console.log('Testando UI com Playwright...');
  await runUiSmoke();
  const md = buildMarkdown();
  const outPath = new URL('../docs/E2E-CRUD-REPORT.md', import.meta.url);
  writeFileSync(outPath, md);
  console.log('\n' + md);
  console.log(`\nRelatório salvo em docs/E2E-CRUD-REPORT.md`);
  const failed = report.api.filter((r) => !r.pass).length + report.ui.filter((r) => !r.pass).length;
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
