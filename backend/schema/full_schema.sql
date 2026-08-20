-- ============================================================================
-- Espaço Terapia OS — Schema Relacional Completo (PostgreSQL 15+)
-- Clínica pediátrica multi-unidade (filiais).
-- Gerado a partir do mapeamento das interfaces do frontend, adaptado para:
--   - Pacientes crianças (sem campos adultos/reprodutivos)
--   - Multi-tenant por unidade (paciente_unidades M:N, RH por filial)
-- NÃO é uma migration; serve como referência canônica do modelo de dados.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 0. EXTENSÕES
-- ────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

-- ────────────────────────────────────────────────────────────────────────────
-- 1. TIPOS ENUM
-- ────────────────────────────────────────────────────────────────────────────

-- Core
CREATE TYPE user_role          AS ENUM ('admin','gestor','funcionario','terceiro');
CREATE TYPE unidade_status     AS ENUM ('ativa','inativa');

-- Pessoas
CREATE TYPE sexo_biologico     AS ENUM ('masculino','feminino','intersexo','nao_informado');
CREATE TYPE tipo_sanguineo     AS ENUM ('A+','A-','B+','B-','AB+','AB-','O+','O-','Desconhecido');
CREATE TYPE paciente_status    AS ENUM ('ativo','inativo','falecido');
CREATE TYPE profissional_status AS ENUM ('ativo','inativo','suspenso');
CREATE TYPE conselho_tipo      AS ENUM ('CRP','CRM','CREFITO','COREN','CRN','CREFONO','CRO','CRBM','OUTRO');
CREATE TYPE documento_categoria AS ENUM ('documento_pessoal','registro_profissional','comprovante','contrato','outro');
CREATE TYPE modalidade_atendimento AS ENUM ('Presencial','Tele');
CREATE TYPE dia_semana         AS ENUM ('dom','seg','ter','qua','qui','sex','sab');

-- Agenda / Consultas
CREATE TYPE consulta_status    AS ENUM ('agendada','confirmada','cancelada','concluida');
CREATE TYPE status_atendimento AS ENUM ('atendimento_pendente','aguardando_prontuario','pronto_para_aprovacao','aprovado','rejeitado');
CREATE TYPE sala_status        AS ENUM ('Ativa','Inativa');
CREATE TYPE agenda_exception_type AS ENUM ('ferias','almoco','exception');
CREATE TYPE recurrence_type    AS ENUM ('none','weekly','monthly_date','monthly_first_weekday');

-- Clínico
CREATE TYPE anamnese_status        AS ENUM ('Ativa','Inativa');
CREATE TYPE question_type          AS ENUM ('boolean','string','text','integer','decimal','choice','date');

-- Consentimento
CREATE TYPE termo_tipo         AS ENUM ('Atendimento','Dados_LGPD','Imagem','Pesquisa');
CREATE TYPE carimbo_tipo       AS ENUM ('inicio','fim');

-- Financeiro
CREATE TYPE categoria_tipo     AS ENUM ('Receita','Despesa');
CREATE TYPE forma_pagamento    AS ENUM ('Dinheiro','PIX','Cartão Débito','Cartão Crédito','Transferência','Boleto','Outro');
CREATE TYPE lancamento_status  AS ENUM ('Pendente','Pago','Vencido','Cancelado');
CREATE TYPE frequencia_recorrencia AS ENUM ('Mensal','Trimestral','Semestral','Anual');
CREATE TYPE nota_fiscal_status AS ENUM ('Pendente','Pago Parcial','Pago','Em Disputa');

-- RH
CREATE TYPE folha_status       AS ENUM ('pendente','pago','cancelado');

-- Planos / Jurídico
CREATE TYPE acao_judicial_status AS ENUM ('Em Andamento','Procedente','Improcedente','Acordo');

-- Estoque / Comodato
CREATE TYPE item_estoque_status  AS ENUM ('Ativo','Inativo');
CREATE TYPE movimentacao_tipo    AS ENUM ('Entrada','Saída','Ajuste');
CREATE TYPE comodato_status      AS ENUM ('Emprestado','Devolvido','Atrasado');

