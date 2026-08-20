DO $$ BEGIN CREATE TYPE conta_natureza AS ENUM ('Devedora','Credora'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE conta_tipo AS ENUM ('Sintética','Analítica'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Migration 000013b_contabil

-- 17. TABELAS — Contabilidade
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contas_contabeis (
  codigo   VARCHAR(20) PRIMARY KEY,
  nome     VARCHAR(200) NOT NULL,
  tipo     conta_tipo NOT NULL,
  natureza conta_natureza NOT NULL,
  pai      VARCHAR(20) REFERENCES contas_contabeis(codigo)
);
CREATE INDEX IF NOT EXISTS idx_contas_pai ON contas_contabeis (pai) WHERE pai IS NOT NULL;

CREATE TABLE IF NOT EXISTS lancamentos_contabeis (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data            DATE NOT NULL,
  conta_codigo    VARCHAR(20) NOT NULL REFERENCES contas_contabeis(codigo),
  conta_nome      VARCHAR(200) NOT NULL,
  debito          NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (debito >= 0),
  credito         NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (credito >= 0),
  historico       TEXT NOT NULL,
  centro_custo    VARCHAR(100),
  unidade_id      UUID REFERENCES unidades(id),
  profissional_id UUID REFERENCES profissionais(id),
  convenio        VARCHAR(200),
  documento       VARCHAR(100),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_lanc_contabil_valor CHECK (debito > 0 OR credito > 0)
);
CREATE INDEX IF NOT EXISTS idx_lanc_contabil_data  ON lancamentos_contabeis (data);
CREATE INDEX IF NOT EXISTS idx_lanc_contabil_conta ON lancamentos_contabeis (conta_codigo);
CREATE INDEX IF NOT EXISTS idx_lanc_contabil_prof  ON lancamentos_contabeis (profissional_id) WHERE profissional_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lanc_contabil_unidade ON lancamentos_contabeis (unidade_id) WHERE unidade_id IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────