-- Migration 000006_tratamentos

DO $$ BEGIN CREATE TYPE diretriz_protocolar AS ENUM ('Protocolo Clinico','Diretriz interna','Off-label justificado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE via_administracao AS ENUM ('VO','IV','IM','SC','SL','Topica','Inalatoria','Retal','Ocular','Nasal'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE dose_unidade AS ENUM ('mg','g','mcg','UI','mL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE duracao_unidade AS ENUM ('dias','semanas','meses'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE tratamento_status AS ENUM ('Ativo','Inativo'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE tipo_cobranca AS ENUM ('Por sessao','Pacote','Mensal'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. TABELAS — Tratamentos e Preços
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tratamentos (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_tratamento          VARCHAR(300) NOT NULL,
  objetivo_terapeutico     TEXT NOT NULL,
  diretriz_protocolar      diretriz_protocolar NOT NULL,
  codigos_referencia       TEXT[],
  regra_ajuste             TEXT,
  indicacoes               TEXT,
  contraindicacoes         TEXT,
  interacoes_relevantes    TEXT,
  monitorizacao            TEXT,
  eventos_adversos         TEXT,
  necessidade_consentimento BOOLEAN NOT NULL DEFAULT FALSE,
  texto_consentimento      TEXT,
  status                   tratamento_status NOT NULL DEFAULT 'Ativo',
  versao                   INTEGER NOT NULL DEFAULT 1 CHECK (versao >= 1),
  anexos                   TEXT[],
  tags                     TEXT[],
  observacoes              TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_tratamentos_updated BEFORE UPDATE ON tratamentos
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_tratamentos_status ON tratamentos (status);

-- Itens do regime terapêutico (1:N)
CREATE TABLE IF NOT EXISTS tratamento_itens_regime (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tratamento_id   UUID NOT NULL REFERENCES tratamentos(id) ON DELETE CASCADE,
  medicamento     VARCHAR(300) NOT NULL,
  via             via_administracao NOT NULL,
  dose            NUMERIC(10,4) NOT NULL CHECK (dose > 0),
  dose_unidade    dose_unidade NOT NULL,
  frequencia      VARCHAR(200) NOT NULL,
  horario         VARCHAR(20),
  duracao         INTEGER CHECK (duracao >= 0),
  duracao_unidade duracao_unidade,
  orientacoes     TEXT
);
CREATE INDEX IF NOT EXISTS idx_trat_itens_trat ON tratamento_itens_regime (tratamento_id);

-- Preços por tratamento/profissional
CREATE TABLE IF NOT EXISTS precos_tratamento (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id       UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  tratamento            VARCHAR(300) NOT NULL,
  preco_base            NUMERIC(12,2) NOT NULL CHECK (preco_base > 0),
  moeda                 VARCHAR(3) NOT NULL DEFAULT 'BRL',
  tipo_cobranca         tipo_cobranca NOT NULL,
  qtd_inclusa           INTEGER,
  preco_promocional     NUMERIC(12,2) CHECK (preco_promocional IS NULL OR preco_promocional <= preco_base),
  vigencia_inicio       DATE NOT NULL,
  vigencia_fim          DATE,
  politica_cancelamento TEXT,
  observacoes           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_vigencia CHECK (vigencia_fim IS NULL OR vigencia_fim >= vigencia_inicio)
);
CREATE TRIGGER trg_precos_updated BEFORE UPDATE ON precos_tratamento
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_precos_prof ON precos_tratamento (profissional_id);
CREATE INDEX IF NOT EXISTS idx_precos_vigencia ON precos_tratamento (vigencia_inicio, vigencia_fim);

-- ────────────────────────────────────────────────────────────────────────────