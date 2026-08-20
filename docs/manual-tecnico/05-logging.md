# 05 — Logging, correlação e observabilidade

## 1. Stack de logging

- **Biblioteca:** Go 1.21+ `log/slog` (structured logging)
- **Implementação:** [`backend/internal/platform/logger/`](../../backend/internal/platform/logger/)
- **Adapter HTTP:** [`backend/internal/infrastructure/logging`](../../backend/internal/infrastructure/logging) → `applog.New(cfg)`
- **Middleware Gin:** [`middleware.AccessLog`](../../backend/internal/interfaces/middleware/) → `logger.GinMiddleware`

## 2. Configuração

| Env | Comportamento |
|-----|---------------|
| `LOG_LEVEL` | `debug`, `info`, `warn`, `error`; se vazio, deriva de `APP_ENV` |
| `LOG_FORMAT` | `json` (prod) ou `text` (dev); vazio = auto |
| `LOG_INCLUDE_CALLER` | Adiciona arquivo:linha (`AddSource`) |
| `LOG_MASK_IP` | Substitui IP por `[REDACTED]` no access log |

Campos default em todo log:

```json
{
  "service": "espaco-terapia-api",
  "env": "production",
  "version": "v0.0.0",
  "level": "INFO",
  "msg": "..."
}
```

## 3. Correlação de requisições

Headers suportados:

| Header | Constante | Uso |
|--------|-----------|-----|
| `X-Request-ID` | `RequestIDHeader` | ID único por request; gerado se ausente |
| `X-Trace-Id` | `TraceIDHeader` | Trace distribuído opcional |
| `X-Tenant-Id` | `TenantIDHeader` | Escopo multi-tenant futuro |

O middleware:

1. Lê ou gera `request_id` (UUID)
2. Propaga no `context.Context`
3. Devolve no response header `X-Request-ID`
4. Sentry recebe tag `request_id` e `user_id` quando autenticado

## 4. Access log (HTTP)

Atributos típicos (sem body):

```json
{
  "method": "GET",
  "path": "/api/v1/consultas",
  "status": 200,
  "latency_ms": 45,
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "..."
}
```

**Paths silenciosos (quiet):** `/api/v1/health`, `/api/v1/admin/health`, `/metrics`, `/api/v1/swagger/*` (se `IncludeSwagger=false`).

**Nunca logado:** corpo request/response, headers `Authorization`, `Cookie`, `Set-Cookie`, `X-API-Key`, `X-Bootstrap-Token`.

## 5. Redação (sanitizer)

Arquivo: [`sanitizer.go`](../../backend/internal/platform/logger/sanitizer.go).

- `RedactAttr` aplicado em todos os handlers slog
- Denylist de chaves: `password`, `token`, `cpf`, `jwt`, `database_url`, `prontuario`, etc.
- JWT detectado por heurística → `[REDACTED]`
- Query params sensíveis redigidos em paths logados (`SanitizePath`)

## 6. Sentry

Inicialização em `observability.InitSentry(cfg)`:

- `SENTRY_DSN` vazio = desabilitado
- Middleware `sentrygin` com `Repanic: true`
- Scope: `request_id`, user id do JWT
- Sample rate: `SENTRY_TRACES_SAMPLE_RATE`

## 7. Exemplos de eventos (referência)

**Login falho (sem senha no log):**

```json
{"level":"WARN","msg":"login failed","request_id":"...","code":"INVALID_CREDENTIALS"}
```

**Erro de validação 400:**

```json
{"level":"INFO","msg":"request completed","status":400,"path":"/api/v1/consultas","latency_ms":12}
```

**Panic recovery:** via `gin.Recovery()` + Sentry hub.

## 8. Boas práticas para novos módulos

1. Usar `logger.FromContext(ctx, base)` em services para propagar `request_id`
2. Não logar structs de paciente/prontuário completos
3. Erros ao cliente via `ErrorHandler` — stack apenas no servidor/Sentry
