#!/usr/bin/env bash
# Shared helpers for Sistema Natielli deploy on shared VM pstec.
# MUST NOT touch Espaço Terapia (/opt/espacoterapia, :8080/:8081) or QR Gestor (/opt/qrgestor, :8082/:8083).

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

script_dir() {
  cd "$(dirname "${BASH_SOURCE[0]}")" && pwd
}

load_deploy_env() {
  local root
  root="$(script_dir)/.."
  if [[ -f "${root}/deploy.env" ]]; then
    # shellcheck disable=SC1091
    set -a
    source "${root}/deploy.env"
    set +a
  fi
  DEPLOY_HOST_ALIAS="${DEPLOY_HOST_ALIAS:-pstec}"
  DEPLOY_APP_DIR="${DEPLOY_APP_DIR:-/opt/sistemanatielli}"
  DEPLOY_ETC_DIR="${DEPLOY_ETC_DIR:-/etc/sistemanatielli}"
  DEPLOY_DOMAIN="${DEPLOY_DOMAIN:-sistema.natielli.com.br}"
  DEPLOY_PUBLIC_URL="${DEPLOY_PUBLIC_URL:-https://sistema.natielli.com.br}"
  PROD_API_HOST_PORT="${PROD_API_HOST_PORT:-8084}"
  PROD_FRONTEND_HOST_PORT="${PROD_FRONTEND_HOST_PORT:-8085}"
  COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-natielli-prod}"
  UPLOADS_VOLUME="${UPLOADS_VOLUME:-natielli-prod_uploads_data}"
  BUILD_STRATEGY="${BUILD_STRATEGY:-prebuilt}"
  GIT_REPO_URL="${GIT_REPO_URL:-git@github.com:rafaelsantos82/sistema-natielli.git}"
  GIT_DEFAULT_BRANCH="${GIT_DEFAULT_BRANCH:-main}"
  CERTBOT_EMAIL="${CERTBOT_EMAIL:-admin@ps.tec.br}"
  IMAGE_API="${IMAGE_API:-natielli/api}"
  IMAGE_FRONTEND="${IMAGE_FRONTEND:-natielli/frontend}"
  IMAGE_TAG="${IMAGE_TAG:-latest}"
  VITE_API_BASE_URL="${VITE_API_BASE_URL:-https://sistema.natielli.com.br/api/v1}"
  NEIGHBOR_HEALTH_ESPACOTERAPIA="${NEIGHBOR_HEALTH_ESPACOTERAPIA:-https://espacoterapia.ps.tec.br/api/v1/health}"
  NEIGHBOR_HEALTH_QRGESTOR="${NEIGHBOR_HEALTH_QRGESTOR:-https://qrgestor.com.br/api/v1/health}"
}

