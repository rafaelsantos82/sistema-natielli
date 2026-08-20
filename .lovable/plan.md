## Suporte a Unidades (Filiais) — Duque de Caxias e Tijuca

Implementação incremental, sem quebrar nada do que já existe (todos os dados ficam em `localStorage`, sem backend; nenhuma migração de schema necessária — apenas atribuição de `unidadeId` padrão a registros legados).

### Auditoria do existente

- `Consulta` (`useConsultas`) — não tem `unidadeId`. Storage: `consultas`.
- `Sala` (`useSalas`) — já tem campo `unidade: string` (texto livre). Vou padronizar para `unidadeId` referenciando `Unidade.id`, mantendo o campo `unidade` legado como label cacheada para retrocompatibilidade.
- `Profissional` (`useProfissionais`) — não tem unidade. Vou adicionar `unidadeIds: string[]` opcional (multi-unidade).
- `Reserva` (salas) — não tem unidade; herda da sala.
- `AuthContext.User` — não tem unidades permitidas. Vou adicionar `unidadesPermitidas?: string[]` opcional (vazio/undefined = todas — admin).
- `Header` — sem seletor.
- `Agenda` (`src/pages/Agenda.tsx`) — filtros por profissional/sala/tratamento, sem unidade.
- `Consultas.tsx` + `ConsultaForm.tsx` — sem campo unidade.
- Pacientes ficam **globais** (sem `unidadeId`), conforme solicitado.

Conceito existente mais próximo é o campo `Sala.unidade` (texto). Não há conceito formal de tenant. Vou criar a entidade `Unidade` formal e migrar.

### Modelo

Tipo único em `src/hooks/useUnidades.ts`:

```ts
interface Unidade {
  id: string;
  nome: string;          // "Duque de Caxias"
  slug: string;          // "duque-de-caxias"
  status: 'ativa' | 'inativa';
  endereco?: string;
  telefone?: string;
  createdAt: string;
  updatedAt: string;
  deleted_at?: string;   // soft delete (memory: ISO 27789 padrão)
}
```

Storage key: `unidades`. Seed na primeira leitura: cria `Duque de Caxias` (id estável `unidade-duque-caxias`) e `Tijuca` (`unidade-tijuca`) se a lista estiver vazia.

### Contexto de unidade ativa

Novo `src/contexts/UnidadeContext.tsx`:

- `unidadeAtivaId: string | null`
- `setUnidadeAtiva(id)`
- `unidades: Unidade[]` (apenas as visíveis ao usuário, respeitando `user.unidadesPermitidas`)
- Persistência em `localStorage['unidade_ativa']`.
- Default: primeira unidade permitida (ou Duque de Caxias).
- Integrado ao `App.tsx` dentro de `<AuthProvider>`.

### Migração de dados legados (idempotente, no carregamento dos hooks)

Em `useConsultas`, `useSalas`, `useProfissionais` adicionar uma função `migrateUnidades()` que roda uma vez (flag `migrations_unidade_v1` em `localStorage`):

- Consultas sem `unidadeId` → `unidade-duque-caxias`.
- Salas: se `unidade` (string) bate com nome de uma unidade existente, mapeia para o `unidadeId` correspondente; senão → Duque de Caxias.
- Profissionais sem `unidadeIds` → `[unidade-duque-caxias]`.

Sem `NOT NULL` forte: campos ficam **opcionais nos types** (`unidadeId?: string`) para não quebrar leituras antigas; código novo trata `undefined` como Duque de Caxias.

### UI

**1. Header (`src/components/layout/Header.tsx`)**: adicionar `<Select>` com label "Unidade" entre o título e o menu de usuário. Mostra apenas unidades permitidas. Se só houver 1, exibe como `Badge` read-only.

**2. Agenda (`src/pages/Agenda.tsx`)**: adicionar 4º filtro "Unidade", default = unidade ativa do contexto. Filtro é aplicado em `eventosCompletos` cruzando `consulta.unidadeId` e `reserva.unidadeId` (ou via `sala.unidadeId`). Detecção de conflitos passa a respeitar `unidadeId` (não conflita entre unidades diferentes). Título: `Agenda — {nomeUnidade}`.

**3. ConsultaForm (`src/components/forms/ConsultaForm.tsx`)**:
- Adicionar campo `unidadeId` (Select) obrigatório no schema Zod.
- Default = `unidadeAtivaId`.
- Editável apenas para `admin`/`gestor`; `funcionario` vê read-only.
- Lista de profissionais e salas filtrada por `unidadeId` selecionada.

**4. Consultas.tsx**: passa `unidadeAtivaId` como default ao formulário; lista filtrada pela unidade ativa (com toggle "Todas as unidades" para admin).

**5. SalaForm (`src/components/forms/SalaForm.tsx`)**: trocar input texto `unidade` por `<Select>` de `Unidade`. Campo obrigatório.

**6. ProfissionalForm**: adicionar multi-select `unidadeIds` (checkbox list). Default: unidade ativa.

