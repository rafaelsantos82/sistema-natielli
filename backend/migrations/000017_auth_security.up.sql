CREATE TABLE IF NOT EXISTS auth_login_attempts (
  identifier        TEXT NOT NULL,
  identifier_type   VARCHAR(10) NOT NULL CHECK (identifier_type IN ('email', 'ip')),
  failed_count      INT NOT NULL DEFAULT 0,
  locked_until      TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (identifier, identifier_type)
);

CREATE INDEX IF NOT EXISTS idx_auth_login_attempts_locked ON auth_login_attempts (locked_until)
  WHERE locked_until IS NOT NULL;
