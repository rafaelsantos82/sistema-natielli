# Migração de templates de anamnese

Cadastro de **questionários** (somente perguntas) na tabela `anamneses`, a partir dos formulários em `backend/docs/anamnese/`.

Não importa `respostas_anamnese` nem valores de PDFs preenchidos à mão.

## Inventário de fontes

| Slug | Arquivo fonte | JSON canônico | Observação |
|------|---------------|---------------|------------|
| `to-2024` | `ANAMNESE ESP TERAPIA 2024.md` | `backend/data/anamneses/to-2024.json` | Fonte canônica TO |
| `to-2024-alt` | `ANAMNESE ESP TERAPIA 2024 (1).md` | — | Ignorado (variante) |
| `ficha-clinica-inicial` | `Modelo - Anamnese- atualizado.pdf` | `ficha-clinica-inicial.json` | PDFs `(1)` e `(2)` são duplicatas |
| `aba` | `Anamnese-ABA.docx` | `aba.json` | Extração via XML do docx |
| `saulo-preenchida` | `Ficha Anamnese Infantil - Saulo Jesus001.pdf` | — | Preenchido; não importar respostas |

## Fluxo

1. **Extrair** (rascunho + relatório de conferência):

```bash
cd backend
make extract-anamneses
```

Gera `data/anamneses/<slug>.draft.json` e `data/anamneses/reviews/<slug>.md`.

2. **Conferência** — revisar `reviews/*.md` (checklist + amostra início/meio/fim). Ajustar JSON canônico se necessário.

3. **Seed local**:

```bash
cd backend
make seed-anamneses-dry-run
make seed-anamneses
# ou: make seed-anamneses ARGS="--only=to-2024"
```

4. **Seed produção** (após `git pull` na droplet com os JSON):

```bash
./deploy/scripts/seed-anamneses.sh --dry-run
./deploy/scripts/seed-anamneses.sh
```

O binário `seed-anamneses` faz UPSERT por `(nome, versao)`.

## Formato JSON

```json
{
  "slug": "to-2024",
  "anamnese": {
    "nome": "Anamnese Terapia Ocupacional 2024",
    "especialidade": "Terapia Ocupacional",
    "versao": "2024.1",
    "status": "Ativa"
  },
  "questionnaire": [
    { "linkId": "gestacao_planejada", "text": "...", "type": "boolean" }
  ]
}
```

`questionnaire` deve ser um **array** (compatível com o frontend).

## Dependências de extração

- `pdftotext` (poppler) — PDFs
- Go padrão — DOCX (`word/document.xml`)
- Markdown — parser interno

## Validação

```bash
curl -s -H "Authorization: Bearer $TOKEN" "$API/anamneses?page_size=50" | jq '.data | length'
```

Na UI: **Anamneses** → badge de quantidade de questões → preview do questionário.
