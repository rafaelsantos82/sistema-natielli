-- Core auth: users e vínculo multi-unidade (bootstrap dev usa email como identificador lógico)

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin','gestor','funcionario','terceiro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(200) NOT NULL,
  email         VARCHAR(320) NOT NULL,
  password_hash TEXT NOT NULL DEFAULT 'disabled',
  role          user_role NOT NULL DEFAULT 'funcionario',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ,
  CONSTRAINT uq_users_email UNIQUE (email)
);
DROP TRIGGER IF EXISTS trg_users_updated ON users;
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS user_unidades (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unidade_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, unidade_id)
);

-- Usuário sistema para FKs de auditoria/upload em dev
INSERT INTO users (id, name, email, password_hash, role)
VALUES (
  '00000000-0000-4000-8000-000000000099',
  'Sistema',
  'sistema@espacoterapia.local',
  'disabled',
  'admin'
) ON CONFLICT (email) DO NOTHING;
