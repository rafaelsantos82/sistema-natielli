-- Renomear módulo Tratamentos → Terapias (tabelas, colunas, enum, RBAC)

ALTER TYPE tratamento_status RENAME TO terapia_status;

ALTER TABLE tratamentos RENAME TO terapias;
ALTER TABLE terapias RENAME COLUMN nome_tratamento TO nome_terapia;

ALTER TRIGGER trg_tratamentos_updated ON terapias RENAME TO trg_terapias_updated;
ALTER INDEX IF EXISTS idx_tratamentos_status RENAME TO idx_terapias_status;

ALTER TABLE tratamento_itens_regime RENAME TO terapia_itens_regime;
ALTER TABLE terapia_itens_regime RENAME COLUMN tratamento_id TO terapia_id;
ALTER INDEX IF EXISTS idx_trat_itens_trat RENAME TO idx_terapia_itens_terapia;

ALTER TABLE precos_tratamento RENAME TO precos_terapia;
ALTER TABLE precos_terapia RENAME COLUMN tratamento TO nome_terapia;

ALTER TRIGGER trg_precos_updated ON precos_terapia RENAME TO trg_precos_terapia_updated;
ALTER INDEX IF EXISTS idx_precos_prof RENAME TO idx_precos_terapia_prof;
ALTER INDEX IF EXISTS idx_precos_vigencia RENAME TO idx_precos_terapia_vigencia;

-- Permissões e escopo RBAC
UPDATE permissions
SET
  code = REPLACE(code, 'tratamentos', 'terapias'),
  resource = REPLACE(resource, 'tratamentos', 'terapias'),
  description = REPLACE(REPLACE(description, 'Tratamentos', 'Terapias'), 'tratamentos', 'terapias')
WHERE code LIKE '%tratamentos%' OR resource LIKE '%tratamentos%';

UPDATE role_resource_scopes
SET resource = 'terapias'
WHERE resource = 'tratamentos';

ALTER TABLE relatorios_operacionais RENAME COLUMN tratamento TO terapia;
