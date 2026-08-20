-- Carteira dinâmica terapeuta ↔ paciente (vínculo por consulta/agendamento)

CREATE TABLE IF NOT EXISTS paciente_profissionais (
  paciente_id            UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  profissional_id        UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  origem                 TEXT NOT NULL DEFAULT 'consulta_agendada'
    CHECK (origem IN ('consulta_agendada', 'consulta_realizada', 'backfill')),
  primeira_consulta_id   UUID NULL REFERENCES consultas(id) ON DELETE SET NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (paciente_id, profissional_id)
);

CREATE INDEX IF NOT EXISTS idx_pp_profissional ON paciente_profissionais (profissional_id);
CREATE INDEX IF NOT EXISTS idx_pp_paciente ON paciente_profissionais (paciente_id);

CREATE TRIGGER trg_paciente_profissionais_updated
  BEFORE UPDATE ON paciente_profissionais
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

INSERT INTO paciente_profissionais (paciente_id, profissional_id, origem, primeira_consulta_id)
SELECT DISTINCT ON (c.paciente_id, c.profissional_id)
  c.paciente_id,
  c.profissional_id,
  'backfill',
  c.id
FROM consultas c
WHERE c.status <> 'cancelada'
ORDER BY c.paciente_id, c.profissional_id, c.created_at ASC
ON CONFLICT (paciente_id, profissional_id) DO NOTHING;

UPDATE data_scopes
SET description = 'Pacientes da carteira do profissional (vínculo por consulta/agendamento)'
WHERE code = 'therapist_patients';
