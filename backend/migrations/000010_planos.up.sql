DO $$ BEGIN CREATE TYPE acao_judicial_status AS ENUM ('Em Andamento','Procedente','Improcedente','Acordo'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE nota_fiscal_status AS ENUM ('Pendente','Pago Parcial','Pago','Em Disputa'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Migration 000009_planos_juridico_nf

-- 12. TABELAS — Planos de Saúde e Jurídico
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS planos_saude (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          VARCHAR(200) NOT NULL,
  cnpj          VARCHAR(18) NOT NULL,
  registro_ans  VARCHAR(50) NOT NULL,
  telefone      VARCHAR(20) NOT NULL,
  email         VARCHAR(200) NOT NULL,
  endereco      VARCHAR(500) NOT NULL,
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  observacoes   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_planos_updated BEFORE UPDATE ON planos_saude
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_planos_ativo ON planos_saude (ativo);

CREATE TABLE IF NOT EXISTS acoes_judiciais (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_processo   VARCHAR(100) NOT NULL,
  plano_saude_id    UUID NOT NULL REFERENCES planos_saude(id),
  plano_saude_nome  VARCHAR(200) NOT NULL,
  valor_acao        NUMERIC(14,2) NOT NULL CHECK (valor_acao > 0),
  data_entrada      DATE NOT NULL,
  data_sentenca     DATE,
  status            acao_judicial_status NOT NULL DEFAULT 'Em Andamento',
  descricao         TEXT NOT NULL,
  observacoes       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_acoes_updated BEFORE UPDATE ON acoes_judiciais
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_acoes_plano  ON acoes_judiciais (plano_saude_id);
CREATE INDEX IF NOT EXISTS idx_acoes_status ON acoes_judiciais (status);

CREATE TABLE IF NOT EXISTS notas_fiscais (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_nota       VARCHAR(100) NOT NULL,
  plano_saude_id    UUID NOT NULL REFERENCES planos_saude(id),
  plano_saude_nome  VARCHAR(200) NOT NULL,
  paciente_nome     VARCHAR(300) NOT NULL,
  data_emissao      DATE NOT NULL,
  data_vencimento   DATE NOT NULL,
  valor_servico     NUMERIC(14,2) NOT NULL CHECK (valor_servico > 0),
  valor_pago        NUMERIC(14,2),
  status            nota_fiscal_status NOT NULL DEFAULT 'Pendente',
  acao_judicial_id  UUID REFERENCES acoes_judiciais(id),
  observacoes       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_nf_updated BEFORE UPDATE ON notas_fiscais
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_nf_plano     ON notas_fiscais (plano_saude_id);
CREATE INDEX IF NOT EXISTS idx_nf_status    ON notas_fiscais (status);
CREATE INDEX IF NOT EXISTS idx_nf_venc      ON notas_fiscais (data_vencimento);

-- ────────────────────────────────────────────────────────────────────────────