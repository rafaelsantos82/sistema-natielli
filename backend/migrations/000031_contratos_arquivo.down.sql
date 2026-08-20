ALTER TABLE contratos DROP COLUMN IF EXISTS storage_path;
ALTER TABLE contratos DROP COLUMN IF EXISTS arquivo_tamanho_bytes;
ALTER TABLE contratos DROP COLUMN IF EXISTS arquivo_mime;
ALTER TABLE contratos DROP COLUMN IF EXISTS arquivo_nome;

-- Restaura NOT NULL apenas se não houver linhas com conteudo NULL
ALTER TABLE contratos ALTER COLUMN conteudo SET NOT NULL;
