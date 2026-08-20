# Segurança — variáveis de ambiente e commits

## Arquivos que nunca devem ir para o Git

| Arquivo | Uso |
|---------|-----|
| `backend/.env` | Segredos da API (JWT, Resend, senha admin, Postgres) |
| `.env.local` | Frontend local + `BOOTSTRAP_AUTH_TOKEN` para proxy Vite |
| `/deploy.env` (raiz) | Override local de deploy (se existir) |

Copie sempre a partir dos `*.env.example` e preencha valores reais só na máquina ou em `/etc/sistemanatielli/` em produção.

## Arquivos seguros para versionar

- `.env.example`, `backend/.env.example`, `deploy/.env.production.example` (placeholders)
- `deploy/deploy.env` (domínio, SSH alias, URLs — sem senhas)

## Frontend (Vite)

- Apenas variáveis com prefixo `VITE_` entram no bundle do navegador.
- **Nunca** use `VITE_` em API keys, JWT ou tokens bootstrap.
- `BOOTSTRAP_AUTH_TOKEN` fica em `.env.local` (ignorado pelo Git) e é usado só no proxy de desenvolvimento.

## Antes de cada commit

```bash
git check-ignore -v backend/.env .env.local   # deve mostrar regra do .gitignore
./scripts/pre-commit-check-secrets.sh         # após git add, se hook instalado
git diff --cached --name-only | grep env || true
```

## Hook opcional (recomendado)

```bash
chmod +x scripts/pre-commit-check-secrets.sh
git config core.hooksPath .githooks   # opcional: ver .githooks/pre-commit
```

Ou link manual:

```bash
ln -sf ../../scripts/pre-commit-check-secrets.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

## Se um segredo foi commitado por engano

1. Remover do índice: `git rm --cached backend/.env`
2. Commit de correção
3. **Rotacionar** a credencial no provedor (Resend, JWT, banco, etc.) — o histórico Git pode manter o valor

## Rotação Resend (ação manual)

Se `RESEND_API_KEY` real esteve em chat, log ou diff compartilhado:

1. [Resend Dashboard](https://resend.com/api-keys) → revogar chave antiga → criar nova
2. Atualizar apenas `backend/.env` local (não commitar)

## Produção

- `BOOTSTRAP_AUTH_ENABLED=false`
- `JWT_SECRET` forte e exclusivo
- Secrets em `/etc/sistemanatielli/` (ver `deploy/.env.production.example`)
