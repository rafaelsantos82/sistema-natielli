# Integração Lovable ↔ Backend Go

## Objetivo

Substituir gradualmente mocks/`localStorage` por `GET/POST/PUT/DELETE /api/v1/pacientes`, sem breaking changes no envelope JSON.

## Envelope (obrigatório)

- Sucesso: `{ "data": <payload>, "meta": <objeto ou null> }`
- Erro: `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [{ "field": "cpf", "message": "..." }] } }`

### Mensagens de erro (UX)

- Em respostas **4xx**, o campo `error.message` deve ser texto **amigável ao usuário** (sem IDs internos, stack ou SQL).
- Use `error.details[]` para erros por campo (`field` + `message`).
- Códigos comuns: `VALIDATION_ERROR`, `BUSINESS_RULE_VIOLATION`, `CONFLICT`, `NOT_FOUND`, `FORBIDDEN`, `INVALID_SALA`.
- Em **5xx**, o handler devolve mensagem genérica; o frontend traduz via `formatApiErrorForToast` (`src/lib/api/formatApiError.ts`).
- Toasts: preferir `showErrorToast(err, { action, entity })` ou `getErrorToastProps` (`src/lib/ui/showErrorToast.ts`) em vez de strings fixas como "Erro" / "Não foi possível...".

## Frontend implementado

| Módulo | Caminho |
|--------|---------|
| Cliente HTTP | `src/lib/api/client.ts` |
| Pacientes API | `src/lib/api/pacientes.ts` |
| Auth API | `src/lib/api/auth.ts` |
| JWT (memória) | `src/lib/auth/tokenStore.ts`, `src/lib/auth/token.ts` |
| Feature flags | `src/lib/featureFlags.ts` |
| Slug → UUID | `src/lib/unidades/apiIds.ts` |
| Mapper form ↔ API | `src/lib/mappers/pacienteMapper.ts` |
| Hook React Query | `src/hooks/usePacientes.ts` |
| Página | `src/pages/Pacientes.tsx` |
| Conta (perfil/senha) | `src/pages/ContaPerfil.tsx`, `src/pages/ContaSenha.tsx`, `src/hooks/useAccountProfile.ts` |

### Conta do usuário (menu header)

| Ação | API | Frontend |
|------|-----|----------|
| Ver perfil | `GET /auth/me` | `fetchMe()` |
| Editar nome/e-mail | `PATCH /auth/me` `{ name, email }` | `updateProfile()` → `refreshProfile()` no `AuthContext` |
| Trocar senha | `PUT /auth/me/password` | `changePassword()` + checklist em `/conta/senha` |

Política de senha (frontend e `HashPassword` no backend): mínimo 8 caracteres e pelo menos 1 dígito; nova senha deve ser diferente da atual.

Rotas: `/conta/perfil`, `/conta/senha`. Com `must_change_password`, o app redireciona para `/conta/senha` (PATCH `/auth/me` bloqueado no backend até trocar a senha).

### Variáveis de ambiente (raiz)

Copie `.env.example` → `.env.local` (gitignored via `*.local`).

| Variável | Default | Descrição |
|----------|---------|-----------|
| `VITE_API_BASE_URL` | `/api/v1` | Base URL (proxy dev → `localhost:8080`) |
| `VITE_API_PACIENTES` | `true` (ligado se ≠ `false`) | API de pacientes; `false` só para CI sem backend |
| `VITE_AUTH_BOOTSTRAP` | `false` | `true` login via `POST /auth/token` |
| `BOOTSTRAP_AUTH_TOKEN` | — | **Sem** prefixo `VITE_`; só no `.env.local`; injetado pelo proxy Vite |

### Dev local

1. Backend: `cd backend && make up && make migrate-up`
2. Frontend: `npm run dev` (porta **5173**, proxy `/api/v1` → **8080**)
3. `.env.local` exemplo:

```env
VITE_API_BASE_URL=/api/v1
VITE_API_PACIENTES=true
VITE_AUTH_BOOTSTRAP=true
BOOTSTRAP_AUTH_TOKEN=<mesmo valor de backend BOOTSTRAP_AUTH_TOKEN>
```

