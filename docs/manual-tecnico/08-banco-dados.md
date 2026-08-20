# 08 — Banco de dados PostgreSQL

## 1. Visão geral

- **SGBD:** PostgreSQL 16 (Docker)
- **Extensão:** `pgcrypto` (UUID)
- **Migrations:** 32 versões (`000001`–`000032`)
- **ORM:** GORM com modelos em `infrastructure/database/*_model.go`

## 2. Convenções de schema

| Convenção | Detalhe |
|-----------|---------|
| PK | `UUID DEFAULT gen_random_uuid()` |
| Timestamps | `created_at`, `updated_at` TIMESTAMPTZ |
| Soft delete | `deleted_at` onde aplicável |
| Enums | `CREATE TYPE ... AS ENUM` |
| updated_at | trigger `fn_set_updated_at()` |

## 3. ER — núcleo operacional

```mermaid
erDiagram
  unidades ||--o{ paciente_unidades : tem
  pacientes ||--o{ paciente_unidades : vinculo
  unidades ||--o{ salas : possui
  unidades ||--o{ consultas : agenda
  pacientes ||--o{ consultas : agenda
  profissionais ||--o{ consultas : realiza
  salas ||--o{ consultas : sala_id
  users ||--o{ user_roles : tem
  profissionais }o--|| users : opcional_vinculo
  pacientes }o--o{ paciente_profissionais : equipe
  profissionais ||--o{ paciente_profissionais : atende
```

## 4. ER — clínico

```mermaid
erDiagram
  pacientes ||--o| prontuarios : um_por_paciente
  prontuarios ||--o{ prontuario_evolucoes : evolucoes
  prontuarios ||--o{ prontuario_prescricoes : prescricoes
  prontuarios ||--o{ prontuario_atestados : atestados
  prontuarios ||--o{ prontuario_documentos : anexos
  consultas ||--o| prontuario_evolucoes : vinculo_atendimento
  anamneses ||--o{ respostas_anamnese : respostas
  pacientes ||--o{ respostas_anamnese : preenchimento
```

## 5. ER — financeiro e planos

```mermaid
erDiagram
  financeiro_categorias ||--o{ financeiro_lancamentos : classifica
  financeiro_centros_custo ||--o{ financeiro_lancamentos : aloca
  planos_saude ||--o{ acoes_judiciais : referencia
  acoes_judiciais ||--o{ notas_fiscais : nf
  contas_contabeis ||--o{ lancamentos_contabeis : partidas
```

## 6. ER — RH, estoque, documentos

```mermaid
erDiagram
  funcionarios_clt ||--o{ folhas_clt : folha
  funcionarios_pj ||--o{ folhas_pj : folha
  estoque_itens ||--o{ estoque_movimentacoes : movimenta
  estoque_itens ||--o{ estoque_inventarios : inventario
  documento_categorias ||--o{ biblioteca_arquivos : organiza
  profissionais ||--o{ profissional_documentos : compliance
  users ||--o| chaves_digitais : chave
  users ||--o{ documentos_assinados : assinaturas
```

## 7. Índice de migrations

| Migration | Domínio |
|-----------|---------|
| 000001 | init |
| 000002 | pacientes, unidades |
| 000003 | auth users |
| 000004 | profissionais |
| 000005 | agenda, consultas, salas |
| 000006 | tratamentos |
| 000007 | prontuário |
| 000008 | anamneses |
| 000009 | financeiro |
| 000010 | planos |
| 000011 | RH |
| 000012 | estoque |
| 000013 | contratos |
| 000014 | marketing |
| 000015 | contábil |
| 000016–000020 | auxiliar, audit, jwt, password reset |
| 000021–000023 | RBAC, data scopes |
| 000024 | rename terapias |
| 000025–000027 | paciente_profissionais, salas seed |
| 000026 | consultas.sala_id |
| 000028 | biblioteca documentos |
| 000029 | chaves digitais |
| 000030–000031 | contratos evolution/arquivo |
| 000032 | conciliação NF |

## 8. Operações

```bash
cd backend && make migrate-up    # aplica UP
make migrate-down               # reverte 1 versão
```

**Produção:** sempre backup antes de migration; nunca editar migration já aplicada.

## 9. Consultas críticas (agenda)

Tabela `consultas` — índices em `paciente_id`, `profissional_id`, `data_hora`, `unidade_id` (migration 000005/000026).

Enum `consulta_status`: `agendada`, `confirmada`, `cancelada`, `concluida`.

Enum `status_atendimento`: fluxo prontuário → aprovação.
