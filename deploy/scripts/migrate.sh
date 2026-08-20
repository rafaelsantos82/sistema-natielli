#!/usr/bin/env bash
set -euo pipefail

# shellcheck source=common.sh
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
load_deploy_env
assert_isolation
require_linux
require_app_dir
require_secrets

cd "${DEPLOY_APP_DIR}"
sync_database_url

set -a
# shellcheck disable=SC1091
source "${DEPLOY_ETC_DIR}/app.env"
set +a

export COMPOSE_PROJECT_NAME IMAGE_API IMAGE_FRONTEND IMAGE_TAG
export PROD_API_HOST_PORT PROD_FRONTEND_HOST_PORT DATABASE_URL POSTGRES_USER POSTGRES_DB

log_info "Running database migrations (natielli-prod only)"
compose_cmd --profile ops run --rm migrate

log_info "Migrations completed"
