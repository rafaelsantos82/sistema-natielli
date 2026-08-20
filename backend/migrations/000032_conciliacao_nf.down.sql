DROP INDEX IF EXISTS idx_nf_acao_judicial;

ALTER TABLE notas_fiscais DROP COLUMN IF EXISTS data_conciliacao;

DELETE FROM role_permissions
WHERE permission_id IN (
  SELECT id FROM permissions WHERE code IN ('api.conciliacao.read', 'api.conciliacao.write')
);

DELETE FROM permissions WHERE code IN ('api.conciliacao.read', 'api.conciliacao.write');
