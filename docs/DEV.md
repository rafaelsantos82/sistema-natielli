# Desenvolvimento local (macOS)

Ambiente de desenvolvimento nesta máquina (Docker Desktop + Vite). Produção: [`DEPLOY.md`](DEPLOY.md).

## Manual de utilização

Guia para usuários finais (passo a passo, abas e ações de cada tela):

- **Markdown:** [`MANUAL-USUARIO.md`](MANUAL-USUARIO.md)
- **PDF:** [`MANUAL-USUARIO.pdf`](MANUAL-USUARIO.pdf)
- **Capturas:** `docs/manual-usuario/screenshots/` (geradas com Playwright)

```bash
npm run docs:manual:screenshots   # requer backend + frontend
npm run docs:manual:usuario       # regenera textos dos capítulos
bash scripts/build-manual-usuario-pdf.sh
```

## Manual técnico

Especificação técnica completa (arquitetura, stack, logging, Swagger, ER, capítulos por item do menu):

- **Markdown (índice):** [`MANUAL-TECNICO.md`](MANUAL-TECNICO.md)
- **Capítulos modulares:** [`manual-tecnico/`](manual-tecnico/)
- **PDF:** [`MANUAL-TECNICO.pdf`](MANUAL-TECNICO.pdf)

Regenerar o PDF após alterar a documentação:

```bash
npm run docs:manual:pdf
```

Requisito: Google Chrome (headless) ou Pandoc+LaTeX. Diagramas Mermaid permanecem no Markdown; no PDF aparecem como referência textual (ver script `scripts/build-manual-pdf.sh`).

Atualizar capítulos gerados por template Python:

```bash
python3 scripts/generate-manual-modules.py
```

## Pré-requisitos

- Docker Desktop (Compose v2)
- Node.js 20+
- Go 1.24+ (opcional, para testes fora do container)

## Backend

```bash
cd backend
cp .env.example .env
make up
make migrate-up
curl -s http://localhost:8080/api/v1/health
```

Após `migrate-up`, a migration `000027` insere **19 salas ativas** na unidade Duque de Caxias (`a0000000-0000-4000-8000-000000000001`), visíveis em Salas de Atendimento e no select de agendamento.

Postgres fica em `127.0.0.1:5432` **somente em dev** — não replicar em produção.

### API em loop `Restarting` (container não sobe)

```bash
cd backend
docker compose logs api --tail 40
```

| Log | Causa | Ação |
|-----|--------|------|
| `panic: ':unidadeId' ... conflicts with ':id'` | Rotas Gin em `/unidades` com nomes de parâmetro diferentes | Usar sempre `:id` (ex.: `/unidades/:id/chave-digital`); `docker compose up --build -d api` |
| `signing envelope init failed` | `SIGNING_MASTER_KEY` vazia com `APP_ENV=production` | Em dev, defina em `backend/.env`: `SIGNING_MASTER_KEY=dev-only-signing-master-key-32bytes!!` |
| `connection refused` no health | API ainda não subiu ou crashou | Aguardar rebuild; conferir `docker compose ps` |

Migrations: `make migrate-up` — versão atual deve aparecer em `schema_migrations` (ex.: `29`, `dirty = f`). Migration quebrada costuma impedir só o `migrate`, não o start da API.

### Após pull ou mudanças no código Go da API

O frontend (Vite) recarrega sozinho; o container **`api` não**. Se você rodar só `docker compose up -d api` **sem** `--build`, continua a imagem antiga em `localhost:8080`.

Sintomas de API desatualizada:

- Endpoint novo retorna 404 (ex.: `POST /api/v1/users/:id/restore`, `POST /api/v1/profissionais/:id/restore`)
- Comportamento antigo (ex.: usuários/profissionais excluídos somem da lista; sem botão Restaurar)

**Sempre reconstruir após alterar handlers/rotas:**

```bash
cd backend
make up
# equivalente: docker compose up --build -d api db
```

Verificação rápida (com JWT de admin):

