#!/usr/bin/env bash
# seed-pacientes-pendencias.sh — resolve JSON comercial contra pacientes já importados.
# --apply é recusado até existir schema (o binário sai com código 2).
#
# Uso:
#   ./deploy/scripts/seed-pacientes-pendencias.sh --dry-run
#   ./deploy/scripts/seed-pacientes-pendencias.sh --dry-run -- backend/data/imports/pendencias-comerciais.json
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"
load_deploy_env
assert_isolation

BACKEND_DIR="${REPO_ROOT}/backend"
BINARY_NAME="seed-pacientes-pendencias"
REMOTE_BIN="/tmp/${BINARY_NAME}"
REMOTE_JSON="/tmp/natielli-pendencias.json"
NETWORK="${COMPOSE_PROJECT_NAME}_backend_internal"
ENV_FILE="${DEPLOY_ETC_DIR}/app.env"
LOCAL_JSON="${BACKEND_DIR}/data/imports/pendencias-comerciais.json"

info() { log_info "$@"; }
err() { log_error "$*"; exit 1; }

MODE="--dry-run"
JSON=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) MODE="--dry-run" ;;
    --apply)
      err "--apply bloqueado neste wrapper até o persist comercial existir (use o binário só em lab)"
      ;;
    --)
      shift
      JSON="${1:-}"
      break
      ;;
    -h|--help)
      echo "Uso: $0 [--dry-run] [-- arquivo.json]"
      exit 0
      ;;
    *)
      JSON="$1"
      ;;
  esac
  shift
done

if [[ -z "${JSON}" ]]; then
  JSON="${LOCAL_JSON}"
fi
[[ -f "${JSON}" ]] || err "JSON não encontrado: ${JSON} (rode seed-pacientes primeiro)"

ssh_cmd() {
  ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new "${DEPLOY_HOST_ALIAS}" "$@"
}

info "Building ${BINARY_NAME} (linux/amd64)"
cd "${BACKEND_DIR}"
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o "/tmp/${BINARY_NAME}" ./cmd/seed-pacientes-pendencias

info "Upload binary + JSON"
scp -o BatchMode=yes -o StrictHostKeyChecking=accept-new "/tmp/${BINARY_NAME}" "${DEPLOY_HOST_ALIAS}:${REMOTE_BIN}"
scp -o BatchMode=yes -o StrictHostKeyChecking=accept-new "${JSON}" "${DEPLOY_HOST_ALIAS}:${REMOTE_JSON}"
ssh_cmd "chmod +x ${REMOTE_BIN}"

info "Running pendencias dry-run (network=${NETWORK})"
ssh_cmd "docker run --rm \
  --network ${NETWORK} \
  --env-file ${ENV_FILE} \
  -v ${REMOTE_BIN}:/seed-pacientes-pendencias:ro \
  -v ${REMOTE_JSON}:/pendencias.json:ro \
  alpine:3.20 /seed-pacientes-pendencias ${MODE} --in=/pendencias.json"

ssh_cmd "rm -f ${REMOTE_BIN} ${REMOTE_JSON}"
info "seed-pacientes-pendencias concluído"
