DROP INDEX IF EXISTS idx_signatarios_token;
ALTER TABLE signatarios DROP COLUMN IF EXISTS expira_em;
ALTER TABLE signatarios DROP COLUMN IF EXISTS token_acesso;

DROP INDEX IF EXISTS idx_contratos_active;
ALTER TABLE contratos DROP COLUMN IF EXISTS deleted_at;

-- audit_acao enum values cannot be removed safely in PostgreSQL without type recreation
