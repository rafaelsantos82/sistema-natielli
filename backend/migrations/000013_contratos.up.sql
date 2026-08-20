DO $$ BEGIN CREATE TYPE contrato_status AS ENUM ('Rascunho','Aguardando Assinatura','Assinado','Recusado','Expirado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE contrato_tipo AS ENUM ('Atendimento','Prestação de Serviço','Termo de Responsabilidade','Outros'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE signatario_status AS ENUM ('Pendente','Visualizado','Assinado','Recusado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE signatario_tipo AS ENUM ('Paciente','Responsável Legal','Profissional','Testemunha'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE solicitacao_status AS ENUM ('Preparando','Enviado','Em Andamento','Concluído','Recusado','Expirado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Migration 000012_contratos

-- 15. TABELAS — Contratos
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contratos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo            VARCHAR(200) NOT NULL,
  tipo              contrato_tipo NOT NULL,
  paciente_id       UUID REFERENCES pacientes(id),
  paciente_nome     VARCHAR(300),
  profissional_id   UUID REFERENCES profissionais(id),
  profissional_nome VARCHAR(300),
  conteudo          TEXT NOT NULL,
  status            contrato_status NOT NULL DEFAULT 'Rascunho',
  criado_por        UUID NOT NULL REFERENCES users(id),
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contratos_paciente ON contratos (paciente_id) WHERE paciente_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contratos_prof     ON contratos (profissional_id) WHERE profissional_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contratos_status   ON contratos (status);

-- Trigger para atualizado_em (contratos e solicitações usam esse padrão)
CREATE OR REPLACE FUNCTION fn_set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_contratos_updated BEFORE UPDATE ON contratos
  FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();

CREATE TABLE IF NOT EXISTS contrato_anexos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  nome        VARCHAR(500) NOT NULL,
  url         TEXT NOT NULL,
  tipo        VARCHAR(100) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contrato_anexos ON contrato_anexos (contrato_id);

CREATE TABLE IF NOT EXISTS compartilhamentos_contrato (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id      UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  contrato_titulo  VARCHAR(200) NOT NULL,
  token            VARCHAR(128) NOT NULL UNIQUE,
  expira_em        TIMESTAMPTZ NOT NULL,
  pode_visualizar  BOOLEAN NOT NULL DEFAULT TRUE,
  pode_baixar      BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comp_contrato ON compartilhamentos_contrato (contrato_id);
CREATE INDEX IF NOT EXISTS idx_comp_token    ON compartilhamentos_contrato (token);

CREATE TABLE IF NOT EXISTS compartilhamento_acessos (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compartilhamento_id    UUID NOT NULL REFERENCES compartilhamentos_contrato(id) ON DELETE CASCADE,
  data_hora              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip                     INET
);
CREATE INDEX IF NOT EXISTS idx_comp_acessos ON compartilhamento_acessos (compartilhamento_id);

CREATE TABLE IF NOT EXISTS solicitacoes_assinatura (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id             UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  contrato_titulo         VARCHAR(200) NOT NULL,
  envelope_id             VARCHAR(200),
  status                  solicitacao_status NOT NULL DEFAULT 'Preparando',
  mensagem_personalizada  TEXT,
  expira_em               TIMESTAMPTZ,
  webhook_url             TEXT,
  criado_em               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_solic_updated BEFORE UPDATE ON solicitacoes_assinatura
  FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();
CREATE INDEX IF NOT EXISTS idx_solic_contrato ON solicitacoes_assinatura (contrato_id);

CREATE TABLE IF NOT EXISTS signatarios (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id      UUID NOT NULL REFERENCES solicitacoes_assinatura(id) ON DELETE CASCADE,
  nome                VARCHAR(200) NOT NULL,
  email               VARCHAR(320) NOT NULL,
  tipo                signatario_tipo NOT NULL,
  cpf                 VARCHAR(14),
  parentesco          VARCHAR(100),
  ordem               INTEGER NOT NULL,
  status              signatario_status NOT NULL DEFAULT 'Pendente',
  assinado_em         TIMESTAMPTZ,
  ip                  INET,
  observacoes         TEXT
);
CREATE INDEX IF NOT EXISTS idx_signatarios_solic ON signatarios (solicitacao_id);

-- ────────────────────────────────────────────────────────────────────────────