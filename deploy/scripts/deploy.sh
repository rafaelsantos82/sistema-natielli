#!/usr/bin/env bash
set -euo pipefail

# Production deploy on Ubuntu droplet only. Compose project: natielli-prod.

# shellcheck source=common.sh
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
load_deploy_env
assert_isolation
require_linux
require_app_dir
require_secrets

cd "${DEPLOY_APP_DIR}"
sync_database_url
load_production_app_env

export IMAGE_API IMAGE_FRONTEND IMAGE_TAG VITE_API_BASE_URL
export PROD_API_HOST_PORT PROD_FRONTEND_HOST_PORT COMPOSE_PROJECT_NAME
export POSTGRES_USER POSTGRES_DB DATABASE_URL

log_info "Deploy started (BUILD_STRATEGY=${BUILD_STRATEGY}, project=${COMPOSE_PROJECT_NAME})"

if ! docker info >/dev/null 2>&1; then
  log_error "Docker is not available for this user"
  exit 1
fi

case "${BUILD_STRATEGY}" in
  on-droplet)
    log_info "Building images on droplet"
    compose_cmd build --pull
    ;;
  prebuilt)
    log_info "Using prebuilt images (${IMAGE_API}:${IMAGE_TAG}, ${IMAGE_FRONTEND}:${IMAGE_TAG})"
    if ! docker image inspect "${IMAGE_API}:${IMAGE_TAG}" >/dev/null 2>&1; then
      log_error "Image ${IMAGE_API}:${IMAGE_TAG} not found. From Mac run: ./deploy/scripts/deploy-from-mac.sh build-push"
      exit 1
    fi
    if ! docker image inspect "${IMAGE_FRONTEND}:${IMAGE_TAG}" >/dev/null 2>&1; then
      log_error "Image ${IMAGE_FRONTEND}:${IMAGE_TAG} not found. From Mac run: ./deploy/scripts/deploy-from-mac.sh build-push"
      exit 1
    fi
    ;;
  *)
    log_error "Invalid BUILD_STRATEGY: ${BUILD_STRATEGY}"
    exit 1
    ;;
esac

"${DEPLOY_APP_DIR}/deploy/scripts/migrate.sh"

log_info "Starting natielli-prod services only"
compose_cmd up -d db
"${DEPLOY_APP_DIR}/deploy/scripts/fix-uploads-permissions.sh"
compose_cmd up -d --no-build api frontend

smoke_tests

if [[ -f "${DEPLOY_APP_DIR}/deploy/nginx/natielli.conf.template" ]]; then
  if sudo -n true 2>/dev/null; then
    sudo bash -c "
      source '${DEPLOY_APP_DIR}/deploy/scripts/common.sh'
      load_deploy_env
      assert_isolation
      DEPLOY_APP_DIR='${DEPLOY_APP_DIR}'
      refresh_nginx_site '/etc/nginx/sites-available/${DEPLOY_DOMAIN}'
    " || log_warn "nginx config refresh skipped"
  fi
fi
reload_nginx_if_valid || true

log_info "Deploy completed successfully"
