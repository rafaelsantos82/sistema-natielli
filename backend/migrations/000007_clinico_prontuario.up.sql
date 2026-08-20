-- Migration 000007_clinico_prontuario

-- Clínico
DO $$ BEGIN
  CREATE TYPE anamnese_status        AS ENUM ('Ativa','Inativa');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE question_type          AS ENUM ('boolean','string','text','integer','decimal','choice','date');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- 8. TABELAS — Clínico / Prontuário
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS evolucoes (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consulta_id             UUID NOT NULL REFERENCES consultas(id),
  paciente_id             UUID NOT NULL REFERENCES pacientes(id),
  data                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  queixa_principal        TEXT NOT NULL,
  historia_doenca         TEXT NOT NULL,
  exame_fisico            TEXT NOT NULL,
  hipotese_diagnostica    TEXT NOT NULL,
  conduta                 TEXT NOT NULL,
  observacoes             TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_evolucoes_consulta  ON evolucoes (consulta_id);
CREATE INDEX IF NOT EXISTS idx_evolucoes_paciente  ON evolucoes (paciente_id, data DESC);

CREATE TABLE IF NOT EXISTS prescricoes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consulta_id   UUID NOT NULL REFERENCES consultas(id),
  paciente_id   UUID NOT NULL REFERENCES pacientes(id),
  data          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  medicamento   VARCHAR(300) NOT NULL,
  dosagem       VARCHAR(200) NOT NULL,
  frequencia    VARCHAR(200) NOT NULL,
  duracao       VARCHAR(200) NOT NULL,
  orientacoes   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prescricoes_consulta ON prescricoes (consulta_id);
CREATE INDEX IF NOT EXISTS idx_prescricoes_paciente ON prescricoes (paciente_id, data DESC);

CREATE TABLE IF NOT EXISTS atestados (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consulta_id       UUID NOT NULL REFERENCES consultas(id),
  paciente_id       UUID NOT NULL REFERENCES pacientes(id),
  data              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cid               VARCHAR(20) NOT NULL,
  dias_afastamento  INTEGER NOT NULL CHECK (dias_afastamento > 0),
  data_inicio       DATE NOT NULL,
  data_fim          DATE NOT NULL,
  observacoes       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_atestado_datas CHECK (data_fim >= data_inicio)
);
CREATE INDEX IF NOT EXISTS idx_atestados_consulta ON atestados (consulta_id);
CREATE INDEX IF NOT EXISTS idx_atestados_paciente ON atestados (paciente_id);

CREATE TABLE IF NOT EXISTS prontuario_documentos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consulta_id   UUID NOT NULL REFERENCES consultas(id),
  paciente_id   UUID NOT NULL REFERENCES pacientes(id),
  nome          VARCHAR(500) NOT NULL,
  tipo          VARCHAR(100) NOT NULL,
  tamanho       BIGINT NOT NULL CHECK (tamanho > 0),
  data_upload   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  url           TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pront_docs_paciente ON prontuario_documentos (paciente_id);
CREATE INDEX IF NOT EXISTS idx_pront_docs_consulta ON prontuario_documentos (consulta_id);

-- ────────────────────────────────────────────────────────────────────────────