assert_isolation() {
  load_deploy_env

  local fail=0

  case "${DEPLOY_APP_DIR}" in
    /opt/espacoterapia|/opt/qrgestor)
      log_error "Isolation: DEPLOY_APP_DIR cannot be ${DEPLOY_APP_DIR}"
      fail=1
      ;;
  esac
  if [[ "${DEPLOY_APP_DIR}" != "/opt/sistemanatielli" ]]; then
    log_error "Isolation: DEPLOY_APP_DIR must be /opt/sistemanatielli (got ${DEPLOY_APP_DIR})"
    fail=1
  fi

  case "${DEPLOY_ETC_DIR}" in
    /etc/espacoterapia|/etc/qrgestor)
      log_error "Isolation: DEPLOY_ETC_DIR cannot be ${DEPLOY_ETC_DIR}"
      fail=1
      ;;
  esac
  if [[ "${DEPLOY_ETC_DIR}" != "/etc/sistemanatielli" ]]; then
    log_error "Isolation: DEPLOY_ETC_DIR must be /etc/sistemanatielli (got ${DEPLOY_ETC_DIR})"
    fail=1
  fi

  case "${PROD_API_HOST_PORT}" in
    8080|8081|8082|8083)
      log_error "Isolation: API host port ${PROD_API_HOST_PORT} belongs to Espaço Terapia or QR Gestor"
      fail=1
      ;;
  esac
  case "${PROD_FRONTEND_HOST_PORT}" in
    8080|8081|8082|8083)
      log_error "Isolation: frontend host port ${PROD_FRONTEND_HOST_PORT} belongs to Espaço Terapia or QR Gestor"
      fail=1
      ;;
  esac
  if [[ "${PROD_API_HOST_PORT}" != "8084" ]] || [[ "${PROD_FRONTEND_HOST_PORT}" != "8085" ]]; then
    log_error "Isolation: expected host ports 8084/8085 (got ${PROD_API_HOST_PORT}/${PROD_FRONTEND_HOST_PORT})"
    fail=1
  fi

  if [[ "${IMAGE_API}" == *espacoterapia* ]] || [[ "${IMAGE_API}" == *qrgestor* ]]; then
    log_error "Isolation: IMAGE_API '${IMAGE_API}' collides with another product"
    fail=1
  fi
  if [[ "${IMAGE_FRONTEND}" == *espacoterapia* ]] || [[ "${IMAGE_FRONTEND}" == *qrgestor* ]]; then
    log_error "Isolation: IMAGE_FRONTEND '${IMAGE_FRONTEND}' collides with another product"
    fail=1
  fi

  if [[ "${COMPOSE_PROJECT_NAME}" != "natielli-prod" ]]; then
    log_error "Isolation: COMPOSE_PROJECT_NAME must be natielli-prod (got ${COMPOSE_PROJECT_NAME})"
    fail=1
  fi

  if [[ "${UPLOADS_VOLUME}" != "natielli-prod_uploads_data" ]]; then
    log_error "Isolation: UPLOADS_VOLUME must be natielli-prod_uploads_data (got ${UPLOADS_VOLUME})"
    fail=1
  fi

  if [[ "${DEPLOY_DOMAIN}" == *"espacoterapia"* ]] || [[ "${DEPLOY_DOMAIN}" == *"qrgestor"* ]]; then
    log_error "Isolation: DEPLOY_DOMAIN '${DEPLOY_DOMAIN}' collides with another product"
    fail=1
  fi
  if [[ "${DEPLOY_DOMAIN}" != "sistema.natielli.com.br" ]]; then
    log_error "Isolation: DEPLOY_DOMAIN must be sistema.natielli.com.br (got ${DEPLOY_DOMAIN})"
    fail=1
  fi

  local template
  template="$(script_dir)/../nginx/natielli.conf.template"
  if [[ -f "${template}" ]]; then
    if grep -E 'espacoterapia\.ps\.tec\.br|qrgestor\.com\.br' "${template}" >/dev/null 2>&1; then
      log_error "Isolation: nginx template contains a neighbor server_name"
      fail=1
    fi
    if grep -E 'upstream espacoterapia_|upstream qrgestor_|zone=espacoterapia_|zone=qrgestor_' "${template}" >/dev/null 2>&1; then
      log_error "Isolation: nginx template reuses neighbor upstream/zone names"
      fail=1
    fi
  fi

  local site="/etc/nginx/sites-available/${DEPLOY_DOMAIN}"
  if [[ -f "${site}" ]]; then
    if grep -E 'server_name[[:space:]]+espacoterapia\.ps\.tec\.br|server_name[[:space:]]+qrgestor\.com\.br' "${site}" >/dev/null 2>&1; then
      log_error "Isolation: Natielli nginx site file contains a neighbor server_name"
      fail=1
    fi
  fi

  if [[ "${fail}" -ne 0 ]]; then
    log_error "Aborting to protect Espaço Terapia and QR Gestor on pstec"
    exit 1
  fi
}

check_neighbor_health() {
  local label="$1"
  local url="$2"
  if curl -fsS --max-time 15 "${url}" >/dev/null 2>&1; then
    log_info "Neighbor OK: ${label}"
    return 0
  fi
  log_error "Neighbor DOWN: ${label} (${url})"
  return 1
}

assert_neighbors_healthy() {
  local fail=0
  check_neighbor_health "Espaço Terapia" "${NEIGHBOR_HEALTH_ESPACOTERAPIA}" || fail=1
  check_neighbor_health "QR Gestor" "${NEIGHBOR_HEALTH_QRGESTOR}" || fail=1
  if [[ "${fail}" -ne 0 ]]; then
    log_error "Aborting: a neighbor app is down. Fix that before touching Natielli."
    exit 1
  fi
}

nginx_site_path() {
  echo "/etc/nginx/sites-available/${DEPLOY_DOMAIN}"
}

render_nginx_site() {
  local template="${DEPLOY_APP_DIR}/deploy/nginx/natielli.conf.template"
  local out="${1:-$(nginx_site_path)}"
  if [[ ! -f "${template}" ]]; then
    log_error "Missing nginx template: ${template}"
    return 1
  fi
  if [[ "${out}" == *espacoterapia* ]] || [[ "${out}" == *qrgestor* ]]; then
    log_error "Isolation: refusing to write nginx site ${out}"
    return 1
  fi
  export DEPLOY_DOMAIN PROD_API_HOST_PORT PROD_FRONTEND_HOST_PORT
  envsubst '${DEPLOY_DOMAIN} ${PROD_API_HOST_PORT} ${PROD_FRONTEND_HOST_PORT}' \
    < "${template}" > "${out}"
}

nginx_site_has_ssl_apex() {
  local site="${1:-$(nginx_site_path)}"
  [[ -f "${site}" ]] && grep -q "server_name ${DEPLOY_DOMAIN};" "${site}" && grep -q 'listen.*443.*ssl' "${site}"
}

