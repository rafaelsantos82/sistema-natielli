# Relatório E2E — CRUD e páginas

**Gerado em:** 2026-05-25T21:53:30.184Z

**Ambiente:** API `http://localhost:8080/api/v1` · Frontend `http://localhost:5173`

**Ferramenta:** Playwright (CLI) via `scripts/e2e-crud-validation.mjs` — o MCP Playwright não expõe tools neste workspace; usamos o pacote `playwright` local.

**Ação corretiva durante o teste:** o container `backend-api-1` estava com imagem antiga (apenas rotas de `/pacientes`). Foi executado `docker compose up --build -d api` para alinhar com o código atual.

## Resumo executivo

| Resultado | Detalhe |
|-----------|---------|
| API (38 checks) | **100% OK** após rebuild — listagens de todos os módulos + CRUD completo em **Pacientes** e **Terapias** |
| UI (23 páginas) | **22/23 OK** — login bootstrap, carregamento e chamadas API sem erro nas páginas integradas |
| Falha UI | **`/unidades`** — 1 requisição com erro na rede (investigar `GET /unidades/:id` ou race no mount) |
| CRUD UI (cliques) | Não automatizado nesta rodada — validação de formulários/modais exige cenários Playwright por entidade |
| Placeholders | `/documentos`, `/configuracoes` — sem API (esperado) |

### Matriz página → endpoint (leitura na UI)

| Página | Hook / API | CRUD backend | Smoke UI |
|--------|------------|--------------|----------|
| `/pacientes` | `usePacientes` | GET/POST/PUT/DELETE ✅ | ✅ |
| `/profissionais` | `useProfissionais` | GET ✅ | ✅ |
| `/consultas` | `useConsultas` | GET ✅ | ✅ |
| `/agenda` | consultas, prof., salas, trat. | GET ✅ | ✅ |
| `/salas` | `useSalas` | GET ✅ | ✅ |
| `/terapias` | `useTerapias` | GET + POST/PUT/DELETE ✅ | ✅ |
| `/anamneses` | `useAnamneses` | GET ✅ | ✅ |
| `/prontuarios` | consultas | GET ✅ | ✅ |
| `/financeiro`, `/faturas` | `useFinanceiro` | GET ✅ | ✅ |
| `/relatorios` | `useRelatoriosOperacionais` | GET ✅ | ✅ |
| `/estoque` | `useEstoque` | GET itens ✅ | ✅ |
| `/comodato` | `useComodatos` | GET ✅ | ✅ |
| `/marketing` | `useMarketing` | GET ✅ | ✅ |
| `/balancetes` | `useBalancetes` | GET contabilidade ✅ | ✅ |
| `/folha-pagamento` | `useFolhaPagamento` | GET RH ✅ | ✅ |
| `/planos-saude`, `/acoes-judiciais` | hooks dedicados | GET ✅ | ✅ |
| `/contratos` | `useContratos` | GET ✅ | ✅ |
| `/unidades` | `useUnidades` | GET ✅ (escrita ainda local) | ❌ |
| `/documentos`, `/configuracoes` | — | N/A | ✅ |

### Pendências conhecidas (fora do escopo deste smoke)

- Escrita em **Unidades** ainda é `localStorage` quando API ligada (`apiReadOnly`).
- **Profissionais**, **Consultas**, **Salas**, etc.: CRUD na UI não foi exercitado botão a botão neste script.
- **Terapias** POST exige enums do Postgres (`diretriz_protocolar`, `via`, `status`).

## Resumo

| Camada | Passou | Total |
|--------|--------|-------|
| API (HTTP direto) | 38 | 38 |
| UI (smoke + rede) | 22 | 23 |

## API — por módulo

