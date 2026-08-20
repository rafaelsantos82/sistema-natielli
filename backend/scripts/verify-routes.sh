#!/usr/bin/env sh
# Verifica rotas reais da API (HTTP) após make up. Swagger pode estar incompleto
# até todas as handlers terem anotações @Router — HTTP é fonte da verdade.
set -eu

API_BASE="${API_BASE:-http://localhost:8080/api/v1}"
BOOTSTRAP_TOKEN="${BOOTSTRAP_AUTH_TOKEN:-change-bootstrap-token}"

REQUIRED_GET_PATHS="/pacientes /profissionais /consultas /unidades /terapias /salas /anamneses /financeiro/categorias /relatorios-operacionais /comodatos /contratos /audit-log /users"
# unidade_id opcional para profissionais include_deleted — probe separado abaixo

echo "==> Health"
curl -sf "${API_BASE}/health" >/dev/null || {
  echo "ERRO: API indisponível em ${API_BASE}" >&2
  exit 1
}

echo "==> JWT bootstrap"
TOKEN=$(curl -sf -X POST "${API_BASE}/auth/token" \
  -H "Content-Type: application/json" \
  -H "X-Bootstrap-Token: ${BOOTSTRAP_TOKEN}" \
  -d '{"user_id":"00000000-0000-4000-8000-000000000099","email":"admin@verify.test","role":"admin"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['access_token'])")

FAIL=0
for path in $REQUIRED_GET_PATHS; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${TOKEN}" "${API_BASE}${path}")
  if [ "$code" = "404" ]; then
    echo "ERRO: GET ${path} => 404 — imagem Docker desatualizada. Rode: docker compose up --build -d api" >&2
    FAIL=1
  elif [ "$code" != "200" ]; then
    echo "ERRO: GET ${path} => ${code}" >&2
    FAIL=1
  else
    echo "OK GET ${path}"
  fi
done

if [ "$FAIL" -ne 0 ]; then
  exit 1
fi

echo "==> Usuários: include_deleted e restore"
USERS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${TOKEN}" \
  "${API_BASE}/users?include_deleted=true&limit=1")
if [ "$USERS_CODE" != "200" ]; then
  echo "ERRO: GET /users?include_deleted=true => ${USERS_CODE}" >&2
  FAIL=1
else
  echo "OK GET /users?include_deleted=true"
fi

# UUID inexistente: API nova responde 404 JSON (handler RestoreUser); imagem antiga costuma 404 sem rota POST.
RESTORE_CODE=$(curl -s -o /tmp/users-restore-probe.json -w "%{http_code}" -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  "${API_BASE}/users/00000000-0000-4000-8000-000000000010/restore")
if [ "$RESTORE_CODE" = "405" ]; then
  echo "ERRO: POST /users/:id/restore => 405 — rota ausente. Rode: docker compose up --build -d api" >&2
  FAIL=1
elif [ "$RESTORE_CODE" != "404" ] && [ "$RESTORE_CODE" != "409" ] && [ "$RESTORE_CODE" != "200" ]; then
  echo "ERRO: POST /users/:id/restore => ${RESTORE_CODE} (esperado 404/409/200)" >&2
  FAIL=1
else
  echo "OK POST /users/:id/restore (probe => ${RESTORE_CODE})"
fi

echo "==> Profissionais: include_deleted e restore"
PROF_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${TOKEN}" \
  "${API_BASE}/profissionais?include_deleted=true&page_size=1")
if [ "$PROF_CODE" != "200" ]; then
  echo "ERRO: GET /profissionais?include_deleted=true => ${PROF_CODE}" >&2
  FAIL=1
else
  echo "OK GET /profissionais?include_deleted=true"
fi

PROF_RESTORE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  "${API_BASE}/profissionais/00000000-0000-4000-8000-000000000010/restore")
if [ "$PROF_RESTORE" = "405" ]; then
  echo "ERRO: POST /profissionais/:id/restore => 405 — rota ausente. Rode: docker compose up --build -d api" >&2
  FAIL=1
elif [ "$PROF_RESTORE" != "404" ] && [ "$PROF_RESTORE" != "409" ] && [ "$PROF_RESTORE" != "200" ]; then
  echo "ERRO: POST /profissionais/:id/restore => ${PROF_RESTORE} (esperado 404/409/200)" >&2
  FAIL=1
