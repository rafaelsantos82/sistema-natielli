-- Rollback 000033. O valor de enum 'nao_informado' não é removido (limitação do PostgreSQL).
-- O CHECK de 25 anos só volta se não houver linhas que o violem.
-- Unidades novas só são apagadas se nenhum paciente estiver vinculado.

ALTER TABLE pacientes DROP CONSTRAINT IF EXISTS ck_paciente_data_nascimento;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pacientes
    WHERE data_nascimento < CURRENT_DATE - INTERVAL '25 years'
  ) THEN
    ALTER TABLE pacientes
      ADD CONSTRAINT ck_paciente_data_nascimento CHECK (
        data_nascimento <= CURRENT_DATE
        AND data_nascimento >= CURRENT_DATE - INTERVAL '25 years'
      );
  ELSE
    ALTER TABLE pacientes
      ADD CONSTRAINT ck_paciente_data_nascimento CHECK (data_nascimento <= CURRENT_DATE);
  END IF;
END $$;

DELETE FROM unidades
WHERE id IN (
  'a0000000-0000-4000-8000-000000000003',
  'a0000000-0000-4000-8000-000000000004',
  'a0000000-0000-4000-8000-000000000005',
  'a0000000-0000-4000-8000-000000000006'
)
AND NOT EXISTS (
  SELECT 1 FROM paciente_unidades pu WHERE pu.unidade_id = unidades.id
);
