# Manual de Utilização — Espaço Terapia OS

Guia para **usuários finais** (recepção, terapeutas, financeiro, gestores e administradores). Linguagem simples, com capturas de tela de cada área do sistema.

| Formato | Arquivo |
|---------|---------|
| Índice (este arquivo) | `docs/MANUAL-USUARIO.md` |
| Capítulos | `docs/manual-usuario/modulos/` |
| Imagens | `docs/manual-usuario/screenshots/` |
| PDF | `docs/MANUAL-USUARIO.pdf` |

---

## Introdução

- [Como usar o sistema](manual-usuario/00-introducao.md)

---

## Recepção

| Tela | Capítulo |
|------|----------|
| Agenda | [01-agenda.md](manual-usuario/modulos/01-agenda.md) |
| Agendamentos | [02-agendamentos.md](manual-usuario/modulos/02-agendamentos.md) |
| Pacientes | [03-pacientes.md](manual-usuario/modulos/03-pacientes.md) |
| Terapias | [04-terapias.md](manual-usuario/modulos/04-terapias.md) |
| Salas de Atendimento | [05-salas.md](manual-usuario/modulos/05-salas.md) |

## Clínico

| Tela | Capítulo |
|------|----------|
| Prontuários | [06-prontuarios.md](manual-usuario/modulos/06-prontuarios.md) |
| Anamneses | [07-anamneses.md](manual-usuario/modulos/07-anamneses.md) |
| Aprovação de Atendimentos | [08-aprovacao-atendimentos.md](manual-usuario/modulos/08-aprovacao-atendimentos.md) |
| Documentos Assinados | [09-docs-assinados.md](manual-usuario/modulos/09-docs-assinados.md) |

## Profissionais

| Tela | Capítulo |
|------|----------|
| Meu Painel | [10-meu-painel.md](manual-usuario/modulos/10-meu-painel.md) |
| Minha Agenda | [11-minha-agenda.md](manual-usuario/modulos/11-minha-agenda.md) |
| Profissionais | [12-profissionais.md](manual-usuario/modulos/12-profissionais.md) |

## Financeiro

| Tela | Capítulo |
|------|----------|
| Financeiro | [13-financeiro.md](manual-usuario/modulos/13-financeiro.md) |
| Balancetes | [14-balancetes.md](manual-usuario/modulos/14-balancetes.md) |
| Relatórios de Conciliação | [15-relatorios-conciliacao.md](manual-usuario/modulos/15-relatorios-conciliacao.md) |
| Auditoria de Notas | [16-auditoria-notas.md](manual-usuario/modulos/16-auditoria-notas.md) |

## RH e Contratos

| Tela | Capítulo |
|------|----------|
| Contratos | [17-contratos.md](manual-usuario/modulos/17-contratos.md) |
| Folha de Pagamento | [18-folha-pagamento.md](manual-usuario/modulos/18-folha-pagamento.md) |

## Planos e Jurídico

| Tela | Capítulo |
|------|----------|
| Planos de Saúde | [19-planos-saude.md](manual-usuario/modulos/19-planos-saude.md) |
| Ações Judiciais | [20-acoes-judiciais.md](manual-usuario/modulos/20-acoes-judiciais.md) |

## Estoque e Ativos

| Tela | Capítulo |
|------|----------|
| Estoque | [21-estoque.md](manual-usuario/modulos/21-estoque.md) |
| Comodato | [22-comodato.md](manual-usuario/modulos/22-comodato.md) |

## Relatórios

| Tela | Capítulo |
|------|----------|
| Relatórios | [23-relatorios.md](manual-usuario/modulos/23-relatorios.md) |
| Relatórios Avançados | [24-relatorios-avancados.md](manual-usuario/modulos/24-relatorios-avancados.md) |

## Marketing e Documentos

| Tela | Capítulo |
|------|----------|
| Marketing | [25-marketing.md](manual-usuario/modulos/25-marketing.md) |
| Documentos | [26-documentos.md](manual-usuario/modulos/26-documentos.md) |

## Administração

| Tela | Capítulo |
|------|----------|
| Usuários | [27-usuarios.md](manual-usuario/modulos/27-usuarios.md) |
| Controles de acesso | [28-controles-acesso.md](manual-usuario/modulos/28-controles-acesso.md) |
| Chave Digital | [29-chave-digital.md](manual-usuario/modulos/29-chave-digital.md) |

## Página inicial

| Tela | Capítulo |
|------|----------|
| Dashboard | [00-dashboard.md](manual-usuario/modulos/00-dashboard.md) |

---

## Atualizar capturas de tela e PDF

Com backend e frontend rodando (`make up` + `npm run dev`):

```bash
npx playwright test e2e/manual-usuario-screenshots.spec.ts --project=manual-usuario
python3 scripts/generate-manual-usuario.py
npm run docs:manual:pdf
```

O comando `docs:manual:pdf` gera **ambos** os PDFs (técnico e utilização) se configurado — ou apenas:

```bash
bash scripts/build-manual-usuario-pdf.sh
```

---

## Manual técnico

Para arquitetura, API e banco de dados, consulte [MANUAL-TECNICO.md](MANUAL-TECNICO.md).
