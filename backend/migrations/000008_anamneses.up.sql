DO $$ BEGIN CREATE TYPE anamnese_status AS ENUM ('Ativa','Inativa'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Migration 000008_anamneses

DO $$ BEGIN CREATE TYPE termo_tipo AS ENUM ('Atendimento','Dados_LGPD','Imagem','Pesquisa'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE carimbo_tipo AS ENUM ('inicio','fim'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 9. TABELAS — Anamneses
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS anamneses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome           VARCHAR(200) NOT NULL,
  especialidade  VARCHAR(200) NOT NULL,
  versao         VARCHAR(20) NOT NULL,
  status         anamnese_status NOT NULL DEFAULT 'Ativa',
  questionnaire  JSONB NOT NULL DEFAULT '[]',
  observacoes    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_anamneses_updated BEFORE UPDATE ON anamneses
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_anamneses_espec ON anamneses (especialidade);
CREATE INDEX IF NOT EXISTS idx_anamneses_status ON anamneses (status);

CREATE TABLE IF NOT EXISTS respostas_anamnese (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id    UUID NOT NULL REFERENCES anamneses(id),
  questionnaire_nome  VARCHAR(200) NOT NULL,
  patient_id          UUID NOT NULL REFERENCES pacientes(id),
  patient_nome        VARCHAR(300) NOT NULL,
  encounter_id        UUID REFERENCES consultas(id),
  respostas           JSONB NOT NULL DEFAULT '{}',
  data_hora           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_resp_anam_quest   ON respostas_anamnese (questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_resp_anam_patient ON respostas_anamnese (patient_id);
CREATE INDEX IF NOT EXISTS idx_resp_anam_enc     ON respostas_anamnese (encounter_id) WHERE encounter_id IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 10. TABELAS — Consentimento e LGPD
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS termos_consentimento (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo       termo_tipo NOT NULL,
  titulo     VARCHAR(300) NOT NULL,
  versao     VARCHAR(20) NOT NULL,
  texto      TEXT NOT NULL,
  ativo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_termos_updated BEFORE UPDATE ON termos_consentimento
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_termos_tipo ON termos_consentimento (tipo, ativo);

CREATE TABLE IF NOT EXISTS registros_consentimento (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id        UUID NOT NULL REFERENCES pacientes(id),
  paciente_nome      VARCHAR(300) NOT NULL,
  termo_id           UUID NOT NULL REFERENCES termos_consentimento(id),
  termo_versao       VARCHAR(20) NOT NULL,
  tipo               VARCHAR(50) NOT NULL,
  aceito             BOOLEAN NOT NULL,
  aceito_em          TIMESTAMPTZ NOT NULL,
  ip_address         INET,
  user_agent         TEXT,
  responsavel_legal  JSONB,
  revogado           BOOLEAN DEFAULT FALSE,
  revogado_em        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reg_consent_paciente ON registros_consentimento (paciente_id);
CREATE INDEX IF NOT EXISTS idx_reg_consent_termo    ON registros_consentimento (termo_id);

CREATE TABLE IF NOT EXISTS carimbos_atendimento (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atendimento_id    UUID NOT NULL REFERENCES consultas(id),
  paciente_id       UUID NOT NULL REFERENCES pacientes(id),
  paciente_nome     VARCHAR(300) NOT NULL,
  profissional_id   UUID NOT NULL REFERENCES profissionais(id),
  profissional_nome VARCHAR(300) NOT NULL,
  tipo              carimbo_tipo NOT NULL,
  timestamp         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hash              VARCHAR(128),
  observacoes       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_carimbos_atend ON carimbos_atendimento (atendimento_id);
CREATE INDEX IF NOT EXISTS idx_carimbos_pac   ON carimbos_atendimento (paciente_id);

-- ────────────────────────────────────────────────────────────────────────────