append_ssl_apex_server() {
  local site="${1:-$(nginx_site_path)}"
  local fragment="${DEPLOY_APP_DIR}/deploy/nginx/natielli.ssl.server.conf.fragment"
  if [[ ! -f "${fragment}" ]] || [[ ! -d "/etc/letsencrypt/live/${DEPLOY_DOMAIN}" ]]; then
    return 0
  fi
  if nginx_site_has_ssl_apex "${site}"; then
    return 0
  fi
  export DEPLOY_DOMAIN
  envsubst '${DEPLOY_DOMAIN}' < "${fragment}" >> "${site}"
}

refresh_nginx_site() {
  local site="${1:-$(nginx_site_path)}"
  render_nginx_site "${site}"
  append_ssl_apex_server "${site}"
}

reload_nginx_if_valid() {
  if ! command -v nginx >/dev/null 2>&1; then
    return 0
  fi
  if sudo nginx -t 2>/dev/null; then
    sudo systemctl reload nginx
    log_info "nginx reloaded (Natielli site only written; other vhosts untouched)"
  else
    log_error "nginx -t failed — NOT reloading (Espaço Terapia and QR Gestor keep current config)"
    return 1
  fi
}

compose_file() {
  echo "${DEPLOY_APP_DIR}/deploy/docker-compose.prod.yml"
}

compose_cmd() {
  docker compose -p "${COMPOSE_PROJECT_NAME}" -f "$(compose_file)" "$@"
}

require_linux() {
  if [[ "${OSTYPE:-}" == darwin* ]]; then
    log_error "This script runs on the Ubuntu droplet only. From macOS use: ./deploy/scripts/deploy-from-mac.sh"
    exit 1
  fi
}

require_app_dir() {
  if [[ ! -d "${DEPLOY_APP_DIR}" ]]; then
    log_error "App directory missing: ${DEPLOY_APP_DIR}. Run setup-droplet.sh first."
    exit 1
  fi
}

require_secrets() {
  local missing=0
  for f in jwt_secret pg_password; do
    if [[ ! -s "${DEPLOY_ETC_DIR}/secrets/${f}" ]]; then
      log_error "Missing or empty: ${DEPLOY_ETC_DIR}/secrets/${f}"
      missing=1
    fi
  done
  if [[ ! -f "${DEPLOY_ETC_DIR}/app.env" ]]; then
    log_error "Missing ${DEPLOY_ETC_DIR}/app.env (copy from deploy/.env.production.example)"
    missing=1
  fi
  if [[ "${missing}" -ne 0 ]]; then
    exit 1
  fi
}

load_production_app_env() {
  if [[ -f "${DEPLOY_ETC_DIR}/app.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "${DEPLOY_ETC_DIR}/app.env"
    set +a
  fi
}

sync_database_url() {
  if [[ ! -f "${DEPLOY_ETC_DIR}/app.env" ]] || [[ ! -s "${DEPLOY_ETC_DIR}/secrets/pg_password" ]]; then
    return 0
  fi
  local user db pass env_path
  env_path="${DEPLOY_ETC_DIR}/app.env"
  user="$(grep -E '^POSTGRES_USER=' "${env_path}" | cut -d= -f2- | tr -d '\r' || echo natielli)"
  db="$(grep -E '^POSTGRES_DB=' "${env_path}" | cut -d= -f2- | tr -d '\r' || echo natielli)"
  pass="$(tr -d '\n\r' < "${DEPLOY_ETC_DIR}/secrets/pg_password")"
  python3 - "${user}" "${pass}" "${db}" "${env_path}" <<'PY'
import sys, re, urllib.parse
user, password, db, path = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
safe = urllib.parse.quote(password, safe="")
url = f"postgres://{user}:{safe}@db:5432/{db}?sslmode=disable"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()
if re.search(r"^DATABASE_URL=", content, flags=re.M):
    content = re.sub(r"^DATABASE_URL=.*$", f"DATABASE_URL={url}", content, flags=re.M)
else:
    content = content.rstrip() + f"\nDATABASE_URL={url}\n"
with open(path, "w", encoding="utf-8") as f:
    f.write(content)
PY
}

wait_for_url() {
  local url="$1"
  local max_attempts="${2:-30}"
  local i
  for ((i = 1; i <= max_attempts; i++)); do
    if curl -fsS "${url}" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

smoke_tests() {
  log_info "Smoke: API loopback (:${PROD_API_HOST_PORT})"
  wait_for_url "http://127.0.0.1:${PROD_API_HOST_PORT}/api/v1/health" 30
  log_info "Smoke: frontend loopback (:${PROD_FRONTEND_HOST_PORT})"
  wait_for_url "http://127.0.0.1:${PROD_FRONTEND_HOST_PORT}/" 30
  if curl -fsS --max-time 15 "${DEPLOY_PUBLIC_URL}/api/v1/health" >/dev/null 2>&1; then
    log_info "Smoke: public HTTPS OK"
  else
    log_warn "Public HTTPS health check failed (TLS/nginx/DNS may still be configuring)"
  fi
}
