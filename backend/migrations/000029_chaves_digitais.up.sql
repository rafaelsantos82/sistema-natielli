-- Chave digital por unidade + extensão documentos assinados + auditoria

ALTER TYPE audit_acao ADD VALUE IF NOT EXISTS 'chave_digital.cadastro';
ALTER TYPE audit_acao ADD VALUE IF NOT EXISTS 'chave_digital.substituicao';
ALTER TYPE audit_acao ADD VALUE IF NOT EXISTS 'chave_digital.revogacao';
ALTER TYPE audit_acao ADD VALUE IF NOT EXISTS 'chave_digital.validacao_falha';
ALTER TYPE audit_acao ADD VALUE IF NOT EXISTS 'documento.assinatura';
ALTER TYPE audit_acao ADD VALUE IF NOT EXISTS 'documento.assinatura_verificacao';
ALTER TYPE audit_acao ADD VALUE IF NOT EXISTS 'documento.assinatura_download';

CREATE TABLE IF NOT EXISTS chaves_digitais (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id              UUID NOT NULL REFERENCES unidades(id),
  signer_common_name      VARCHAR(300) NOT NULL,
  signer_org              VARCHAR(300),
  signer_cpf              VARCHAR(14),
  cert_valid_from         TIMESTAMPTZ NOT NULL,
  cert_valid_to           TIMESTAMPTZ NOT NULL,
  cert_issuer             VARCHAR(300) NOT NULL,
  cert_serial             VARCHAR(100) NOT NULL,
  algoritmo               VARCHAR(50) NOT NULL DEFAULT 'SHA256withRSA',
  pfx_ciphertext          BYTEA NOT NULL,
  pfx_password_ciphertext BYTEA NOT NULL,
  encryption_key_id       VARCHAR(32) NOT NULL DEFAULT 'v1',
  cadastrada_por          UUID NOT NULL REFERENCES users(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revogada_em             TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_chaves_digitais_unidade_ativa
  ON chaves_digitais (unidade_id)
  WHERE revogada_em IS NULL;

CREATE INDEX IF NOT EXISTS idx_chaves_digitais_unidade ON chaves_digitais (unidade_id);

ALTER TABLE documentos_assinados
  ADD COLUMN IF NOT EXISTS unidade_id UUID REFERENCES unidades(id),
  ADD COLUMN IF NOT EXISTS cadastrado_por UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS original_path VARCHAR(500),
  ADD COLUMN IF NOT EXISTS signed_path VARCHAR(500);

CREATE INDEX IF NOT EXISTS idx_docs_assin_unidade ON documentos_assinados (unidade_id);

INSERT INTO permissions (code, resource, action, description) VALUES
  ('api.chave-digital.read', 'chave-digital', 'read', 'Consultar chave digital da unidade'),
  ('api.chave-digital.write', 'chave-digital', 'write', 'Cadastrar ou revogar chave digital'),
  ('api.documentos-assinados.read', 'documentos-assinados', 'read', 'Listar e verificar documentos assinados'),
  ('api.documentos-assinados.write', 'documentos-assinados', 'write', 'Assinar documentos'),
  ('menu.configuracoes.chave-digital.view', 'menu.configuracoes.chave-digital', 'view', 'Ver menu Chave Digital')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'admin'::user_role, p.id
FROM permissions p
WHERE p.code IN (
  'api.chave-digital.read', 'api.chave-digital.write',
  'api.documentos-assinados.read', 'api.documentos-assinados.write',
  'menu.configuracoes.chave-digital.view'
)
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'gestor'::user_role, p.id
FROM permissions p
WHERE p.code IN (
  'api.chave-digital.read', 'api.chave-digital.write',
  'api.documentos-assinados.read', 'api.documentos-assinados.write',
  'menu.configuracoes.chave-digital.view'
)
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'funcionario'::user_role, p.id
FROM permissions p
WHERE p.code IN ('api.documentos-assinados.read', 'api.documentos-assinados.write')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'terapeuta'::user_role, p.id
FROM permissions p
WHERE p.code IN ('api.documentos-assinados.read', 'api.documentos-assinados.write')
ON CONFLICT DO NOTHING;