```bash
# Listagem com soft-deleted (deve retornar 200; itens excluídos trazem deleted_at)
curl -s "http://localhost:8080/api/v1/users?include_deleted=true&limit=5" \
  -H "Authorization: Bearer SEU_TOKEN"

# Rota restore registrada (404 JSON = usuário inexistente; 405 = rota ausente na imagem antiga)
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  "http://localhost:8080/api/v1/users/00000000-0000-4000-8000-000000000010/restore" \
  -H "Authorization: Bearer SEU_TOKEN"

# Profissionais: listagem com soft-deleted e restore
curl -s "http://localhost:8080/api/v1/profissionais?include_deleted=true&page_size=5" \
  -H "Authorization: Bearer SEU_TOKEN"

curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  "http://localhost:8080/api/v1/profissionais/00000000-0000-4000-8000-000000000010/restore" \
  -H "Authorization: Bearer SEU_TOKEN"

# Biblioteca de documentos (após migration 000028)
curl -s "http://localhost:8080/api/v1/documentos/categorias" -H "Authorization: Bearer SEU_TOKEN"
curl -s "http://localhost:8080/api/v1/documentos/arquivos?page_size=5" -H "Authorization: Bearer SEU_TOKEN"

# Upload / delete na biblioteca global (/documentos) — mesmo volume de uploads dos profissionais
curl -s -w "\n%{http_code}\n" -X POST "http://localhost:8080/api/v1/documentos/arquivos" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "categoria_id=CATEGORIA_UUID" \
  -F "titulo=Meu documento" \
  -F "file=@/caminho/arquivo.pdf"

curl -s -w "\n%{http_code}\n" -X DELETE "http://localhost:8080/api/v1/documentos/arquivos/ARQUIVO_UUID" \
  -H "Authorization: Bearer SEU_TOKEN"
```

O `make up` também executa [`backend/scripts/verify-routes.sh`](../backend/scripts/verify-routes.sh), que falha se a imagem estiver velha.

### Upload de documentos (profissionais e biblioteca `/documentos`)

O volume `uploads_data` precisa ser gravável pelo usuário `appuser` (UID 100) do container `api`. Profissionais gravam em `profissionais/`; a biblioteca global em `biblioteca/`; marketing em `marketing/`. Se o upload retornar erro de permissão ou 500 ao armazenar:

```bash
cd backend
docker compose exec -u root api sh -c 'mkdir -p /data/uploads && chown -R appuser:appgroup /data/uploads && chmod 750 /data/uploads'
```

Em produção use [`deploy/scripts/fix-uploads-permissions.sh`](../deploy/scripts/fix-uploads-permissions.sh) (Alpine + volume; o `api` hardened não aceita `chown` via `compose run`). Ver [`DEPLOY.md`](DEPLOY.md).

### Listagem `/documentos` com campos vazios (correção GORM)

Se a tabela mostrar título/categoria/arquivo vazios e data `31/12/0001`, a API antiga restringia o `SELECT` no `Count` e o `Find` listava só `ba.id`. **Rebuild obrigatório** (`docker compose up --build -d api`).

Após o deploy, opcionalmente remova registros inválidos criados durante o bug (soft-delete):

```bash
docker compose exec -T db psql -U postgres -d espaco_terapia -c "
UPDATE biblioteca_arquivos
SET deleted_at = NOW()
WHERE deleted_at IS NULL
  AND (
    nome_arquivo = ''
    OR tamanho_bytes = 0
    OR uploaded_at < TIMESTAMPTZ '2000-01-01'
  );
"
```

Não é necessária migration de schema além da `000028` já existente.

### Marketing: upload de manuais e materiais

Arquivos ficam em `marketing/manuais/` e `marketing/materiais/` no mesmo volume `uploads_data`. Rebuild da API após alterações Go: `cd backend && docker compose up --build -d api`.

