# 04 — Configuração e ambientes

## 1. Variáveis backend (`config.Config`)

Fonte: [`backend/internal/config/config.go`](../../backend/internal/config/config.go), exemplos em [`backend/.env.example`](../../backend/.env.example).

| Variável | Obrigatório (prod) | Default dev | Descrição |
|----------|-------------------|-------------|-----------|
| `APP_ENV` | sim | `development` | `development` \| `production` |
| `SERVER_PORT` | sim | `8080` | Porta HTTP |
| `DATABASE_URL` | sim | postgres local | DSN PostgreSQL |
| `JWT_SECRET` | **sim em prod** | vazio | HMAC para access token |
| `JWT_ISSUER` | não | `espaco-terapia-api` | Claim `iss` |
| `JWT_EXPIRATION_MINUTES` | não | `60` | TTL access token |
| `BOOTSTRAP_AUTH_ENABLED` | **false em prod** | `true` | `POST /auth/token` dev |
| `BOOTSTRAP_AUTH_TOKEN` | se bootstrap on | — | Header/token bootstrap |
| `CORS_ALLOWED_ORIGINS` | sim (lista) | localhost:5173 | CSV de origens |
| `SWAGGER_ENABLED` | não | `false` | UI OpenAPI |
| `SENTRY_DSN` | não | vazio | Telemetria |
| `SENTRY_ENVIRONMENT` | não | development | Tag ambiente |
| `SENTRY_ENABLE_TRACING` | não | false | Tracing Sentry |
| `SENTRY_TRACES_SAMPLE_RATE` | não | 0.2 | Amostragem |
| `SERVICE_NAME` | não | espaco-terapia-api | Campo log `service` |
| `SERVICE_VERSION` | não | v0.0.0 | Campo log `version` |
| `LOG_LEVEL` | não | auto por env | debug/info/warn/error |
| `LOG_FORMAT` | não | auto | `json` \| `text` |
| `LOG_INCLUDE_CALLER` | não | false | `AddSource` slog |
| `LOG_MASK_IP` | não | true em prod | Mascara IP em access log |
| `LOGIN_MAX_ATTEMPTS` | não | 5 | Lockout progressivo |
| `LOGIN_LOCKOUT_MINUTES` | não | 15 | Duração bloqueio |
| `RESEND_API_KEY` | se e-mail | — | API Resend |
| `EMAIL_FROM` | se e-mail | — | Remetente |
| `FRONTEND_PUBLIC_URL` | não | localhost:5173 | Links reset senha |

**Validação (`cfg.Validate()`):**

- `JWT_SECRET` obrigatório se `APP_ENV=production`
- `BOOTSTRAP_AUTH_ENABLED` deve ser `false` em produção
- Token bootstrap obrigatório se bootstrap habilitado

## 2. Variáveis frontend (Vite)

Fonte: [`.env.example`](../../.env.example).

| Variável | Descrição |
|----------|-----------|
| `VITE_API_BASE_URL` | Base API (`/api/v1` com proxy dev) |
| `VITE_API_*` | Flags por módulo (ver cap. 01) |
| `VITE_AUTH_LOGIN` | Login real vs desabilitado |
| `VITE_AUTH_BOOTSTRAP` | Bootstrap dev no browser |

**Segurança:** nunca prefixar segredos com `VITE_` (expostos no bundle). `BOOTSTRAP_AUTH_TOKEN` só no proxy Vite / servidor.

## 3. Matriz de ambientes

| Aspecto | Development | Production |
|---------|-------------|------------|
| `APP_ENV` | development | production |
| Gin mode | Debug | ReleaseMode |
| Swagger | frequentemente `true` | `false` |
| Bootstrap auth | permitido | **proibido** |
| CORS | localhost | domínios reais |
| Logs | text ou json debug | json info+ |
| Uploads | volume local | volume com permissões `deploy/scripts/fix-uploads-permissions.sh` |

## 4. Docker Compose (local)

- `make up` — sobe `api` + `db`
- `make migrate-up` — profile `ops`, container migrate
- Health: `GET http://localhost:8080/api/v1/health`

Ver [DEV.md](../DEV.md) e [DEPLOY.md](../DEPLOY.md) para procedimentos completos.
