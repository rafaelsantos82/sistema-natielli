# Deploy em produção (Digital Ocean)

**URL:** https://sistema.natielli.com.br  
**SSH (Mac):** alias `pstec` → `142.93.245.159` (ver `deploy/deploy.env`)  
**App na droplet:** `/opt/sistemanatielli`  
**Secrets:** `/etc/sistemanatielli/`  
**Portas loopback:** API `127.0.0.1:8084`, frontend `127.0.0.1:8085`

VM **compartilhada** com Espaço Terapia (`8080`/`8081`) e QR Gestor (`8082`/`8083`). Os scripts abortam se o alvo for path, porta, imagem ou volume de outro produto.

Desenvolvimento local: [`DEV.md`](DEV.md).

## Isolamento (obrigatório)

| Recurso | Espaço Terapia | QR Gestor | Sistema Natielli |
|---------|----------------|-----------|------------------|
| App | `/opt/espacoterapia` | `/opt/qrgestor` | `/opt/sistemanatielli` |
| Secrets | `/etc/espacoterapia` | `/etc/qrgestor` | `/etc/sistemanatielli` |
| Portas | 8080 / 8081 | 8082 / 8083 | **8084 / 8085** |
| Compose | `espacoterapia-prod` | `qrgestor-prod` | `natielli-prod` |
| Imagens | `espacoterapia/*` | `qrgestor/*` | `natielli/*` |
| Nginx site | `espacoterapia.ps.tec.br` | `qrgestor.com.br` | `sistema.natielli.com.br` |

Antes e depois de qualquer bootstrap/deploy:

```bash
curl -fsS https://espacoterapia.ps.tec.br/api/v1/health
curl -fsS https://qrgestor.com.br/api/v1/health
ssh pstec 'ss -tlnp | grep -E ":808[0-5]"; free -h'
```

Se um vizinho cair, **parar**. Não rode `docker compose down` global, `docker system prune`, `systemctl restart docker` nem `rm` em sites nginx de outro produto.

## Capacidade da droplet

| Tier | Spec | Deploy recomendado |
|------|------|-------------------|
| **Atual (compartilhada)** | 1 vCPU, ~2 GB RAM | `BUILD_STRATEGY=prebuilt` — build no Mac, `build-push` + `deploy` |
| **Recomendado** | 2 vCPU, 4 GB RAM, 80 GB SSD | Resize no painel DO → `BUILD_STRATEGY=on-droplet` em `deploy/deploy.env` |

Com 2 GB e **três** stacks, **não** rode `docker compose build` do frontend na droplet (risco de OOM nos vizinhos). Confira `free -h` / `docker stats --no-stream` antes do primeiro `up`.

## Primeira vez (bootstrap)

1. DNS `A` `sistema.natielli.com.br` → `142.93.245.159` (propagado).
2. SSH no Mac: alias `pstec` em `~/.ssh/config`; deploy key do GitHub na droplet para `git@github.com:rafaelsantos82/sistema-natielli.git`.
3. Health dos vizinhos (comandos acima). Portas `8084`/`8085` livres.
4. No Mac, na raiz do repo:

```bash
make deploy-bootstrap
```

Isso clona o repo em `/opt/sistemanatielli`, cria o vhost **somente** de `sistema.natielli.com.br` e executa Certbot **só** nesse domínio. Não apaga os sites do Espaço Terapia nem do QR Gestor.

5. Preencher secrets na droplet:

```bash
ssh pstec
sudo nano /etc/sistemanatielli/secrets/jwt_secret    # string longa aleatória
sudo nano /etc/sistemanatielli/secrets/pg_password
sudo nano /etc/sistemanatielli/app.env               # revisar JWT, CORS, Sentry
sudo /opt/sistemanatielli/deploy/scripts/setup-secrets.sh
```

6. Publicar imagens (tier 2 GB — **obrigatório** na primeira vez):

```bash
make deploy-build-push
```

Se `npm ci` falhar no build do frontend (`package-lock` desync), regenere o lock com o mesmo Node da imagem:

```bash
docker run --rm -v "$(pwd):/app" -w /app node:20-alpine sh -c "rm -rf node_modules && npm install"
git add package-lock.json && git commit -m "chore: sync package-lock for node:20-alpine" && git push
```

