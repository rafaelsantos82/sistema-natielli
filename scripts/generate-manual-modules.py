#!/usr/bin/env python3
"""Gera capítulos modulares do manual técnico em docs/manual-tecnico/modulos/."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "docs" / "manual-tecnico" / "modulos"

MODULES = [
    {
        "file": "00-dashboard.md",
        "title": "Dashboard",
        "menu": "(raiz — fora do sidebar)",
        "route": "/",
        "perm": "(autenticado)",
        "page": "src/pages/Dashboard.tsx",
        "flag": "—",
        "register": "—",
        "api": "Agregações locais + endpoints pontuais conforme widgets",
        "tables": "consultas, pacientes (leitura)",
        "hooks": "vários use* conforme cards",
    },
    {
        "file": "01-agenda.md",
        "title": "Agenda",
        "menu": "Recepção → Agenda",
        "route": "/agenda",
        "perm": "menu.agenda.view",
        "page": "src/pages/Agenda.tsx",
        "flag": "VITE_API_CONSULTAS",
        "register": "register_consultas.go",
        "api": "GET /consultas?unidade_id=&de=&ate=",
        "tables": "consultas, salas, pacientes, profissionais",
        "hooks": "useConsultas",
    },
    {
        "file": "02-agendamentos.md",
        "title": "Agendamentos",
        "menu": "Recepção → Agendamentos",
        "route": "/consultas",
        "perm": "menu.consultas.view",
        "page": "src/pages/Consultas.tsx",
        "flag": "VITE_API_CONSULTAS",
        "register": "register_consultas.go",
        "api": "CRUD /consultas + POST confirmar|cancelar|concluir|vincular-prontuario|aprovar|rejeitar",
        "tables": "consultas",
        "hooks": "useConsultas",
    },
    {
        "file": "03-pacientes.md",
        "title": "Pacientes",
        "menu": "Recepção → Pacientes",
        "route": "/pacientes",
        "perm": "menu.pacientes.view",
        "page": "src/pages/Pacientes.tsx",
        "flag": "VITE_API_PACIENTES",
        "register": "register_pacientes.go",
        "api": "CRUD /pacientes + POST /:id/restore",
        "tables": "pacientes, paciente_unidades, paciente_profissionais",
        "hooks": "usePacientes",
    },
    {
        "file": "04-terapias.md",
        "title": "Terapias",
        "menu": "Recepção → Terapias",
        "route": "/terapias",
        "perm": "menu.terapias.view",
        "page": "src/pages/Terapias.tsx",
        "flag": "VITE_API_TERAPIAS",
        "register": "register_terapias.go",
        "api": "CRUD /terapias",
        "tables": "terapias (ex-tratamentos, mig. 000024)",
        "hooks": "useTerapias",
    },
    {
        "file": "05-salas.md",
        "title": "Salas de Atendimento",
        "menu": "Recepção → Salas",
        "route": "/salas",
        "perm": "menu.salas.view",
        "page": "src/pages/Salas.tsx, AgendaSala.tsx",
        "flag": "VITE_API_SALAS",
        "register": "register_salas.go",
        "api": "CRUD /salas",
        "tables": "salas, sala_especialidades, sala_recursos",
        "hooks": "useSalas",
    },
    {
        "file": "06-prontuarios.md",
        "title": "Prontuários",
        "menu": "Clínico → Prontuários",
        "route": "/prontuarios, /prontuario/:consultaId",
        "perm": "menu.prontuarios.view",
        "page": "src/pages/Prontuarios.tsx, Prontuario.tsx",
        "flag": "VITE_API_PRONTUARIO",
        "register": "register_prontuario.go",
        "api": "GET /prontuario/pacientes/:id; POST evolucoes|prescricoes|atestados|documentos",
        "tables": "prontuarios, prontuario_*",
        "hooks": "useProntuario",
    },
    {
        "file": "07-anamneses.md",
        "title": "Anamneses",
        "menu": "Clínico → Anamneses",
        "route": "/anamneses",
        "perm": "menu.anamneses.view",
        "page": "src/pages/Anamneses.tsx",
        "flag": "VITE_API_ANAMNESES",
        "register": "register_anamneses.go",
        "api": "CRUD /anamneses; /respostas-anamnese",
        "tables": "anamneses, respostas_anamnese",
        "hooks": "useAnamneses",
    },
    {
        "file": "08-aprovacao-atendimentos.md",
        "title": "Aprovação de Atendimentos",
        "menu": "Clínico → Aprovação Atendimentos",
        "route": "/atendimentos/aprovacoes",
        "perm": "menu.aprovacoes.view",
        "page": "src/pages/AtendimentosAprovacao.tsx",
        "flag": "VITE_API_CONSULTAS",
        "register": "register_consultas.go",
        "api": "POST /consultas/:id/aprovar-atendimento|rejeitar-atendimento",
        "tables": "consultas.status_atendimento",
        "hooks": "useConsultas",
    },
    {
        "file": "09-docs-assinados.md",
        "title": "Documentos Assinados",
        "menu": "Clínico → Docs Assinados",
        "route": "/documentos-assinados",
        "perm": "menu.docs-assinados.view",
        "page": "src/pages/DocumentosAssinados.tsx",
        "flag": "VITE_API_DOCUMENTOS_ASSINADOS",
        "register": "register_chave_digital.go",
        "api": "GET /documentos-assinados; POST assinar; GET download; POST verificar",
        "tables": "documentos_assinados, chaves_digitais",
        "hooks": "useDocumentosAssinados",
    },
    {
        "file": "10-meu-painel.md",
        "title": "Meu Painel",
        "menu": "Profissionais → Meu Painel",
        "route": "/meu-painel",
        "perm": "menu.meu-painel.view",
        "page": "src/pages/MeuPainel.tsx",
        "flag": "VITE_API_CONSULTAS, VITE_API_PROFISSIONAIS",
        "register": "vários",
        "api": "Métricas do profissional logado",
        "tables": "consultas, profissionais",
        "hooks": "useConsultas, useAuth",
    },
    {
        "file": "11-minha-agenda.md",
        "title": "Minha Agenda",
        "menu": "Profissionais → Minha Agenda",
        "route": "/minha-agenda",
        "perm": "menu.minha-agenda.view",
        "page": "src/pages/MinhaAgenda.tsx",
        "flag": "VITE_API_CONSULTAS",
        "register": "register_consultas.go",
        "api": "GET /consultas filtrado profissional_id=me",
        "tables": "consultas",
        "hooks": "useConsultas",
    },
    {
        "file": "12-profissionais.md",
        "title": "Profissionais",
        "menu": "Profissionais → Profissionais",
        "route": "/profissionais, /profissionais/:id/agenda",
        "perm": "menu.profissionais.view",
        "page": "src/pages/Profissionais.tsx, AgendaProfissional.tsx",
        "flag": "VITE_API_PROFISSIONAIS",
        "register": "register_profissionais.go",
        "api": "CRUD /profissionais; documentos upload; /profissionais/documentos/pendencias",
        "tables": "profissionais, profissional_documentos, conselhos",
        "hooks": "useProfissionais",
    },
    {
        "file": "13-financeiro.md",
        "title": "Financeiro",
        "menu": "Financeiro → Financeiro",
        "route": "/financeiro",
        "perm": "menu.financeiro.view",
        "page": "src/pages/Financeiro.tsx",
        "flag": "VITE_API_FINANCEIRO",
        "register": "register_financeiro.go",
        "api": "/financeiro/categorias|centros-custo|lancamentos",
        "tables": "financeiro_*",
        "hooks": "useFinanceiro",
    },
    {
        "file": "14-balancetes.md",
        "title": "Balancetes",
        "menu": "Financeiro → Balancetes",
        "route": "/balancetes",
        "perm": "menu.balancetes.view",
        "page": "src/pages/Balancetes.tsx",
        "flag": "VITE_API_CONTABILIDADE",
        "register": "register_contabilidade.go",
        "api": "GET /contabilidade/balancete; CRUD contas e lancamentos contabeis",
        "tables": "contas_contabeis, lancamentos_contabeis",
        "hooks": "useContabilidade",
    },
    {
        "file": "15-relatorios-conciliacao.md",
        "title": "Relatórios de Conciliação",
        "menu": "Financeiro → Relatórios Conciliação",
        "route": "/relatorios-conciliacao",
        "perm": "menu.relatorios-conciliacao.view",
        "page": "src/pages/RelatoriosConciliacao.tsx",
        "flag": "VITE_API_PLANOS",
        "register": "register_planos.go",
        "api": "GET /acoes-judiciais/conciliacao-resumo",
        "tables": "acoes_judiciais, notas_fiscais",
        "hooks": "usePlanos",
    },
    {
        "file": "16-auditoria-notas.md",
        "title": "Auditoria de Notas",
        "menu": "Financeiro → Auditoria de Notas",
        "route": "/auditoria-notas",
        "perm": "menu.auditoria-notas.view",
        "page": "src/pages/AuditoriaNotas.tsx",
        "flag": "VITE_API_PLANOS",
        "register": "register_planos.go",
        "api": "CRUD /notas-fiscais; POST /:id/conciliar",
        "tables": "notas_fiscais (mig. 000032)",
        "hooks": "useNotasFiscais",
    },
    {
        "file": "17-contratos.md",
        "title": "Contratos",
        "menu": "RH & Contratos → Contratos",
        "route": "/contratos",
        "perm": "menu.contratos.view",
        "page": "src/pages/Contratos.tsx",
        "flag": "VITE_API_CONTRATOS",
        "register": "register_contratos.go",
        "api": "CRUD /contratos; arquivo; compartilhar; solicitacoes-assinatura; rotas publicas token",
        "tables": "contratos, contrato_arquivos, solicitacoes",
        "hooks": "useContratos",
    },
    {
        "file": "18-folha-pagamento.md",
        "title": "Folha de Pagamento",
        "menu": "RH → Folha de Pagamento",
        "route": "/folha-pagamento",
        "perm": "menu.folha-pagamento.view",
        "page": "src/pages/FolhaPagamento.tsx",
        "flag": "VITE_API_RH",
        "register": "register_rh.go",
        "api": "/rh/funcionarios-clt|pj; /rh/folhas-clt|pj",
        "tables": "funcionarios_*, folhas_*",
        "hooks": "useRH",
    },
    {
        "file": "19-planos-saude.md",
        "title": "Planos de Saúde",
        "menu": "Planos & Jurídico → Planos de Saúde",
        "route": "/planos-saude",
        "perm": "menu.planos-saude.view",
        "page": "src/pages/PlanosSaude.tsx",
        "flag": "VITE_API_PLANOS",
        "register": "register_planos.go",
        "api": "CRUD /planos-saude",
        "tables": "planos_saude",
        "hooks": "usePlanosSaude",
    },
    {
        "file": "20-acoes-judiciais.md",
        "title": "Ações Judiciais",
        "menu": "Planos & Jurídico → Ações Judiciais",
        "route": "/acoes-judiciais, /acoes-judiciais/:id",
        "perm": "menu.acoes-judiciais.view",
        "page": "src/pages/AcoesJudiciais.tsx, AcaoJudicialDetalhe.tsx",
        "flag": "VITE_API_PLANOS",
        "register": "register_planos.go",
        "api": "CRUD /acoes-judiciais; GET conciliacao",
        "tables": "acoes_judiciais",
        "hooks": "useAcoesJudiciais",
    },
    {
        "file": "21-estoque.md",
        "title": "Estoque",
        "menu": "Estoque & Ativos → Estoque",
        "route": "/estoque",
        "perm": "menu.estoque.view",
        "page": "src/pages/Estoque.tsx",
        "flag": "VITE_API_ESTOQUE",
        "register": "register_estoque.go",
        "api": "/estoque/itens|movimentacoes|inventarios",
        "tables": "estoque_*",
        "hooks": "useEstoque",
    },
    {
        "file": "22-comodato.md",
        "title": "Comodato",
        "menu": "Estoque → Comodato",
        "route": "/comodato",
        "perm": "menu.comodato.view",
        "page": "src/pages/Comodato.tsx",
        "flag": "VITE_API_COMODATO",
        "register": "register_comodatos.go",
        "api": "CRUD /comodatos",
        "tables": "comodatos",
        "hooks": "useComodatos",
    },
    {
        "file": "23-relatorios.md",
        "title": "Relatórios",
        "menu": "Relatórios → Relatórios",
        "route": "/relatorios",
        "perm": "menu.relatorios.view",
        "page": "src/pages/Relatorios.tsx",
        "flag": "VITE_API_RELATORIOS",
        "register": "register_relatorios_operacionais.go",
        "api": "CRUD /relatorios-operacionais",
        "tables": "relatorios_operacionais",
        "hooks": "useRelatorios",
    },
    {
        "file": "24-relatorios-avancados.md",
        "title": "Relatórios Avançados",
        "menu": "Relatórios → Relatórios Avançados",
        "route": "/relatorios-avancados",
        "perm": "menu.relatorios-avancados.view",
        "page": "src/pages/RelatoriosAvancados.tsx",
        "flag": "VITE_API_RELATORIOS",
        "register": "register_relatorios_operacionais.go",
        "api": "Mesma API com filtros avançados / export",
        "tables": "relatorios_operacionais",
        "hooks": "useRelatorios",
    },
    {
        "file": "25-marketing.md",
        "title": "Marketing",
        "menu": "Marketing → Marketing",
        "route": "/marketing",
        "perm": "menu.marketing.view",
        "page": "src/pages/Marketing.tsx",
        "flag": "VITE_API_MARKETING",
        "register": "register_marketing.go",
        "api": "/marketing/manuais|materiais + upload/download",
        "tables": "marketing_manuais, marketing_materiais",
        "hooks": "useMarketing",
    },
    {
        "file": "26-documentos.md",
        "title": "Documentos (Biblioteca)",
        "menu": "Documentos → Documentos",
        "route": "/documentos",
        "perm": "menu.documentos.view",
        "page": "src/pages/Documentos.tsx",
        "flag": "VITE_API_DOCUMENTOS",
        "register": "register_documentos.go",
        "api": "/documentos/categorias; /documentos/arquivos upload|download",
        "tables": "documento_categorias, biblioteca_arquivos (mig. 000028)",
        "hooks": "useBibliotecaDocumentos",
    },
    {
        "file": "27-usuarios.md",
        "title": "Usuários",
        "menu": "Administração → Usuários",
        "route": "/configuracoes/usuarios",
        "perm": "menu.configuracoes.usuarios.view",
        "page": "src/pages/Configuracoes.tsx (aba usuários)",
        "flag": "—",
        "register": "register_users.go",
        "api": "CRUD /users + POST restore (admin)",
        "tables": "users, user_roles",
        "hooks": "useUsers",
    },
    {
        "file": "28-controles-acesso.md",
        "title": "Controles de Acesso",
        "menu": "Administração → Controles de acesso",
        "route": "/configuracoes/controles-acesso",
        "perm": "menu.configuracoes.acessos.view",
        "page": "src/pages/ControlesAcesso.tsx",
        "flag": "—",
        "register": "register_access_control.go",
        "api": "/access-control/permissions|data-scopes|roles/:role",
        "tables": "permissions, role_permissions, data_scopes",
        "hooks": "useAccessControl",
    },
    {
        "file": "29-chave-digital.md",
        "title": "Chave Digital",
        "menu": "Administração → Chave Digital",
        "route": "/configuracoes/chave-digital",
        "perm": "menu.configuracoes.chave-digital.view",
        "page": "src/pages/ChaveDigital.tsx",
        "flag": "VITE_API_CHAVE_DIGITAL",
        "register": "register_chave_digital.go",
        "api": "GET|POST|DELETE /chave-digital",
        "tables": "chaves_digitais (mig. 000029)",
        "hooks": "useChaveDigital",
    },
]

TEMPLATE = '''# {title}

## 1. Identificação

| Campo | Valor |
|-------|-------|
| Menu | {menu} |
| Rota SPA | `{route}` |
| Permissão RBAC | `{perm}` |
| Feature flag | `{flag}` |
| Página | `{page}` |

## 2. UI e componentes

- Entrada principal: `{page}`
- Layout: `AppLayout` + sidebar filtrada por permissão
- Formulários/modais: ver subpasta `src/components/` do domínio

## 3. Integração frontend

| Artefato | Caminho |
|----------|---------|
| Hook(s) | `{hooks}` |
| API client | `src/lib/api/` (módulo homônimo) |
| Feature flag | `{flag}` |

**Modo de dados:** API quando flag `true`; caso contrário fallback `localStorage` (legado Lovable) onde ainda existir.

## 4. Backend

| Artefato | Caminho |
|----------|---------|
| Rotas | `backend/internal/interfaces/http/routes/{register}` |
| Handlers | `backend/internal/interfaces/http/handlers/` |
| Services | `backend/internal/domain/service/` |

**Endpoints principais:** {api}

## 5. Persistência

**Tabelas:** {tables}

Consultar migrations em `backend/migrations/` e ER em [08-banco-dados.md](../08-banco-dados.md).

## 6. Fluxo operacional

```mermaid
flowchart LR
  User[Usuario] --> Page[Pagina_{slug}]
  Page --> Hook[React_Query]
  Hook --> API[REST_api_v1]
  API --> Svc[Domain_Service]
  Svc --> DB[(PostgreSQL)]
```

## 7. Sequência — leitura lista

```mermaid
sequenceDiagram
  participant U as Usuario
  participant P as Page_SPA
  participant Q as TanStack_Query
  participant A as API_Gin
  participant D as PostgreSQL
  U->>P: abre_rota
  P->>Q: useQuery
  Q->>A: GET_com_Bearer
  A->>D: SELECT_scoped
  D-->>A: rows
  A-->>Q: data_meta
  Q-->>P: render_tabela
```

## 8. Testes

- Backend: `go test ./internal/domain/service/...`
- Frontend: `*.test.tsx` no domínio, se existir
- E2E: ver `e2e/` para fluxos críticos (ex. agenda em `agenda-sync.spec.ts`)

## 9. Segurança

- Validar RBAC no guard HTTP antes do handler
- Aplicar data scope por unidade/usuário em services de listagem
- Não expor IDs de outros tenants/unidades na resposta

'''


def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    for m in MODULES:
        slug = m["file"].replace(".md", "").split("-", 1)[-1]
        content = TEMPLATE.format(
            title=m["title"],
            menu=m["menu"],
            route=m["route"],
            perm=m["perm"],
            flag=m["flag"],
            page=m["page"],
            register=m["register"],
            api=m["api"],
            tables=m["tables"],
            hooks=m["hooks"],
            slug=slug.replace("-", "_"),
        )
        (ROOT / m["file"]).write_text(content, encoding="utf-8")
    print(f"Generated {len(MODULES)} modules in {ROOT}")


if __name__ == "__main__":
    main()
