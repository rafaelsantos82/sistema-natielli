#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:8080/api/v1}"
BOOTSTRAP_AUTH_TOKEN="${BOOTSTRAP_AUTH_TOKEN:-change-bootstrap-token}"
UNIDADE_ID_DEFAULT="${UNIDADE_ID_DEFAULT:-a0000000-0000-4000-8000-000000000003}"

RUN_ID="${RUN_ID:-DEMO-$(date +%Y%m%d-%H%M%S)}"

require() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERRO: comando obrigatório não encontrado: $1" >&2
    exit 1
  }
}

require curl
require python3

json_get() {
  python3 -c '
import json,sys
path = sys.argv[1]
try:
    raw = sys.stdin.read()
    if not raw.strip():
        sys.exit(0)
    doc = json.loads(raw)
except Exception:
    sys.exit(0)
cur = doc
for part in path.split("."):
    if part == "":
        continue
    if isinstance(cur, dict):
        cur = cur.get(part)
    else:
        cur = None
    if cur is None:
        break
if cur is None:
    sys.exit(0)
if isinstance(cur, (dict,list)):
    print(json.dumps(cur))
else:
    print(cur)
' "$@"
}

issue_token() {
  curl -sS -X POST "${API_BASE}/auth/token" \
    -H "Content-Type: application/json" \
    -H "X-Bootstrap-Token: ${BOOTSTRAP_AUTH_TOKEN}" \
    -d '{"user_id":"00000000-0000-4000-8000-000000000099","email":"sistema@espacoterapia.local","role":"admin"}'
}

TOKEN="$(issue_token | json_get "data.access_token")"
if [ -z "${TOKEN}" ]; then
  echo "ERRO: não foi possível obter JWT via bootstrap em ${API_BASE}/auth/token" >&2
  echo "DICA: verifique se o backend está no ar e se BOOTSTRAP_AUTH_TOKEN confere." >&2
  echo "Resposta /auth/token:" >&2
  issue_token >&2 || true
  exit 1
fi

api_call() {
  local method="$1"
  local path="$2"
  local body="${3:-}"

  local tmp
  tmp="$(mktemp)"
  local code

  if [ -n "${body}" ]; then
    code="$(curl -sS -o "${tmp}" -w "%{http_code}" \
      -X "${method}" "${API_BASE}${path}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "${body}")"
  else
    code="$(curl -sS -o "${tmp}" -w "%{http_code}" \
      -X "${method}" "${API_BASE}${path}" \
      -H "Authorization: Bearer ${TOKEN}")"
  fi

  echo "${code} ${method} ${path}" >&2
  cat "${tmp}"
  rm -f "${tmp}"
}

create_id() {
  local method="$1"
  local path="$2"
  local body="$3"
  local resp
  resp="$(api_call "${method}" "${path}" "${body}")"
  local id
  id="$(printf "%s" "${resp}" | json_get "data.id")"
  if [ -z "${id}" ]; then
    echo "ERRO: não foi possível extrair data.id em ${method} ${path}" >&2
    echo "Resposta:" >&2
    printf "%s\n" "${resp}" >&2
    exit 1
  fi
  printf "%s" "${id}"
}

echo "==> Seed demo: ${RUN_ID}"
echo "API_BASE=${API_BASE}"
echo "UNIDADE_ID=${UNIDADE_ID_DEFAULT}"
echo

# ---- Core: Paciente ----
PACIENTE_NOME="${RUN_ID} Paciente"
PACIENTE_TEL="21987654321"
PACIENTE_CEP="20040-020"
PACIENTE_UF="RJ"
PACIENTE_RESP_NOME="${RUN_ID} Responsável"

PACIENTE_ID="$(create_id POST /pacientes "$(cat <<JSON
{
  "nome_completo":"${PACIENTE_NOME}",
  "data_nascimento":"2018-06-15",
  "sexo_biologico":"masculino",
  "tel_principal":"${PACIENTE_TEL}",
  "uf":"${PACIENTE_UF}",
  "cep":"${PACIENTE_CEP}",
  "responsavel_nome":"${PACIENTE_RESP_NOME}",
  "responsavel_cpf":"11144477735",
  "pessoas_autorizadas_busca":[],
  "vacinas":[],
  "status":"ativo",
  "consentimento_lgpd":true,
  "autorizacao_uso_imagem":false,
  "documentos_anexos":[],
  "unidade_ids":[{"unidade_id":"${UNIDADE_ID_DEFAULT}","principal":true}]
}
JSON
)")"
echo "PACIENTE_ID=${PACIENTE_ID}"

