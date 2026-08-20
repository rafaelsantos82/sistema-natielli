#!/usr/bin/env bash
# seed-pacientes.sh — importa cadastro das planilhas Natielli na Postgres de produção.
# Uso (na raiz do repo, no Mac):
#   ./deploy/scripts/seed-pacientes.sh --dry-run -- ~/Downloads/clientes_22_07_2026.xlsx ~/Downloads/clientes_Natielli.xlsx
#   ./deploy/scripts/seed-pacientes.sh --apply -- file1.xlsx file2.xlsx
#
# Planilhas NÃO entram no git. São copiadas para /tmp na droplet e apagadas ao final.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"
load_deploy_env
assert_isolation

BACKEND_DIR="${REPO_ROOT}/backend"
BINARY_NAME="seed-pacientes"
REMOTE_BIN="/tmp/${BINARY_NAME}"
REMOTE_IMPORT="/tmp/natielli-xlsx"
NETWORK="${COMPOSE_PROJECT_NAME}_backend_internal"
ENV_FILE="${DEPLOY_ETC_DIR}/app.env"
LOCAL_PEND="${BACKEND_DIR}/data/imports/pendencias-comerciais.json"

info() { log_info "$@"; }
err() { log_error "$*"; exit 1; }

MODE="--dry-run"
FILES=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) MODE="--dry-run" ;;
    --apply) MODE="--apply" ;;
    --)
      shift
      FILES+=("$@")
      break
      ;;
    -h|--help)
      echo "Uso: $0 [--dry-run|--apply] -- arquivo.xlsx [arquivo.xlsx...]"
      echo "Ordem: arquivos mais antigos primeiro; o último ganha no mesmo WhatsApp."
      exit 0
      ;;
    *)
      FILES+=("$1")
      ;;
  esac
  shift
done

if [[ ${#FILES[@]} -eq 0 ]]; then
  err "informe ao menos um .xlsx após --"
fi

ssh_cmd() {
  ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new "${DEPLOY_HOST_ALIAS}" "$@"
}

if [[ "${MODE}" == "--apply" ]]; then
  info "Backup do banco antes do apply"
  ssh_cmd "bash ${DEPLOY_APP_DIR}/deploy/scripts/backup-db.sh"
fi

info "Building ${BINARY_NAME} (linux/amd64)"
cd "${BACKEND_DIR}"
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o "/tmp/${BINARY_NAME}" ./cmd/seed-pacientes

info "Upload binary + planilhas to ${DEPLOY_HOST_ALIAS}"
scp -o BatchMode=yes -o StrictHostKeyChecking=accept-new "/tmp/${BINARY_NAME}" "${DEPLOY_HOST_ALIAS}:${REMOTE_BIN}"
ssh_cmd "rm -rf ${REMOTE_IMPORT} && mkdir -p ${REMOTE_IMPORT} && chmod 700 ${REMOTE_IMPORT} && chmod +x ${REMOTE_BIN}"

XLSX_CLI=""
i=0
for f in "${FILES[@]}"; do
  [[ -f "$f" ]] || err "arquivo inexistente: $f"
  dest_name="$(printf '%02d' "$i")-$(basename "$f" | tr ' ' '_')"
  dest="${REMOTE_IMPORT}/${dest_name}"
  scp -o BatchMode=yes -o StrictHostKeyChecking=accept-new "$f" "${DEPLOY_HOST_ALIAS}:${dest}"
  XLSX_CLI+=" --xlsx=/import/${dest_name}"
  i=$((i + 1))
done

info "Running seed on droplet (network=${NETWORK}, mode=${MODE})"
ssh_cmd "docker run --rm \
  --network ${NETWORK} \
  --env-file ${ENV_FILE} \
  -v ${REMOTE_BIN}:/seed-pacientes:ro \
  -v ${REMOTE_IMPORT}:/import \
  alpine:3.20 /seed-pacientes ${MODE} ${XLSX_CLI} --pendencias-out=/import/pendencias-comerciais.json"

mkdir -p "$(dirname "${LOCAL_PEND}")"
scp -o BatchMode=yes -o StrictHostKeyChecking=accept-new \
  "${DEPLOY_HOST_ALIAS}:${REMOTE_IMPORT}/pendencias-comerciais.json" "${LOCAL_PEND}"
info "Pendências copiadas para ${LOCAL_PEND} (gitignored)"

ssh_cmd "rm -f ${REMOTE_BIN}; rm -rf ${REMOTE_IMPORT}"
info "seed-pacientes concluído (${MODE})"
