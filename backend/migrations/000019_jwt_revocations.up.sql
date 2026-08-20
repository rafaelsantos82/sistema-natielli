CREATE TABLE IF NOT EXISTS jwt_revocations (
  token_hash  CHAR(64) PRIMARY KEY,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jwt_revocations_expires ON jwt_revocations (expires_at);
