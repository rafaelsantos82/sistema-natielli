#!/usr/bin/env bash
set -euo pipefail

# First-time (idempotent) setup for Sistema Natielli on shared VM pstec.
# Does NOT remove other nginx sites, restart Docker, or write Espaço Terapia / QR Gestor paths.

# shellcheck source=common.sh
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
load_deploy_env
assert_isolation
require_linux

if [[ "${EUID}" -ne 0 ]]; then
  SUDO="sudo"
else
  SUDO=""
fi

DEPLOY_USER="${SUDO_USER:-${USER}}"
NGINX_SITE="/etc/nginx/sites-available/${DEPLOY_DOMAIN}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${DEPLOY_DOMAIN}"

log_info "Bootstrap Natielli for ${DEPLOY_DOMAIN} (user: ${DEPLOY_USER})"
log_info "Neighbors must stay up: Espaço Terapia :8080/8081, QR Gestor :8082/8083"

PACKAGES=()
command -v curl >/dev/null || PACKAGES+=(curl)
command -v git >/dev/null || PACKAGES+=(git)
command -v python3 >/dev/null || PACKAGES+=(python3)
command -v envsubst >/dev/null || PACKAGES+=(gettext-base)
if ! command -v docker >/dev/null; then
  PACKAGES+=(docker.io)
  if apt-cache show docker-compose-v2 &>/dev/null; then
    PACKAGES+=(docker-compose-v2)
  elif apt-cache show docker-compose-plugin &>/dev/null; then
    PACKAGES+=(docker-compose-plugin)
  fi
fi
command -v nginx >/dev/null || PACKAGES+=(nginx)
if ! command -v certbot >/dev/null; then
  PACKAGES+=(certbot python3-certbot-nginx)
fi

if [[ ${#PACKAGES[@]} -gt 0 ]]; then
  log_info "Installing missing packages: ${PACKAGES[*]}"
  export DEBIAN_FRONTEND=noninteractive
  ${SUDO} apt-get update -qq
  ${SUDO} apt-get install -y -qq "${PACKAGES[@]}"
else
  log_info "Docker/nginx/certbot already present — skipping apt install"
fi

if command -v docker >/dev/null; then
  ${SUDO} systemctl enable --now docker >/dev/null 2>&1 || true
  ${SUDO} usermod -aG docker "${DEPLOY_USER}" || true
fi

if command -v ufw >/dev/null; then
  if ${SUDO} ufw status | grep -q inactive; then
    ${SUDO} ufw default deny incoming
    ${SUDO} ufw default allow outgoing
    ${SUDO} ufw allow OpenSSH
    ${SUDO} ufw allow 80/tcp
    ${SUDO} ufw allow 443/tcp
    ${SUDO} ufw --force enable
    log_info "UFW enabled (22, 80, 443)"
  else
    log_info "UFW already active — leaving existing rules untouched"
  fi
fi

${SUDO} mkdir -p "${DEPLOY_APP_DIR}" /var/log/sistemanatielli /var/www/html
${SUDO} chown "${DEPLOY_USER}:${DEPLOY_USER}" "${DEPLOY_APP_DIR}" /var/log/sistemanatielli

run_as_deploy_user() {
  if [[ "${EUID}" -eq 0 ]] && [[ -n "${SUDO_USER:-}" ]] && [[ "${SUDO_USER}" != "root" ]]; then
    sudo -u "${SUDO_USER}" "$@"
  else
    "$@"
  fi
}

if [[ ! -d "${DEPLOY_APP_DIR}/.git" ]]; then
  log_info "Cloning repository into ${DEPLOY_APP_DIR}"
  run_as_deploy_user git clone "${GIT_REPO_URL}" "${DEPLOY_APP_DIR}"
else
  log_info "Repository already present — pulling latest"
  run_as_deploy_user git -C "${DEPLOY_APP_DIR}" pull --ff-only origin "${GIT_DEFAULT_BRANCH}" || true
fi

"${DEPLOY_APP_DIR}/deploy/scripts/setup-secrets.sh"

log_info "Installing nginx site for ${DEPLOY_DOMAIN} only (not touching other vhosts)"
${SUDO} bash -c "
  source '${DEPLOY_APP_DIR}/deploy/scripts/common.sh'
  load_deploy_env
  assert_isolation
  DEPLOY_APP_DIR='${DEPLOY_APP_DIR}'
  refresh_nginx_site '${NGINX_SITE}'
"
${SUDO} ln -sf "${NGINX_SITE}" "${NGINX_ENABLED}"
# Only remove the unused Debian default site — never Espaço Terapia or QR Gestor vhosts.
${SUDO} rm -f /etc/nginx/sites-enabled/default
if ! ${SUDO} nginx -t; then
  log_error "nginx -t failed after writing Natielli site — NOT reloading"
  exit 1
fi
${SUDO} systemctl reload nginx

if [[ ! -d "/etc/letsencrypt/live/${DEPLOY_DOMAIN}" ]]; then
  log_info "Requesting TLS certificate via certbot for ${DEPLOY_DOMAIN} only"
  ${SUDO} certbot --nginx -d "${DEPLOY_DOMAIN}" \
    --non-interactive --agree-tos -m "${CERTBOT_EMAIL}" \
    --redirect || log_warn "Certbot failed — check DNS A ${DEPLOY_DOMAIN} → this VM and retry"
else
  log_info "TLS certificate already present for ${DEPLOY_DOMAIN}"
fi

${SUDO} bash -c "
  source '${DEPLOY_APP_DIR}/deploy/scripts/common.sh'
  load_deploy_env
  assert_isolation
  DEPLOY_APP_DIR='${DEPLOY_APP_DIR}'
  refresh_nginx_site '${NGINX_SITE}'
"
if ! ${SUDO} nginx -t; then
  log_error "nginx -t failed after certbot/refresh — NOT reloading"
  exit 1
fi
${SUDO} systemctl reload nginx

log_info "Bootstrap complete. Fill ${DEPLOY_ETC_DIR}/secrets then run deploy.sh"
log_info "Port isolation: ss -tlnp | grep -E ':808[0-5]'  (Natielli must be 8084/8085)"

if [[ -s "${DEPLOY_ETC_DIR}/secrets/jwt_secret" ]] && [[ -s "${DEPLOY_ETC_DIR}/secrets/pg_password" ]]; then
  log_info "Secrets detected — running first deploy"
  ${SUDO} -u "${DEPLOY_USER}" "${DEPLOY_APP_DIR}/deploy/scripts/deploy.sh" || log_warn "Deploy failed — fix secrets/config and rerun deploy.sh"
fi