```bash
# Upload manual
curl -s -w "\n%{http_code}\n" -X POST "http://localhost:8080/api/v1/marketing/manuais/upload" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "titulo=Manual de conduta" \
  -F "versao=1.0" \
  -F "publico_alvo=Interno" \
  -F "status=Rascunho" \
  -F "file=@/caminho/manual.pdf"

# Download
curl -s -o manual.pdf "http://localhost:8080/api/v1/marketing/manuais/MANUAL_UUID/download" \
  -H "Authorization: Bearer SEU_TOKEN"

# Excluir
curl -s -w "\n%{http_code}\n" -X DELETE "http://localhost:8080/api/v1/marketing/manuais/MANUAL_UUID" \
  -H "Authorization: Bearer SEU_TOKEN"

# Material (mesmo padrão)
curl -s -w "\n%{http_code}\n" -X POST "http://localhost:8080/api/v1/marketing/materiais/upload" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "titulo=Banner campanha" \
  -F "tipo=Imagem" \
  -F "file=@/caminho/banner.png"
```

Frontend: `VITE_API_MARKETING=true` na raiz (`.env.local`).

## Frontend

Na raiz do repositório:

```bash
cp .env.example .env.local
npm install
npm run dev
```

Abra http://localhost:5173 — o Vite faz proxy de `/api/v1` para `http://localhost:8080`.

Exemplo `.env.local` **com backend local no ar** (dados em PostgreSQL):

```env
VITE_API_BASE_URL=/api/v1
VITE_API_PACIENTES=true
VITE_AUTH_BOOTSTRAP=true
BOOTSTRAP_AUTH_TOKEN=<mesmo valor de BOOTSTRAP_AUTH_TOKEN no backend/.env>
```

Reinicie `npm run dev` após alterar variáveis `VITE_*` (são lidas só no startup).

### Sessão após refresh (F5)

Com `VITE_AUTH_LOGIN=true` (login real), o JWT e o perfil ficam em **sessionStorage** na mesma aba: recarregar a página (F5) **mantém** o login. Ao fechar o navegador, a sessão some (não há “lembrar-me” em `localStorage`). Se o JWT expirar (padrão do backend: `JWT_EXPIRATION_MINUTES`, ex. 60), é necessário entrar de novo.

## APIs por módulo (backend Go)

Migrations `000003`–`000016` aplicam o schema completo. Rotas em `/api/v1` (JWT + bootstrap dev).

| Onda | Módulos | Flags Vite (default `true`) |
|------|---------|----------------------------|
| 1 | pacientes, unidades, profissionais, consultas, salas | `VITE_API_PACIENTES`, `VITE_API_UNIDADES`, `VITE_API_PROFISSIONAIS`, `VITE_API_CONSULTAS`, `VITE_API_SALAS` |
| 2 | terapias, anamneses, prontuário, financeiro, relatórios | `VITE_API_TERAPIAS`, `VITE_API_ANAMNESES`, `VITE_API_PRONTUARIO`, `VITE_API_FINANCEIRO`, `VITE_API_RELATORIOS` |
| 3 | RH, estoque, comodato, planos, contratos, marketing, contabilidade, audit | `VITE_API_RH`, `VITE_API_ESTOQUE`, `VITE_API_PLANOS`, `VITE_API_COMODATO`, `VITE_API_CONTRATOS`, `VITE_API_MARKETING`, `VITE_API_CONTABILIDADE`, `VITE_API_AUDIT` |

**Verificador de disponibilidade (Novo Agendamento):** usa `diasAtendimento`, `horarioInicio` e `horarioFim` do cadastro do profissional (slugs `segunda`…`domingo`, mapeados da API `seg`…`dom` em `profissionalMapper.ts`). Helpers em `src/lib/agenda/`. Exceções de férias/almoço vêm do `localStorage` (`agenda_exceptions_{profissionalId}`) cadastradas na agenda do profissional. O backend valida dia/horário e sobreposição ao criar/editar consulta quando `ConsultaService` recebe `ProfissionalRepository`.

**Comodato:** o status exibido nas abas **Atrasados** / **Ativos** é derivado de `data_devolucao_prevista` (helpers em `src/lib/comodato/comodatoStatus.ts`). Registros podem permanecer `status: "Emprestado"` na API mesmo em atraso; a aba Atrasados não depende de `status === "Atrasado"` no banco.

Com `VITE_API_ESTOQUE=true`, itens e movimentações usam `GET/POST /estoque/itens` e `GET/POST /estoque/movimentacoes` (saldo atualizado no servidor). Inventários ainda podem usar `localStorage` até migração completa. Se a lista de movimentações mostrar dados antigos de testes locais, limpe `estoque_movimentacoes` no DevTools → Application → Local Storage.
| — | biblioteca documentos (`/documentos`) | `VITE_API_DOCUMENTOS` (migration `000028`) |

