DELETE FROM role_permissions
WHERE permission_id IN (
  SELECT id FROM permissions
  WHERE code IN ('api.documentos.read', 'api.documentos.write', 'api.documentos.delete')
);

DELETE FROM permissions
WHERE code IN ('api.documentos.read', 'api.documentos.write', 'api.documentos.delete');

DROP TABLE IF EXISTS biblioteca_arquivos CASCADE;
DROP TABLE IF EXISTS documento_categorias CASCADE;