else
  echo "OK POST /profissionais/:id/restore (probe => ${PROF_RESTORE})"
fi

echo "==> Documentos: biblioteca"
DOC_CAT=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${TOKEN}" \
  "${API_BASE}/documentos/categorias")
if [ "$DOC_CAT" != "200" ]; then
  echo "ERRO: GET /documentos/categorias => ${DOC_CAT} (migration 000028 / rebuild API?)" >&2
  FAIL=1
else
  echo "OK GET /documentos/categorias"
fi

DOC_ARQ=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${TOKEN}" \
  "${API_BASE}/documentos/arquivos?page_size=1")
if [ "$DOC_ARQ" != "200" ]; then
  echo "ERRO: GET /documentos/arquivos => ${DOC_ARQ}" >&2
  FAIL=1
else
  echo "OK GET /documentos/arquivos"
fi

DOC_CAT_ID=$(curl -sf -H "Authorization: Bearer ${TOKEN}" "${API_BASE}/documentos/categorias" \
  | python3 -c "import sys,json; d=json.load(sys.stdin).get('data') or []; print(d[0]['id'] if d else '')" 2>/dev/null || true)
if [ -n "${DOC_CAT_ID}" ]; then
  echo "teste verify biblioteca" > /tmp/verify-bib-doc.txt
  DOC_UP_BODY=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/documentos/arquivos" \
    -H "Authorization: Bearer ${TOKEN}" \
    -F "categoria_id=${DOC_CAT_ID}" \
    -F "file=@/tmp/verify-bib-doc.txt")
  DOC_UP_CODE=$(echo "$DOC_UP_BODY" | tail -1)
  DOC_UP_JSON=$(echo "$DOC_UP_BODY" | sed '$d')
  if [ "$DOC_UP_CODE" != "201" ]; then
    echo "ERRO: POST /documentos/arquivos => ${DOC_UP_CODE} (rebuild API?)" >&2
    echo "$DOC_UP_JSON" >&2
    FAIL=1
  else
    echo "OK POST /documentos/arquivos"
    DOC_ARQ_ID=$(echo "$DOC_UP_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || true)
    if [ -n "${DOC_ARQ_ID}" ]; then
      DOC_LIST_JSON=$(curl -sf -H "Authorization: Bearer ${TOKEN}" \
        "${API_BASE}/documentos/arquivos?page_size=5")
      DOC_LIST_NOME=$(echo "$DOC_LIST_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin).get('data') or []
match = next((x for x in data if x.get('id') == '${DOC_ARQ_ID}'), None)
print((match or {}).get('nome_arquivo', ''))
" 2>/dev/null || true)
      if [ -z "$DOC_LIST_NOME" ]; then
        echo "ERRO: GET /documentos/arquivos — item ${DOC_ARQ_ID} sem nome_arquivo (bug Count/Find? rebuild API)" >&2
        FAIL=1
      else
        echo "OK GET /documentos/arquivos (metadados: nome_arquivo=${DOC_LIST_NOME})"
      fi
      DOC_DEL=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
        -H "Authorization: Bearer ${TOKEN}" \
        "${API_BASE}/documentos/arquivos/${DOC_ARQ_ID}")
      if [ "$DOC_DEL" != "204" ]; then
        echo "ERRO: DELETE /documentos/arquivos/:id => ${DOC_DEL}" >&2
        FAIL=1
      else
        echo "OK DELETE /documentos/arquivos/:id"
      fi
    fi
  fi
  rm -f /tmp/verify-bib-doc.txt
else
  echo "AVISO: sem categoria em /documentos/categorias — pulando probe POST/DELETE de arquivos"
fi

echo "==> Contratos: create multipart"
printf '%%PDF-1.4\nverify contrato\n' > /tmp/verify-contrato.pdf
CONTR_UP_BODY=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/contratos" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "titulo=Contrato Verify" \
  -F "tipo=Atendimento" \
  -F "file=@/tmp/verify-contrato.pdf;type=application/pdf")
CONTR_UP_CODE=$(echo "$CONTR_UP_BODY" | tail -1)
CONTR_UP_JSON=$(echo "$CONTR_UP_BODY" | sed '$d')
if [ "$CONTR_UP_CODE" != "201" ]; then
  echo "ERRO: POST /contratos (multipart) => ${CONTR_UP_CODE} — migration 000031 aplicada? rebuild API?" >&2
  echo "$CONTR_UP_JSON" >&2
  FAIL=1
else
  echo "OK POST /contratos (multipart)"
  CONTR_ID=$(echo "$CONTR_UP_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || true)
  if [ -n "$CONTR_ID" ]; then
    CONTR_DEL=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
      -H "Authorization: Bearer ${TOKEN}" \
      "${API_BASE}/contratos/${CONTR_ID}")
    if [ "$CONTR_DEL" != "204" ]; then
      echo "ERRO: DELETE /contratos/:id => ${CONTR_DEL}" >&2
      FAIL=1
    else
      echo "OK DELETE /contratos/:id (cleanup probe)"
    fi
  fi
fi
rm -f /tmp/verify-contrato.pdf

echo "==> Marketing: manuais"
MKT_LIST=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${TOKEN}" \
  "${API_BASE}/marketing/manuais?page_size=1")
if [ "$MKT_LIST" != "200" ]; then
  echo "ERRO: GET /marketing/manuais => ${MKT_LIST}" >&2
  FAIL=1
else
  echo "OK GET /marketing/manuais"
  echo "manual verify" > /tmp/verify-mkt-manual.pdf
  MKT_UP_BODY=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/marketing/manuais/upload" \
    -H "Authorization: Bearer ${TOKEN}" \
    -F "file=@/tmp/verify-mkt-manual.pdf;type=application/pdf" \
    -F "titulo=Manual Verify" \
    -F "versao=1.0" \
    -F "publico_alvo=Interno" \
    -F "status=Rascunho")
  MKT_UP_CODE=$(echo "$MKT_UP_BODY" | tail -n1)
  if [ "$MKT_UP_CODE" != "201" ]; then
    echo "ERRO: POST /marketing/manuais/upload => ${MKT_UP_CODE} (rebuild API?)" >&2
    FAIL=1
  else
    echo "OK POST /marketing/manuais/upload"
    MKT_MANUAL_ID=$(echo "$MKT_UP_BODY" | sed '$d' | python3 -c "import sys,json; d=json.load(sys.stdin); print((d.get('data') or {}).get('id',''))" 2>/dev/null || true)
    if [ -n "$MKT_MANUAL_ID" ]; then
      MKT_DL=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${TOKEN}" \
        "${API_BASE}/marketing/manuais/${MKT_MANUAL_ID}/download")
      if [ "$MKT_DL" != "200" ]; then
        echo "ERRO: GET /marketing/manuais/:id/download => ${MKT_DL}" >&2
        FAIL=1
      else
        echo "OK GET /marketing/manuais/:id/download"
      fi
      MKT_DEL=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
        -H "Authorization: Bearer ${TOKEN}" \
        "${API_BASE}/marketing/manuais/${MKT_MANUAL_ID}")
      if [ "$MKT_DEL" != "204" ]; then
        echo "ERRO: DELETE /marketing/manuais/:id => ${MKT_DEL}" >&2
        FAIL=1
      else
        echo "OK DELETE /marketing/manuais/:id"
      fi
    fi
  fi
  rm -f /tmp/verify-mkt-manual.pdf
