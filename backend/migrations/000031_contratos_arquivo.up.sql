-- Contratos: armazenamento de arquivo (PDF/DOC/DOCX) em vez de texto obrigatório

ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS arquivo_nome VARCHAR(512),
  ADD COLUMN IF NOT EXISTS arquivo_mime VARCHAR(128),
  ADD COLUMN IF NOT EXISTS arquivo_tamanho_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS storage_path VARCHAR(1024);

ALTER TABLE contratos ALTER COLUMN conteudo DROP NOT NULL;
