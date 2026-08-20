DO $$ BEGIN CREATE TYPE folha_status AS ENUM ('pendente','pago','cancelado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Migration 000010_rh

-- 13. TABELAS — RH / Folha de Pagamento
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS funcionarios_clt (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id      UUID NOT NULL REFERENCES unidades(id),
  nome            VARCHAR(100) NOT NULL,
  cpf             VARCHAR(14) NOT NULL UNIQUE,
  cargo           VARCHAR(100) NOT NULL,
  salario_base    NUMERIC(12,2) NOT NULL CHECK (salario_base >= 0.01),
  data_admissao   DATE NOT NULL,
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  dependentes     INTEGER NOT NULL DEFAULT 0 CHECK (dependentes >= 0),
  vale_transporte BOOLEAN NOT NULL DEFAULT TRUE,
  vale_alimentacao NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (vale_alimentacao >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_func_clt_updated BEFORE UPDATE ON funcionarios_clt
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_func_clt_unidade ON funcionarios_clt (unidade_id);

CREATE TABLE IF NOT EXISTS funcionarios_pj (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id    UUID NOT NULL REFERENCES unidades(id),
  nome          VARCHAR(100) NOT NULL,
  cnpj          VARCHAR(18) NOT NULL UNIQUE,
  razao_social  VARCHAR(150) NOT NULL,
  servico       VARCHAR(100) NOT NULL,
  valor_hora    NUMERIC(10,2) NOT NULL CHECK (valor_hora >= 0.01),
  data_inicio   DATE NOT NULL,
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_func_pj_updated BEFORE UPDATE ON funcionarios_pj
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_func_pj_unidade ON funcionarios_pj (unidade_id);

CREATE TABLE IF NOT EXISTS folhas_clt (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id    UUID NOT NULL REFERENCES funcionarios_clt(id),
  mes_referencia    VARCHAR(7) NOT NULL,
  salario_base      NUMERIC(12,2) NOT NULL,
  horas_extras      NUMERIC(10,2) NOT NULL DEFAULT 0,
  adicional_noturno NUMERIC(10,2) NOT NULL DEFAULT 0,
  outros_proventos  NUMERIC(10,2) NOT NULL DEFAULT 0,
  vale_transporte   NUMERIC(10,2) NOT NULL DEFAULT 0,
  vale_alimentacao  NUMERIC(10,2) NOT NULL DEFAULT 0,
  inss              NUMERIC(10,2) NOT NULL DEFAULT 0,
  fgts              NUMERIC(10,2) NOT NULL DEFAULT 0,
  irrf              NUMERIC(10,2) NOT NULL DEFAULT 0,
  outros_descontos  NUMERIC(10,2) NOT NULL DEFAULT 0,
  salario_liquido   NUMERIC(12,2) NOT NULL DEFAULT 0,
  data_pagamento    DATE,
  status            folha_status NOT NULL DEFAULT 'pendente',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_folha_clt_mes UNIQUE (funcionario_id, mes_referencia)
);
CREATE TRIGGER trg_folha_clt_updated BEFORE UPDATE ON folhas_clt
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_folha_clt_func ON folhas_clt (funcionario_id);
CREATE INDEX IF NOT EXISTS idx_folha_clt_mes  ON folhas_clt (mes_referencia);

CREATE TABLE IF NOT EXISTS folhas_pj (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id     UUID NOT NULL REFERENCES funcionarios_pj(id),
  mes_referencia     VARCHAR(7) NOT NULL,
  horas_trabalhadas  NUMERIC(10,2) NOT NULL CHECK (horas_trabalhadas >= 0),
  valor_hora         NUMERIC(10,2) NOT NULL CHECK (valor_hora >= 0.01),
  valor_total        NUMERIC(12,2) NOT NULL DEFAULT 0,
  retencao_iss       NUMERIC(10,2) NOT NULL DEFAULT 0,
  retencao_ir        NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_liquido      NUMERIC(12,2) NOT NULL DEFAULT 0,
  data_pagamento     DATE,
  status             folha_status NOT NULL DEFAULT 'pendente',
  descricao_servicos VARCHAR(500),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_folha_pj_mes UNIQUE (funcionario_id, mes_referencia)
);
CREATE TRIGGER trg_folha_pj_updated BEFORE UPDATE ON folhas_pj
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_folha_pj_func ON folhas_pj (funcionario_id);
CREATE INDEX IF NOT EXISTS idx_folha_pj_mes  ON folhas_pj (mes_referencia);

-- ────────────────────────────────────────────────────────────────────────────