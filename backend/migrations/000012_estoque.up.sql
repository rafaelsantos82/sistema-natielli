DO $$ BEGIN CREATE TYPE comodato_status AS ENUM ('Emprestado','Devolvido','Atrasado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE item_estoque_status AS ENUM ('Ativo','Inativo'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE movimentacao_tipo AS ENUM ('Entrada','Saída','Ajuste'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Migration 000011_estoque_comodato

-- 14. TABELAS — Estoque e Comodato
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS itens_estoque (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id      UUID NOT NULL REFERENCES unidades(id),
  codigo          VARCHAR(50) NOT NULL,
  nome            VARCHAR(200) NOT NULL,
  categoria       VARCHAR(100) NOT NULL,
  unidade_medida  VARCHAR(50) NOT NULL,
  estoque_atual   INTEGER NOT NULL DEFAULT 0,
  estoque_minimo  INTEGER NOT NULL DEFAULT 0 CHECK (estoque_minimo >= 0),
  localizacao     VARCHAR(100),
  status          item_estoque_status NOT NULL DEFAULT 'Ativo',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_itens_estoque_unidade_codigo UNIQUE (unidade_id, codigo)
);
CREATE TRIGGER trg_itens_est_updated BEFORE UPDATE ON itens_estoque
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_itens_est_unidade ON itens_estoque (unidade_id);
CREATE INDEX IF NOT EXISTS idx_itens_est_status ON itens_estoque (status);
CREATE INDEX IF NOT EXISTS idx_itens_est_cat    ON itens_estoque (categoria);

CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id          UUID NOT NULL REFERENCES itens_estoque(id),
  item_nome        VARCHAR(200) NOT NULL,
  tipo             movimentacao_tipo NOT NULL,
  quantidade       INTEGER NOT NULL CHECK (quantidade > 0),
  data_hora        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  documento        VARCHAR(50),
  motivo           VARCHAR(500) NOT NULL,
  responsavel_id   UUID NOT NULL,
  responsavel_nome VARCHAR(200) NOT NULL,
  saldo_anterior   INTEGER NOT NULL,
  saldo_atual      INTEGER NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mov_est_item ON movimentacoes_estoque (item_id, data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_mov_est_resp ON movimentacoes_estoque (responsavel_id);

CREATE TABLE IF NOT EXISTS inventarios (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data             DATE NOT NULL,
  responsavel_id   UUID NOT NULL,
  responsavel_nome VARCHAR(200) NOT NULL,
  observacoes      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inventarios_data ON inventarios (data DESC);

CREATE TABLE IF NOT EXISTS inventario_contagens (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventario_id    UUID NOT NULL REFERENCES inventarios(id) ON DELETE CASCADE,
  item_id          UUID NOT NULL REFERENCES itens_estoque(id),
  item_nome        VARCHAR(200) NOT NULL,
  estoque_sistema  INTEGER NOT NULL,
  contagem_fisica  INTEGER NOT NULL,
  divergencia      INTEGER NOT NULL GENERATED ALWAYS AS (contagem_fisica - estoque_sistema) STORED
);
CREATE INDEX IF NOT EXISTS idx_inv_cont_inv ON inventario_contagens (inventario_id);

CREATE TABLE IF NOT EXISTS comodatos (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id                  UUID REFERENCES itens_estoque(id),
  item_nome                VARCHAR(200) NOT NULL,
  descricao                TEXT,
  paciente_id              UUID NOT NULL REFERENCES pacientes(id),
  paciente_nome            VARCHAR(300) NOT NULL,
  data_emprestimo          DATE NOT NULL,
  data_devolucao_prevista  DATE NOT NULL,
  data_devolucao_real      DATE,
  status                   comodato_status NOT NULL DEFAULT 'Emprestado',
  condicao_entrega         TEXT NOT NULL,
  condicao_devolucao       TEXT,
  observacoes              TEXT,
  responsavel_id           UUID NOT NULL,
  responsavel_nome         VARCHAR(200) NOT NULL,
  numero_serie             VARCHAR(100),
  quantidade               INTEGER NOT NULL DEFAULT 1 CHECK (quantidade >= 1),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_comodato_devolucao CHECK (
    data_devolucao_real IS NULL OR data_devolucao_real >= data_emprestimo
  )
);
CREATE TRIGGER trg_comodatos_updated BEFORE UPDATE ON comodatos
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_comodatos_paciente ON comodatos (paciente_id);
CREATE INDEX IF NOT EXISTS idx_comodatos_status   ON comodatos (status);
CREATE INDEX IF NOT EXISTS idx_comodatos_devol    ON comodatos (data_devolucao_prevista) WHERE status = 'Emprestado';

-- ────────────────────────────────────────────────────────────────────────────