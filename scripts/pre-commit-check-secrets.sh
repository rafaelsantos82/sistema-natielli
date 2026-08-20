#!/usr/bin/env bash
# Blocks commit if real env files with secrets are staged.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

is_blocked() {
  local file="$1"
  case "$file" in
    .env|.env.local|backend/.env|backend/.env.local|deploy.env) return 0 ;;
    *) return 1 ;;
  esac
}

staged="$(git diff --cached --name-only 2>/dev/null || true)"
if [[ -z "$staged" ]]; then
  exit 0
fi

failed=0
while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  if is_blocked "$file"; then
    echo "pre-commit-check-secrets: blocked staged file: $file" >&2
    failed=1
  fi
done <<< "$staged"

if [[ "$failed" -ne 0 ]]; then
  echo "Remove secrets from the index: git reset HEAD -- <file>" >&2
  echo "Only *.env.example and deploy/deploy.env (no passwords) may be committed." >&2
  exit 1
fi

# Obvious secret assignments in staged diff
if git diff --cached -U0 -- . ':(exclude)scripts/pre-commit-check-secrets.sh' \
  | grep -E '^\+.*(RESEND_API_KEY=re_|sk_live_[A-Za-z0-9]+|sk_test_[A-Za-z0-9]{20,})' \
  | grep -v '\.example' >/dev/null 2>&1; then
  echo "pre-commit-check-secrets: possible API key in staged diff" >&2
  exit 1
fi

exit 0
