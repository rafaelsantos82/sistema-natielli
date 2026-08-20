-- Conciliação NF x ações judiciais: índice e auditoria de vínculo

ALTER TABLE notas_fiscais
  ADD COLUMN IF NOT EXISTS data_conciliacao TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_nf_acao_judicial
  ON notas_fiscais (acao_judicial_id)
  WHERE acao_judicial_id IS NOT NULL;

INSERT INTO permissions (code, resource, action, description) VALUES
  ('api.conciliacao.read', 'conciliacao', 'read', 'Ler conciliação NF e ações judiciais'),
  ('api.conciliacao.write', 'conciliacao', 'write', 'Conciliar notas fiscais com ações judiciais')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'admin'::user_role, p.id
FROM permissions p
WHERE p.code IN ('api.conciliacao.read', 'api.conciliacao.write')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'gestor'::user_role, p.id
FROM permissions p
WHERE p.code IN ('api.conciliacao.read', 'api.conciliacao.write')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'funcionario'::user_role, p.id
FROM permissions p
WHERE p.code IN ('api.conciliacao.read', 'api.conciliacao.write')
ON CONFLICT DO NOTHING;