Hooks integrados via React Query (padrão `useProfissionais.ts`): ondas 1–3 acima. Use `VITE_API_*=false` apenas em CI sem backend.

### Contratos (`VITE_API_CONTRATOS`, migrations `000030` + `000031`)

- CRUD autenticado em `/api/v1/contratos` com **soft delete** (`deleted_at`).
- **Documento por arquivo** (PDF, DOC, DOCX — até `UPLOAD_MAX_BYTES`, default 10 MB): migration `000031` adiciona `arquivo_*` e `storage_path`; `conteudo` permanece nullable para contratos legados redigidos em texto.
- **Criar:** `POST /contratos` — `multipart/form-data` com campos `titulo`, `tipo`, `paciente_id`/`profissional_id` (opcionais) e `file` (obrigatório). Não aceita mais JSON com `conteudo`.
- **Metadados:** `PUT /contratos/:id` — JSON (título, tipo, vínculos).
- **Substituir arquivo:** `PUT /contratos/:id/arquivo` — multipart só `file` (status `Rascunho` ou `Recusado`).
- **Download autenticado:** `GET /contratos/:id/arquivo`.
- Compartilhamento: `POST /contratos/:id/compartilhar` → link público `/contratos/compartilhado/:token` (só `expiracao_horas` no body; **sempre** permite visualizar e baixar — flags `pode_*` ignoradas no servidor). Visualização/download em `GET /contratos/compartilhado/:token/arquivo`. A página pública não oferece impressão no navegador; o destinatário baixa e imprime localmente.
- Assinatura eletrônica (MVP): `POST /contratos/:id/solicitacoes-assinatura` → links `/contratos/assinatura/:token`, preview em `GET /contratos/assinatura/:token/arquivo`, aceite em `POST .../aceitar` (sem e-mail; copiar links na UI).
- Rotas públicas com rate limit por IP; não exigem JWT. JSON público expõe metadados do arquivo (`arquivo_nome`, `tem_arquivo`, `download_url`), não o binário inline.
- **ICP-Brasil** (chave da unidade): no modal de visualização, assinatura usa o **PDF enviado** (bytes do arquivo) — disponível apenas quando o contrato está em PDF. DOC/DOCX: download na UI. Contratos legados só com `conteudo` texto: fallback de visualização em texto.
- `FRONTEND_PUBLIC_URL` no backend monta URLs absolutas de compartilhamento/assinatura.
- Arquivos em disco: `{UPLOAD_BASE_PATH}/contratos/{contrato_id}/`.

### Conciliação NF × ações judiciais (`VITE_API_PLANOS`, migration `000032`)

Vincula notas fiscais a ações judiciais do mesmo plano e calcula pagamento por processo (`valor_acao` vs soma de `valor_pago` nas notas vinculadas).

| Método | Rota | Uso |
|--------|------|-----|
| `GET` | `/acoes-judiciais/conciliacao-resumo` | Lista ações com totais agregados (`plano_saude_id`, `page_size`) |
| `GET` | `/acoes-judiciais/:id/conciliacao` | Detalhe: KPIs + notas vinculadas |
| `POST` | `/notas-fiscais/:id/conciliar` | Body: `{ "acao_judicial_id", "valor_pago" }` — valida plano, limites e deriva `status` (`Pago` / `Pago Parcial` / `Pendente`) |

RBAC: `api.conciliacao.read` / `api.conciliacao.write` (admin e financeiro). Frontend: `src/lib/conciliacao/conciliacaoCalc.ts`, hooks `useConciliacaoAcao` / `conciliarNota` em `useNotasFiscais`, telas Auditoria de Notas, Ações Judiciais, detalhe `/acoes-judiciais/:id`, Relatórios de Conciliação.

Regras resumidas: `saldoEmAberto = max(0, valor_acao - valorPagoTotal)`; ação **quitada** quando pago ≥ valor da ação (tolerância R$ 0,01). UI distingue **valor da ação** e **total das notas**.

