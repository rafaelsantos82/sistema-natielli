-- Migration 000004_profissionais

DO $$ BEGIN
  CREATE TYPE profissional_status AS ENUM ('ativo','inativo','suspenso');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE conselho_tipo      AS ENUM ('CRP','CRM','CREFITO','COREN','CRN','CREFONO','CRO','CRBM','OUTRO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE documento_categoria AS ENUM ('documento_pessoal','registro_profissional','comprovante','contrato','outro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE modalidade_atendimento AS ENUM ('Presencial','Tele');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE dia_semana         AS ENUM ('dom','seg','ter','qua','qui','sex','sab');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. TABELAS — Pessoas: Profissionais
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profissionais (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                    VARCHAR(300) NOT NULL,
  cpf                     VARCHAR(14),
  rg                      VARCHAR(30),
  data_nascimento         DATE,
  email                   VARCHAR(320) NOT NULL,
  telefone                VARCHAR(30),
  celular                 VARCHAR(30),
  conselho                conselho_tipo,
  numero_registro         VARCHAR(50),
  uf_registro             CHAR(2),
  foto                    TEXT,

  -- Endereço
  cep                     VARCHAR(10),
  logradouro              TEXT,
  numero                  VARCHAR(20),
  complemento             VARCHAR(100),
  bairro                  VARCHAR(100),
  cidade                  VARCHAR(100),
  uf                      CHAR(2),

  -- Atendimento
  modalidades_atendimento modalidade_atendimento[],
  locais_atendimento      TEXT[],
  duracao_padrao_sessao   INTEGER CHECK (duracao_padrao_sessao >= 15),
  dias_atendimento        dia_semana[],
  janelas_horarias        JSONB DEFAULT '[]',
  horario_inicio          TIME,
  horario_fim             TIME,
  duracao_consulta        INTEGER CHECK (duracao_consulta >= 15),

  -- LGPD
  consentimento_lgpd      BOOLEAN DEFAULT FALSE,
  data_consentimento      TIMESTAMPTZ,
  compartilhamento_dados  BOOLEAN DEFAULT FALSE,
  finalidade_dados        TEXT,

  -- Administrativo
  status                  profissional_status NOT NULL DEFAULT 'ativo',
  observacoes             TEXT,
  dados_complementares    JSONB,
  anexos_contratuais      TEXT[],

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ,

  CONSTRAINT uq_prof_email UNIQUE (email)
);
CREATE TRIGGER trg_profissionais_updated BEFORE UPDATE ON profissionais
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_prof_nome   ON profissionais (nome) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_prof_status ON profissionais (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_prof_email  ON profissionais (email) WHERE deleted_at IS NULL;

-- M:N — profissional x unidade
CREATE TABLE IF NOT EXISTS profissional_unidades (
  profissional_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  unidade_id      UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  PRIMARY KEY (profissional_id, unidade_id)
);

-- Especialidades normalizadas (1:N simples, valores texto livres no frontend)
CREATE TABLE IF NOT EXISTS profissional_especialidades (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  especialidade   VARCHAR(200) NOT NULL,
  CONSTRAINT uq_prof_espec UNIQUE (profissional_id, especialidade)
);
CREATE INDEX IF NOT EXISTS idx_prof_espec_prof ON profissional_especialidades (profissional_id);

-- Conselhos profissionais (múltiplos registros por profissional)
CREATE TABLE IF NOT EXISTS profissional_conselhos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  tipo            conselho_tipo NOT NULL,
  numero          VARCHAR(50) NOT NULL,
  uf              CHAR(2) NOT NULL,
  validade        DATE,
  principal       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);
CREATE TRIGGER trg_prof_conselhos_updated BEFORE UPDATE ON profissional_conselhos
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_prof_conselhos_prof ON profissional_conselhos (profissional_id) WHERE deleted_at IS NULL;

-- Documentos do profissional (upload, versionamento via substitui)
CREATE TABLE IF NOT EXISTS profissional_documentos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  categoria       documento_categoria NOT NULL,
  obrigatorio     BOOLEAN NOT NULL DEFAULT FALSE,
  nome_arquivo    VARCHAR(500) NOT NULL,
  mime_type       VARCHAR(100) NOT NULL,
  tamanho_bytes   BIGINT NOT NULL CHECK (tamanho_bytes > 0),
  url             TEXT NOT NULL,
  versao          INTEGER NOT NULL DEFAULT 1 CHECK (versao >= 1),
  substitui       UUID REFERENCES profissional_documentos(id),
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by     UUID NOT NULL REFERENCES users(id),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_prof_docs_prof ON profissional_documentos (profissional_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_prof_docs_cat  ON profissional_documentos (profissional_id, categoria) WHERE deleted_at IS NULL;

-- ────────────────────────────────────────────────────────────────────────────