# ---- Core: Profissional ----
PROF_NOME="${RUN_ID} Profissional"
PROF_EMAIL="seed-${RUN_ID}@test.local"

PROF_ID="$(create_id POST /profissionais "$(cat <<JSON
{
  "nome":"${PROF_NOME}",
  "email":"${PROF_EMAIL}",
  "unidade_ids":["${UNIDADE_ID_DEFAULT}"],
  "status":"ativo",
  "consentimento_lgpd":true,
  "dias_atendimento":["seg"],
  "especialidades":["Psicólogo Clínico"]
}
JSON
)")"
echo "PROF_ID=${PROF_ID}"

# ---- Core: Consulta ----
CONSULTA_DATA="$(date -u -v+1d +%Y-%m-%dT10:00:00Z)"
CONSULTA_MOTIVO="${RUN_ID} Consulta"

CONSULTA_ID="$(create_id POST /consultas "$(cat <<JSON
{
  "paciente_id":"${PACIENTE_ID}",
  "profissional_id":"${PROF_ID}",
  "unidade_id":"${UNIDADE_ID_DEFAULT}",
  "data_hora":"${CONSULTA_DATA}",
  "duracao":60,
  "motivo":"${CONSULTA_MOTIVO}"
}
JSON
)")"
echo "CONSULTA_ID=${CONSULTA_ID}"

# ---- Infra: Sala + Reserva ----
SALA_NOME="${RUN_ID} Sala 01"
SALA_ID="$(create_id POST /salas "$(cat <<JSON
{
  "nome_sala":"${SALA_NOME}",
  "unidade_id":"${UNIDADE_ID_DEFAULT}",
  "status":"Ativa",
  "especialidades":["Psicólogo Clínico"],
  "recursos":["Ar-condicionado"]
}
JSON
)")"
echo "SALA_ID=${SALA_ID}"

RESERVA_DATA="$(date -u -v+1d +%Y-%m-%dT11:00:00Z)"
RESERVA_ID="$(create_id POST "/salas/${SALA_ID}/reservas" "$(cat <<JSON
{
  "data_hora_inicio":"${RESERVA_DATA}",
  "duracao":60,
  "profissional_id":"${PROF_ID}",
  "profissional_nome":"${PROF_NOME}",
  "consulta_id":"${CONSULTA_ID}"
}
JSON
)")"
echo "RESERVA_ID=${RESERVA_ID}"

# ---- Notification settings (para tela de Configurações) ----
api_call PUT "/notification-settings?unidade_id=${UNIDADE_ID_DEFAULT}" "$(cat <<JSON
{
  "email_enabled": true,
  "sms_enabled": false,
  "horas_antecedencia": 24
}
JSON
)" >/dev/null

# ---- Wave2: Tratamento / Anamnese / Resposta ----
TRAT_ID="$(create_id POST /terapias "$(cat <<JSON
{
  "nome_terapia":"${RUN_ID} Tratamento",
  "objetivo_terapeutico":"Seed demo",
  "diretriz_protocolar":"Diretriz interna",
  "itens_regime":[
    {"id":"00000000-0000-0000-0000-000000000000","medicamento":"Vitamina D","via":"VO","dose":1,"dose_unidade":"UI","frequencia":"1x/dia"}
  ],
  "status":"Ativo",
  "versao":1
}
JSON
)")"
echo "TRATAMENTO_ID=${TRAT_ID}"

ANAMNESE_NOME="${RUN_ID} Anamnese"
ANAMNESE_ID="$(create_id POST /anamneses "$(cat <<JSON
{
  "nome":"${ANAMNESE_NOME}",
  "especialidade":"Psicologia",
  "versao":"1",
  "status":"Ativa",
  "questionnaire": {"title":"${ANAMNESE_NOME}","items":[]}
}
JSON
)")"
echo "ANAMNESE_ID=${ANAMNESE_ID}"

