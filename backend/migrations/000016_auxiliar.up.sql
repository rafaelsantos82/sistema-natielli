DO $$ BEGIN CREATE TYPE audit_acao AS ENUM ('documento.upload','documento.exclusao','documento.visualizacao','documento.download',
  'agenda.alteracao','agenda.bloqueio',
  'atendimento.aprovacao','atendimento.rejeicao','atendimento.vinculo_prontuario',
  'evolucao.criacao','evolucao.edicao',
  'profissional.criacao','profissional.edicao','profissional.exclusao'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE notificacao_agenda_tipo AS ENUM ('alteracao_disponibilidade','cancelamento','bloqueio_manual'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE notificacao_status AS ENUM ('pendente','enviado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Migration 000014_auxiliar

-- 18. TABELAS — Notificações de Agenda
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notificacoes_agenda (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo              notificacao_agenda_tipo NOT NULL,
  profissional_id   UUID NOT NULL REFERENCES profissionais(id),
  profissional_nome VARCHAR(300),
  payload           JSONB NOT NULL DEFAULT '{}',
  status            notificacao_status NOT NULL DEFAULT 'pendente',
  canal             VARCHAR(20) NOT NULL DEFAULT 'email',
  destinatario      VARCHAR(320) NOT NULL,
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  enviado_em        TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_notif_agenda_prof   ON notificacoes_agenda (profissional_id);
CREATE INDEX IF NOT EXISTS idx_notif_agenda_status ON notificacoes_agenda (status);

-- ────────────────────────────────────────────────────────────────────────────
-- 19. TABELAS — Aniversariantes
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aniversariantes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome             VARCHAR(300) NOT NULL,
  tipo             VARCHAR(20) NOT NULL CHECK (tipo IN ('Paciente','Colaborador')),
  data_nascimento  DATE NOT NULL,
  foto_url         TEXT,
  telefone         VARCHAR(30),
  email            VARCHAR(320),
  unidade_id       UUID REFERENCES unidades(id)
);
CREATE INDEX IF NOT EXISTS idx_aniversariantes_unidade ON aniversariantes (unidade_id) WHERE unidade_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_aniv_nascimento ON aniversariantes (
  EXTRACT(MONTH FROM data_nascimento),
  EXTRACT(DAY FROM data_nascimento)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 20. TABELAS — Assinatura Digital (documentos assinados)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS documentos_assinados (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               VARCHAR(500) NOT NULL,
  type               VARCHAR(50) NOT NULL CHECK (type IN ('prontuario','prescricao','atestado')),
  document_hash      VARCHAR(128) NOT NULL,
  signature          TEXT NOT NULL,
  certificate        TEXT NOT NULL,
  signed_at          TIMESTAMPTZ NOT NULL,
  algorithm          VARCHAR(50) NOT NULL,
  -- Informações do certificado
  signer_common_name VARCHAR(300) NOT NULL,
  signer_org         VARCHAR(300),
  signer_cpf         VARCHAR(14),
  signer_cnpj        VARCHAR(18),
  cert_valid_from    TIMESTAMPTZ NOT NULL,
  cert_valid_to      TIMESTAMPTZ NOT NULL,
  cert_issuer        VARCHAR(300) NOT NULL,
  cert_serial        VARCHAR(100) NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_docs_assin_type ON documentos_assinados (type);

-- ────────────────────────────────────────────────────────────────────────────
-- 21. TABELA — Audit Log (append-only, imutável)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id       UUID NOT NULL,
  actor_name     VARCHAR(200) NOT NULL,
  actor_role     VARCHAR(50) NOT NULL,
  acao           audit_acao NOT NULL,
  entidade       VARCHAR(100) NOT NULL,
  entidade_id    VARCHAR(200) NOT NULL,
  diff           JSONB,
  ip             INET,
  user_agent     TEXT,
  timestamp_utc  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Append-only: revogar UPDATE e DELETE via permissão, não via constraint
CREATE INDEX IF NOT EXISTS idx_audit_actor    ON audit_log (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_entidade ON audit_log (entidade, entidade_id);
CREATE INDEX IF NOT EXISTS idx_audit_acao     ON audit_log (acao);
CREATE INDEX IF NOT EXISTS idx_audit_time     ON audit_log (timestamp_utc DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- 22. FK DIFERIDA: pacientes.profissional_responsavel
--     Criada após profissionais para evitar dependência circular no DDL.
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE pacientes
  ADD CONSTRAINT fk_paciente_prof_resp
  FOREIGN KEY (profissional_responsavel) REFERENCES profissionais(id);

ALTER TABLE consultas
  ADD CONSTRAINT fk_consulta_evolucao
  FOREIGN KEY (prontuario_evolucao_id) REFERENCES evolucoes(id);

-- ────────────────────────────────────────────────────────────────────────────
-- FIM DO SCHEMA
-- ────────────────────────────────────────────────────────────────────────────