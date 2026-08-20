# Apêndice B — Matriz módulo × integração API

| Módulo | Flag | Backend | Fallback local |
|--------|------|---------|------------------|
| Pacientes | `VITE_API_PACIENTES` | `/pacientes` | localStorage (desligado) |
| Profissionais | `VITE_API_PROFISSIONAIS` | `/profissionais` | parcial |
| Consultas / Agenda | `VITE_API_CONSULTAS` | `/consultas` | — |
| Salas | `VITE_API_SALAS` | `/salas` | — |
| Unidades | `VITE_API_UNIDADES` | `/unidades` | seed slugs |
| Terapias | `VITE_API_TERAPIAS` | `/terapias` | — |
| Anamneses | `VITE_API_ANAMNESES` | `/anamneses` | — |
| Prontuário | `VITE_API_PRONTUARIO` | `/prontuario/*` | — |
| Financeiro | `VITE_API_FINANCEIRO` | `/financeiro/*` | — |
| Contabilidade | `VITE_API_CONTABILIDADE` | `/contabilidade/*` | — |
| Relatórios | `VITE_API_RELATORIOS` | `/relatorios-operacionais` | — |
| Estoque | `VITE_API_ESTOQUE` | `/estoque/*` | — |
| Comodato | `VITE_API_COMODATO` | `/comodatos` | — |
| RH / Folha | `VITE_API_RH` | `/rh/*` | — |
| Planos / Ações / NF | `VITE_API_PLANOS` | `/planos-saude`, `/acoes-judiciais`, `/notas-fiscais` | — |
| Contratos | `VITE_API_CONTRATOS` | `/contratos` | — |
| Marketing | `VITE_API_MARKETING` | `/marketing/*` | — |
| Documentos biblioteca | `VITE_API_DOCUMENTOS` | `/documentos/*` | — |
| Chave digital | `VITE_API_CHAVE_DIGITAL` | `/chave-digital` | — |
| Docs assinados | `VITE_API_DOCUMENTOS_ASSINADOS` | `/documentos-assinados` | — |
| Audit | `VITE_API_AUDIT` | `/audit-log` | — |
| Usuários / RBAC | — | `/users`, `/access-control` | — |
| Exceções agenda prof. | — | — | **localStorage** em `/profissionais/:id/agenda` |

**Regra:** em produção, manter todas as flags `true` exceto testes CI.
