#!/usr/bin/env bash
# Ajusta dono do volume natielli-prod_uploads_data para appuser (API roda sem CAP_CHOWN).
# Nunca usar grep uploads_data — isso poderia pegar o volume do Espaço Terapia ou do QR Gestor.

set -euo pipefail

# shellcheck source=common.sh
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
load_deploy_env
assert_isolation
require_linux
require_app_dir

cd "${DEPLOY_APP_DIR}"
export IMAGE_API IMAGE_FRONTEND IMAGE_TAG COMPOSE_PROJECT_NAME
export PROD_API_HOST_PORT PROD_FRONTEND_HOST_PORT

if [[ "${UPLOADS_VOLUME}" != "natielli-prod_uploads_data" ]]; then
  log_error "Isolation: refusing to chown volume ${UPLOADS_VOLUME}"
  exit 1
fi
if [[ "${UPLOADS_VOLUME}" == *espacoterapia* ]] || [[ "${UPLOADS_VOLUME}" == *qrgestor* ]]; then
  log_error "Isolation: refusing neighbor volume ${UPLOADS_VOLUME}"
  exit 1
fi

resolve_app_ids() {
  if docker image inspect "${IMAGE_API}:${IMAGE_TAG}" >/dev/null 2>&1; then
    local uid gid
    uid="$(docker run --rm --entrypoint sh "${IMAGE_API}:${IMAGE_TAG}" -c 'id -u appuser' 2>/dev/null || true)"
    gid="$(docker run --rm --entrypoint sh "${IMAGE_API}:${IMAGE_TAG}" -c 'id -g appuser' 2>/dev/null || true)"
    if [[ -n "${uid}" && -n "${gid}" ]]; then
      echo "${uid} ${gid}"
      return 0
    fi
  fi
  log_warn "Não foi possível ler UID/GID de appuser na imagem; usando 100:101 (Alpine padrão)"
  echo "100 101"
}

read -r APP_UID APP_GID <<<"$(resolve_app_ids)"

log_info "Ajustando permissões do volume ${UPLOADS_VOLUME} (${APP_UID}:${APP_GID})"

docker run --rm \
  -v "${UPLOADS_VOLUME}:/data/uploads" \
  alpine:3.20 \
  sh -c "mkdir -p /data/uploads && chown -R ${APP_UID}:${APP_GID} /data/uploads && chmod 750 /data/uploads"

log_info "Volume de uploads pronto para appuser"
