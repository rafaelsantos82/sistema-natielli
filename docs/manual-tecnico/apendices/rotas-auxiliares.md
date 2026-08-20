# Apêndice C — Rotas auxiliares (fora do menu principal)

| Rota | Página | Auth | Descrição |
|------|--------|------|-----------|
| `/login` | Login | Público | Autenticação |
| `/esqueci-senha` | EsqueciSenha | Público | Solicita reset |
| `/redefinir-senha` | RedefinirSenha | Público | Token e-mail |
| `/alterar-senha` | AlterarSenhaObrigatoria | Protegido | Senha temporária |
| `/` | Dashboard | Protegido | Home KPIs |
| `/unidades` | Unidades | Protegido | Gestão filiais (menu oculto) |
| `/dashboard-ocupacao` | DashboardOcupacao | Protegido | Ocupação salas |
| `/prontuario/:consultaId` | Prontuario | Protegido | Sessão clínica |
| `/salas/:id/agenda` | AgendaSala | Protegido | Grade da sala |
| `/profissionais/:id/agenda` | AgendaProfissional | Protegido | **Exceções** (localStorage) |
| `/relatorios/:id` | RelatorioDetalhes | Protegido | Detalhe relatório |
| `/acoes-judiciais/:id` | AcaoJudicialDetalhe | Protegido | Processo judicial |
| `/faturas` | Faturas | Protegido | Faturamento |
| `/configuracoes` | Configuracoes | Admin | Hub config |
| `/configuracoes/usuarios` | Configuracoes | Admin | Usuários |
| `/configuracoes/controles-acesso` | ControlesAcesso | Admin | RBAC UI |
| `/configuracoes/chave-digital` | ChaveDigital | Admin/Gestor | Chaves |
| `/conta/perfil` | ContaPerfil | Protegido | Perfil usuário |
| `/conta/senha` | ContaSenha | Protegido | Troca senha |
| `/contratos/compartilhado/:token` | ContratoCompartilhado | **Público** | Link compartilhado |
| `/contratos/assinatura/:token` | ContratoAssinatura | **Público** | Fluxo assinatura |

Redirect: `/tratamentos` → `/terapias` (compatibilidade Lovable).
