DELETE FROM role_permissions WHERE role IN ('terapeuta'::user_role, 'responsavel'::user_role);

DROP INDEX IF EXISTS idx_users_profissional_id;
ALTER TABLE users DROP COLUMN IF EXISTS profissional_id;

DROP TABLE IF EXISTS role_resource_scopes;
DROP TABLE IF EXISTS data_scopes;