7. Deploy da aplicação:

```bash
make deploy-prod
```

8. Validar Natielli **e** vizinhos:

```bash
curl -fsS https://sistema.natielli.com.br/api/v1/health
curl -fsS https://espacoterapia.ps.tec.br/api/v1/health
curl -fsS https://qrgestor.com.br/api/v1/health
```

## Atualizações (rotina)

Após `git push`:

```bash
# Se mudou backend ou frontend (Dockerfile, deps, código que afeta build):
make deploy-build-push

make deploy-prod
# ou: ./deploy/scripts/deploy-from-mac.sh deploy main
```

Apenas migrations/config sem rebuild de imagem:

```bash
make deploy-prod
```

## Rollout RBAC (níveis de acesso)

Para ativar o controle de acesso por perfil (menu + rotas + APIs):

1. Deploy backend com migration e middleware de permissões.
2. Executar migrations (`deploy/scripts/deploy.sh` já chama `migrate.sh`).
3. Validar endpoints admin:
   - `GET /api/v1/access-control/permissions`
   - `GET /api/v1/access-control/roles/gestor`
4. Deploy frontend com novo submenu em Configurações:
   - `/configuracoes/usuarios`
   - `/configuracoes/controles-acesso`
5. Revisar permissões por perfil na nova tela e salvar ajustes.

Observação: `admin` sempre tem acesso total por regra de backend.

### Perfis Terapeuta e Responsável (`000022_user_roles_terapeuta_responsavel`)

- Amplia `user_role` com `terapeuta` e `responsavel`, adiciona `users.paciente_id` (FK `pacientes`, obrigatório no cadastro quando o perfil é responsável).
- Terapeuta: mesma **matriz inicial** que funcionário (`role_permissions` copiada na migration).
- Responsável: permissões mínimas de agenda/consultas no seed; a API filtra listagem e leitura por `paciente_id` vinculado (evita exposição de dados de outros pacientes).

O fluxo de deploy habitual (`migrate.sh` chamado pelo `deploy-prod`) aplica esta migration quando a imagem do backend já inclui o arquivo correspondente em `backend/migrations/`.

### Renomear módulo Tratamentos → Terapias (`000024_rename_tratamentos_terapias`)

- Renomeia tabelas/colunas (`tratamentos` → `terapias`, `nome_terapia`, `precos_terapia`) e permissões RBAC (`api.terapias.*`, `menu.terapias.view`).
- Coluna `relatorios_operacionais.tratamento` → `terapia`.
- **Breaking:** API em `/api/v1/terapias` (não `/tratamentos`). Frontend: rota `/terapias`, env `VITE_API_TERAPIAS`.

**Smoke pós-migration:**

```bash
curl -fsS -H "Authorization: Bearer $TOKEN" https://sistema.natielli.com.br/api/v1/terapias?page=1&page_size=5
```

### Carteira dinâmica terapeuta (`000025_paciente_profissionais`)

- Tabela `paciente_profissionais` (M2M paciente ↔ profissional), populada ao criar/atualizar/concluir consultas (não no cadastro de usuário).
- Backfill a partir de `consultas` não canceladas.
- Escopo `therapist_patients` usa só a carteira (não `pacientes.profissional_responsavel`).
- Listagem de pacientes para terapeuta inclui `ultima_consulta_em`, `proxima_consulta_em`, `total_consultas`.

**Smoke pós-migration (terapeuta):**

1. Login terapeuta com `users.profissional_id` preenchido.
2. Criar consulta para um paciente → `GET /pacientes` deve incluir o paciente com métricas de carteira.
3. Paciente com apenas `profissional_responsavel` e sem consulta → não aparece na lista do terapeuta.

### Seed salas Duque de Caxias (`000027_seed_salas_duque_caxias`)

- Insere 19 salas **Ativas** na unidade Duque de Caxias com UUIDs fixos (`b0000000-0000-4000-8000-000000000001` … `…0019`).
- Idempotente: `ON CONFLICT (id) DO UPDATE` (redeploy não duplica).
- Aplicada com o fluxo habitual de migrations (`migrate.sh` / `make deploy-prod`).