| Módulo | Verbo | Path | Status | Resultado | Nota |
|--------|-------|------|--------|-----------|------|
| Unidades | GET | `/unidades` | 200 | ✅ | - |
| Audit log | GET | `/audit-log` | 200 | ✅ | - |
| Notification settings | GET | `/notification-settings` | 200 | ✅ | - |
| Financeiro categorias | GET | `/financeiro/categorias` | 200 | ✅ | - |
| Financeiro centros | GET | `/financeiro/centros-custo` | 200 | ✅ | - |
| Financeiro lançamentos | GET | `/financeiro/lancamentos` | 200 | ✅ | - |
| RH CLT | GET | `/rh/funcionarios-clt` | 200 | ✅ | - |
| RH PJ | GET | `/rh/funcionarios-pj` | 200 | ✅ | - |
| Folha CLT | GET | `/rh/folhas-clt` | 200 | ✅ | - |
| Folha PJ | GET | `/rh/folhas-pj` | 200 | ✅ | - |
| Estoque itens | GET | `/estoque/itens` | 200 | ✅ | - |
| Estoque mov | GET | `/estoque/movimentacoes` | 200 | ✅ | - |
| Estoque inventários | GET | `/estoque/inventarios` | 200 | ✅ | - |
| Planos saúde | GET | `/planos-saude` | 200 | ✅ | - |
| Ações judiciais | GET | `/acoes-judiciais` | 200 | ✅ | - |
| Notas fiscais | GET | `/notas-fiscais` | 200 | ✅ | - |
| Marketing manuais | GET | `/marketing/manuais` | 200 | ✅ | - |
| Marketing materiais | GET | `/marketing/materiais` | 200 | ✅ | - |
| Contabilidade contas | GET | `/contabilidade/contas` | 200 | ✅ | - |
| Contabilidade lançamentos | GET | `/contabilidade/lancamentos` | 200 | ✅ | - |
| Comodatos | GET | `/comodatos` | 200 | ✅ | - |
| Contratos | GET | `/contratos` | 200 | ✅ | - |
| Relatórios operacionais | GET | `/relatorios-operacionais` | 200 | ✅ | - |
| Profissionais | GET | `/profissionais` | 200 | ✅ | - |
| Consultas | GET | `/consultas` | 200 | ✅ | - |
| Salas | GET | `/salas` | 200 | ✅ | - |
| Terapias | GET | `/terapias` | 200 | ✅ | - |
| Anamneses | GET | `/anamneses` | 200 | ✅ | - |
| Respostas anamnese | GET | `/respostas-anamnese` | 200 | ✅ | - |
| Pacientes | GET | `/pacientes?limit=5` | 200 | ✅ | - |
| Pacientes | POST | `/pacientes` | 201 | ✅ | - |
| Pacientes | GET | `/pacientes/:id` | 200 | ✅ | - |
| Pacientes | PUT | `/pacientes/:id` | 200 | ✅ | - |
| Pacientes | DELETE | `/pacientes/:id` | 204 | ✅ | - |
| Terapias | POST | `/terapias` | 201 | ✅ | - |
| Terapias | PUT | `/terapias/:id` | 200 | ✅ | - |
| Terapias | DELETE | `/terapias/:id` | 204 | ✅ | - |
| Notification settings | PUT | `/notification-settings` | 200 | ✅ | - |

## UI — por página

| Página | Rota | Resultado | Alertas | Nota |
|--------|------|-----------|---------|------|
| Login | `/login` | ✅ | - | Bootstrap auth OK |
| Pacientes | `/pacientes` | ✅ | 2 | - |
| Profissionais | `/profissionais` | ✅ | 2 | - |
| Consultas | `/consultas` | ✅ | 2 | - |
| Agenda | `/agenda` | ✅ | 2 | - |
| Salas | `/salas` | ✅ | 2 | - |
| Terapias | `/terapias` | ✅ | 2 | - |
| Anamneses | `/anamneses` | ✅ | 2 | - |
| Prontuários | `/prontuarios` | ✅ | 2 | - |
| Financeiro | `/financeiro` | ✅ | 2 | - |
| Faturas | `/faturas` | ✅ | 2 | - |
| Relatórios | `/relatorios` | ✅ | 2 | - |
| Estoque | `/estoque` | ✅ | 2 | - |
| Comodato | `/comodato` | ✅ | 2 | - |
| Marketing | `/marketing` | ✅ | 2 | - |
| Balancetes | `/balancetes` | ✅ | 2 | - |
| Folha pagamento | `/folha-pagamento` | ✅ | 2 | - |
| Planos saúde | `/planos-saude` | ✅ | 2 | - |
| Ações judiciais | `/acoes-judiciais` | ✅ | 2 | - |
| Contratos | `/contratos` | ✅ | 2 | - |
| Unidades | `/unidades` | ❌ | 2 | 1 API(s) com erro |
| Documentos (placeholder) | `/documentos` | ✅ | 2 | - |
| Configurações (placeholder) | `/configuracoes` | ✅ | 2 | - |

## Legenda

- **API:** CRUD completo em Pacientes e Terapias; demais módulos validados com GET (listagem) + PUT notification quando aplicável.
- **UI:** login bootstrap, navegação e ausência de respostas `4xx/5xx` nas APIs esperadas por página.
- Páginas placeholder (`/documentos`, `/configuracoes`) não consomem API.
