# Seed de pacientes (planilhas Natielli)

Importa cadastro das planilhas de clientes para `pacientes` (local e produção) **sem duplicar**. Campos comerciais (plano, check-ins, etiquetas) vão para um JSON gitignored, prontos para um apply futuro.

Planilhas **não entram no git**.

## Local

```bash
cd backend
make migrate-up
make seed-pacientes ARGS='--dry-run --xlsx=/Users/rprenzier/Downloads/clientes_22_07_2026.xlsx --xlsx=/Users/rprenzier/Downloads/clientes_Natielli.xlsx --pendencias-out=data/imports/pendencias-comerciais.json'
make seed-pacientes ARGS='--apply --xlsx=/Users/rprenzier/Downloads/clientes_22_07_2026.xlsx --xlsx=/Users/rprenzier/Downloads/clientes_Natielli.xlsx --pendencias-out=data/imports/pendencias-comerciais.json'
make seed-pacientes-pendencias ARGS='--dry-run --in=data/imports/pendencias-comerciais.json'
```

Ordem dos `--xlsx`: mais antigo primeiro; o último ganha no mesmo WhatsApp. As duas Natielli são idênticas; as duas de 22/07 também — basta um arquivo de cada par.

`--apply` de pendências sai com código 2 até existir schema comercial.

## Produção

A migration `000033` precisa estar aplicada (`./deploy/scripts/deploy-from-mac.sh deploy main`) **antes** do seed.

```bash
./deploy/scripts/seed-pacientes.sh --dry-run -- \
  ~/Downloads/clientes_22_07_2026.xlsx \
  ~/Downloads/clientes_Natielli.xlsx

./deploy/scripts/seed-pacientes.sh --apply -- \
  ~/Downloads/clientes_22_07_2026.xlsx \
  ~/Downloads/clientes_Natielli.xlsx

./deploy/scripts/seed-pacientes-pendencias.sh --dry-run
```

O apply faz backup (`backup-db.sh`) e apaga as planilhas de `/tmp` na droplet. O JSON de pendências é copiado para `backend/data/imports/` (gitignored).

## Placeholders de cadastro

| Campo | Valor no import |
|-------|-----------------|
| sexo | `nao_informado` |
| CEP | `00000-000` |
| responsável | nome do próprio paciente |
| nascimento `*/2026` | `1900-01-01` + nota em observações |
| UF `INT` | `EX` |
| status `Pausado` | `inativo` |
| LGPD | `false` |

Unidades novas: Catanduva, Londrina, Sertanópolis, Online. Filtrar no header — a lista em Duque de Caxias permanece vazia.