**Smoke pós-migration:**

```bash
curl -fsS -H "Authorization: Bearer $TOKEN" \
  "https://sistema.natielli.com.br/api/v1/salas?unidade_id=a0000000-0000-4000-8000-000000000001&status=Ativa&page_size=50"
```

Resposta deve listar 19 salas (SALA 01 … ABA GRUPO 19). O `down` da migration remove apenas esses IDs; falha se já houver consultas/reservas vinculadas.

### RBAC por escopo de dados anti-IDOR (`000023_rbac_data_scopes`)

- Cria catálogo `data_scopes` e matriz `role_resource_scopes` (escopo por perfil/recurso clínico).
- Adiciona `users.profissional_id` (FK `profissionais`, obrigatório no cadastro quando o perfil é terapeuta).
- Seeds de escopo: admin/gestor/terceiro → `all`; funcionário → `unit_patients`; terapeuta → `therapist_patients`; responsável → `self_patient`.
- API `/access-control` passa a expor `GET /data-scopes` e `resource_scopes` em `GET/PUT /roles/:role`.
- Handlers de pacientes, consultas, prontuário e respostas de anamnese aplicam `DataScopeService` server-side.

**Smoke pós-deploy (por perfil):**

1. Responsável: listar consultas/pacientes — apenas o vínculo `paciente_id`; tentativa de outro ID → 403.
2. Terapeuta: carteira via `paciente_profissionais` (consultas); `users.profissional_id` é só identidade da conta.
3. Gestor: em Controles de Acesso, salvar matriz de ações + escopo e validar reflexo no login do perfil editado.

## Scripts

| Script | Onde | Função |
|--------|------|--------|
| `deploy/scripts/deploy-from-mac.sh` | Mac | `bootstrap`, `build-push`, `deploy` (checa health dos vizinhos) |
| `deploy/scripts/setup-droplet.sh` | Droplet | Pacotes faltantes, nginx **só** Natielli, certbot do domínio Natielli, clone |
| `deploy/scripts/deploy.sh` | Droplet | migrate + `docker compose -p natielli-prod up` |
| `deploy/scripts/migrate.sh` | Droplet | SQL migrations |
| `deploy/scripts/backup-db.sh` | Droplet | `pg_dump` gzip |
| `deploy/scripts/fix-uploads-permissions.sh` | Droplet | `chown` **somente** de `natielli-prod_uploads_data` |
| `deploy/scripts/seed-anamneses.sh` | Mac | Build + seed templates de anamnese em produção |
| `deploy/scripts/seed-pacientes.sh` | Mac | Import cadastro das planilhas (backup no apply; PII só em `/tmp`) |
| `deploy/scripts/seed-pacientes-pendencias.sh` | Mac | Dry-run do JSON comercial (apply bloqueado até schema) |

## Seed de pacientes (planilhas)

Cadastro agora; plano/check-in/etiqueta só no JSON. Detalhes: [`SEED-PACIENTES.md`](SEED-PACIENTES.md).

```bash
./deploy/scripts/seed-pacientes.sh --dry-run -- ~/Downloads/clientes_22_07_2026.xlsx ~/Downloads/clientes_Natielli.xlsx
./deploy/scripts/seed-pacientes.sh --apply -- ~/Downloads/clientes_22_07_2026.xlsx ~/Downloads/clientes_Natielli.xlsx
./deploy/scripts/seed-pacientes-pendencias.sh --dry-run
```

Migration `000033` precisa estar no ar antes (teto de 25 anos removido + unidades Natielli).

## Seed de anamneses (produção)

Após merge dos JSON em `backend/data/anamneses/` e `git pull` na droplet:

```bash
./deploy/scripts/seed-anamneses.sh --dry-run
./deploy/scripts/seed-anamneses.sh
```

Detalhes: [`ANAMNESE-MIGRATION.md`](ANAMNESE-MIGRATION.md).

- `deploy/deploy.env` — domínio, `pstec`, portas 8084/8085, imagens `natielli/*`
- `deploy/.env.production.example` → `/etc/sistemanatielli/app.env`
- `deploy/docker-compose.prod.yml` — Postgres em rede **internal** (sem porta no host)

