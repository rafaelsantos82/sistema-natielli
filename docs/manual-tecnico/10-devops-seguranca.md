# 10 — DevOps, segurança e qualidade

## 1. Pipeline de deploy (resumo)

Fluxo documentado em [DEPLOY.md](../DEPLOY.md):

1. Build imagem API (multi-stage, usuário non-root)
2. Build SPA (`npm run build`) com `VITE_*` de produção
3. `migrate-up` antes ou durante deploy
4. Nginx TLS + proxy `/api/v1`
5. Volume uploads com permissões corretas (`deploy/scripts/fix-uploads-permissions.sh`)

## 2. Hardening

| Controle | Implementação |
|----------|---------------|
| Container non-root | Dockerfile API |
| CORS restritivo | lista explícita, sem `*` com credentials |
| JWT secret | obrigatório prod |
| Bootstrap off prod | `config.Validate()` |
| Rate limit login | tentativas + lockout |
| Headers segurança | Nginx (ver SECURITY.md) |
| Swagger off prod | `SWAGGER_ENABLED=false` |
| Logs sem PII | sanitizer slog |
| Upload path | fora de webroot; download via handler autenticado |

## 3. OWASP — mapeamento

| Risco | Mitigação no projeto |
|-------|----------------------|
| Broken Auth | JWT + revogação + lockout |
| Broken Access Control | RBAC + data scope + guards |
| IDOR | filtros no service por unidade/user |
| Injection | GORM parametrizado, validação DTO |
| Security misconfiguration | Validate config prod |
| Sensitive data exposure | redação logs, erros sem stack |

## 4. Quality gates

```bash
# Backend
cd backend && go test ./... && go vet ./... && make verify-routes

# Frontend
npm run test && npm run lint

# E2E (agenda)
npm run test:e2e -- e2e/agenda-sync.spec.ts --project=agenda-sync
```

## 5. Observabilidade em produção

- Logs JSON para agregador (stdout Docker)
- Sentry para erros 5xx e panics
- Healthcheck: `/api/v1/health`
- Correlação: propagar `X-Request-ID` do load balancer

## 6. Débitos técnicos conhecidos

| Item | Impacto | Referência |
|------|---------|------------|
| `datetime-local` enviado como UTC no backend | Validação expediente em BRT | DEV.md checklist agenda |
| `/profissionais/:id/agenda` não é lista de consultas | Confusão operacional | cap. Profissionais |
| Alguns módulos ainda híbridos localStorage | Dados divergentes sem API | featureFlags |
