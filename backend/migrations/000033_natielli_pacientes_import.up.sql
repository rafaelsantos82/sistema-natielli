-- Natielli: clínica não é pediátrica (remove teto de 25 anos).
-- Unidades reais da planilha de clientes. Duque de Caxias / Tijuca permanecem.

ALTER TABLE pacientes DROP CONSTRAINT IF EXISTS ck_paciente_data_nascimento;

ALTER TABLE pacientes
  ADD CONSTRAINT ck_paciente_data_nascimento CHECK (data_nascimento <= CURRENT_DATE);

-- PG 16: ADD VALUE em transação da migration é permitido; o valor só é usado depois do commit (seed CLI).
ALTER TYPE sexo_biologico ADD VALUE IF NOT EXISTS 'nao_informado';

INSERT INTO unidades (id, nome, slug, status) VALUES
  ('a0000000-0000-4000-8000-000000000003', 'Catanduva', 'unidade-catanduva', 'ativa'),
  ('a0000000-0000-4000-8000-000000000004', 'Londrina', 'unidade-londrina', 'ativa'),
  ('a0000000-0000-4000-8000-000000000005', 'Sertanópolis', 'unidade-sertanopolis', 'ativa'),
  ('a0000000-0000-4000-8000-000000000006', 'Online', 'unidade-online', 'ativa')
ON CONFLICT (slug) DO NOTHING;