RESP_ID="$(create_id POST /respostas-anamnese "$(cat <<JSON
{
  "questionnaire_id":"${ANAMNESE_ID}",
  "questionnaire_nome":"${ANAMNESE_NOME}",
  "patient_id":"${PACIENTE_ID}",
  "patient_nome":"${PACIENTE_NOME}",
  "encounter_id":"${CONSULTA_ID}",
  "respostas": {"demo": true, "run_id":"${RUN_ID}"}
}
JSON
)")"
echo "RESPOSTA_ANAMNESE_ID=${RESP_ID}"

# ---- Financeiro / Relatórios ----
CATEG_ID="$(create_id POST /financeiro/categorias "$(cat <<JSON
{
  "nome":"${RUN_ID} Categoria",
  "tipo":"Receita"
}
JSON
)")"
echo "CATEGORIA_ID=${CATEG_ID}"

CC_ID="$(create_id POST /financeiro/centros-custo "$(cat <<JSON
{
  "codigo":"CC-$(date +%s)",
  "nome":"${RUN_ID} Centro de Custo",
  "ativo": true
}
JSON
)")"
echo "CENTRO_CUSTO_ID=${CC_ID}"

LANC_ID="$(create_id POST /financeiro/lancamentos "$(cat <<JSON
{
  "tipo":"Receita",
  "descricao":"${RUN_ID} Lançamento",
  "valor": 123.45,
  "data_vencimento":"$(date -u +%Y-%m-%d)",
  "categoria_id":"${CATEG_ID}",
  "categoria_nome":"${RUN_ID} Categoria",
  "centro_custo_id":"${CC_ID}",
  "centro_custo_nome":"${RUN_ID} Centro de Custo",
  "status":"Pendente",
  "recorrente": false,
  "conciliado": false,
  "unidade_id":"${UNIDADE_ID_DEFAULT}"
}
JSON
)")"
echo "LANCAMENTO_ID=${LANC_ID}"

REL_ID="$(create_id POST /relatorios-operacionais "$(cat <<JSON
{
  "numero":"${RUN_ID}-001",
  "paciente_nome":"${PACIENTE_NOME}",
  "profissional_nome":"${PROF_NOME}",
  "terapia":"${RUN_ID} Tratamento",
  "periodo":"$(date -u +%Y-%m)",
  "valor": 200.0,
  "status":"rascunho",
  "unidade_id":"${UNIDADE_ID_DEFAULT}",
  "historico_versoes": []
}
JSON
)")"
echo "RELATORIO_OPERACIONAL_ID=${REL_ID}"

# ---- RH ----
FUNC_CLT_ID="$(create_id POST /rh/funcionarios-clt "$(cat <<JSON
{
  "unidade_id":"${UNIDADE_ID_DEFAULT}",
  "nome":"${RUN_ID} Func CLT",
  "cpf":"1$(date +%s)",
  "cargo":"Recepção",
  "salario_base": 2500.0,
  "data_admissao":"$(date -u -v-30d +%Y-%m-%d)",
  "ativo": true,
  "dependentes": 0,
  "vale_transporte": true,
  "vale_alimentacao": 250.0
}
JSON
)")"
echo "FUNCIONARIO_CLT_ID=${FUNC_CLT_ID}"

FUNC_PJ_ID="$(create_id POST /rh/funcionarios-pj "$(cat <<JSON
{
  "unidade_id":"${UNIDADE_ID_DEFAULT}",
  "nome":"${RUN_ID} Func PJ",
  "cnpj":"12$(date +%s)0000",
  "razao_social":"${RUN_ID} Serviços LTDA",
  "servico":"Fonoaudiologia",
  "valor_hora": 120.0,
  "data_inicio":"$(date -u -v-10d +%Y-%m-%d)",
  "ativo": true
}
JSON
)")"
echo "FUNCIONARIO_PJ_ID=${FUNC_PJ_ID}"