4. Login com e-mail contendo `admin`, `gestor`, `funcionario` ou `terceiro` para role inferida.

### Auth (segurança)

- JWT em **memória** (`tokenStore.ts`), não em `localStorage`.
- Perfil mínimo em `sessionStorage` (`auth_profile`) para F5.
- Com `VITE_AUTH_BOOTSTRAP=true`, após F5 o `AuthContext` reemite `POST /auth/token` se o perfil existir sem JWT em memória.
- 401 da API → logout automático (`setOnUnauthorized`).
- Bootstrap token **nunca** em variável `VITE_*` (não entra no bundle).

### Listagem Pacientes (sem fallback silencioso)

- Com `VITE_API_PACIENTES=true`, falha na API **não** preenche a tabela com `mockPacientes`; a UI exibe alerta de erro.
- Toasts de sucesso em create/update/delete só ocorrem quando a mutation HTTP retorna OK.

### RBAC UI

- `canWritePacientes` em `AuthContext` (admin, gestor, funcionario).
- Botões criar/editar/excluir ocultos para `terceiro`.
- Backend valida roles nas rotas de escrita.

## Pacientes — contrato pediátrico

| Campo API | Obrigatório (create) | Notas |
|-----------|----------------------|--------|
| `nome_completo` | sim | |
| `data_nascimento` | sim | `YYYY-MM-DD`, idade ≤ 25 anos |
| `sexo_biologico` | sim | `masculino`, `feminino`, `intersexo` |
| `cpf` | não | Se vazio, exige `responsavel_cpf` válido |
| `tel_principal`, `uf`, `cep` | sim | |
| `responsavel_nome` | sim | |
| `consentimento_lgpd` | sim | deve ser `true` no cadastro |
| `unidade_ids` | sim | array `{ unidade_id, principal }`, exatamente uma `principal: true` |

Removidos do formulário: tabagismo, alcoolismo, estresse, campos reprodutivos adultos.

### Multi-filial

```text
unidade-duque-caxias → a0000000-0000-4000-8000-000000000001
unidade-tijuca       → a0000000-0000-4000-8000-000000000002
```

Implementado em `src/lib/unidades/apiIds.ts`; listagem usa `unidade_id` da unidade ativa (`UnidadeContext`).

## Checklist OWASP (integração SPA)

| Risco | Mitigação |
|-------|-----------|
| A01 Broken Access Control | JWT + `canWritePacientes`; backend `RequireRole` |
| A02 Cryptographic Failures | HTTPS em prod; token não em query string |
| A03 Injection | JSON + Zod; `encodeURIComponent` em paths |
| A05 Misconfiguration | Secrets só em `.env.local`; bootstrap fora do bundle |
| A07 XSS | JWT fora de `localStorage`; React escaping |
| A09 Logging | Client não loga CPF/token/payload completo em prod |
| IDOR | Edição por ID da lista autorizada; escopo por unidade na query |

## Produção

- URL: `https://sistema.natielli.com.br`
- API: `https://sistema.natielli.com.br/api/v1`
- Build frontend: `VITE_API_BASE_URL=https://sistema.natielli.com.br/api/v1`, `VITE_API_PACIENTES=true`, `VITE_AUTH_BOOTSTRAP=false`
- Deploy: [`../../docs/DEPLOY.md`](../../docs/DEPLOY.md) — `make deploy-prod` no Mac (SSH `pstec`)

Pendente: rate limit login dedicado, refresh token, CSP fino no nginx.

## Módulos consumidores (pacientes API)

- `Consultas.tsx`, `Comodato.tsx` — `usePacientesOptions()` (sem `mockPacientes`)
- `useAniversariantes.ts` — pacientes do mês via `usePacientesList` (API)

## Persistência por módulo