```bash
cd backend && make migrate-up   # deve listar 32/u conciliacao_nf
```

**Deploy local após mudança de contrato por arquivo**

1. Aplicar migration `000031`: `cd backend && make migrate-up` (deve listar `31/u contratos_arquivo`).
2. Rebuild da API sem cache se o create ainda responder “Corpo da requisição inválido” (imagem antiga com JSON): `docker compose build --no-cache api && make up`.
3. No browser (DevTools → Network), confirmar `POST /api/v1/contratos` com `Content-Type: multipart/form-data; boundary=...` e campo `file`.

## Perfil terapeuta: identidade vs carteira

- **`users.profissional_id`** (cadastro em Configurações → Usuários): identifica **qual profissional** a conta representa. Não define quais pacientes aparecem.
- **Carteira (`paciente_profissionais`)**: criada ao **agendar ou registrar consultas** (migration `000025`). Um paciente pode ter vários terapeutas; vínculos permanecem após cancelamento (histórico).
- Listagem `GET /pacientes` para terapeuta retorna `ultima_consulta_em`, `proxima_consulta_em`, `total_consultas` quando o escopo `therapist_patients` está ativo.

## Smoke checklist (com backend + `.env.local`)

1. Login bootstrap → `POST /auth/token`
2. Pacientes: listar, criar, F5 persiste
3. Profissionais: listar na página (sem mock inline)
4. Consultas: criar, concluir, vincular prontuário, aprovar (terapeuta: paciente entra na carteira após agendar)
5. Agenda: exibe consultas/salas/profissionais da API (`npm run test:e2e -- e2e/agenda-sync.spec.ts` após criar agendamento)
6. Terapias / Anamneses / Relatórios: CRUD básico
7. Prontuário: evolução + vínculo na consulta

```bash
cd backend && make migrate-up && make up
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/profissionais?unidade_id=a0000000-0000-4000-8000-000000000001
```

### Testes E2E (Playwright)

```bash
cd backend && make up && make migrate-up
# Opcional se login real (VITE_AUTH_BOOTSTRAP=false): make seed-admin
# Import de clientes (planilhas): docs/SEED-PACIENTES.md
npm run test:e2e -- e2e/agenda-sync.spec.ts --project=agenda-sync
```

O helper `e2e/helpers/auth.ts` obtém JWT via `POST /auth/login` e, se falhar, via `POST /auth/token` (bootstrap). **Não depende** do modo bootstrap do Vite.

- Pare o `npm run dev` manual antes dos testes **ou** use `PW_REUSE_DEV_SERVER=true` só se o admin existir (`make seed-admin`).
- Por padrão o Playwright sobe o Vite com `VITE_AUTH_BOOTSTRAP=true` (porta 5173 livre).
- Credenciais padrão: `ADMIN_EMAIL=admin@espacoterapia.local`, `ADMIN_PASSWORD=change-me-admin` (alinhadas ao `backend/.env` e `make seed-admin`).

### Checklist produção — agenda não atualiza

Após deploy (`make deploy-build-push` + `make deploy-prod`):

1. Confirmar build do frontend com `VITE_API_CONSULTAS=true` (ver `deploy/docker-compose.prod.yml`).
2. Migrations aplicadas no Postgres (`consultas` com `unidade_id` preenchido).
3. No browser (DevTools → Network), ao criar agendamento: `POST /consultas` → **201**; em seguida `GET /consultas?unidade_id=…` deve listar o novo `id`.
4. Se GET retorna o registro mas a UI não: atualizar imagem do frontend (correção de cache/`await` no formulário).
5. Se GET não retorna: revisar `unidade_id` no payload, unidade ativa e escopo RBAC do usuário.
6. **Minha Agenda** (terapeuta): usuário deve ter `profissional_id` vinculado em Configurações; rota `/profissionais/:id/agenda` é só exceções (férias), não lista de consultas.

## Pós-remoção de mocks (frontend)