fi

echo "==> Conciliação NF x ações judiciais"
CONC_RESUMO=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${TOKEN}" \
  "${API_BASE}/acoes-judiciais/conciliacao-resumo?page_size=1")
if [ "$CONC_RESUMO" != "200" ]; then
  echo "ERRO: GET /acoes-judiciais/conciliacao-resumo => ${CONC_RESUMO} (migration 000032 / rebuild API?)" >&2
  FAIL=1
else
  echo "OK GET /acoes-judiciais/conciliacao-resumo"
fi

ACAO_ID=$(curl -sf -H "Authorization: Bearer ${TOKEN}" "${API_BASE}/acoes-judiciais?page_size=1" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('data') or []; print(items[0]['id'] if items else '')" 2>/dev/null || true)
if [ -n "$ACAO_ID" ]; then
  CONC_DET=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${TOKEN}" \
    "${API_BASE}/acoes-judiciais/${ACAO_ID}/conciliacao")
  if [ "$CONC_DET" != "200" ]; then
    echo "ERRO: GET /acoes-judiciais/:id/conciliacao => ${CONC_DET}" >&2
    FAIL=1
  else
    echo "OK GET /acoes-judiciais/:id/conciliacao"
  fi
else
  echo "AVISO: sem ação judicial para probe GET /:id/conciliacao"
fi

NOTA_ID=$(curl -sf -H "Authorization: Bearer ${TOKEN}" "${API_BASE}/notas-fiscais?page_size=1" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('data') or []; print(items[0]['id'] if items else '')" 2>/dev/null || true)
if [ -n "$NOTA_ID" ]; then
  CONC_POST=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"acao_judicial_id":"00000000-0000-4000-8000-000000000099","valor_pago":0}' \
    "${API_BASE}/notas-fiscais/${NOTA_ID}/conciliar")
  if [ "$CONC_POST" = "405" ]; then
    echo "ERRO: POST /notas-fiscais/:id/conciliar => 405 — rota ausente. Rode: docker compose up --build -d api" >&2
    FAIL=1
  elif [ "$CONC_POST" != "400" ] && [ "$CONC_POST" != "404" ] && [ "$CONC_POST" != "200" ]; then
    echo "ERRO: POST /notas-fiscais/:id/conciliar => ${CONC_POST} (esperado 400/404/200)" >&2
    FAIL=1
  else
    echo "OK POST /notas-fiscais/:id/conciliar (probe => ${CONC_POST})"
  fi
else
  echo "AVISO: sem nota fiscal para probe POST /conciliar"
fi

echo "==> Chave digital e documentos assinados"
UNIDADE_ID=$(curl -sf -H "Authorization: Bearer ${TOKEN}" "${API_BASE}/unidades?page_size=1" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('data') or []; print(items[0]['id'] if items else '')" 2>/dev/null || true)
if [ -z "$UNIDADE_ID" ]; then
  echo "AVISO: sem unidade para probe chave-digital/documentos-assinados" >&2
else
  CHAVE_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${TOKEN}" \
    "${API_BASE}/unidades/${UNIDADE_ID}/chave-digital")
  if [ "$CHAVE_CODE" != "200" ]; then
    echo "ERRO: GET /unidades/:id/chave-digital => ${CHAVE_CODE}" >&2
    FAIL=1
  else
    echo "OK GET /unidades/:id/chave-digital"
  fi
  DOCS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${TOKEN}" \
    "${API_BASE}/documentos-assinados?unidade_id=${UNIDADE_ID}&page_size=1")
  if [ "$DOCS_CODE" != "200" ]; then
    echo "ERRO: GET /documentos-assinados => ${DOCS_CODE}" >&2
    FAIL=1
  else
    echo "OK GET /documentos-assinados"
  fi
fi

if [ "$FAIL" -ne 0 ]; then
  exit 1
fi

echo "==> Swagger doc.json (opcional)"
SWAGGER_CODE=$(curl -s -o /tmp/swagger-doc.json -w "%{http_code}" "${API_BASE}/swagger/doc.json")
if [ "$SWAGGER_CODE" = "404" ]; then
  echo "AVISO: Swagger desabilitado (SWAGGER_ENABLED=false)." >&2
  echo "==> Rotas HTTP verificadas com sucesso"
  exit 0
fi

if [ "$SWAGGER_CODE" != "200" ]; then
  echo "AVISO: swagger/doc.json => ${SWAGGER_CODE}" >&2
  echo "==> Rotas HTTP verificadas com sucesso"
  exit 0
fi

COUNT=$(python3 -c "import json; print(len(json.load(open('/tmp/swagger-doc.json')).get('paths',{})))")
ONLY_PAC=$(python3 -c "
import json
paths=list(json.load(open('/tmp/swagger-doc.json')).get('paths',{}).keys())
print('yes' if paths and all(p.startswith('/pacientes') for p in paths) else 'no')
")

echo "Swagger paths documentados: ${COUNT}"
if [ "$ONLY_PAC" = "yes" ]; then
  echo "AVISO: Swagger só documenta /pacientes (faltam anotações swag nos demais handlers)." >&2
  echo "      A API responde nos módulos acima — rode 'make swagger' após adicionar @Router." >&2
elif [ "$COUNT" -lt 50 ]; then
  echo "AVISO: Swagger parcial (${COUNT} paths). Rode 'make swagger' após alterar handlers." >&2
fi

echo "==> Rotas verificadas com sucesso"
