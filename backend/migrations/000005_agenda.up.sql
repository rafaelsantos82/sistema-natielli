-- Migration 000005_agenda

-- Agenda / Consultas
DO $$ BEGIN
  CREATE TYPE consulta_status    AS ENUM ('agendada','confirmada','cancelada','concluida');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE status_atendimento AS ENUM ('atendimento_pendente','aguardando_prontuario','pronto_para_aprovacao','aprovado','rejeitado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE sala_status        AS ENUM ('Ativa','Inativa');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE agenda_exception_type AS ENUM ('ferias','almoco','exception');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE recurrence_type    AS ENUM ('none','weekly','monthly_date','monthly_first_weekday');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 7. TABELAS — Agenda e Consultas
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS salas (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_sala              VARCHAR(100) NOT NULL,
  codigo                 VARCHAR(20),
  unidade_id             UUID NOT NULL REFERENCES unidades(id),
  capacidade             INTEGER CHECK (capacidade > 0),
  status                 sala_status NOT NULL DEFAULT 'Ativa',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_salas_updated BEFORE UPDATE ON salas
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_salas_unidade ON salas (unidade_id);

-- Arrays normalizados da sala
CREATE TABLE IF NOT EXISTS sala_especialidades (
  sala_id       UUID NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
  especialidade VARCHAR(200) NOT NULL,
  PRIMARY KEY (sala_id, especialidade)
);

CREATE TABLE IF NOT EXISTS sala_recursos (
  sala_id UUID NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
  recurso VARCHAR(200) NOT NULL,
  PRIMARY KEY (sala_id, recurso)
);

CREATE TABLE IF NOT EXISTS consultas (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id            UUID NOT NULL REFERENCES pacientes(id),
  profissional_id        UUID NOT NULL REFERENCES profissionais(id),
  unidade_id             UUID REFERENCES unidades(id),
  data_hora              TIMESTAMPTZ NOT NULL,
  duracao                INTEGER NOT NULL CHECK (duracao >= 15),
  motivo                 TEXT NOT NULL,
  observacoes            TEXT,
  observacoes_anamnese   TEXT,
  status                 consulta_status NOT NULL DEFAULT 'agendada',
  notificacao_enviada    BOOLEAN DEFAULT FALSE,
  confirmacao_presenca   BOOLEAN DEFAULT FALSE,
  status_atendimento     status_atendimento,
  prontuario_evolucao_id UUID,
  aprovado_por           UUID REFERENCES users(id),
  aprovado_em            TIMESTAMPTZ,
  rejeitado_por          UUID REFERENCES users(id),
  rejeitado_em           TIMESTAMPTZ,
  motivo_rejeicao        TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_consultas_updated BEFORE UPDATE ON consultas
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_consultas_paciente     ON consultas (paciente_id);
CREATE INDEX IF NOT EXISTS idx_consultas_profissional ON consultas (profissional_id, data_hora);
CREATE INDEX IF NOT EXISTS idx_consultas_unidade      ON consultas (unidade_id, data_hora);
CREATE INDEX IF NOT EXISTS idx_consultas_data         ON consultas (data_hora);
CREATE INDEX IF NOT EXISTS idx_consultas_status       ON consultas (status);
CREATE INDEX IF NOT EXISTS idx_consultas_atendimento  ON consultas (status_atendimento) WHERE status_atendimento IS NOT NULL;

CREATE TABLE IF NOT EXISTS reservas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id           UUID NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
  data_hora_inicio  TIMESTAMPTZ NOT NULL,
  duracao           INTEGER NOT NULL CHECK (duracao >= 15),
  profissional_id   UUID NOT NULL REFERENCES profissionais(id),
  profissional_nome VARCHAR(300) NOT NULL,
  consulta_id       UUID REFERENCES consultas(id),
  tipo_atendimento  VARCHAR(100),
  observacoes       VARCHAR(500),
  rrule             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reservas_sala  ON reservas (sala_id, data_hora_inicio);
CREATE INDEX IF NOT EXISTS idx_reservas_prof  ON reservas (profissional_id, data_hora_inicio);

-- Exceções de agenda (férias, almoço, bloqueios)
CREATE TABLE IF NOT EXISTS agenda_exceptions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID REFERENCES profissionais(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  type          agenda_exception_type NOT NULL,
  start_time    TIME,
  end_time      TIME,
  description   TEXT NOT NULL,
  recurrence    JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agenda_exc_prof ON agenda_exceptions (profissional_id, date);

-- Configurações de notificação de consultas (por unidade ou global)
CREATE TABLE IF NOT EXISTS notification_settings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id          UUID REFERENCES unidades(id),
  email_enabled       BOOLEAN NOT NULL DEFAULT TRUE,
  sms_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
  horas_antecedencia  INTEGER NOT NULL DEFAULT 24 CHECK (horas_antecedencia > 0),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_notif_settings_updated BEFORE UPDATE ON notification_settings
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ────────────────────────────────────────────────────────────────────────────