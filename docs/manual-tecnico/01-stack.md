# 01 — Stack tecnológico

## 1. Backend (Go)

| Componente | Versão / biblioteca | Função |
|------------|---------------------|--------|
| Linguagem | Go **1.25.0** | Runtime (`backend/go.mod`) |
| HTTP | **gin-gonic/gin** v1.10 | Router, middleware, binding |
| ORM | **gorm.io/gorm** + driver postgres | Persistência |
| Migrations | **golang-migrate** (Docker image) | Schema versionado em `backend/migrations/` |
| Auth | **golang-jwt/jwt** v5 | Access tokens + revogação (`jwt_revocations`) |
| Senha | **golang.org/x/crypto** (bcrypt) | Hash de credenciais |
| Docs API | **swaggo/swag** | OpenAPI 2.0 em `backend/docs/` |
| Logs | **log/slog** (stdlib) | JSON/text estruturado |
| Erros runtime | **getsentry/sentry-go** | Panics e tracing opcional |
| E-mail | Resend API (via env) | Reset de senha, notificações |
| UUID | google/uuid | Identificadores |

**Entrypoints:**

- `backend/cmd/api/main.go` — servidor HTTP principal
- `backend/cmd/seed-admin/main.go` — seed administrador
- `backend/cmd/seed-anamneses/main.go` — seed anamneses
- `backend/cmd/extract-anamneses/main.go` — utilitário DOCX

## 2. Frontend (TypeScript / React)

| Componente | Biblioteca | Função |
|------------|------------|--------|
| Build | **Vite** 5.x | Dev server, HMR, proxy `/api` |
| UI | **React** 18 | Componentes |
| Roteamento | **react-router-dom** v6 | SPA routes |
| Estado servidor | **@tanstack/react-query** v5 | Cache, invalidação, refetch |
| Formulários | **react-hook-form** + **zod** | Validação |
| UI kit | **Radix UI** + **shadcn/ui** | Acessibilidade, primitivos |
| Estilo | **Tailwind CSS** | Utility-first |
| Drag-drop | **@dnd-kit** | Agenda, kanban onde aplicável |
| Ícones | **lucide-react** | Sidebar e ações |
| Testes unit. | **Vitest** | `src/lib`, componentes |
| E2E | **Playwright** | `e2e/*.spec.ts` |

## 3. Infraestrutura

| Artefato | Descrição |
|----------|-----------|
| `docker-compose.yml` | Serviços `api`, `db`, profile `migrate` |
| `deploy/` | Scripts e exemplos produção |
| Nginx (produção) | Serve SPA estático + reverse proxy API |
| PostgreSQL 16 | Banco relacional único |

## 4. Qualidade e segurança (tooling)

- `go test ./...`, `go vet ./...`
- `golangci-lint` (recomendado em CI)
- `eslint` no frontend
- `backend/scripts/verify-routes.sh` — smoke HTTP + contagem Swagger paths

## 5. Matriz de integração API (frontend)

Cada módulo pode ser desligado via `VITE_API_*=false` (fallback localStorage legado Lovable):

| Flag | Módulo |
|------|--------|
| `VITE_API_PACIENTES` | Pacientes |
| `VITE_API_PROFISSIONAIS` | Profissionais |
| `VITE_API_CONSULTAS` | Consultas / Agenda |
| `VITE_API_SALAS` | Salas |
| `VITE_API_UNIDADES` | Unidades |
| `VITE_API_TERAPIAS` | Terapias |
| `VITE_API_ANAMNESES` | Anamneses |
| `VITE_API_PRONTUARIO` | Prontuário |
| `VITE_API_FINANCEIRO` | Financeiro |
| `VITE_API_CONTABILIDADE` | Balancetes |
| `VITE_API_RELATORIOS` | Relatórios |
| `VITE_API_ESTOQUE` | Estoque |
| `VITE_API_COMODATO` | Comodato |
| `VITE_API_RH` | Folha |
| `VITE_API_PLANOS` | Planos / Ações / NF |
| `VITE_API_CONTRATOS` | Contratos |
| `VITE_API_MARKETING` | Marketing |
| `VITE_API_DOCUMENTOS` | Biblioteca documentos |
| `VITE_API_CHAVE_DIGITAL` | Chave digital |
| `VITE_API_DOCUMENTOS_ASSINADOS` | Docs assinados |
| `VITE_API_AUDIT` | Auditoria |

Definição: [`src/lib/featureFlags.ts`](../../src/lib/featureFlags.ts).
