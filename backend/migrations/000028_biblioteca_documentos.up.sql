-- Migration 000028: biblioteca de documentos (categorias + arquivos globais)

CREATE TABLE IF NOT EXISTS documento_categorias (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        VARCHAR(100) NOT NULL,
  descricao   VARCHAR(500),
  ordem       INT NOT NULL DEFAULT 0,
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_documento_categorias_nome_active
  ON documento_categorias (lower(nome))
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_documento_categorias_updated
  BEFORE UPDATE ON documento_categorias
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS biblioteca_arquivos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id    UUID NOT NULL REFERENCES documento_categorias(id),
  titulo          VARCHAR(200),
  nome_arquivo    VARCHAR(500) NOT NULL,
  mime_type       VARCHAR(100) NOT NULL,
  tamanho_bytes   BIGINT NOT NULL CHECK (tamanho_bytes > 0),
  storage_path    TEXT NOT NULL,
  uploaded_by     UUID NOT NULL REFERENCES users(id),
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_biblioteca_arquivos_categoria
  ON biblioteca_arquivos (categoria_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_biblioteca_arquivos_uploaded
  ON biblioteca_arquivos (uploaded_at DESC)
  WHERE deleted_at IS NULL;

-- Permissões API documentos
INSERT INTO permissions (code, resource, action, description) VALUES
  ('api.documentos.read', 'documentos', 'read', 'Ler biblioteca de documentos'),
  ('api.documentos.write', 'documentos', 'write', 'Gerenciar categorias e enviar documentos'),
  ('api.documentos.delete', 'documentos', 'delete', 'Excluir categorias e documentos da biblioteca')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'admin'::user_role, p.id
FROM permissions p
WHERE p.code IN ('api.documentos.read', 'api.documentos.write', 'api.documentos.delete')
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'gestor'::user_role, p.id
FROM permissions p
WHERE p.code IN ('api.documentos.read', 'api.documentos.write', 'api.documentos.delete')
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'funcionario'::user_role, p.id
FROM permissions p
WHERE p.code = 'api.documentos.read'
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'terapeuta'::user_role, p.id
FROM permissions p
WHERE p.code = 'api.documentos.read'
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'terceiro'::user_role, p.id
FROM permissions p
WHERE p.code = 'api.documentos.read'
ON CONFLICT (role, permission_id) DO NOTHING;
