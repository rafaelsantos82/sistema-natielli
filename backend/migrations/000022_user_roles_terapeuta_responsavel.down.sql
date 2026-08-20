-- Enum user_role não remove valores 'terapeuta'/'responsavel' (limitação PostgreSQL).

DELETE FROM role_permissions WHERE role IN ('terapeuta'::user_role, 'responsavel'::user_role);

DROP INDEX IF EXISTS idx_users_paciente_id;

ALTER TABLE users DROP COLUMN IF EXISTS paciente_id;