-- Contratos
CREATE TYPE contrato_tipo      AS ENUM ('Atendimento','Prestação de Serviço','Termo de Responsabilidade','Outros');
CREATE TYPE contrato_status    AS ENUM ('Rascunho','Aguardando Assinatura','Assinado','Recusado','Expirado');
CREATE TYPE signatario_tipo    AS ENUM ('Paciente','Responsável Legal','Profissional','Testemunha');
CREATE TYPE signatario_status  AS ENUM ('Pendente','Visualizado','Assinado','Recusado');
CREATE TYPE solicitacao_status AS ENUM ('Preparando','Enviado','Em Andamento','Concluído','Recusado','Expirado');

-- Marketing
CREATE TYPE publico_alvo       AS ENUM ('Interno','Externo','Ambos');
CREATE TYPE manual_status      AS ENUM ('Rascunho','Publicado','Arquivado');
CREATE TYPE material_status    AS ENUM ('Rascunho','Aprovado','Publicado','Arquivado');

-- Contabilidade
CREATE TYPE conta_tipo         AS ENUM ('Sintética','Analítica');
CREATE TYPE conta_natureza     AS ENUM ('Devedora','Credora');

-- Tratamento
CREATE TYPE diretriz_protocolar AS ENUM ('Protocolo Clinico','Diretriz interna','Off-label justificado');
CREATE TYPE via_administracao   AS ENUM ('VO','IV','IM','SC','SL','Topica','Inalatoria','Retal','Ocular','Nasal');
CREATE TYPE dose_unidade        AS ENUM ('mg','g','mcg','UI','mL');
CREATE TYPE duracao_unidade     AS ENUM ('dias','semanas','meses');
CREATE TYPE terapia_status   AS ENUM ('Ativo','Inativo');
CREATE TYPE tipo_cobranca       AS ENUM ('Por sessao','Pacote','Mensal');

-- Notificações
CREATE TYPE notificacao_agenda_tipo AS ENUM ('alteracao_disponibilidade','cancelamento','bloqueio_manual');
CREATE TYPE notificacao_status      AS ENUM ('pendente','enviado');

-- Auditoria
CREATE TYPE audit_acao AS ENUM (
  'documento.upload','documento.exclusao','documento.visualizacao','documento.download',
  'agenda.alteracao','agenda.bloqueio',
  'atendimento.aprovacao','atendimento.rejeicao','atendimento.vinculo_prontuario',
  'evolucao.criacao','evolucao.edicao',
  'profissional.criacao','profissional.edicao','profissional.exclusao'
);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. FUNÇÃO TRIGGER: updated_at automático
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. TABELAS — Core / Multi-tenant
-- ────────────────────────────────────────────────────────────────────────────

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
CREATE INDEX idx_unidades_status ON unidades (status) WHERE deleted_at IS NULL;