**7. MeuPainel / MinhaAgenda**: aplicar filtro adicional por `unidadeAtivaId` quando definido. Se profissional atende em mais de uma unidade, exibir toggle "Todas as unidades" + por unidade.

**8. AppSidebar (admin)**: novo item em "Administração" → "Unidades" (`/unidades`) restrito a `admin`/`gestor`. Página simples com `DataTable` (CRUD usando `useUnidades`).

### Permissões (RBAC já existente)

`User.unidadesPermitidas?: string[]`:
- `undefined` ou `[]` → vê todas (default para admin/gestor existentes).
- Lista preenchida → seletor de unidade só mostra as permitidas; tentativas de filtrar por unidade não permitida caem para a primeira permitida.

`UnidadeContext` aplica esse filtro de forma centralizada. Toda tela que lê unidade ativa já respeita automaticamente.

### Garantias (não-quebra)

- Storage keys existentes (`consultas`, `salas_atendimento`, `profissionais`, `reservas_salas`) **mantidas**. Apenas adicionamos campos opcionais.
- Migração roda 1x e é idempotente (flag em `localStorage`).
- Hooks existentes continuam expondo a mesma API; adicionamos overloads para filtrar por unidade (`useConsultas().listByUnidade(id)`).
- Financeiro, Prontuário, Anamneses, Aprovação: **inalterados**. Eles continuam vendo todos os registros; o filtro por unidade é UI-side.
- `AgendaProfissional`, `Tratamentos`, `Pacientes`: inalterados nesta entrega.
- Conflitos: passam a considerar `unidadeId` — antes conflitava globalmente; depois só dentro da mesma unidade. Isso é uma melhoria, não regressão.

### Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Sala antiga com `unidade` texto livre não bater em "Duque de Caxias"/"Tijuca" | Fallback para Duque de Caxias e log warn no console; admin pode reatribuir via SalaForm. |
| Consulta antiga aparecer em unidade errada | Default Duque de Caxias; admin pode editar. |
| `funcionario` mudar unidade no form sem permissão | Campo desabilitado se `user.role === 'funcionario'`. |
| Confusão "todas as unidades" vs unidade específica | Header sempre mostra a unidade ativa; título da Agenda inclui nome da unidade. |
| Tela atual de Salas usa filtro `nome` por unidade | Migrar para id; manter campo `unidade` (string) preenchido com nome para retrocompatibilidade visual. |

### Arquivos

**Criar**
- `src/hooks/useUnidades.ts` — CRUD + seed.
- `src/contexts/UnidadeContext.tsx` — provider + hook `useUnidadeAtiva`.
- `src/pages/Unidades.tsx` — CRUD admin.
- `src/components/forms/UnidadeForm.tsx`.
- `src/lib/migrations/unidades.ts` — migração idempotente legados.

**Editar**
- `src/App.tsx` — envolver com `<UnidadeProvider>`; nova rota `/unidades`.
- `src/contexts/AuthContext.tsx` — adicionar `unidadesPermitidas?: string[]` em `User`.
- `src/components/layout/Header.tsx` — seletor de unidade.
- `src/components/layout/AppSidebar.tsx` — item "Unidades" em Administração.
- `src/hooks/useConsultas.ts` — campo `unidadeId?`, helper `listByUnidade`, migração.
- `src/hooks/useSalas.ts` — campo `unidadeId`, migração de `unidade` (texto) → id.
- `src/hooks/useProfissionais.ts` — campo `unidadeIds?: string[]`, migração.
- `src/pages/Agenda.tsx` — filtro de unidade + título dinâmico + conflito por unidade.
- `src/pages/Consultas.tsx` — filtro/listagem por unidade ativa.
- `src/components/forms/ConsultaForm.tsx` — Select `unidadeId` obrigatório.
- `src/components/forms/SalaForm.tsx` — Select `unidadeId`.
- `src/components/forms/ProfissionalForm.tsx` — multi-select `unidadeIds`.
- `src/pages/MeuPainel.tsx` / `MinhaAgenda.tsx` — respeitar unidade ativa + toggle multi-unidade.
- `src/lib/validations/sala.schema.ts` — `unidadeId` obrigatório.
- `src/lib/validations/profissional.schema.ts` — `unidadeIds` opcional.

### Memória a salvar (após implementação)

- `mem://features/multi-unidade` — descreve modelo `Unidade`, `unidadeAtivaId`, regra de filtro UI-side, defaults para legados (Duque de Caxias).
- Atualizar `mem://index.md` Core: "Multi-unidade: Unidade ativa via UnidadeContext; consultas/salas/profissionais filtrados por unidadeId; pacientes são globais."

### Entrega

1. Cadastro `Unidade` + seed Duque de Caxias e Tijuca.
2. Seletor no header com persistência e filtro por permissão.
3. Filtro de unidade na Agenda + título dinâmico.
4. Campo unidade obrigatório em ConsultaForm e SalaForm.
5. Multi-unidade em Profissional.
6. Migração automática (legados → Duque de Caxias).
7. CRUD `/unidades` para admin.
8. Zero alteração em rotas existentes, financeiro, prontuário, anamneses ou aprovação.