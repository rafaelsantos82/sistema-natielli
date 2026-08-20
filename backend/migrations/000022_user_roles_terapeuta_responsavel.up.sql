-- Terapeuta / Responsável: novos valores de user_role e vínculo usuário→paciente.
-- Seeds RBAC para os novos perfis ficam em 000023 (enum não pode ser usado na mesma transação).

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'terapeuta';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'responsavel';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS paciente_id UUID REFERENCES pacientes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_paciente_id ON users (paciente_id) WHERE paciente_id IS NOT NULL;
