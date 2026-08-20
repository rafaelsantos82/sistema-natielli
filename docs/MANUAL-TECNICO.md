# Manual Técnico — Espaço Terapia OS

**Versão do documento:** gerado a partir do repositório monorepo `espaco-terapia-os`  
**Público-alvo:** engenheiros de software, DevOps, arquitetos, auditoria técnica  
**Formato:** Markdown modular + PDF (`MANUAL-TECNICO.pdf`)

---

## Como usar este manual

1. Leia a **Parte I (Fundamentos)** para arquitetura, stack, configuração, logs e API.
2. Consulte **Parte II (Módulos)** alinhada ao menu lateral da aplicação.
3. Use **Apêndices** para glossário, matriz de integração e rotas auxiliares.
4. Contratos HTTP detalhados: Swagger UI (`SWAGGER_ENABLED=true`) em `/api/v1/swagger/index.html`.

---

## Parte I — Fundamentos

| # | Capítulo | Arquivo |
|---|----------|---------|
| 00 | Introdução e visão do sistema | [manual-tecnico/00-introducao.md](manual-tecnico/00-introducao.md) |
| 01 | Stack tecnológico | [manual-tecnico/01-stack.md](manual-tecnico/01-stack.md) |
| 02 | Arquitetura backend | [manual-tecnico/02-arquitetura-backend.md](manual-tecnico/02-arquitetura-backend.md) |
| 03 | Organização do código | [manual-tecnico/03-organizacao-codigo.md](manual-tecnico/03-organizacao-codigo.md) |
| 04 | Configuração e ambientes | [manual-tecnico/04-configuracao.md](manual-tecnico/04-configuracao.md) |
| 05 | Logging e observabilidade | [manual-tecnico/05-logging.md](manual-tecnico/05-logging.md) |
| 06 | API REST e Swagger | [manual-tecnico/06-api-swagger.md](manual-tecnico/06-api-swagger.md) |
| 07 | Autenticação e RBAC | [manual-tecnico/07-autenticacao-rbac.md](manual-tecnico/07-autenticacao-rbac.md) |
| 08 | Banco de dados (ER) | [manual-tecnico/08-banco-dados.md](manual-tecnico/08-banco-dados.md) |
| 09 | Frontend transversal | [manual-tecnico/09-frontend.md](manual-tecnico/09-frontend.md) |
| 10 | DevOps e segurança | [manual-tecnico/10-devops-seguranca.md](manual-tecnico/10-devops-seguranca.md) |

---

## Parte II — Módulos (menu lateral)

### Dashboard

| Módulo | Arquivo |
|--------|---------|
| Dashboard (`/`) | [modulos/00-dashboard.md](manual-tecnico/modulos/00-dashboard.md) |

### Recepção

| Módulo | Rota | Arquivo |
|--------|------|---------|
| Agenda | `/agenda` | [modulos/01-agenda.md](manual-tecnico/modulos/01-agenda.md) |
| Agendamentos | `/consultas` | [modulos/02-agendamentos.md](manual-tecnico/modulos/02-agendamentos.md) |
| Pacientes | `/pacientes` | [modulos/03-pacientes.md](manual-tecnico/modulos/03-pacientes.md) |
| Terapias | `/terapias` | [modulos/04-terapias.md](manual-tecnico/modulos/04-terapias.md) |
| Salas | `/salas` | [modulos/05-salas.md](manual-tecnico/modulos/05-salas.md) |

### Clínico

| Módulo | Rota | Arquivo |
|--------|------|---------|
| Prontuários | `/prontuarios` | [modulos/06-prontuarios.md](manual-tecnico/modulos/06-prontuarios.md) |
| Anamneses | `/anamneses` | [modulos/07-anamneses.md](manual-tecnico/modulos/07-anamneses.md) |
| Aprovação Atendimentos | `/atendimentos/aprovacoes` | [modulos/08-aprovacao-atendimentos.md](manual-tecnico/modulos/08-aprovacao-atendimentos.md) |
| Docs Assinados | `/documentos-assinados` | [modulos/09-docs-assinados.md](manual-tecnico/modulos/09-docs-assinados.md) |

### Profissionais

| Módulo | Rota | Arquivo |
|--------|------|---------|
| Meu Painel | `/meu-painel` | [modulos/10-meu-painel.md](manual-tecnico/modulos/10-meu-painel.md) |
| Minha Agenda | `/minha-agenda` | [modulos/11-minha-agenda.md](manual-tecnico/modulos/11-minha-agenda.md) |
| Profissionais | `/profissionais` | [modulos/12-profissionais.md](manual-tecnico/modulos/12-profissionais.md) |

### Financeiro

