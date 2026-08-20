#!/usr/bin/env bash
set -euo pipefail

# shellcheck source=common.sh
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
load_deploy_env
assert_isolation

SECRETS_DIR="${DEPLOY_ETC_DIR}/secrets"
APP_ENV="${DEPLOY_ETC_DIR}/app.env"

log_info "Ensuring secrets layout under ${DEPLOY_ETC_DIR}"

if [[ "${EUID}" -ne 0 ]]; then
  log_error "Run as root or with sudo"
  exit 1
fi

mkdir -p "${SECRETS_DIR}"
chmod 700 "${DEPLOY_ETC_DIR}" "${SECRETS_DIR}"

touch_if_missing() {
  local path="$1"
  if [[ ! -f "${path}" ]]; then
    install -m 600 /dev/null "${path}"
    log_warn "Created empty ${path} — fill before deploy"
  else
    chmod 600 "${path}"
  fi
}

touch_if_missing "${SECRETS_DIR}/jwt_secret"
touch_if_missing "${SECRETS_DIR}/pg_password"

if [[ ! -f "${APP_ENV}" ]]; then
  if [[ -f "${DEPLOY_APP_DIR}/deploy/.env.production.example" ]]; then
    install -m 600 "${DEPLOY_APP_DIR}/deploy/.env.production.example" "${APP_ENV}"
    log_info "Installed ${APP_ENV} from example — edit JWT and review settings"
  else
    log_error "Missing ${DEPLOY_APP_DIR}/deploy/.env.production.example"
    exit 1
  fi
else
  chmod 600 "${APP_ENV}"
fi

if [[ -s "${SECRETS_DIR}/jwt_secret" ]] && grep -q '^JWT_SECRET=$' "${APP_ENV}" 2>/dev/null; then
  jwt="$(tr -d '\n\r' < "${SECRETS_DIR}/jwt_secret")"
  sed -i.bak "s|^JWT_SECRET=.*|JWT_SECRET=${jwt}|" "${APP_ENV}"
  rm -f "${APP_ENV}.bak"
fi

sync_database_url
log_info "Secrets layout ready"
