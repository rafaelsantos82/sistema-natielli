# Backend API — Espaço Terapia OS

Backend em Go inspirado na arquitetura do NextBridgeAI, com camadas `handler → application → service → repository → entity`, envelope JSON padronizado e integração incremental com o frontend Lovable.

## Estrutura

- `cmd/api`: entrypoint da API
- `internal/config`: configuração via env vars
- `internal/database`: conexão PostgreSQL
- `internal/domain`: entidades, erros de domínio, serviços e interfaces de repositório
- `internal/application`: casos de uso finos
- `internal/infrastructure/database`: repositórios GORM
- `internal/interfaces/http`: handlers, DTOs, rotas, error handler
- `migrations`: migrations SQL versionadas (`000001` health, `000002` pacientes/unidades)
- `docs`: Swagger gerado (`make swagger`)

## Execução local

1. Copie `.env.example` para `.env` (defina `SWAGGER_ENABLED=true` em dev). **Nunca** versione `.env` — está no `.gitignore` (ver `docs/SECURITY.md`).
2. Suba a stack: `make up`
3. Aplique migrations: `make migrate-up`
4. Health: `GET http://localhost:8080/api/v1/health`
5. Swagger (se habilitado): `GET http://localhost:8080/api/v1/swagger/index.html`

## Auth

- Login (recomendado): `POST /api/v1/auth/login` com `{ "email", "password" }` → JWT + perfil (`user.unidade_ids`).
- Primeiro admin local: defina `ADMIN_EMAIL` / `ADMIN_PASSWORD` no `.env`, suba o stack (`make up`) e rode `make seed-admin` (conecta em `127.0.0.1:5432` a partir do host; dentro do Compose a API continua usando `host=db`).

## Templates de anamnese (seed)

```bash
make extract-anamneses      # docs/anamnese → data/anamneses/*.json
make seed-anamneses-dry-run
make seed-anamneses
```

Produção: `./deploy/scripts/seed-anamneses.sh`. Detalhes em [`docs/ANAMNESE-MIGRATION.md`](../docs/ANAMNESE-MIGRATION.md).
- Token bootstrap (`BOOTSTRAP_AUTH_ENABLED=true`, apenas dev/E2E):
  - `POST /api/v1/auth/token`
  - Header: `X-Bootstrap-Token: <BOOTSTRAP_AUTH_TOKEN>`
  - Body: `{ "user_id": "...", "email": "...", "role": "admin|gestor|funcionario|terceiro" }`
- Sessão: `GET /api/v1/auth/me` com `Authorization: Bearer <token>` → `{ id, name, email, role, unidade_ids, must_change_password }`
- Perfil (self-service): `PATCH /api/v1/auth/me` com `{ name, email }` — apenas nome e e-mail; `role`/`unidade_ids` continuam via admin em `PUT /users/:id`
- Troca de senha (logado): `PUT /api/v1/auth/me/password` com `{ current_password, new_password }` → novo JWT
- Logout: `POST /api/v1/auth/logout` (revoga JWT na blacklist PostgreSQL até o `exp`)
- Lockout de login: após `LOGIN_MAX_ATTEMPTS` falhas por e-mail **e** IP → `429` (complementa rate limit do nginx)
- Esqueci senha: `POST /api/v1/auth/forgot-password` (resposta genérica; requer `RESEND_API_KEY`, `EMAIL_FROM`, `FRONTEND_PUBLIC_URL`)
- Redefinir: `POST /api/v1/auth/reset-password` com `{ token, password }`
- Troca obrigatória: JWT com `must_change_password`; rotas bloqueadas exceto `/auth/me`, `/auth/me/password`, `/auth/logout`
- Auditoria de usuários: ações `usuario.*` em `audit_log`; filtro `GET /audit-log?entidade=usuario`

Em produção: `BOOTSTRAP_AUTH_ENABLED=false`, domínio Resend verificado, `JWT_SECRET` forte.

## Usuários de acesso (`/api/v1/users`, admin)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/users` | Lista paginada (`?search=&page=&limit=&include_deleted=true`) |
| POST | `/users` | Cria usuário (senha mín. 8 caracteres) |
| GET | `/users/:id` | Detalhe |
| PUT | `/users/:id` | Atualiza (senha opcional) |
| DELETE | `/users/:id` | Soft delete (permanece listável com `include_deleted`) |
| POST | `/users/:id/restore` | Restaura usuário excluído |

