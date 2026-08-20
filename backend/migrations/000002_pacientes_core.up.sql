-- Pacientes core: enums, unidades, pacientes, paciente_unidades (clínica pediátrica multi-filial)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE sexo_biologico AS ENUM ('masculino','feminino','intersexo');
CREATE TYPE tipo_sanguineo AS ENUM ('A+','A-','B+','B-','AB+','AB-','O+','O-','Desconhecido');
CREATE TYPE paciente_status AS ENUM ('ativo','inativo','falecido');
CREATE TYPE unidade_status AS ENUM ('ativa','inativa');

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE unidades (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       VARCHAR(200) NOT NULL,
  slug       VARCHAR(100) NOT NULL UNIQUE,
  status     unidade_status NOT NULL DEFAULT 'ativa',
  endereco   TEXT,
  telefone   VARCHAR(30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER trg_unidades_updated BEFORE UPDATE ON unidades
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE pacientes (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo             VARCHAR(300) NOT NULL,
  nome_social               VARCHAR(300),
  data_nascimento           DATE NOT NULL,
  sexo_biologico            sexo_biologico NOT NULL,
  cpf                       VARCHAR(14),
  rg_numero                 VARCHAR(30),
  rg_orgao                  VARCHAR(30),
  foto                      TEXT,
  tel_principal             VARCHAR(30) NOT NULL,
  tel_secundario            VARCHAR(30),
  email                     VARCHAR(320),
  endereco                  TEXT,
  numero                    VARCHAR(20),
  complemento               VARCHAR(100),
  bairro                    VARCHAR(100),
  cidade                    VARCHAR(100),
  uf                        CHAR(2) NOT NULL,
  cep                       VARCHAR(10) NOT NULL,
  responsavel_nome          VARCHAR(200) NOT NULL,
  responsavel_cpf           VARCHAR(14),
  responsavel_parentesco    VARCHAR(50),
  responsavel_tel           VARCHAR(30),
  responsavel_email         VARCHAR(320),
  contato_emergencia_nome   VARCHAR(200),
  contato_emergencia_tel    VARCHAR(30),
  pessoas_autorizadas_busca TEXT[],
  escola                    VARCHAR(200),
  serie_ano                 VARCHAR(50),
  necessidades_especiais    TEXT,
  pediatra_referencia       VARCHAR(200),
  altura                    NUMERIC(5,2) CHECK (altura > 0),
  peso                      NUMERIC(6,2) CHECK (peso > 0),
  tipo_sanguineo            tipo_sanguineo,
  alergias                  TEXT,
  doencas_cronicas          TEXT,
  medicacoes_continuo       TEXT,
  cirurgias_previas         TEXT,
  historico_familiar        TEXT,
  vacinas                   JSONB DEFAULT '[]',
  observacoes               TEXT,
  atividade_fisica_frequencia VARCHAR(100),
  atividade_fisica_tipo     VARCHAR(200),
  alimentacao               TEXT,
  sono_horas                SMALLINT CHECK (sono_horas BETWEEN 0 AND 24),
  data_cadastro             TIMESTAMPTZ DEFAULT NOW(),
  profissional_responsavel  UUID,
  status                    paciente_status NOT NULL DEFAULT 'ativo',
  consentimento_lgpd        BOOLEAN NOT NULL DEFAULT FALSE,
  autorizacao_uso_imagem    BOOLEAN NOT NULL DEFAULT FALSE,
  assinatura_digital        TEXT,
  documentos_anexos         JSONB DEFAULT '[]',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                TIMESTAMPTZ,
  CONSTRAINT ck_paciente_data_nascimento CHECK (
    data_nascimento <= CURRENT_DATE
    AND data_nascimento >= CURRENT_DATE - INTERVAL '25 years'
  )
);
CREATE TRIGGER trg_pacientes_updated BEFORE UPDATE ON pacientes
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE UNIQUE INDEX uq_pacientes_cpf ON pacientes (cpf) WHERE cpf IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_pacientes_nome ON pacientes (nome_completo) WHERE deleted_at IS NULL;
CREATE INDEX idx_pacientes_status ON pacientes (status) WHERE deleted_at IS NULL;

CREATE TABLE paciente_unidades (
  paciente_id   UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  unidade_id    UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  principal     BOOLEAN NOT NULL DEFAULT FALSE,
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  vinculado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (paciente_id, unidade_id)
);
CREATE INDEX idx_pac_unidades_unidade ON paciente_unidades (unidade_id) WHERE ativo = TRUE;

-- Seed dev (slugs alinhados ao frontend Lovable)
INSERT INTO unidades (id, nome, slug, status) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Duque de Caxias', 'unidade-duque-caxias', 'ativa'),
  ('a0000000-0000-4000-8000-000000000002', 'Tijuca', 'unidade-tijuca', 'ativa')
ON CONFLICT (slug) DO NOTHING;