| Módulo | Rota | Arquivo |
|--------|------|---------|
| Financeiro | `/financeiro` | [modulos/13-financeiro.md](manual-tecnico/modulos/13-financeiro.md) |
| Balancetes | `/balancetes` | [modulos/14-balancetes.md](manual-tecnico/modulos/14-balancetes.md) |
| Relatórios Conciliação | `/relatorios-conciliacao` | [modulos/15-relatorios-conciliacao.md](manual-tecnico/modulos/15-relatorios-conciliacao.md) |
| Auditoria de Notas | `/auditoria-notas` | [modulos/16-auditoria-notas.md](manual-tecnico/modulos/16-auditoria-notas.md) |

### RH & Contratos

| Módulo | Rota | Arquivo |
|--------|------|---------|
| Contratos | `/contratos` | [modulos/17-contratos.md](manual-tecnico/modulos/17-contratos.md) |
| Folha de Pagamento | `/folha-pagamento` | [modulos/18-folha-pagamento.md](manual-tecnico/modulos/18-folha-pagamento.md) |

### Planos & Jurídico

| Módulo | Rota | Arquivo |
|--------|------|---------|
| Planos de Saúde | `/planos-saude` | [modulos/19-planos-saude.md](manual-tecnico/modulos/19-planos-saude.md) |
| Ações Judiciais | `/acoes-judiciais` | [modulos/20-acoes-judiciais.md](manual-tecnico/modulos/20-acoes-judiciais.md) |

### Estoque & Ativos

| Módulo | Rota | Arquivo |
|--------|------|---------|
| Estoque | `/estoque` | [modulos/21-estoque.md](manual-tecnico/modulos/21-estoque.md) |
| Comodato | `/comodato` | [modulos/22-comodato.md](manual-tecnico/modulos/22-comodato.md) |

### Relatórios

| Módulo | Rota | Arquivo |
|--------|------|---------|
| Relatórios | `/relatorios` | [modulos/23-relatorios.md](manual-tecnico/modulos/23-relatorios.md) |
| Relatórios Avançados | `/relatorios-avancados` | [modulos/24-relatorios-avancados.md](manual-tecnico/modulos/24-relatorios-avancados.md) |

### Marketing e Documentos

| Módulo | Rota | Arquivo |
|--------|------|---------|
| Marketing | `/marketing` | [modulos/25-marketing.md](manual-tecnico/modulos/25-marketing.md) |
| Documentos | `/documentos` | [modulos/26-documentos.md](manual-tecnico/modulos/26-documentos.md) |

### Administração

| Módulo | Rota | Arquivo |
|--------|------|---------|
| Usuários | `/configuracoes/usuarios` | [modulos/27-usuarios.md](manual-tecnico/modulos/27-usuarios.md) |
| Controles de acesso | `/configuracoes/controles-acesso` | [modulos/28-controles-acesso.md](manual-tecnico/modulos/28-controles-acesso.md) |
| Chave Digital | `/configuracoes/chave-digital` | [modulos/29-chave-digital.md](manual-tecnico/modulos/29-chave-digital.md) |

---

## Parte III — Apêndices

| Apêndice | Arquivo |
|----------|---------|
| A — Glossário | [apendices/glossario.md](manual-tecnico/apendices/glossario.md) |
| B — Matriz integração API | [apendices/matriz-integracao.md](manual-tecnico/apendices/matriz-integracao.md) |
| C — Rotas auxiliares | [apendices/rotas-auxiliares.md](manual-tecnico/apendices/rotas-auxiliares.md) |

---

## Documentação operacional relacionada

- [DEV.md](DEV.md) — desenvolvimento local e E2E
- [DEPLOY.md](DEPLOY.md) — produção
- [SECURITY.md](SECURITY.md) — políticas de segurança
- [backend/README.md](../backend/README.md) — API e seeds

---

## Regenerar o PDF

**Pré-requisitos (prioridade do script):**

1. **Google Chrome** (headless) — método padrão no macOS
2. **Pandoc** + LaTeX (`pdflatex` / `xelatex`)
3. **md-to-pdf** via `npx` (fallback)

**Comando:**

```bash
npm run docs:manual:pdf
```

**Saída:** `docs/MANUAL-TECNICO.pdf` (~2 MB, todas as seções concatenadas)

O script concatena todos os capítulos, converte Markdown→HTML (Python `markdown`), imprime via Chrome. Diagramas **Mermaid** são preservados no Markdown modular; no PDF são substituídos por referência textual (renderização nativa requer `mmdc` + pipeline alternativo).

**Atualizar módulos gerados por template:**

```bash
python3 scripts/generate-manual-modules.py
```

---

## Template interno

Novo capítulo de módulo: copiar [manual-tecnico/_TEMPLATE.md](manual-tecnico/_TEMPLATE.md).