## Pacientes (`/api/v1/pacientes`)

Requer JWT. Papéis:

| Operação | Roles |
|----------|--------|
| GET list / GET by id | admin, gestor, funcionario, terceiro |
| POST / PUT | admin, gestor, funcionario |
| DELETE (soft) | admin, gestor |

### Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/v1/pacientes` | Lista paginada |
| POST | `/api/v1/pacientes` | Cria (201, `data.id`) |
| GET | `/api/v1/pacientes/:id` | Detalhe |
| PUT | `/api/v1/pacientes/:id` | Atualiza |
| DELETE | `/api/v1/pacientes/:id` | Soft delete (204) |

### Query params (listagem)

- `unidade_id` — UUID da filial (filtro via `paciente_unidades`)
- `q` — busca por nome
- `cpf` — CPF (somente dígitos)
- `status` — `ativo`, `inativo`, `falecido`
- `page` — default 1
- `page_size` — default 20, máximo 100
- `include_deleted` — `true` para incluir soft-deleted

### Unidades seed (dev)

Após `migrate-up`, existem unidades com slugs alinhados ao frontend:

| Slug | UUID fixo (seed) |
|------|------------------|
| `unidade-catanduva` | `a0000000-0000-4000-8000-000000000003` |
| `unidade-londrina` | `a0000000-0000-4000-8000-000000000004` |
| `unidade-sertanopolis` | `a0000000-0000-4000-8000-000000000005` |
| `unidade-online` | `a0000000-0000-4000-8000-000000000006` |

Duque de Caxias (`…000001`) e Tijuca (`…000002`) são criadas na `000002` e removidas na `000034`.

No create/update, envie `unidade_ids: [{ "unidade_id": "<uuid>", "principal": true }]`.

## Respostas

- Sucesso: `{ "data": ..., "meta": ... }`
- Erro: `{ "error": { "code": "...", "message": "...", "details": [{ "field": "...", "message": "..." }] } }`

## Logging (slog)

Logging estruturado via [`internal/platform/logger`](internal/platform/logger) com sanitização LGPD/OWASP.

| Variável | Descrição |
|----------|-----------|
| `SERVICE_NAME` | Nome do serviço nos logs (default `espaco-terapia-api`) |
| `SERVICE_VERSION` | Versão (default `v0.0.0`) |
| `LOG_LEVEL` | `debug`, `info`, `warn`, `error` (vazio = debug em dev, info em prod) |
| `LOG_FORMAT` | `json` ou `text` (vazio = json em production/staging, text em dev) |
| `LOG_INCLUDE_CALLER` | `true` para incluir arquivo:linha |
| `LOG_MASK_IP` | `true` mascara IPv4 nos access logs (default true em prod/staging) |

**Produção (JSON):** uma linha por evento, campos `service`, `env`, `request_id`, `method`, `path`, `status`, `latency_ms`.

**Dev (text):** mesmo conteúdo em formato legível no terminal.

**Política:** nunca logar body, tokens, Authorization, cookies, senhas, CPF completo ou `DATABASE_URL`. Correlação via header `X-Request-ID` (ecoado na resposta).

## Qualidade

- `make test` / `make vet`
- `make swagger` — regenera `docs/` a partir das anotações `@Router` nos handlers (`internal/interfaces/http/handlers/`)
- Após criar handlers novos: `python3 scripts/inject_swagger_annotations.py` (opcional, idempotente) e `make swagger`
- Recomendado: `govulncheck ./...`, `gosec ./...`, `golangci-lint run`

Contrato detalhado para o frontend: [`docs/lovable-integration.md`](docs/lovable-integration.md).

## Deploy

- Desenvolvimento local (macOS): [`../docs/DEV.md`](../docs/DEV.md)
- Produção (Digital Ocean, `https://sistema.natielli.com.br` na VM pstec): [`../docs/DEPLOY.md`](../docs/DEPLOY.md)
- `make deploy-prod` na raiz do monorepo (via SSH `pstec`)
