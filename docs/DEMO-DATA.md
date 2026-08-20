## Dados de demo (seed) — navegação manual

Este documento descreve como popular o ambiente com dados mínimos para você navegar nas telas e consultar resultados no browser.

### Admin para login na UI

```bash
cd backend
# ADMIN_EMAIL e ADMIN_PASSWORD no .env (ver .env.example)
make seed-admin
```

No frontend, use `VITE_AUTH_LOGIN=true` e `VITE_AUTH_BOOTSTRAP=false` em `.env.local`, depois faça login em `/login` com o mesmo e-mail/senha.

### Seed (create-only)

- **Script**: `backend/scripts/seed-demo.sh`
- **Pré-requisitos**: backend e migrations rodando

```bash
cd /Users/rprenzier/Documents/Projetos/espaco-terapia-os/backend
make up && make migrate-up

# (opcional) fixe os envs
export API_BASE=http://localhost:8080/api/v1
export BOOTSTRAP_AUTH_TOKEN=change-bootstrap-token
export UNIDADE_ID_DEFAULT=a0000000-0000-4000-8000-000000000001

./scripts/seed-demo.sh
```

### Exclusão de salas após o seed

O seed cria uma **consulta** e depois uma **sala** com reserva vinculada. A migration `000026` preenche `consultas.sala_id` a partir da reserva. Enquanto existir consulta referenciando a sala, o DELETE retorna **400** com mensagem de agendamentos vinculados — comportamento esperado. Para remover a sala demo, cancele ou exclua o agendamento antes, ou desvincule a sala na edição da consulta.

### O que o seed cria

O script imprime durante a execução os IDs/códigos criados (ex.: `PACIENTE_ID=...`). Todos os nomes/descrições usam um prefixo:

- `RUN_ID=DEMO-YYYYMMDD-HHMMSS`

Use esse prefixo na busca das telas para localizar rapidamente os registros.

### Dica para navegar mais rápido

O `RUN_ID` mais recente fica no final do output do script:

```bash
./scripts/seed-demo.sh | tail -20
```

### Onde ver no app (browser)

- **Pacientes**: buscar por `RUN_ID`
- **Profissionais**: buscar por `RUN_ID`
- **Agendamentos / Consultas**: buscar por `RUN_ID`
- **Salas**: buscar por `RUN_ID` (e abrir reservas)
- **Tratamentos / Anamneses / Respostas-anamnese**: buscar por `RUN_ID`
- **Financeiro**: categorias/centros de custo/lançamentos com `RUN_ID`
- **Relatórios operacionais**: número contém `RUN_ID-001`
- **RH**: funcionários CLT/PJ e folhas com `RUN_ID`
- **Estoque**: itens/movimentações/inventários com `RUN_ID`
- **Comodatos**: paciente + item com `RUN_ID`
- **Planos / Ações judiciais / Notas fiscais**: nomes e números com `RUN_ID`
- **Contratos**: título com `RUN_ID`
- **Marketing**: manual/material com `RUN_ID`
- **Contabilidade**: conta e lançamento com `RUN_ID`

### Unidades

Este seed **não cria unidades** (endpoint é read-only). Ele usa por padrão a unidade:

- `UNIDADE_ID_DEFAULT=a0000000-0000-4000-8000-000000000001`

### Observação sobre logs

Para acompanhar erros durante o seed:

```bash
cd /Users/rprenzier/Documents/Projetos/espaco-terapia-os/backend
docker compose logs -f api
docker compose logs -f db
```