FOLHA_CLT_ID="$(create_id POST /rh/folhas-clt "$(cat <<JSON
{
  "funcionario_id":"${FUNC_CLT_ID}",
  "mes_referencia":"$(date -u +%Y-%m)",
  "salario_base":2500.0,
  "salario_liquido":2300.0,
  "status":"pendente"
}
JSON
)")"
echo "FOLHA_CLT_ID=${FOLHA_CLT_ID}"

FOLHA_PJ_ID="$(create_id POST /rh/folhas-pj "$(cat <<JSON
{
  "funcionario_id":"${FUNC_PJ_ID}",
  "mes_referencia":"$(date -u +%Y-%m)",
  "horas_trabalhadas": 10,
  "valor_hora": 120.0,
  "valor_total": 1200.0,
  "valor_liquido": 1100.0,
  "status":"pendente"
}
JSON
)")"
echo "FOLHA_PJ_ID=${FOLHA_PJ_ID}"

# ---- Estoque ----
ITEM_EST_ID="$(create_id POST /estoque/itens "$(cat <<JSON
{
  "unidade_id":"${UNIDADE_ID_DEFAULT}",
  "codigo":"IT-$(date +%s)",
  "nome":"${RUN_ID} Item",
  "categoria":"Consumíveis",
  "unidade_medida":"un",
  "estoque_atual": 5,
  "estoque_minimo": 2,
  "status":"Ativo"
}
JSON
)")"
echo "ITEM_ESTOQUE_ID=${ITEM_EST_ID}"

MOV_ID="$(create_id POST /estoque/movimentacoes "$(cat <<JSON
{
  "item_id":"${ITEM_EST_ID}",
  "item_nome":"${RUN_ID} Item",
  "tipo":"Entrada",
  "quantidade": 1,
  "motivo":"Seed demo",
  "responsavel_id":"${PROF_ID}",
  "responsavel_nome":"${PROF_NOME}"
}
JSON
)")"
echo "MOVIMENTACAO_ID=${MOV_ID}"

INV_ID="$(create_id POST /estoque/inventarios "$(cat <<JSON
{
  "data":"$(date -u +%Y-%m-%d)",
  "responsavel_id":"${PROF_ID}",
  "responsavel_nome":"${PROF_NOME}",
  "contagens":[{"item_id":"${ITEM_EST_ID}","item_nome":"${RUN_ID} Item","estoque_sistema":5,"contagem_fisica":5}]
}
JSON
)")"
echo "INVENTARIO_ID=${INV_ID}"

# ---- Comodatos / Planos / Ações / NF / Contratos / Marketing / Contabilidade ----
COMOD_ID="$(create_id POST /comodatos "$(cat <<JSON
{
  "item_nome":"${RUN_ID} Item",
  "paciente_id":"${PACIENTE_ID}",
  "paciente_nome":"${PACIENTE_NOME}",
  "data_emprestimo":"$(date -u +%Y-%m-%d)",
  "data_devolucao_prevista":"$(date -u -v+30d +%Y-%m-%d)",
  "status":"Emprestado",
  "condicao_entrega":"novo",
  "responsavel_id":"${PROF_ID}",
  "responsavel_nome":"${PROF_NOME}",
  "quantidade": 1
}
JSON
)")"
echo "COMODATO_ID=${COMOD_ID}"

PLANO_NOME="${RUN_ID} Plano"
PLANO_ID="$(create_id POST /planos-saude "$(cat <<JSON
{
  "nome":"${PLANO_NOME}",
  "cnpj":"12$(date +%s)0000",
  "registro_ans":"ANS-${RUN_ID}",
  "telefone":"21999999999",
  "email":"plano-${RUN_ID}@test.local",
  "endereco":"Rua Demo, 123",
  "ativo": true
}
JSON
)")"
echo "PLANO_SAUDE_ID=${PLANO_ID}"

ACAO_ID="$(create_id POST /acoes-judiciais "$(cat <<JSON
{
  "numero_processo":"${RUN_ID}-PROC",
  "plano_saude_id":"${PLANO_ID}",
  "plano_saude_nome":"${PLANO_NOME}",
  "valor_acao": 1000.0,
  "data_entrada":"$(date -u +%Y-%m-%d)",
  "status":"Em Andamento",
  "descricao":"Seed demo"
}
JSON
)")"
echo "ACAO_JUDICIAL_ID=${ACAO_ID}"

