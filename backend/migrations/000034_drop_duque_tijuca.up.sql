-- Remove Duque de Caxias e Tijuca (herança Espaço Terapia).
-- Falha se ainda houver paciente/consulta/uso de negócio nessas unidades.

DO $$
DECLARE
  duque  UUID := 'a0000000-0000-4000-8000-000000000001';
  tijuca UUID := 'a0000000-0000-4000-8000-000000000002';
  n BIGINT;
BEGIN
  SELECT COUNT(*) INTO n FROM paciente_unidades WHERE unidade_id IN (duque, tijuca);
  IF n > 0 THEN
    RAISE EXCEPTION 'Não é possível apagar Duque/Tijuca: % paciente(s) vinculado(s). Reatribua ou remova antes.', n;
  END IF;

  SELECT COUNT(*) INTO n FROM consultas WHERE unidade_id IN (duque, tijuca);
  IF n > 0 THEN
    RAISE EXCEPTION 'Não é possível apagar Duque/Tijuca: % consulta(s) vinculada(s).', n;
  END IF;

  SELECT COUNT(*) INTO n
  FROM consultas c
  JOIN salas s ON s.id = c.sala_id
  WHERE s.unidade_id IN (duque, tijuca);
  IF n > 0 THEN
    RAISE EXCEPTION 'Não é possível apagar Duque/Tijuca: % consulta(s) com sala dessas unidades.', n;
  END IF;

  SELECT COUNT(*) INTO n FROM funcionarios_clt WHERE unidade_id IN (duque, tijuca);
  IF n > 0 THEN
    RAISE EXCEPTION 'Não é possível apagar Duque/Tijuca: % funcionário(s) CLT vinculado(s).', n;
  END IF;

  SELECT COUNT(*) INTO n FROM funcionarios_pj WHERE unidade_id IN (duque, tijuca);
  IF n > 0 THEN
    RAISE EXCEPTION 'Não é possível apagar Duque/Tijuca: % funcionário(s) PJ vinculado(s).', n;
  END IF;

  SELECT COUNT(*) INTO n FROM itens_estoque WHERE unidade_id IN (duque, tijuca);
  IF n > 0 THEN
    RAISE EXCEPTION 'Não é possível apagar Duque/Tijuca: % item(ns) de estoque vinculado(s).', n;
  END IF;

  SELECT COUNT(*) INTO n FROM lancamentos WHERE unidade_id IN (duque, tijuca);
  IF n > 0 THEN
    RAISE EXCEPTION 'Não é possível apagar Duque/Tijuca: % lançamento(s) financeiro(s) vinculado(s).', n;
  END IF;

  SELECT COUNT(*) INTO n FROM lancamentos_contabeis WHERE unidade_id IN (duque, tijuca);
  IF n > 0 THEN
    RAISE EXCEPTION 'Não é possível apagar Duque/Tijuca: % lançamento(s) contábil(is) vinculado(s).', n;
  END IF;

  SELECT COUNT(*) INTO n FROM chaves_digitais WHERE unidade_id IN (duque, tijuca);
  IF n > 0 THEN
    RAISE EXCEPTION 'Não é possível apagar Duque/Tijuca: % chave(s) digital(is) vinculada(s).', n;
  END IF;

  SELECT COUNT(*) INTO n FROM documentos_assinados WHERE unidade_id IN (duque, tijuca);
  IF n > 0 THEN
    RAISE EXCEPTION 'Não é possível apagar Duque/Tijuca: % documento(s) assinado(s) vinculado(s).', n;
  END IF;

  SELECT COUNT(*) INTO n FROM materiais_marketing WHERE unidade_id IN (duque, tijuca);
  IF n > 0 THEN
    RAISE EXCEPTION 'Não é possível apagar Duque/Tijuca: % material(is) de marketing vinculado(s).', n;
  END IF;

  SELECT COUNT(*) INTO n FROM aniversariantes WHERE unidade_id IN (duque, tijuca);
  IF n > 0 THEN
    RAISE EXCEPTION 'Não é possível apagar Duque/Tijuca: % aniversariante(s) vinculado(s).', n;
  END IF;

  SELECT COUNT(*) INTO n FROM relatorios_operacionais WHERE unidade_id IN (duque, tijuca);
  IF n > 0 THEN
    RAISE EXCEPTION 'Não é possível apagar Duque/Tijuca: % relatório(s) operacional(is) vinculado(s).', n;
  END IF;
END $$;

-- Realoca vínculos de usuário/profissional para Catanduva antes de apagar as unidades.
INSERT INTO user_unidades (user_id, unidade_id)
SELECT user_id, 'a0000000-0000-4000-8000-000000000003'
FROM user_unidades
WHERE unidade_id IN (
  'a0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000002'
)
ON CONFLICT DO NOTHING;

DELETE FROM user_unidades
WHERE unidade_id IN (
  'a0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000002'
);

INSERT INTO profissional_unidades (profissional_id, unidade_id)
SELECT profissional_id, 'a0000000-0000-4000-8000-000000000003'
FROM profissional_unidades
WHERE unidade_id IN (
  'a0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000002'
)
ON CONFLICT DO NOTHING;

DELETE FROM profissional_unidades
WHERE unidade_id IN (
  'a0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000002'
);

DELETE FROM notification_settings
WHERE unidade_id IN (
  'a0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000002'
);

DELETE FROM salas
WHERE unidade_id IN (
  'a0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000002'
);

DELETE FROM unidades
WHERE id IN (
  'a0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000002'
);