| Módulo | API REST | Frontend integrado |
|--------|----------|-------------------|
| Pacientes | `GET/POST/PUT/DELETE /pacientes` | Sim (`usePacientes`). Terapeuta: escopo por carteira (`paciente_profissionais`); resposta pode incluir `ultima_consulta_em`, `proxima_consulta_em`, `total_consultas`. |
| Unidades | `GET /unidades` | Sim (`useUnidades` + `UnidadeContext`) |
| Profissionais | `/profissionais` + `/conselhos` | Sim (`useProfissionais`, página `Profissionais.tsx`) |
| Consultas | `/consultas` + confirmar/cancelar/concluir/vincular/aprovar/rejeitar | Sim (`useConsultas`). POST/PUT exigem `sala_id` (sala ativa da mesma `unidade_id`); resposta inclui `sala_id` e `sala_nome`; cria/atualiza reserva vinculada em `reservas`. |
| Salas / reservas | `/salas` + `/salas/:id/reservas` | Sim (`useSalas`). Cadastro UI: `nome_sala`, `unidade_id`, `codigo?`, `status?`. POST/PUT mínimo: `nome_sala` + `unidade_id` obrigatórios; `especialidades`, `recursos` e `capacidade` opcionais na API (legado no banco). Seed DC: migration `000027` (19 salas ativas, UUIDs `b0000000-…0001`–`…0019`). |
| Notification settings | `GET/PUT /notification-settings` | Sim (`useConsultas`) |
| Terapias | `/terapias` | Sim (`useTerapias`) |
| Anamneses / respostas | `/anamneses`, `/respostas-anamnese` | Sim (`useAnamneses` CRUD + respostas POST) |
| Prontuário | `/prontuario/pacientes/:id`, evoluções/prescrições/atestados/documentos | Sim (`useProntuario`) |
| Financeiro | `/financeiro/*` | Sim (`useFinanceiro`) |
| Relatórios operacionais | `/relatorios-operacionais` | Sim (`useRelatoriosOperacionais`) |
| RH | `/rh/*` | Sim (`useFolhaPagamento` — CLT/PJ) |
| Estoque | `/estoque/itens` (+ mov/inventário LS se API off) | Parcial (`useEstoque` itens API) |
| Comodato | `/comodatos` | Sim (`useComodatos`) |
| Planos / NF / ações | `/planos-saude`, `/notas-fiscais`, `/acoes-judiciais` | Sim (hooks dedicados) |
| Contratos | `/contratos` | Parcial (contrato API; compartilhamento LS) |
| Marketing | `/marketing/manuais`, `/marketing/materiais` | Sim (`useMarketing`) |
| Contabilidade | `/contabilidade/contas`, `/contabilidade/lancamentos` | Sim (`useBalancetes`) |
| Audit log | `GET /audit-log` (admin) | Leitura API (`useAuditLog`) |

## Matriz página × endpoint (resumo)

| Página | Hook | Verbos principais |
|--------|------|-------------------|
| `/pacientes` | `usePacientes` | GET, POST, PUT, DELETE |
| `/profissionais` | `useProfissionais` | GET, POST, PUT, DELETE |
| `/consultas` | `useConsultas` | GET, POST, PUT, DELETE + POST ações |
| `/agenda` | consultas, profissionais, salas, terapias | GET |
| `/salas`, `/salas/:id/agenda` | `useSalas` | GET, POST, PUT, DELETE |
| `/terapias` | `useTerapias` | GET, POST, PUT, DELETE |
| `/anamneses` | `useAnamneses` | GET, POST, PUT, DELETE |
| `/prontuario/:id` | `useProntuario` + `useConsultas` | GET, POST, DELETE + POST vincular |
| `/financeiro`, `/faturas` | `useFinanceiro` | GET, POST, PUT, DELETE |
| `/relatorios` | `useRelatoriosOperacionais` | GET, POST, PUT |
| `/estoque`, `/comodato`, `/marketing`, `/balancetes`, `/folha-pagamento`, `/planos-saude`, etc. | hooks Wave 3 | GET, POST, PUT, DELETE |
| `/documentos`, `/configuracoes` | — | N/A (placeholder) |
| `/documentos-assinados` | assinatura local | N/A |

## Testes frontend

```bash
npm run test
```

Cobre: `token.test.ts`, `pacienteMapper.test.ts`, `apiIds.test.ts`.

## Adoção incremental

1. Publicar endpoint — feito.
2. Cliente HTTP + JWT — feito.
3. `VITE_API_PACIENTES=true` — padrão em dev/prod com backend.
4. Sem fallback mock em falha de API — UI exibe erro.
5. Demais módulos: implementar endpoints Go incrementalmente.