### Upload de documentos (profissionais)

- Volume Docker `natielli-prod_uploads_data` montado em `/data/uploads` no serviço `api`.
- Variáveis em `app.env`: `UPLOAD_BASE_PATH=/data/uploads`, `UPLOAD_MAX_BYTES=10485760` (10 MB).
- Tipos permitidos: imagens, TXT/CSV, Excel, Word (DOC/DOCX), PDF.
- Backup: incluir volume `uploads_data` no snapshot ou backup de arquivos.
- O `deploy.sh` executa `fix-uploads-permissions.sh` após subir o Postgres e **antes** da API (idempotente).

A API roda como `appuser` com `cap_drop: ALL` — **não** use `docker compose run api ... chown` (falha com `Operation not permitted`). O script de correção usa um container Alpine com o volume montado.

Correção manual (emergência), a partir de `/opt/sistemanatielli`:

```bash
docker volume ls | grep natielli-prod_uploads
docker run --rm natielli/api:latest id appuser   # anotar uid/gid (ex.: 100 / 101)

docker run --rm \
  -v natielli-prod_uploads_data:/data/uploads \
  alpine:3.20 \
  sh -c 'mkdir -p /data/uploads && chown -R 100:101 /data/uploads && chmod 750 /data/uploads'

docker compose -p natielli-prod -f deploy/docker-compose.prod.yml restart api
```

Não use `chmod 777`. Não rode compose a partir de `backend/` (usa `.env` de dev, não `/etc/sistemanatielli/app.env`).

## Backup

Na droplet (cron sugerido diário):

```bash
sudo /opt/sistemanatielli/deploy/scripts/backup-db.sh
```

Complementar com snapshot de volume no painel Digital Ocean.

## TLS

Certbot: apenas o certificado `sistema.natielli.com.br`. Manual:

```bash
./deploy/scripts/deploy-from-mac.sh cert-renew
```

(`certbot renew --cert-name sistema.natielli.com.br` — não renova os outros produtos nesta chamada.)

## Troubleshooting

| Sintoma | Ação |
|---------|------|
| `Image not found` no deploy | Rodar `make deploy-build-push` no Mac |
| 502 no site | `docker ps`; `curl 127.0.0.1:8084/api/v1/health`; `sudo nginx -t` |
| Migrate falhou | Logs: `docker compose -p natielli-prod -f deploy/docker-compose.prod.yml logs migrate` |
| OOM / exit 137 | Usar `prebuilt`; conferir RAM antes de subir a terceira stack |
| CORS | `CORS_ALLOWED_ORIGINS=https://sistema.natielli.com.br` em `app.env` |
| Frontend `Restarting`, `client_temp` / `nginx.pid` | Usar imagem/compose atuais (`frontend/nginx-runtime.conf`, sem tmpfs em `/var/cache/nginx`); `make deploy-build-push` |
| `Could not resolve hostname pstec` | Configurar `Host pstec` em `~/.ssh/config` |
| `npm ci` no Docker (Mac npm 11) | Regenerar `package-lock.json` com `node:20-alpine` (ver acima) |
| Isolation abort | Conferir `deploy/deploy.env` — não apontar para `/opt/espacoterapia` nem portas 8080–8083 |
| Upload de documento falha / permission denied | Conferir `UPLOAD_*` em `app.env`; rodar `sudo /opt/sistemanatielli/deploy/scripts/fix-uploads-permissions.sh`; reiniciar `api` |
| `chown: Operation not permitted` via `compose run api` | Esperado (`cap_drop: ALL`); usar `fix-uploads-permissions.sh` ou container Alpine (ver seção Upload) |

## Segurança (checklist)

- [ ] `BOOTSTRAP_AUTH_ENABLED=false` em produção
- [ ] `SWAGGER_ENABLED=false`
- [ ] Secrets com chmod 600, diretório 700
- [ ] UFW + Cloud Firewall DO (22, 80, 443)
- [ ] Postgres sem `ports` publicados no host
- [ ] Portas 8080–8083 e vhosts dos vizinhos intactos após o deploy
