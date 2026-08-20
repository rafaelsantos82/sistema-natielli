DROP TRIGGER IF EXISTS trg_paciente_profissionais_updated ON paciente_profissionais;
DROP TABLE IF EXISTS paciente_profissionais;

UPDATE data_scopes
SET description = 'Pacientes do profissional vinculado ao usuário'
WHERE code = 'therapist_patients';
