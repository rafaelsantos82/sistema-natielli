#!/usr/bin/env bash
set -euo pipefail

# Run from macOS repo root. Uses SSH alias pstec (see deploy/deploy.env).
# Shared VM: never load/stop Espaço Terapia or QR Gestor images/containers.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"
load_deploy_env
assert_isolation

info() { log_info "$@"; }
err() { log_error "$*"; exit 1; }

usage() {
  cat <<EOF
Usage: $0 <command> [args]

Commands:
  bootstrap          First-time Natielli setup on pstec (clone + nginx site + certbot)
  deploy [branch]    git pull on droplet + deploy.sh (default branch: ${GIT_DEFAULT_BRANCH})
  build-push         Build linux/amd64 natielli images on Mac and load on droplet
  cert-renew         Renew TLS for ${DEPLOY_DOMAIN} only

Examples:
  $0 bootstrap
  $0 build-push && $0 deploy main
  make deploy-prod
EOF
}

ssh_cmd() {
  ssh "${DEPLOY_HOST_ALIAS}" "$@"
}

check_free_ports_remote() {
  info "Checking host ports on ${DEPLOY_HOST_ALIAS} (8084/8085 must be free or owned by natielli)"
  ssh_cmd 'ss -tlnp | grep -E ":808[0-5]" || true'
}

cmd="${1:-deploy}"
shift || true

case "${cmd}" in
  bootstrap)
    assert_neighbors_healthy
    check_free_ports_remote
    info "Bootstrap Natielli on ${DEPLOY_HOST_ALIAS} → ${DEPLOY_APP_DIR}"
    ssh_cmd "mkdir -p ${DEPLOY_APP_DIR} && test -d ${DEPLOY_APP_DIR}/.git || git clone ${GIT_REPO_URL} ${DEPLOY_APP_DIR}"
    ssh_cmd "cd ${DEPLOY_APP_DIR} && git fetch origin && git checkout ${GIT_DEFAULT_BRANCH} && git pull --ff-only origin ${GIT_DEFAULT_BRANCH} || true"
    ssh_cmd "cd ${DEPLOY_APP_DIR} && chmod +x deploy/scripts/*.sh && sudo ./deploy/scripts/setup-droplet.sh"
    assert_neighbors_healthy
    ;;
  build-push)
    if [[ "${IMAGE_API}" == *espacoterapia* ]] || [[ "${IMAGE_FRONTEND}" == *espacoterapia* ]] \
      || [[ "${IMAGE_API}" == *qrgestor* ]] || [[ "${IMAGE_FRONTEND}" == *qrgestor* ]]; then
      err "Isolation: refusing to load images that collide with neighbor products"
    fi
    info "Building ${IMAGE_API}:${IMAGE_TAG} and ${IMAGE_FRONTEND}:${IMAGE_TAG} for linux/amd64"
    cd "${REPO_ROOT}"
    docker buildx version >/dev/null 2>&1 || err "docker buildx required (Docker Desktop)"
    docker buildx build --platform linux/amd64 \
      -t "${IMAGE_API}:${IMAGE_TAG}" \
      -f backend/Dockerfile backend --load
    docker buildx build --platform linux/amd64 \
      -t "${IMAGE_FRONTEND}:${IMAGE_TAG}" \
      -f frontend/Dockerfile \
      --build-arg "VITE_API_BASE_URL=${VITE_API_BASE_URL}" \
      --build-arg "VITE_API_PACIENTES=true" \
      --build-arg "VITE_API_PROFISSIONAIS=true" \
      --build-arg "VITE_API_CONSULTAS=true" \
      --build-arg "VITE_API_SALAS=true" \
      --build-arg "VITE_API_UNIDADES=true" \
      --build-arg "VITE_API_FINANCEIRO=true" \
      --build-arg "VITE_API_TERAPIAS=true" \
      --build-arg "VITE_API_ANAMNESES=true" \
      --build-arg "VITE_API_ESTOQUE=true" \
      --build-arg "VITE_API_RH=true" \
      --build-arg "VITE_API_PLANOS=true" \
      --build-arg "VITE_API_MARKETING=true" \
      --build-arg "VITE_API_PRONTUARIO=true" \
      --build-arg "VITE_API_RELATORIOS=true" \
      --build-arg "VITE_API_CONTABILIDADE=true" \
      --build-arg "VITE_API_COMODATO=true" \
      --build-arg "VITE_API_CONTRATOS=true" \
      --build-arg "VITE_API_AUDIT=true" \
      --build-arg "VITE_AUTH_BOOTSTRAP=false" \
      . --load
    info "Uploading ${IMAGE_API} and ${IMAGE_FRONTEND} to droplet (docker save | ssh docker load)"
    docker save "${IMAGE_API}:${IMAGE_TAG}" "${IMAGE_FRONTEND}:${IMAGE_TAG}" \
      | ssh_cmd docker load
    info "Images loaded on droplet"
    ;;
  cert-renew)
    info "Renewing certificate ${DEPLOY_DOMAIN} only"
    ssh_cmd "sudo certbot renew --cert-name ${DEPLOY_DOMAIN} --quiet && sudo nginx -t && sudo systemctl reload nginx"
    ;;
  deploy)
    branch="${1:-${GIT_DEFAULT_BRANCH}}"
    assert_neighbors_healthy
    info "Deploying branch ${branch} via ${DEPLOY_HOST_ALIAS} → ${DEPLOY_APP_DIR}"
    if [[ "${BUILD_STRATEGY}" == "prebuilt" ]]; then
      info "Tip: run '$0 build-push' first when images changed"
    fi
    ssh_cmd "cd ${DEPLOY_APP_DIR} && \
      git fetch origin && \
      git checkout ${branch} && \
      git pull --ff-only origin ${branch} && \
      chmod +x deploy/scripts/*.sh && \
      ./deploy/scripts/deploy.sh"
    assert_neighbors_healthy
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    err "Unknown command: ${cmd}. Use --help"
    ;;
esac
