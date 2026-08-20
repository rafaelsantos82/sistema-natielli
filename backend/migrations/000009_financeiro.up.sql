-- Migration 000008_financeiro

-- Financeiro
DO $$ BEGIN
  CREATE TYPE categoria_tipo     AS ENUM ('Receita','Despesa');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE forma_pagamento    AS ENUM ('Dinheiro','PIX','Cartão Débito','Cartão Crédito','Transferência','Boleto','Outro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE lancamento_status  AS ENUM ('Pendente','Pago','Vencido','Cancelado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE frequencia_recorrencia AS ENUM ('Mensal','Trimestral','Semestral','Anual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- 11. TABELAS — Financeiro
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS categorias_financeiras (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       VARCHAR(100) NOT NULL,
  tipo       categoria_tipo NOT NULL,
  cor        VARCHAR(20),
  descricao  VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_cat_fin_updated BEFORE UPDATE ON categorias_financeiras
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_cat_fin_tipo ON categorias_financeiras (tipo);

CREATE TABLE IF NOT EXISTS centros_custo (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo     VARCHAR(20) NOT NULL UNIQUE,
  nome       VARCHAR(100) NOT NULL,
  descricao  VARCHAR(500),
  ativo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_cc_updated BEFORE UPDATE ON centros_custo
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS lancamentos (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo                    categoria_tipo NOT NULL,
  descricao               VARCHAR(500) NOT NULL,
  valor                   NUMERIC(14,2) NOT NULL CHECK (valor > 0),
  data_vencimento         DATE NOT NULL,
  data_pagamento          DATE,
  categoria_id            UUID NOT NULL REFERENCES categorias_financeiras(id),
  categoria_nome          VARCHAR(100) NOT NULL,
  centro_custo_id         UUID REFERENCES centros_custo(id),
  centro_custo_nome       VARCHAR(100),
  forma_pagamento         forma_pagamento,
  documento               VARCHAR(100),
  observacoes             TEXT,
  status                  lancamento_status NOT NULL DEFAULT 'Pendente',
  recorrente              BOOLEAN NOT NULL DEFAULT FALSE,
  frequencia_recorrencia  frequencia_recorrencia,
  parcelas                INTEGER CHECK (parcelas >= 1),
  parcela_atual           INTEGER,
  anexo_url               TEXT,
  conciliado              BOOLEAN NOT NULL DEFAULT FALSE,
  data_conciliacao        DATE,
  unidade_id              UUID REFERENCES unidades(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_lancamentos_updated BEFORE UPDATE ON lancamentos
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_lanc_vencimento ON lancamentos (data_vencimento, status);
CREATE INDEX IF NOT EXISTS idx_lanc_categoria  ON lancamentos (categoria_id);
CREATE INDEX IF NOT EXISTS idx_lanc_cc         ON lancamentos (centro_custo_id) WHERE centro_custo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lanc_unidade    ON lancamentos (unidade_id) WHERE unidade_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lanc_tipo       ON lancamentos (tipo);
CREATE INDEX IF NOT EXISTS idx_lanc_conciliado ON lancamentos (conciliado) WHERE conciliado = FALSE;

-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS relatorios_operacionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(50) NOT NULL,
  paciente_nome VARCHAR(300) NOT NULL,
  profissional_nome VARCHAR(300) NOT NULL,
  tratamento VARCHAR(300) NOT NULL,
  periodo VARCHAR(20) NOT NULL,
  valor NUMERIC(14,2) NOT NULL CHECK (valor >= 0),
  status VARCHAR(50) NOT NULL DEFAULT 'rascunho',
  unidade_id UUID REFERENCES unidades(id),
  data_submissao DATE,
  data_aprovacao DATE,
  aprovado_por VARCHAR(200),
  observacoes TEXT,
  historico_versoes JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_relatorios_updated ON relatorios_operacionais;
CREATE TRIGGER trg_relatorios_updated BEFORE UPDATE ON relatorios_operacionais
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
