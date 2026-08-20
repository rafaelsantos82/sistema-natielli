#!/usr/bin/env bash
set -euo pipefail

# shellcheck source=common.sh
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
load_deploy_env
assert_isolation
require_linux
require_app_dir

BACKUP_DIR="${BACKUP_DIR:-/var/backups/sistemanatielli}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

mkdir -p "${BACKUP_DIR}"
timestamp="$(date +%Y%m%d_%H%M%S)"
out="${BACKUP_DIR}/natielli_${timestamp}.sql.gz"

cd "${DEPLOY_APP_DIR}"

set -a
# shellcheck disable=SC1091
source "${DEPLOY_ETC_DIR}/app.env"
set +a

export COMPOSE_PROJECT_NAME IMAGE_API IMAGE_FRONTEND IMAGE_TAG
export PROD_API_HOST_PORT PROD_FRONTEND_HOST_PORT

log_info "Backing up PostgreSQL to ${out}"
compose_cmd exec -T db pg_dump -U "${POSTGRES_USER:-natielli}" "${POSTGRES_DB:-natielli}" | gzip > "${out}"

find "${BACKUP_DIR}" -name 'natielli_*.sql.gz' -mtime +"${RETENTION_DAYS}" -delete
log_info "Backup done (${out})"
