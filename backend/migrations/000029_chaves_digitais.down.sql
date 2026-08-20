DELETE FROM role_permissions
WHERE permission_id IN (
  SELECT id FROM permissions WHERE code IN (
    'api.chave-digital.read', 'api.chave-digital.write',
    'api.documentos-assinados.read', 'api.documentos-assinados.write',
    'menu.configuracoes.chave-digital.view'
  )
);

DELETE FROM permissions WHERE code IN (
  'api.chave-digital.read', 'api.chave-digital.write',
  'api.documentos-assinados.read', 'api.documentos-assinados.write',
  'menu.configuracoes.chave-digital.view'
);

ALTER TABLE documentos_assinados
  DROP COLUMN IF EXISTS signed_path,
  DROP COLUMN IF EXISTS original_path,
  DROP COLUMN IF EXISTS cadastrado_por,
  DROP COLUMN IF EXISTS unidade_id;

DROP TABLE IF EXISTS chaves_digitais;
