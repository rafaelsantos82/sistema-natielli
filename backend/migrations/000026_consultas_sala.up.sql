-- Migration 000026: sala obrigatória no agendamento (coluna nullable para legado; API exige em novos saves)

ALTER TABLE consultas ADD COLUMN IF NOT EXISTS sala_id UUID REFERENCES salas(id);

UPDATE consultas c
SET sala_id = r.sala_id
FROM reservas r
WHERE r.consulta_id = c.id
  AND c.sala_id IS NULL
  AND r.sala_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_consultas_sala ON consultas (sala_id);
