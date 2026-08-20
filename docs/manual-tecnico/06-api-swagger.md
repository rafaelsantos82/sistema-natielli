# 06 — API REST e documentação Swagger

## 1. Convenções gerais

| Item | Valor |
|------|-------|
| Base URL | `/api/v1` |
| Autenticação | `Authorization: Bearer <access_token>` |
| Content-Type | `application/json` (exceto uploads `multipart/form-data`) |
| OpenAPI | Swagger 2.0 |
| Título | Espaço Terapia API v1.0 |

Anotações na raiz: [`backend/cmd/api/main.go`](../../backend/cmd/api/main.go).

## 2. Habilitar Swagger UI

```bash
# backend/.env
SWAGGER_ENABLED=true
```

URLs:

- UI: `http://localhost:8080/api/v1/swagger/index.html`
- JSON: `http://localhost:8080/api/v1/swagger/doc.json`

Registro condicional em [`routes/routes.go`](../../backend/internal/interfaces/http/routes/routes.go):

```go
if cfg.SwaggerEnabled {
    api.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
}
```

**Produção:** manter `SWAGGER_ENABLED=false` (superfície de ataque / vazamento de schema).

## 3. Regenerar documentação

```bash
cd backend
make swagger
```

- Entrada: anotações `@Router`, `@Summary`, `@Security BearerAuth` nos handlers
- Saída: `backend/docs/docs.go`, `swagger.json`, `swagger.yaml`
- Script auxiliar opcional: `scripts/inject_swagger_annotations.py`

## 4. Verificação automatizada

```bash
cd backend && make verify-routes
```

- Smoke de rotas críticas com JWT
- Conta paths em `swagger/doc.json`
- Avisa se handlers novos não têm `@Router`

## 5. Catálogo de tags (domínios)

Agrupamento lógico alinhado aos `register_*.go`:

| Tag / domínio | Prefixos principais |
|---------------|---------------------|
| Auth | `/auth/*` |
| Pacientes | `/pacientes` |
| Profissionais | `/profissionais`, documentos |
| Consultas | `/consultas` |
| Salas | `/salas` |
| Terapias | `/terapias` |
| Anamneses | `/anamneses`, `/respostas-anamnese` |
| Prontuário | `/prontuario/*` |
| Financeiro | `/financeiro/*` |
| Contabilidade | `/contabilidade/*` |
| RH | `/rh/*` |
| Estoque | `/estoque/*` |
| Comodatos | `/comodatos` |
| Planos | `/planos-saude`, `/acoes-judiciais`, `/notas-fiscais` |
| Contratos | `/contratos` + rotas públicas |
| Marketing | `/marketing/*` |
| Documentos | `/documentos/*` |
| Chave digital | `/chave-digital`, `/documentos-assinados` |
| Access control | `/access-control/*` |
| Users | `/users` |
| Audit | `/audit-log` |

Consulte `swagger/doc.json` para lista exata de paths (~centenas após Wave 3).

## 6. Contrato de resposta

Documentado em handlers com `@Success 200 {object} ...`. Padrão runtime:

**Sucesso:** `{ "data": T, "meta": M }`

**Erro:** `{ "error": { "code", "message", "details" } }`

Códigos comuns: `VALIDATION_ERROR`, `NOT_FOUND`, `FORBIDDEN`, `UNAUTHORIZED`, `CONFLICT`, `INTERNAL_ERROR`.

## 7. Endpoints públicos (sem JWT)

| Método | Path | Uso |
|--------|------|-----|
| POST | `/auth/login` | Credenciais |
| POST | `/auth/forgot-password` | Reset e-mail |
| POST | `/auth/reset-password` | Token reset |
| POST | `/auth/token` | Bootstrap dev |
| GET | `/contratos/compartilhado/:token` | Visualização pública |
| POST | `/contratos/assinatura/:token/aceitar` | Assinatura pública |

## 8. Paginação (listagens)

Query params típicos (quando implementado no handler):

- `page`, `per_page` ou `limit`, `offset`
- Filtros: `unidade_id`, `status`, `q` (busca)

`meta` retorna totais para UI paginada.
