DO $$ BEGIN CREATE TYPE manual_status AS ENUM ('Rascunho','Publicado','Arquivado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE material_status AS ENUM ('Rascunho','Aprovado','Publicado','Arquivado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE publico_alvo AS ENUM ('Interno','Externo','Ambos'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Migration 000013_marketing_contabil

-- 16. TABELAS — Marketing
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS manuais (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo        VARCHAR(200) NOT NULL,
  versao        VARCHAR(20) NOT NULL,
  publico_alvo  publico_alvo NOT NULL,
  arquivo_url   TEXT NOT NULL,
  arquivo_nome  VARCHAR(500) NOT NULL,
  tags          TEXT[] DEFAULT '{}',
  status        manual_status NOT NULL DEFAULT 'Rascunho',
  observacoes   TEXT,
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_manuais_updated BEFORE UPDATE ON manuais
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_manuais_status ON manuais (status);

CREATE TABLE IF NOT EXISTS materiais_marketing (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo        VARCHAR(200) NOT NULL,
  tipo          VARCHAR(100) NOT NULL,
  arquivo_url   TEXT NOT NULL,
  arquivo_nome  VARCHAR(500) NOT NULL,
  tags          TEXT[] DEFAULT '{}',
  campanha      VARCHAR(100),
  unidade_id    UUID REFERENCES unidades(id),
  status        material_status NOT NULL DEFAULT 'Rascunho',
  observacoes   TEXT,
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_materiais_updated BEFORE UPDATE ON materiais_marketing
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_materiais_status ON materiais_marketing (status);
CREATE INDEX IF NOT EXISTS idx_materiais_unidade ON materiais_marketing (unidade_id) WHERE unidade_id IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────