- Na primeira carga, `clearLegacyMockStorage()` remove chaves de demonstração do `localStorage` (flag `legacy_demo_data_cleared_v2`).
- Módulos com `VITE_API_*=true` (padrão em `.env.example`) consomem a API Go; use `false` só em CI sem backend.
- Telas sem registros exibem estado vazio neutro (tabela vazia ou `EmptyIntegrationState` no dashboard), sem banners de migração ou stack técnica.
- Onde a API ainda não existir para um módulo, cadastros podem gravar em `localStorage` conforme o hook da tela.
- Login exige `VITE_AUTH_BOOTSTRAP=true` + `BOOTSTRAP_AUTH_TOKEN` alinhado ao backend (não há login fictício em memória).

Ver só pacientes no banco após limpar storage do browser:

```bash
cd backend
docker compose exec db psql -U postgres -d espaco_terapia \
  -c "SELECT nome_completo, status FROM pacientes WHERE deleted_at IS NULL ORDER BY created_at DESC;"
```

## Pacientes: API vs Postgres

| Sintoma no browser | Causa provável |
|--------------------|----------------|
| Alerta vermelho na lista | API indisponível ou 401 — não há fallback para dados fictícios |
| Lista vazia com API ligada | Unidade errada no header (filtro `unidade_id`) ou paciente em outra filial |
| Após F5 pede login | JWT expirado ou aba nova; com login real, confira `auth_access_token` em sessionStorage (Application → Session Storage) |
| Cadastro ok mas não lista | POST funcionou; confira `GET /api/v1/pacientes` no Network e unidade ativa |

### Confirmar persistência no PostgreSQL

```bash
cd backend
docker compose ps   # api e db healthy
docker compose exec db psql -U postgres -d espaco_terapia \
  -c "SELECT nome_completo, deleted_at FROM pacientes ORDER BY created_at DESC LIMIT 10;"
```

### Confirmar no DevTools (tela Pacientes)

1. Console: `import.meta.env.VITE_API_PACIENTES` → `"true"`
2. Network: `GET /api/v1/pacientes?unidade_id=...` → **200** e corpo `data` com registros do banco
3. Ao salvar: `POST /api/v1/pacientes` → **201** e toast "Paciente cadastrado com sucesso"
4. Banner verde na página: "Dados do PostgreSQL"

### Outros módulos

Consultas, profissionais, financeiro, agenda etc. **ainda persistem em `localStorage`** — não aparecem no Postgres até haver endpoints e hooks equivalentes.

## Portas

| Serviço | URL |
|---------|-----|
| Frontend (Vite) | http://localhost:5173 |
| API | http://localhost:8080 |
| PostgreSQL | localhost:5432 |

## Testes

```bash
cd backend && make test
npm run test
```

Contrato API ↔ frontend: [`backend/docs/lovable-integration.md`](../backend/docs/lovable-integration.md).

### Chave digital e documentos assinados

Uma chave ICP-Brasil (A1, arquivo `.pfx`/`.p12`) **por unidade**, cadastrada em **Administração → Chave Digital** (`/configuracoes/chave-digital`). A senha do certificado é informada só no cadastro; no servidor fica cifrada com `SIGNING_MASTER_KEY` (ver `backend/.env.example`).

Assinatura de PDFs (Prontuário, Comodato, etc.) usa a chave da **unidade ativa**, sem pedir senha no modal. Arquivos e metadados ficam em PostgreSQL + `UPLOAD_BASE_PATH/assinaturas/`.

**Teste manual:**

1. `make up` (ou API local) com migration `000029` aplicada.
2. Login como admin/gestor → cadastre PFX em `/configuracoes/chave-digital`.
3. Troque a unidade ativa no header; assine um PDF no Prontuário ou liste em `/documentos-assinados`.
4. **Verificar** e **Baixar** na lista; conferir `audit_log` (ações `documento.assinatura`, `chave_digital.cadastro`, etc.).

Documentos antigos só em `localStorage` (`signed_documents`) **não** são migrados automaticamente.

**Testes automatizados:**

```bash
cd backend && go test ./internal/infrastructure/crypto/... ./internal/domain/service/... -count=1
npx vitest run src/pages/ChaveDigital.test.tsx src/components/signature/AssinarDocumentoDialog.test.tsx
```

Utilitário legado client-side (verificação offline): [`src/lib/utils/digitalSignature.ts`](../src/lib/utils/digitalSignature.ts).
