#!/usr/bin/env bash
# seed-anamneses.sh — aplica templates JSON em backend/data/anamneses na base de produção.
# Uso (no Mac, na raiz do repo):
#   ./deploy/scripts/seed-anamneses.sh
#   ./deploy/scripts/seed-anamneses.sh --dry-run
#   ./deploy/scripts/seed-anamneses.sh --only=to-2024
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"
load_deploy_env
assert_isolation

BACKEND_DIR="${REPO_ROOT}/backend"
BINARY_NAME="seed-anamneses"
REMOTE_BIN="/tmp/${BINARY_NAME}"
DATA_DIR="${DEPLOY_APP_DIR}/backend/data/anamneses"
NETWORK="${COMPOSE_PROJECT_NAME}_backend_internal"
ENV_FILE="${DEPLOY_ETC_DIR}/app.env"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'
info() { echo -e "${GREEN}[INFO]${NC} $*"; }
err() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

ssh_cmd() {
  ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new "${DEPLOY_HOST_ALIAS}" "$@"
}

DRY_RUN=""
ONLY=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN="--dry-run" ;;
    --only=*) ONLY="$1" ;;
    --only)
      shift
      ONLY="--only=$1"
      ;;
    -h|--help)
      echo "Uso: $0 [--dry-run] [--only=slug]"
      exit 0
      ;;
    *) err "argumento desconhecido: $1" ;;
  esac
  shift
done

info "Building ${BINARY_NAME} (linux/amd64)"
cd "${BACKEND_DIR}"
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o "/tmp/${BINARY_NAME}" ./cmd/seed-anamneses

info "Upload binary to ${DEPLOY_HOST_ALIAS}:${REMOTE_BIN}"
scp -o BatchMode=yes -o StrictHostKeyChecking=accept-new "/tmp/${BINARY_NAME}" "${DEPLOY_HOST_ALIAS}:${REMOTE_BIN}"
ssh_cmd "chmod +x ${REMOTE_BIN}"

SEED_ARGS="--data-dir /data/anamneses ${DRY_RUN} ${ONLY}"
info "Running seed on droplet (network=${NETWORK})"
ssh_cmd "test -d '${DATA_DIR}'" || err "Diretório ${DATA_DIR} ausente — faça git pull em ${DEPLOY_APP_DIR}"
ssh_cmd "docker run --rm \
  --network ${NETWORK} \
  --env-file ${ENV_FILE} \
  -v ${REMOTE_BIN}:/seed-anamneses:ro \
  -v ${DATA_DIR}:/data/anamneses:ro \
  alpine:3.20 /seed-anamneses ${SEED_ARGS}"

info "seed-anamneses concluído"
