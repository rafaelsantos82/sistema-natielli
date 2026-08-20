# 03 — Organização do código

## 1. Estrutura do repositório (monorepo)

```
espaco-terapia-os/
├── backend/                 # API Go
│   ├── cmd/api/             # main HTTP
│   ├── internal/
│   │   ├── application/     # apps (orquestração)
│   │   ├── config/          # env → Config
│   │   ├── domain/          # entities, services, repo interfaces
│   │   ├── infrastructure/  # postgres, auth, storage, logging
│   │   ├── interfaces/http/ # handlers, dto, routes, middleware
│   │   └── platform/logger/ # slog, sanitizer, middleware
│   ├── migrations/          # SQL versionado
│   ├── docs/                # Swagger gerado
│   └── scripts/
├── src/                     # SPA React
│   ├── pages/               # rotas principais
│   ├── components/          # UI por domínio
│   ├── hooks/               # React Query wrappers
│   ├── lib/api/             # client HTTP + módulos
│   ├── contexts/            # Auth, Unidade
│   └── lib/mappers/         # DTO ↔ UI
├── e2e/                     # Playwright
├── deploy/                  # produção
└── docs/                    # documentação operacional + manual
```

## 2. Frontend — convenções

| Pasta | Responsabilidade |
|-------|------------------|
| `pages/` | Uma página por rota principal; compõe hooks + componentes |
| `hooks/use*.ts` | Queries/mutations TanStack Query; chaveia por `unidadeId` quando necessário |
| `lib/api/*.ts` | Funções `apiRequest` tipadas; types em `*.types.ts` |
| `components/{dominio}/` | Modais, tabelas, formulários específicos |
| `components/layout/` | `AppLayout`, `AppSidebar`, header |
| `components/common/` | `FormModal`, tabelas genéricas |

**Rotas:** definidas em [`src/App.tsx`](../../src/App.tsx). Redirect legado: `/tratamentos` → `/terapias`.

**Proteção:** [`ProtectedRoute`](../../src/components/ProtectedRoute.tsx) com `requiredPermission` opcional.

## 3. Backend — convenções

| Pasta | Responsabilidade |
|-------|------------------|
| `handlers/*_handler.go` | Parse HTTP, status codes, chama service |
| `dto/*_request.go` | Binding JSON/query; tags `validate` |
| `domain/service/*_service.go` | Regras de negócio, transações lógicas |
| `domain/entity/` | Structs de domínio |
| `infrastructure/database/*_model.go` | Tags GORM |
| `infrastructure/database/postgres_*_repository.go` | SQL/GORM |

**Nomenclatura HTTP:** plural em paths (`/pacientes`, `/consultas`).

**Soft delete:** coluna `deleted_at` onde migration define; endpoints `POST /:id/restore` em users, pacientes, profissionais.

## 4. Migrations

- Arquivos: `NNNNNN_descricao.up.sql` / `.down.sql`
- Nunca alterar migration aplicada em produção — criar nova versão
- Trigger padrão: `fn_set_updated_at()` em tabelas mutáveis

## 5. Testes — localização

| Tipo | Onde |
|------|------|
| Service unit | `backend/internal/domain/service/*_test.go` |
| Handler HTTP | `backend/internal/interfaces/http/handlers/*_test.go` |
| Frontend unit | `src/**/*.test.ts(x)` |
| E2E | `e2e/*.spec.ts` |
