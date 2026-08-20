-- Contratos: soft delete, tokens de assinatura, auditoria

ALTER TYPE audit_acao ADD VALUE IF NOT EXISTS 'contrato.criacao';
ALTER TYPE audit_acao ADD VALUE IF NOT EXISTS 'contrato.atualizacao';
ALTER TYPE audit_acao ADD VALUE IF NOT EXISTS 'contrato.exclusao';
ALTER TYPE audit_acao ADD VALUE IF NOT EXISTS 'contrato.compartilhamento';
ALTER TYPE audit_acao ADD VALUE IF NOT EXISTS 'contrato.solicitacao_assinatura';
ALTER TYPE audit_acao ADD VALUE IF NOT EXISTS 'contrato.assinatura_aceite';
ALTER TYPE audit_acao ADD VALUE IF NOT EXISTS 'contrato.acesso_compartilhado';

ALTER TABLE contratos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_contratos_active ON contratos (criado_em DESC) WHERE deleted_at IS NULL;

ALTER TABLE signatarios ADD COLUMN IF NOT EXISTS token_acesso VARCHAR(128);
ALTER TABLE signatarios ADD COLUMN IF NOT EXISTS expira_em TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS idx_signatarios_token ON signatarios (token_acesso) WHERE token_acesso IS NOT NULL;