CREATE TABLE users (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 VARCHAR(200) NOT NULL,
  email                VARCHAR(320) NOT NULL,
  password_hash        TEXT NOT NULL,
  role                 user_role NOT NULL DEFAULT 'funcionario',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMPTZ,
  CONSTRAINT uq_users_email UNIQUE (email)
);
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX idx_users_email ON users (email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role  ON users (role)  WHERE deleted_at IS NULL;

-- M:N — usuário x unidade (permissões multi-unidade)
CREATE TABLE user_unidades (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unidade_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, unidade_id)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 4. TABELAS — Pessoas: Pacientes
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE pacientes (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo             VARCHAR(300) NOT NULL,
  nome_social               VARCHAR(300),
  data_nascimento           DATE NOT NULL,
  sexo_biologico            sexo_biologico NOT NULL,
  cpf                       VARCHAR(14),  -- opcional: criança pode não ter CPF próprio
  rg_numero                 VARCHAR(30),
  rg_orgao                  VARCHAR(30),
  foto                      TEXT,

  -- Contato (criança / família)
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

  -- Responsável legal (obrigatório no cadastro pediátrico)
  responsavel_nome          VARCHAR(200) NOT NULL,
  responsavel_cpf           VARCHAR(14),
  responsavel_parentesco    VARCHAR(50),
  responsavel_tel           VARCHAR(30),
  responsavel_email         VARCHAR(320),
  contato_emergencia_nome   VARCHAR(200),
  contato_emergencia_tel    VARCHAR(30),
  pessoas_autorizadas_busca TEXT[],

  -- Contexto escolar / desenvolvimento
  escola                    VARCHAR(200),
  serie_ano                 VARCHAR(50),
  necessidades_especiais    TEXT,
  pediatra_referencia       VARCHAR(200),

  -- Dados clínicos pediátricos
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

  -- Administrativo
  data_cadastro             TIMESTAMPTZ DEFAULT NOW(),
  profissional_responsavel  UUID, -- FK adicionada via ALTER TABLE após criação de profissionais
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
  )
);
CREATE TRIGGER trg_pacientes_updated BEFORE UPDATE ON pacientes
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE UNIQUE INDEX uq_pacientes_cpf ON pacientes (cpf) WHERE cpf IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_pacientes_nome      ON pacientes (nome_completo) WHERE deleted_at IS NULL;
CREATE INDEX idx_pacientes_cpf       ON pacientes (cpf) WHERE cpf IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_pacientes_status    ON pacientes (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_pacientes_nascimento ON pacientes (data_nascimento);

-- Plano de saúde vinculado ao paciente (sub-entidade de PacienteMock)
CREATE TABLE paciente_planos_saude (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id         UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  nome                VARCHAR(200) NOT NULL,
  categoria           VARCHAR(100),
  numero_carteirinha  VARCHAR(50) NOT NULL,
  validade            DATE,
  titular             VARCHAR(200),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_pac_planos_updated BEFORE UPDATE ON paciente_planos_saude
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX idx_pac_planos_paciente ON paciente_planos_saude (paciente_id);

-- M:N — paciente x unidade (multi-filial; filial principal via principal=TRUE)
CREATE TABLE paciente_unidades (
  paciente_id   UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  unidade_id    UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  principal     BOOLEAN NOT NULL DEFAULT FALSE,
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  vinculado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (paciente_id, unidade_id)
);
CREATE INDEX idx_pac_unidades_unidade ON paciente_unidades (unidade_id) WHERE ativo = TRUE;
CREATE INDEX idx_pac_unidades_paciente ON paciente_unidades (paciente_id) WHERE ativo = TRUE;

-- ────────────────────────────────────────────────────────────────────────────
-- 5. TABELAS — Pessoas: Profissionais
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE profissionais (
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
CREATE INDEX idx_prof_nome   ON profissionais (nome) WHERE deleted_at IS NULL;
CREATE INDEX idx_prof_status ON profissionais (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_prof_email  ON profissionais (email) WHERE deleted_at IS NULL;

-- M:N — profissional x unidade
CREATE TABLE profissional_unidades (
  profissional_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  unidade_id      UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  PRIMARY KEY (profissional_id, unidade_id)
);

-- Especialidades normalizadas (1:N simples, valores texto livres no frontend)
CREATE TABLE profissional_especialidades (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  especialidade   VARCHAR(200) NOT NULL,
  CONSTRAINT uq_prof_espec UNIQUE (profissional_id, especialidade)
);
CREATE INDEX idx_prof_espec_prof ON profissional_especialidades (profissional_id);

-- Conselhos profissionais (múltiplos registros por profissional)
CREATE TABLE profissional_conselhos (
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
CREATE INDEX idx_prof_conselhos_prof ON profissional_conselhos (profissional_id) WHERE deleted_at IS NULL;

-- Documentos do profissional (upload, versionamento via substitui)
CREATE TABLE profissional_documentos (
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
CREATE INDEX idx_prof_docs_prof ON profissional_documentos (profissional_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_prof_docs_cat  ON profissional_documentos (profissional_id, categoria) WHERE deleted_at IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 6. TABELAS — Terapias e Preços
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE terapias (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_terapia          VARCHAR(300) NOT NULL,
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
  status                   terapia_status NOT NULL DEFAULT 'Ativo',
  versao                   INTEGER NOT NULL DEFAULT 1 CHECK (versao >= 1),
  anexos                   TEXT[],
  tags                     TEXT[],
  observacoes              TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_terapias_updated BEFORE UPDATE ON terapias
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX idx_terapias_status ON terapias (status);

-- Itens do regime terapêutico (1:N)
CREATE TABLE terapia_itens_regime (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  terapia_id   UUID NOT NULL REFERENCES terapias(id) ON DELETE CASCADE,
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
CREATE INDEX idx_terapia_itens_terapia ON terapia_itens_regime (terapia_id);

-- Preços por terapia/profissional
CREATE TABLE precos_terapia (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id       UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  nome_terapia          VARCHAR(300) NOT NULL,
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
CREATE TRIGGER trg_precos_terapia_updated BEFORE UPDATE ON precos_terapia
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX idx_precos_terapia_prof ON precos_terapia (profissional_id);
CREATE INDEX idx_precos_terapia_vigencia ON precos_terapia (vigencia_inicio, vigencia_fim);

-- ────────────────────────────────────────────────────────────────────────────
-- 7. TABELAS — Agenda e Consultas
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE salas (
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
CREATE INDEX idx_salas_unidade ON salas (unidade_id);

-- Arrays normalizados da sala
CREATE TABLE sala_especialidades (
  sala_id       UUID NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
  especialidade VARCHAR(200) NOT NULL,
  PRIMARY KEY (sala_id, especialidade)
);

CREATE TABLE sala_recursos (
  sala_id UUID NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
  recurso VARCHAR(200) NOT NULL,
  PRIMARY KEY (sala_id, recurso)
);

CREATE TABLE consultas (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id            UUID NOT NULL REFERENCES pacientes(id),
  profissional_id        UUID NOT NULL REFERENCES profissionais(id),
  unidade_id             UUID REFERENCES unidades(id),
  sala_id                UUID REFERENCES salas(id),
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
CREATE INDEX idx_consultas_sala         ON consultas (sala_id);
CREATE INDEX idx_consultas_paciente     ON consultas (paciente_id);
CREATE INDEX idx_consultas_profissional ON consultas (profissional_id, data_hora);
CREATE INDEX idx_consultas_unidade      ON consultas (unidade_id, data_hora);
CREATE INDEX idx_consultas_data         ON consultas (data_hora);
CREATE INDEX idx_consultas_status       ON consultas (status);
CREATE INDEX idx_consultas_atendimento  ON consultas (status_atendimento) WHERE status_atendimento IS NOT NULL;

CREATE TABLE paciente_profissionais (
  paciente_id            UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  profissional_id        UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  origem                 TEXT NOT NULL DEFAULT 'consulta_agendada'
    CHECK (origem IN ('consulta_agendada', 'consulta_realizada', 'backfill')),
  primeira_consulta_id   UUID NULL REFERENCES consultas(id) ON DELETE SET NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (paciente_id, profissional_id)
);
CREATE INDEX idx_pp_profissional ON paciente_profissionais (profissional_id);
CREATE INDEX idx_pp_paciente ON paciente_profissionais (paciente_id);
CREATE TRIGGER trg_paciente_profissionais_updated BEFORE UPDATE ON paciente_profissionais
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE reservas (
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
CREATE INDEX idx_reservas_sala  ON reservas (sala_id, data_hora_inicio);
CREATE INDEX idx_reservas_prof  ON reservas (profissional_id, data_hora_inicio);

-- Exceções de agenda (férias, almoço, bloqueios)
CREATE TABLE agenda_exceptions (
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
CREATE INDEX idx_agenda_exc_prof ON agenda_exceptions (profissional_id, date);

-- Configurações de notificação de consultas (por unidade ou global)
CREATE TABLE notification_settings (
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
-- 8. TABELAS — Clínico / Prontuário
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE evolucoes (
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
CREATE INDEX idx_evolucoes_consulta  ON evolucoes (consulta_id);
CREATE INDEX idx_evolucoes_paciente  ON evolucoes (paciente_id, data DESC);

CREATE TABLE prescricoes (
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
CREATE INDEX idx_prescricoes_consulta ON prescricoes (consulta_id);
CREATE INDEX idx_prescricoes_paciente ON prescricoes (paciente_id, data DESC);

CREATE TABLE atestados (
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
CREATE INDEX idx_atestados_consulta ON atestados (consulta_id);
CREATE INDEX idx_atestados_paciente ON atestados (paciente_id);

CREATE TABLE prontuario_documentos (
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
CREATE INDEX idx_pront_docs_paciente ON prontuario_documentos (paciente_id);
CREATE INDEX idx_pront_docs_consulta ON prontuario_documentos (consulta_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 9. TABELAS — Anamneses
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE anamneses (
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
CREATE INDEX idx_anamneses_espec ON anamneses (especialidade);
CREATE INDEX idx_anamneses_status ON anamneses (status);

CREATE TABLE respostas_anamnese (
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
CREATE INDEX idx_resp_anam_quest   ON respostas_anamnese (questionnaire_id);
CREATE INDEX idx_resp_anam_patient ON respostas_anamnese (patient_id);
CREATE INDEX idx_resp_anam_enc     ON respostas_anamnese (encounter_id) WHERE encounter_id IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 10. TABELAS — Consentimento e LGPD
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE termos_consentimento (
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
CREATE INDEX idx_termos_tipo ON termos_consentimento (tipo, ativo);

CREATE TABLE registros_consentimento (
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
CREATE INDEX idx_reg_consent_paciente ON registros_consentimento (paciente_id);
CREATE INDEX idx_reg_consent_termo    ON registros_consentimento (termo_id);

CREATE TABLE carimbos_atendimento (
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
CREATE INDEX idx_carimbos_atend ON carimbos_atendimento (atendimento_id);
CREATE INDEX idx_carimbos_pac   ON carimbos_atendimento (paciente_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 11. TABELAS — Financeiro
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE categorias_financeiras (
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
CREATE INDEX idx_cat_fin_tipo ON categorias_financeiras (tipo);

CREATE TABLE centros_custo (
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

CREATE TABLE lancamentos (
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
CREATE INDEX idx_lanc_vencimento ON lancamentos (data_vencimento, status);
CREATE INDEX idx_lanc_categoria  ON lancamentos (categoria_id);
CREATE INDEX idx_lanc_cc         ON lancamentos (centro_custo_id) WHERE centro_custo_id IS NOT NULL;
CREATE INDEX idx_lanc_unidade    ON lancamentos (unidade_id) WHERE unidade_id IS NOT NULL;
CREATE INDEX idx_lanc_tipo       ON lancamentos (tipo);
CREATE INDEX idx_lanc_conciliado ON lancamentos (conciliado) WHERE conciliado = FALSE;

-- ────────────────────────────────────────────────────────────────────────────
-- 12. TABELAS — Planos de Saúde e Jurídico
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE planos_saude (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          VARCHAR(200) NOT NULL,
  cnpj          VARCHAR(18) NOT NULL,
  registro_ans  VARCHAR(50) NOT NULL,
  telefone      VARCHAR(20) NOT NULL,
  email         VARCHAR(200) NOT NULL,
  endereco      VARCHAR(500) NOT NULL,
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  observacoes   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_planos_updated BEFORE UPDATE ON planos_saude
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX idx_planos_ativo ON planos_saude (ativo);

CREATE TABLE acoes_judiciais (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_processo   VARCHAR(100) NOT NULL,
  plano_saude_id    UUID NOT NULL REFERENCES planos_saude(id),
  plano_saude_nome  VARCHAR(200) NOT NULL,
  valor_acao        NUMERIC(14,2) NOT NULL CHECK (valor_acao > 0),
  data_entrada      DATE NOT NULL,
  data_sentenca     DATE,
  status            acao_judicial_status NOT NULL DEFAULT 'Em Andamento',
  descricao         TEXT NOT NULL,
  observacoes       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_acoes_updated BEFORE UPDATE ON acoes_judiciais
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX idx_acoes_plano  ON acoes_judiciais (plano_saude_id);
CREATE INDEX idx_acoes_status ON acoes_judiciais (status);

CREATE TABLE notas_fiscais (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_nota       VARCHAR(100) NOT NULL,
  plano_saude_id    UUID NOT NULL REFERENCES planos_saude(id),
  plano_saude_nome  VARCHAR(200) NOT NULL,
  paciente_nome     VARCHAR(300) NOT NULL,
  data_emissao      DATE NOT NULL,
  data_vencimento   DATE NOT NULL,
  valor_servico     NUMERIC(14,2) NOT NULL CHECK (valor_servico > 0),
  valor_pago        NUMERIC(14,2),
  status            nota_fiscal_status NOT NULL DEFAULT 'Pendente',
  acao_judicial_id  UUID REFERENCES acoes_judiciais(id),
  observacoes       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_nf_updated BEFORE UPDATE ON notas_fiscais
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX idx_nf_plano     ON notas_fiscais (plano_saude_id);
CREATE INDEX idx_nf_status    ON notas_fiscais (status);
CREATE INDEX idx_nf_venc      ON notas_fiscais (data_vencimento);

-- ────────────────────────────────────────────────────────────────────────────
-- 13. TABELAS — RH / Folha de Pagamento
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE funcionarios_clt (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id      UUID NOT NULL REFERENCES unidades(id),
  nome            VARCHAR(100) NOT NULL,
  cpf             VARCHAR(14) NOT NULL UNIQUE,
  cargo           VARCHAR(100) NOT NULL,
  salario_base    NUMERIC(12,2) NOT NULL CHECK (salario_base >= 0.01),
  data_admissao   DATE NOT NULL,
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  dependentes     INTEGER NOT NULL DEFAULT 0 CHECK (dependentes >= 0),
  vale_transporte BOOLEAN NOT NULL DEFAULT TRUE,
  vale_alimentacao NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (vale_alimentacao >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_func_clt_updated BEFORE UPDATE ON funcionarios_clt
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX idx_func_clt_unidade ON funcionarios_clt (unidade_id);

CREATE TABLE funcionarios_pj (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id    UUID NOT NULL REFERENCES unidades(id),
  nome          VARCHAR(100) NOT NULL,
  cnpj          VARCHAR(18) NOT NULL UNIQUE,
  razao_social  VARCHAR(150) NOT NULL,
  servico       VARCHAR(100) NOT NULL,
  valor_hora    NUMERIC(10,2) NOT NULL CHECK (valor_hora >= 0.01),
  data_inicio   DATE NOT NULL,
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_func_pj_updated BEFORE UPDATE ON funcionarios_pj
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX idx_func_pj_unidade ON funcionarios_pj (unidade_id);

CREATE TABLE folhas_clt (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id    UUID NOT NULL REFERENCES funcionarios_clt(id),
  mes_referencia    VARCHAR(7) NOT NULL,
  salario_base      NUMERIC(12,2) NOT NULL,
  horas_extras      NUMERIC(10,2) NOT NULL DEFAULT 0,
  adicional_noturno NUMERIC(10,2) NOT NULL DEFAULT 0,
  outros_proventos  NUMERIC(10,2) NOT NULL DEFAULT 0,
  vale_transporte   NUMERIC(10,2) NOT NULL DEFAULT 0,
  vale_alimentacao  NUMERIC(10,2) NOT NULL DEFAULT 0,
  inss              NUMERIC(10,2) NOT NULL DEFAULT 0,
  fgts              NUMERIC(10,2) NOT NULL DEFAULT 0,
  irrf              NUMERIC(10,2) NOT NULL DEFAULT 0,
  outros_descontos  NUMERIC(10,2) NOT NULL DEFAULT 0,
  salario_liquido   NUMERIC(12,2) NOT NULL DEFAULT 0,
  data_pagamento    DATE,
  status            folha_status NOT NULL DEFAULT 'pendente',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_folha_clt_mes UNIQUE (funcionario_id, mes_referencia)
);
CREATE TRIGGER trg_folha_clt_updated BEFORE UPDATE ON folhas_clt
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX idx_folha_clt_func ON folhas_clt (funcionario_id);
CREATE INDEX idx_folha_clt_mes  ON folhas_clt (mes_referencia);

CREATE TABLE folhas_pj (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id     UUID NOT NULL REFERENCES funcionarios_pj(id),
  mes_referencia     VARCHAR(7) NOT NULL,
  horas_trabalhadas  NUMERIC(10,2) NOT NULL CHECK (horas_trabalhadas >= 0),
  valor_hora         NUMERIC(10,2) NOT NULL CHECK (valor_hora >= 0.01),
  valor_total        NUMERIC(12,2) NOT NULL DEFAULT 0,
  retencao_iss       NUMERIC(10,2) NOT NULL DEFAULT 0,
  retencao_ir        NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_liquido      NUMERIC(12,2) NOT NULL DEFAULT 0,
  data_pagamento     DATE,
  status             folha_status NOT NULL DEFAULT 'pendente',
  descricao_servicos VARCHAR(500),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_folha_pj_mes UNIQUE (funcionario_id, mes_referencia)
);
CREATE TRIGGER trg_folha_pj_updated BEFORE UPDATE ON folhas_pj
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX idx_folha_pj_func ON folhas_pj (funcionario_id);
CREATE INDEX idx_folha_pj_mes  ON folhas_pj (mes_referencia);

-- ────────────────────────────────────────────────────────────────────────────
-- 14. TABELAS — Estoque e Comodato
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE itens_estoque (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id      UUID NOT NULL REFERENCES unidades(id),
  codigo          VARCHAR(50) NOT NULL,
  nome            VARCHAR(200) NOT NULL,
  categoria       VARCHAR(100) NOT NULL,
  unidade_medida  VARCHAR(50) NOT NULL,
  estoque_atual   INTEGER NOT NULL DEFAULT 0,
  estoque_minimo  INTEGER NOT NULL DEFAULT 0 CHECK (estoque_minimo >= 0),
  localizacao     VARCHAR(100),
  status          item_estoque_status NOT NULL DEFAULT 'Ativo',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_itens_estoque_unidade_codigo UNIQUE (unidade_id, codigo)
);
CREATE TRIGGER trg_itens_est_updated BEFORE UPDATE ON itens_estoque
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX idx_itens_est_unidade ON itens_estoque (unidade_id);
CREATE INDEX idx_itens_est_status ON itens_estoque (status);
CREATE INDEX idx_itens_est_cat    ON itens_estoque (categoria);

CREATE TABLE movimentacoes_estoque (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id          UUID NOT NULL REFERENCES itens_estoque(id),
  item_nome        VARCHAR(200) NOT NULL,
  tipo             movimentacao_tipo NOT NULL,
  quantidade       INTEGER NOT NULL CHECK (quantidade > 0),
  data_hora        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  documento        VARCHAR(50),
  motivo           VARCHAR(500) NOT NULL,
  responsavel_id   UUID NOT NULL,
  responsavel_nome VARCHAR(200) NOT NULL,
  saldo_anterior   INTEGER NOT NULL,
  saldo_atual      INTEGER NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_mov_est_item ON movimentacoes_estoque (item_id, data_hora DESC);
CREATE INDEX idx_mov_est_resp ON movimentacoes_estoque (responsavel_id);

CREATE TABLE inventarios (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data             DATE NOT NULL,
  responsavel_id   UUID NOT NULL,
  responsavel_nome VARCHAR(200) NOT NULL,
  observacoes      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_inventarios_data ON inventarios (data DESC);

CREATE TABLE inventario_contagens (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventario_id    UUID NOT NULL REFERENCES inventarios(id) ON DELETE CASCADE,
  item_id          UUID NOT NULL REFERENCES itens_estoque(id),
  item_nome        VARCHAR(200) NOT NULL,
  estoque_sistema  INTEGER NOT NULL,
  contagem_fisica  INTEGER NOT NULL,
  divergencia      INTEGER NOT NULL GENERATED ALWAYS AS (contagem_fisica - estoque_sistema) STORED
);
CREATE INDEX idx_inv_cont_inv ON inventario_contagens (inventario_id);

CREATE TABLE comodatos (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id                  UUID REFERENCES itens_estoque(id),
  item_nome                VARCHAR(200) NOT NULL,
  descricao                TEXT,
  paciente_id              UUID NOT NULL REFERENCES pacientes(id),
  paciente_nome            VARCHAR(300) NOT NULL,
  data_emprestimo          DATE NOT NULL,
  data_devolucao_prevista  DATE NOT NULL,
  data_devolucao_real      DATE,
  status                   comodato_status NOT NULL DEFAULT 'Emprestado',
  condicao_entrega         TEXT NOT NULL,
  condicao_devolucao       TEXT,
  observacoes              TEXT,
  responsavel_id           UUID NOT NULL,
  responsavel_nome         VARCHAR(200) NOT NULL,
  numero_serie             VARCHAR(100),
  quantidade               INTEGER NOT NULL DEFAULT 1 CHECK (quantidade >= 1),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_comodato_devolucao CHECK (
    data_devolucao_real IS NULL OR data_devolucao_real >= data_emprestimo
  )
);
CREATE TRIGGER trg_comodatos_updated BEFORE UPDATE ON comodatos
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX idx_comodatos_paciente ON comodatos (paciente_id);
CREATE INDEX idx_comodatos_status   ON comodatos (status);
CREATE INDEX idx_comodatos_devol    ON comodatos (data_devolucao_prevista) WHERE status = 'Emprestado';

-- ────────────────────────────────────────────────────────────────────────────
-- 15. TABELAS — Contratos
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE contratos (
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
CREATE INDEX idx_contratos_paciente ON contratos (paciente_id) WHERE paciente_id IS NOT NULL;
CREATE INDEX idx_contratos_prof     ON contratos (profissional_id) WHERE profissional_id IS NOT NULL;
CREATE INDEX idx_contratos_status   ON contratos (status);

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

CREATE TABLE contrato_anexos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  nome        VARCHAR(500) NOT NULL,
  url         TEXT NOT NULL,
  tipo        VARCHAR(100) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_contrato_anexos ON contrato_anexos (contrato_id);

CREATE TABLE compartilhamentos_contrato (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id      UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  contrato_titulo  VARCHAR(200) NOT NULL,
  token            VARCHAR(128) NOT NULL UNIQUE,
  expira_em        TIMESTAMPTZ NOT NULL,
  pode_visualizar  BOOLEAN NOT NULL DEFAULT TRUE,
  pode_baixar      BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_comp_contrato ON compartilhamentos_contrato (contrato_id);
CREATE INDEX idx_comp_token    ON compartilhamentos_contrato (token);

CREATE TABLE compartilhamento_acessos (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compartilhamento_id    UUID NOT NULL REFERENCES compartilhamentos_contrato(id) ON DELETE CASCADE,
  data_hora              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip                     INET
);
CREATE INDEX idx_comp_acessos ON compartilhamento_acessos (compartilhamento_id);

CREATE TABLE solicitacoes_assinatura (
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
CREATE INDEX idx_solic_contrato ON solicitacoes_assinatura (contrato_id);

CREATE TABLE signatarios (
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
CREATE INDEX idx_signatarios_solic ON signatarios (solicitacao_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 16. TABELAS — Marketing
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE manuais (
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
CREATE INDEX idx_manuais_status ON manuais (status);

CREATE TABLE materiais_marketing (
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
CREATE INDEX idx_materiais_status ON materiais_marketing (status);
CREATE INDEX idx_materiais_unidade ON materiais_marketing (unidade_id) WHERE unidade_id IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 17. TABELAS — Contabilidade
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE contas_contabeis (
  codigo   VARCHAR(20) PRIMARY KEY,
  nome     VARCHAR(200) NOT NULL,
  tipo     conta_tipo NOT NULL,
  natureza conta_natureza NOT NULL,
  pai      VARCHAR(20) REFERENCES contas_contabeis(codigo)
);
CREATE INDEX idx_contas_pai ON contas_contabeis (pai) WHERE pai IS NOT NULL;

CREATE TABLE lancamentos_contabeis (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data            DATE NOT NULL,
  conta_codigo    VARCHAR(20) NOT NULL REFERENCES contas_contabeis(codigo),
  conta_nome      VARCHAR(200) NOT NULL,
  debito          NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (debito >= 0),
  credito         NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (credito >= 0),
  historico       TEXT NOT NULL,
  centro_custo    VARCHAR(100),
  unidade_id      UUID REFERENCES unidades(id),
  profissional_id UUID REFERENCES profissionais(id),
  convenio        VARCHAR(200),
  documento       VARCHAR(100),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_lanc_contabil_valor CHECK (debito > 0 OR credito > 0)
);
CREATE INDEX idx_lanc_contabil_data  ON lancamentos_contabeis (data);
CREATE INDEX idx_lanc_contabil_conta ON lancamentos_contabeis (conta_codigo);
CREATE INDEX idx_lanc_contabil_prof  ON lancamentos_contabeis (profissional_id) WHERE profissional_id IS NOT NULL;
CREATE INDEX idx_lanc_contabil_unidade ON lancamentos_contabeis (unidade_id) WHERE unidade_id IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 18. TABELAS — Notificações de Agenda
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE notificacoes_agenda (
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
CREATE INDEX idx_notif_agenda_prof   ON notificacoes_agenda (profissional_id);
CREATE INDEX idx_notif_agenda_status ON notificacoes_agenda (status);

-- ────────────────────────────────────────────────────────────────────────────
-- 19. TABELAS — Aniversariantes
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE aniversariantes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome             VARCHAR(300) NOT NULL,
  tipo             VARCHAR(20) NOT NULL CHECK (tipo IN ('Paciente','Colaborador')),
  data_nascimento  DATE NOT NULL,
  foto_url         TEXT,
  telefone         VARCHAR(30),
  email            VARCHAR(320),
  unidade_id       UUID REFERENCES unidades(id)
);
CREATE INDEX idx_aniversariantes_unidade ON aniversariantes (unidade_id) WHERE unidade_id IS NOT NULL;
CREATE INDEX idx_aniv_nascimento ON aniversariantes (
  EXTRACT(MONTH FROM data_nascimento),
  EXTRACT(DAY FROM data_nascimento)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 20. TABELAS — Assinatura Digital (documentos assinados)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE documentos_assinados (
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
CREATE INDEX idx_docs_assin_type ON documentos_assinados (type);

-- ────────────────────────────────────────────────────────────────────────────
-- 21. TABELA — Audit Log (append-only, imutável)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE audit_log (
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
CREATE INDEX idx_audit_actor    ON audit_log (actor_id);
CREATE INDEX idx_audit_entidade ON audit_log (entidade, entidade_id);
CREATE INDEX idx_audit_acao     ON audit_log (acao);
CREATE INDEX idx_audit_time     ON audit_log (timestamp_utc DESC);

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
