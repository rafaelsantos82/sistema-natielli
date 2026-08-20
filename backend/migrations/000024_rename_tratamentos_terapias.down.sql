ALTER TABLE relatorios_operacionais RENAME COLUMN terapia TO tratamento;

UPDATE role_resource_scopes SET resource = 'tratamentos' WHERE resource = 'terapias';

UPDATE permissions
SET
  code = REPLACE(code, 'terapias', 'tratamentos'),
  resource = REPLACE(resource, 'terapias', 'tratamentos'),
  description = REPLACE(REPLACE(description, 'Terapias', 'Tratamentos'), 'terapias', 'tratamentos')
WHERE code LIKE '%terapias%' OR resource LIKE '%terapias%';

ALTER INDEX IF EXISTS idx_precos_terapia_vigencia RENAME TO idx_precos_vigencia;
ALTER INDEX IF EXISTS idx_precos_terapia_prof RENAME TO idx_precos_prof;
ALTER TRIGGER trg_precos_terapia_updated ON precos_terapia RENAME TO trg_precos_updated;

ALTER TABLE precos_terapia RENAME COLUMN nome_terapia TO tratamento;
ALTER TABLE precos_terapia RENAME TO precos_tratamento;

ALTER INDEX IF EXISTS idx_terapia_itens_terapia RENAME TO idx_trat_itens_trat;
ALTER TABLE terapia_itens_regime RENAME COLUMN terapia_id TO tratamento_id;
ALTER TABLE terapia_itens_regime RENAME TO tratamento_itens_regime;

ALTER INDEX IF EXISTS idx_terapias_status RENAME TO idx_tratamentos_status;
ALTER TRIGGER trg_terapias_updated ON terapias RENAME TO trg_tratamentos_updated;
ALTER TABLE terapias RENAME COLUMN nome_terapia TO nome_tratamento;
ALTER TABLE terapias RENAME TO tratamentos;

ALTER TYPE terapia_status RENAME TO tratamento_status;