NF_ID="$(create_id POST /notas-fiscais "$(cat <<JSON
{
  "numero_nota":"${RUN_ID}-NF",
  "plano_saude_id":"${PLANO_ID}",
  "plano_saude_nome":"${PLANO_NOME}",
  "paciente_nome":"${PACIENTE_NOME}",
  "data_emissao":"$(date -u +%Y-%m-%d)",
  "data_vencimento":"$(date -u -v+15d +%Y-%m-%d)",
  "valor_servico": 300.0,
  "status":"Pendente",
  "acao_judicial_id":"${ACAO_ID}"
}
JSON
)")"
echo "NOTA_FISCAL_ID=${NF_ID}"

printf '%%PDF-1.4\n%% Contrato seed demo\n' > /tmp/seed-contrato-demo.pdf
CONTR_TMP="$(mktemp)"
CONTR_CODE="$(curl -sS -o "${CONTR_TMP}" -w "%{http_code}" \
  -X POST "${API_BASE}/contratos" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "titulo=${RUN_ID} Contrato" \
  -F "tipo=Prestação de Serviço" \
  -F "paciente_id=${PACIENTE_ID}" \
  -F "paciente_nome=${PACIENTE_NOME}" \
  -F "profissional_id=${PROF_ID}" \
  -F "profissional_nome=${PROF_NOME}" \
  -F "status=Rascunho" \
  -F "file=@/tmp/seed-contrato-demo.pdf;type=application/pdf")"
if [ "${CONTR_CODE}" != "201" ]; then
  echo "ERRO: POST /contratos (multipart) => ${CONTR_CODE}" >&2
  cat "${CONTR_TMP}" >&2
  rm -f "${CONTR_TMP}" /tmp/seed-contrato-demo.pdf
  exit 1
fi
CONTR_ID="$(cat "${CONTR_TMP}" | json_get "data.id")"
rm -f "${CONTR_TMP}" /tmp/seed-contrato-demo.pdf
if [ -z "${CONTR_ID}" ]; then
  echo "ERRO: não foi possível extrair data.id em POST /contratos" >&2
  exit 1
fi
echo "CONTRATO_ID=${CONTR_ID}"

MAN_ID="$(create_id POST /marketing/manuais "$(cat <<JSON
{
  "titulo":"${RUN_ID} Manual",
  "versao":"1",
  "publico_alvo":"Interno",
  "arquivo_url":"https://example.com/manual.pdf",
  "arquivo_nome":"manual.pdf",
  "status":"Publicado"
}
JSON
)")"
echo "MANUAL_ID=${MAN_ID}"

MAT_ID="$(create_id POST /marketing/materiais "$(cat <<JSON
{
  "titulo":"${RUN_ID} Material",
  "tipo":"banner",
  "arquivo_url":"https://example.com/banner.png",
  "arquivo_nome":"banner.png",
  "status":"Publicado",
  "unidade_id":"${UNIDADE_ID_DEFAULT}"
}
JSON
)")"
echo "MATERIAL_MARKETING_ID=${MAT_ID}"

CONTA_COD="D$(date +%s).01"
api_call POST /contabilidade/contas "$(cat <<JSON
{
  "codigo":"${CONTA_COD}",
  "nome":"${RUN_ID} Conta",
  "tipo":"Analítica",
  "natureza":"Credora"
}
JSON
)" >/dev/null
echo "CONTA_CONTABIL_CODIGO=${CONTA_COD}"

LANC_CONT_ID="$(create_id POST /contabilidade/lancamentos "$(cat <<JSON
{
  "data":"$(date -u +%Y-%m-%d)",
  "conta_codigo":"${CONTA_COD}",
  "conta_nome":"${RUN_ID} Conta",
  "debito": 0,
  "credito": 50.0,
  "historico":"Seed demo",
  "unidade_id":"${UNIDADE_ID_DEFAULT}"
}
JSON
)")"
echo "LANCAMENTO_CONTABIL_ID=${LANC_CONT_ID}"

echo
echo "==> Seed concluído: ${RUN_ID}"
echo "Sugestão: use o prefixo de busca \"${RUN_ID}\" nas telas."
