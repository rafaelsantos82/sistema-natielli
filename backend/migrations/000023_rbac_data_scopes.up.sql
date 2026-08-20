-- Escopo de dados por perfil/recurso (anti-IDOR) + vínculo terapeuta→profissional
-- Seeds de permissões dos perfis terapeuta/responsavel (após enum em 000022).

INSERT INTO role_permissions (role, permission_id)
SELECT 'terapeuta'::user_role, permission_id
FROM role_permissions
WHERE role = 'funcionario'::user_role
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'responsavel'::user_role, id
FROM permissions
WHERE code IN (
  'api.consultas.read',
  'menu.agenda.view',
  'menu.consultas.view'
)
ON CONFLICT (role, permission_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS data_scopes (
  code        TEXT PRIMARY KEY,
  description TEXT NOT NULL
);

INSERT INTO data_scopes (code, description) VALUES
  ('all', 'Todos os registros permitidos pelo perfil'),
  ('self_patient', 'Somente o paciente vinculado ao usuário'),
  ('therapist_patients', 'Pacientes do profissional vinculado ao usuário'),
  ('unit_patients', 'Pacientes das unidades do usuário')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS role_resource_scopes (
  role       user_role NOT NULL,
  resource   TEXT NOT NULL,
  scope_code TEXT NOT NULL REFERENCES data_scopes(code),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role, resource)
);

CREATE INDEX IF NOT EXISTS idx_role_resource_scopes_resource ON role_resource_scopes (resource);

-- Recursos clínicos com escopo padrão por perfil
WITH clinical_resources AS (
  SELECT unnest(ARRAY['pacientes','consultas','prontuario','anamneses','tratamentos']) AS resource
),
role_scope_map AS (
  SELECT 'admin'::user_role AS role, r.resource, 'all'::text AS scope_code FROM clinical_resources r
  UNION ALL
  SELECT 'gestor'::user_role, r.resource, 'all' FROM clinical_resources r
  UNION ALL
  SELECT 'funcionario'::user_role, r.resource, 'unit_patients' FROM clinical_resources r
  UNION ALL
  SELECT 'terceiro'::user_role, r.resource, 'all' FROM clinical_resources r
  UNION ALL
  SELECT 'terapeuta'::user_role, r.resource, 'therapist_patients' FROM clinical_resources r
  UNION ALL
  SELECT 'responsavel'::user_role, r.resource, 'self_patient' FROM clinical_resources r
)
INSERT INTO role_resource_scopes (role, resource, scope_code)
SELECT role, resource, scope_code FROM role_scope_map
ON CONFLICT (role, resource) DO NOTHING;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profissional_id UUID NULL REFERENCES profissionais(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_profissional_id ON users (profissional_id) WHERE profissional_id IS NOT NULL;
