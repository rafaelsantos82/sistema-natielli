## Seed demo — relatório e plano de ação

Este documento registra os erros encontrados ao implementar/rodar o seed `backend/scripts/seed-demo.sh` e as correções aplicadas.

### Resultado atual

- **Status**: seed executa até o fim sem erro (create-only).
- **Como rodar**: veja `docs/DEMO-DATA.md`.

### Erros encontrados (e correções)

#### 1) `POST /pacientes` retornando 400

- **Sintoma**: `VALIDATION_ERROR` com mensagem “Informe CPF do paciente ou CPF do responsável legal”.
- **Causa**: regra de negócio exige pelo menos um CPF.
- **Correção aplicada**: adicionar `responsavel_cpf` no payload do seed.
- **Arquivo**: `backend/scripts/seed-demo.sh`.

#### 2) `POST /salas` retornando 500 (enum)

- **Sintoma**: `DATABASE_ERROR`, e no Postgres: `invalid input value for enum sala_status: "ativa"`.
- **Causa**: enum `sala_status` espera `Ativa`/`Inativa` (case-sensitive).
- **Correção aplicada**: enviar `"status":"Ativa"`.
- **Arquivo**: `backend/scripts/seed-demo.sh`.

#### 3) `POST /tratamentos` retornando 500 (enums)

- **Sintoma**: `invalid input value for enum diretriz_protocolar` e depois `tratamento_status`.
- **Causa**: enums case-sensitive e com valores fixos em migrations.
- **Correção aplicada**:
  - `diretriz_protocolar: "Diretriz interna"`
  - `status: "Ativo"`
  - item do regime: `via:"VO"` e `dose_unidade:"UI"`
- **Arquivo**: `backend/scripts/seed-demo.sh`.

#### 4) `POST /anamneses` retornando 500 (enum)

- **Sintoma**: `invalid input value for enum anamnese_status: "ativo"`.
- **Causa**: enum `anamnese_status` usa `Ativa`/`Inativa`.
- **Correção aplicada**: `status:"Ativa"`.
- **Arquivo**: `backend/scripts/seed-demo.sh`.

#### 5) `POST /financeiro/lancamentos` retornando 500 (enum)

- **Sintoma**: `invalid input value for enum lancamento_status: "aberto"`.
- **Causa**: enum `lancamento_status` usa `Pendente/Pago/Vencido/Cancelado`.
- **Correção aplicada**: `status:"Pendente"`.
- **Arquivo**: `backend/scripts/seed-demo.sh`.

#### 6) Conflitos por unicidade (centro de custo / estoque)

- **Sintoma**: `CONFLICT` “Registro duplicado”.
- **Causa**: códigos fixos se repetiam entre runs.
- **Correção aplicada**: usar `date +%s` em códigos (`CC-<epoch>`, `IT-<epoch>`).
- **Arquivo**: `backend/scripts/seed-demo.sh`.

#### 7) `POST /comodatos` retornando 500 (enum)

- **Sintoma**: `invalid input value for enum comodato_status: "emprestado"`.
- **Causa**: enum `comodato_status` usa `Emprestado/Devolvido/Atrasado`.
- **Correção aplicada**: `status:"Emprestado"`.
- **Arquivo**: `backend/scripts/seed-demo.sh`.

#### 8) `POST /acoes-judiciais` e `POST /notas-fiscais` retornando 500 (enums)

- **Sintoma**: status inválidos (`aberta`, `emitida`).
- **Causa**: enums possuem valores fixos:
  - `acao_judicial_status`: `Em Andamento/Procedente/Improcedente/Acordo`
  - `nota_fiscal_status`: `Pendente/Pago Parcial/Pago/Em Disputa`
- **Correção aplicada**:
  - ação judicial: `status:"Em Andamento"`
  - nota fiscal: `status:"Pendente"`
- **Arquivo**: `backend/scripts/seed-demo.sh`.

#### 9) `POST /contratos` retornando 500 (FK e enums)

- **Sintoma**:
  - enum `contrato_tipo` inválido
  - enum `contrato_status` inválido
  - FK `criado_por` apontando para `00000000-...-0000` não existente
- **Causa**:
  - enums do Postgres são case-sensitive e com valores “humanizados”
  - token bootstrap anterior usava `user_id` não UUID, falhando parse → `uuid.Nil`
- **Correção aplicada**:
  - `tipo:"Prestação de Serviço"`
  - `status:"Rascunho"`
  - emitir token com `user_id` do usuário “Sistema” existente em migration: `00000000-0000-4000-8000-000000000099`
- **Arquivos**:
  - `backend/scripts/seed-demo.sh`
  - `backend/migrations/000003_core_auth.up.sql` (referência do user Sistema)

#### 10) `POST /marketing/manuais` retornando 500 (enums)

- **Sintoma**: enums `publico_alvo` e `manual_status` inválidos.
- **Causa**: enums:
  - `publico_alvo`: `Interno/Externo/Ambos`
  - `manual_status`: `Rascunho/Publicado/Arquivado`
- **Correção aplicada**:
  - `publico_alvo:"Interno"`
  - `status:"Publicado"`
- **Arquivo**: `backend/scripts/seed-demo.sh`.

#### 11) `POST /contabilidade/contas` não retorna `data.id`

- **Sintoma**: resposta traz `data.codigo`, não `data.id`.
- **Causa**: conta contábil é identificada por `codigo`.
- **Correção aplicada**: tratar como “OK” sem extração de ID, e criar lançamento contábil em seguida.
- **Arquivo**: `backend/scripts/seed-demo.sh`.

