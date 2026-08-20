#!/usr/bin/env bash
# seed-admin.sh — cria ou atualiza um administrador na Postgres de produção (natielli-prod).
# Uso (na raiz do repo, no Mac):
#   ADMIN_EMAIL=admin@natielli.com.br ADMIN_PASSWORD='…' ADMIN_NAME='Natielli Paula' \
#     ./deploy/scripts/seed-admin.sh
#
# A senha NÃO deve ser commitada. Passe só por variável de ambiente.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"
load_deploy_env
assert_isolation

BACKEND_DIR="${REPO_ROOT}/backend"
BINARY_NAME="seed-admin"
REMOTE_BIN="/tmp/${BINARY_NAME}"
NETWORK="${COMPOSE_PROJECT_NAME}_backend_internal"
ENV_FILE="${DEPLOY_ETC_DIR}/app.env"

ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
ADMIN_NAME="${ADMIN_NAME:-Natielli Paula}"

info() { log_info "$@"; }
err() { log_error "$*"; exit 1; }

if [[ -z "${ADMIN_EMAIL}" || -z "${ADMIN_PASSWORD}" ]]; then
  err "ADMIN_EMAIL e ADMIN_PASSWORD são obrigatórios (não grave a senha no git)"
fi
if [[ ${#ADMIN_PASSWORD} -lt 8 ]]; then
  err "ADMIN_PASSWORD deve ter no mínimo 8 caracteres"
fi

ssh_cmd() {
  ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new "${DEPLOY_HOST_ALIAS}" "$@"
}

info "Building ${BINARY_NAME} (linux/amd64)"
cd "${BACKEND_DIR}"
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o "/tmp/${BINARY_NAME}" ./cmd/seed-admin

info "Upload binary to ${DEPLOY_HOST_ALIAS}:${REMOTE_BIN}"
scp -o BatchMode=yes -o StrictHostKeyChecking=accept-new "/tmp/${BINARY_NAME}" "${DEPLOY_HOST_ALIAS}:${REMOTE_BIN}"
ssh_cmd "chmod +x ${REMOTE_BIN}"

info "Running seed-admin on droplet (network=${NETWORK}, email=${ADMIN_EMAIL})"
# Credenciais só na linha de comando remota (não escritas em arquivo no repo).
email_q=$(printf '%q' "${ADMIN_EMAIL}")
pass_q=$(printf '%q' "${ADMIN_PASSWORD}")
name_q=$(printf '%q' "${ADMIN_NAME}")
ssh_cmd "docker run --rm \
  --network ${NETWORK} \
  --env-file ${ENV_FILE} \
  -e ADMIN_EMAIL=${email_q} \
  -e ADMIN_PASSWORD=${pass_q} \
  -e ADMIN_NAME=${name_q} \
  -v ${REMOTE_BIN}:/seed-admin:ro \
  alpine:3.20 /seed-admin"

ssh_cmd "rm -f ${REMOTE_BIN}"
info "seed-admin concluído"
