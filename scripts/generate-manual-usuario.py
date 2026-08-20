#!/usr/bin/env python3
"""Gera capítulos do Manual de Utilização em docs/manual-usuario/modulos/."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MOD = ROOT / "docs" / "manual-usuario" / "modulos"
SHOT = "manual-usuario/screenshots"

def img(path: str, alt: str) -> str:
    return f'\n![{alt}]({SHOT}/{path})\n'

def section(title: str, menu: str, route: str, quem: str, objetivo: str,
            screenshot: str, passos: list[str], acoes_lista: list[str],
            abas: list[tuple[str, str]] | None = None,
            dicas: list[str] | None = None) -> str:
    lines = [
        f"# {title}",
        "",
        f"**Menu:** {menu}  ",
        f"**Endereço na barra de endereços:** `{route}`  ",
        f"**Quem usa:** {quem}",
        "",
        "## Para que serve",
        "",
        objetivo,
        "",
        "## Como chegar",
        "",
        "1. Faça login no sistema.",
        "2. No menu à esquerda, abra o grupo indicado em **Menu**.",
        f"3. Clique em **{title.split('—')[-1].strip() if '—' in title else title}**.",
        "",
        "## Tela principal",
        img(screenshot, f"Tela {title}"),
        "",
        "## O que você pode fazer",
        "",
    ]
    for a in acoes_lista:
        lines.append(f"- {a}")
    if abas:
        lines.append("")
        lines.append("## Abas desta tela")
        lines.append("")
        for nome, desc in abas:
            lines.append(f"### Aba «{nome}»")
            lines.append("")
            lines.append(desc)
            lines.append("")
    if passos:
        lines.append("")
        lines.append("## Passo a passo comum")
        lines.append("")
        for i, p in enumerate(passos, 1):
            lines.append(f"{i}. {p}")
    if dicas:
        lines.append("")
        lines.append("## Dicas")
        lines.append("")
        for d in dicas:
            lines.append(f"- {d}")
    lines.append("")
    return "\n".join(lines)

COMMON_LIST = [
    "**Buscar:** use a caixa de pesquisa no topo da lista para filtrar por nome ou texto.",
    "**Novo / Adicionar:** botão no canto da lista abre um formulário em janela (modal). Preencha e confirme em **Salvar**.",
    "**Ver (ícone olho):** abre detalhes sem editar.",
    "**Editar (ícone lápis):** altera o registro existente.",
    "**Excluir (ícone lixeira):** remove ou desativa; o sistema pede confirmação.",
    "**Restaurar:** em cadastros excluídos, volta o registro à lista de ativos.",
    "**Menu de três pontos (⋯):** ações extras na linha da tabela.",
]

MODULES = [
    section(
        "Dashboard",
        "(página inicial após login)",
        "/",
        "Todos os perfis com acesso ao sistema.",
        "Visão geral do dia: resumos, atalhos e indicadores da unidade selecionada.",
        "geral/dashboard.png",
        ["Confira no topo qual **unidade** está selecionada — muitas telas filtram por ela."],
        [
            "Visualizar indicadores e cards de resumo.",
            "Acessar atalhos para áreas frequentes.",
            "Trocar de unidade no seletor do cabeçalho (quando disponível).",
        ],
        dicas=["Se os números parecerem vazios, verifique se a unidade correta está ativa."],
    ),
    section(
        "Agenda",
        "Recepção → Agenda",
        "/agenda",
        "Recepção, gestores e profissionais.",
        "Calendário visual das consultas da unidade: ver ocupação por dia/semana e localizar horários.",
        "recepcao/agenda.png",
        [
            "Use as setas ou botões para mudar semana/mês.",
            "Clique em um evento para ver detalhes ou ir ao agendamento.",
            "Para novo horário, prefira **Agendamentos** (cadastro completo).",
        ],
        [
            "Navegar entre semanas no calendário.",
            "Visualizar consultas por profissional, sala ou horário (conforme filtros da tela).",
            "Abrir detalhe de um agendamento existente.",
        ],
        dicas=[
            "A agenda mostra consultas já salvas; criar nova consulta é feito em **Agendamentos**.",
            "Se não aparecer nada, confira a unidade no cabeçalho e se há consultas naquela semana.",
        ],
    ),
    section(
        "Agendamentos",
        "Recepção → Agendamentos",
        "/consultas",
        "Recepção e gestores.",
        "Cadastrar, alterar, confirmar ou cancelar consultas (agendamentos) dos pacientes.",
        "recepcao/agendamentos.png",
        [
            "Clique em **Novo Agendamento**.",
            "Escolha paciente, profissional, data/hora, terapia e sala quando solicitado.",
            "Salve e aguarde a mensagem de sucesso antes de fechar a janela.",
        ],
        COMMON_LIST
        + [
            "**Confirmar / Cancelar / Concluir:** ações de fluxo da consulta (ícones ou menu da linha).",
            "Badge vermelho no menu: quantidade de pendências de agendamento.",
        ],
        dicas=["Após salvar, a consulta aparece na **Agenda** e na **Minha Agenda** do profissional."],
    ),
    section(
        "Pacientes",
        "Recepção → Pacientes",
        "/pacientes",
        "Recepção, clínico e gestores.",
        "Cadastro completo do paciente (dados pessoais, responsável, saúde, endereço).",
        "recepcao/pacientes.png",
        ["Clique em **Novo** e preencha as abas do formulário.", "Salve ao final de cada etapa importante."],
        COMMON_LIST
        + [
            "Vincular paciente a uma ou mais unidades.",
            "Abrir prontuário a partir do cadastro (quando disponível).",
        ],
    ),
    section(
        "Terapias",
        "Recepção → Terapias",
        "/terapias",
        "Recepção e gestores.",
        "Catálogo de tipos de terapia/serviço oferecidos (nome, duração, valores).",
        "recepcao/terapias.png",
        ["Cadastre terapias antes de agendar consultas que dependem delas."],
        COMMON_LIST,
    ),
    section(
        "Salas de Atendimento",
        "Recepção → Salas de Atendimento",
        "/salas",
        "Recepção e gestores.",
        "Cadastro de salas por unidade (capacidade, recursos, status).",
        "recepcao/salas.png",
        ["Ao agendar, selecione a sala disponível na unidade."],
        COMMON_LIST
        + [
            "**Configurar agenda da sala:** botão que abre grade de ocupação da sala.",
        ],
    ),
    section(
        "Prontuários",
        "Clínico → Prontuários",
        "/prontuarios",
        "Profissionais de saúde e gestores.",
        "Lista de pacientes para acessar o prontuário eletrônico (histórico clínico).",
        "clinico/prontuarios.png",
        ["Busque o paciente e abra o prontuário.", "Dentro do prontuário use as abas: Evoluções, Prescrições, Atestados, Documentos."],
        COMMON_LIST + ["Registrar evolução após atendimento.", "Anexar documentos clínicos."],
        abas=[
            ("Evoluções", "Texto do atendimento e evolução clínica."),
            ("Prescrições", "Medicamentos e orientações prescritas."),
            ("Atestados", "Atestados médicos gerados no sistema."),
            ("Documentos", "Arquivos anexados ao prontuário."),
        ],
    ),
    section(
        "Anamneses",
        "Clínico → Anamneses",
        "/anamneses",
        "Profissionais e recepção.",
        "Formulários de anamnese (questionários) e respostas dos pacientes.",
        "clinico/anamneses.png",
        [],
        COMMON_LIST + ["Preencher ou visualizar respostas de anamnese por paciente."],
    ),
    section(
        "Aprovação de Atendimentos",
        "Clínico → Aprovação Atendimentos",
        "/atendimentos/aprovacoes",
        "Gestores e coordenadores.",
        "Revisar atendimentos concluídos antes de liberar faturamento ou arquivo.",
        "clinico/aprovacao-atendimentos.png",
        ["Abra a aba **Aprovação**.", "Analise cada linha e use **Aprovar** ou **Rejeitar** (com motivo se pedido)."],
        [
            "Filtrar por status nas abas.",
            "Aprovar atendimento.",
            "Rejeitar com justificativa.",
        ],
        abas=[
            ("Aprovação", "Itens aguardando sua decisão."),
            ("Aguardando prontuário", "Atendimentos sem prontuário vinculado."),
            ("Aprovados", "Histórico já aprovado."),
            ("Rejeitados", "Histórico recusado — pode exigir correção."),
        ],
    ),
    section(
        "Documentos Assinados",
        "Clínico → Docs Assinados",
        "/documentos-assinados",
        "Profissionais e gestores.",
        "Documentos assinados digitalmente com validade no sistema.",
        "clinico/docs-assinados.png",
        [],
        ["Listar documentos assinados.", "Assinar novo documento (com chave digital cadastrada).", "Baixar ou verificar assinatura."],
    ),
    section(
        "Meu Painel",
        "Profissionais → Meu Painel",
        "/meu-painel",
        "Terapeutas e profissionais.",
        "Resumo da sua produção: consultas, pendências e indicadores pessoais.",
        "profissionais/meu-painel.png",
        [],
        ["Acompanhar métricas do período.", "Identificar pendências de documentos ou atendimentos."],
    ),
    section(
        "Minha Agenda",
        "Profissionais → Minha Agenda",
        "/minha-agenda",
        "Terapeutas.",
        "Sua agenda pessoal de consultas (somente os seus horários).",
        "profissionais/minha-agenda.png",
        [],
        ["Ver consultas do dia/semana.", "Abrir detalhe do agendamento."],
        dicas=["É a mesma base de **Agendamentos**, filtrada para o profissional logado."],
    ),
    section(
        "Profissionais",
        "Profissionais → Profissionais",
        "/profissionais",
        "Gestores e administração.",
        "Cadastro de terapeutas e profissionais: dados, conselho, documentos obrigatórios e preços.",
        "profissionais/profissionais.png",
        [],
        COMMON_LIST
        + [
            "**Gerenciar preços:** tabela de valores por terapia.",
            "**Configurar agenda:** exceções de horário (férias, almoço) — não confundir com consultas de pacientes.",
            "**Pendências:** alerta de documentos obrigatórios em falta.",
        ],
    ),
    section(
        "Financeiro",
        "Financeiro → Financeiro",
        "/financeiro",
        "Financeiro e gestores.",
        "Controle de entradas e saídas, categorias e centros de custo.",
        "financeiro/financeiro-dashboard.png",
        [],
        ["Ver resumo no Dashboard.", "Lançar contas a pagar e receber.", "Manter categorias e centros de custo."],
        abas=[
            ("Dashboard", "Visão geral financeira."),
            ("Contas a Pagar", "Despesas a pagar."),
            ("Contas a Receber", "Receitas a receber."),
            ("Categorias", "Plano de categorias de lançamento."),
            ("Centros de Custo", "Departamentos ou projetos para alocação."),
        ],
    ),
    section(
        "Balancetes",
        "Financeiro → Balancetes",
        "/balancetes",
        "Contabilidade e gestores.",
        "Relatório contábil de balancete por período.",
        "financeiro/balancetes.png",
        ["Selecione período e filtros.", "Gere ou exporte o relatório conforme botões da tela."],
        ["Consultar balancete.", "Exportar (se disponível)."],
    ),
    section(
        "Relatórios de Conciliação",
        "Financeiro → Relatórios Conciliação",
        "/relatorios-conciliacao",
        "Financeiro.",
        "Conciliação entre ações judiciais/planos e valores recebidos.",
        "financeiro/relatorios-conciliacao.png",
        [],
        ["Visualizar resumo de conciliação.", "Filtrar por período ou status."],
    ),
    section(
        "Auditoria de Notas",
        "Financeiro → Auditoria de Notas",
        "/auditoria-notas",
        "Financeiro e auditoria.",
        "Conferência e conciliação de notas fiscais.",
        "financeiro/auditoria-notas.png",
        [],
        COMMON_LIST + ["Conciliar nota fiscal quando o processo estiver disponível na linha."],
    ),
    section(
        "Contratos",
        "RH & Contratos → Contratos",
        "/contratos",
        "RH e gestores.",
        "Contratos com profissionais ou parceiros: upload, compartilhamento e assinatura.",
        "rh/contratos.png",
        ["Crie contrato, anexe arquivo PDF e envie para assinatura ou compartilhamento."],
        COMMON_LIST
        + [
            "**Compartilhar:** gera link para o signatário externo.",
            "**Solicitar assinatura:** fluxo de aceite digital.",
        ],
    ),
    section(
        "Folha de Pagamento",
        "RH & Contratos → Folha de Pagamento",
        "/folha-pagamento",
        "RH.",
        "Folhas de pagamento de funcionários CLT e PJ.",
        "rh/folha-clt.png",
        [],
        COMMON_LIST,
        abas=[
            ("CLT", "Funcionários com carteira assinada."),
            ("PJ", "Prestadores pessoa jurídica."),
        ],
    ),
    section(
        "Planos de Saúde",
        "Planos & Jurídico → Planos de Saúde",
        "/planos-saude",
        "Gestores.",
        "Cadastro de operadoras/planos convênio.",
        "planos/planos-saude.png",
        [],
        COMMON_LIST,
    ),
    section(
        "Ações Judiciais",
        "Planos & Jurídico → Ações Judiciais",
        "/acoes-judiciais",
        "Jurídico e gestores.",
        "Processos judiciais ligados a planos ou pacientes.",
        "planos/acoes-judiciais.png",
        [],
        COMMON_LIST + ["Abrir detalhe do processo clicando na linha."],
    ),
    section(
        "Estoque",
        "Estoque & Ativos → Estoque",
        "/estoque",
        "Equipe administrativa e terapeutas (conforme permissão).",
        "Controle de materiais: itens, entradas/saídas e inventário.",
        "estoque/estoque-dashboard.png",
        [],
        ["Cadastrar itens.", "Registrar movimentação.", "Realizar inventário."],
        abas=[
            ("Dashboard", "Resumo de estoque."),
            ("Itens", "Cadastro de produtos/materiais."),
            ("Movimentações", "Entradas e saídas."),
            ("Relatórios", "Relatórios de movimentação."),
            ("Inventário", "Contagem física."),
        ],
    ),
    section(
        "Comodato",
        "Estoque & Ativos → Comodato",
        "/comodato",
        "Administrativo.",
        "Materiais emprestados (comodato) para pacientes ou profissionais.",
        "estoque/comodato-ativos.png",
        [],
        COMMON_LIST,
        abas=[
            ("Ativos", "Empréstimos em andamento."),
            ("Atrasados", "Devolução em atraso."),
            ("Devolvidos", "Histórico devolvido."),
        ],
    ),
    section(
        "Relatórios",
        "Relatórios → Relatórios",
        "/relatorios",
        "Gestores e terceiros.",
        "Relatórios operacionais pré-configurados.",
        "relatorios/relatorios.png",
        [],
        COMMON_LIST,
    ),
    section(
        "Relatórios Avançados",
        "Relatórios → Relatórios Avançados",
        "/relatorios-avancados",
        "Gestores.",
        "Relatórios com filtros e métricas adicionais.",
        "relatorios/relatorios-avancados.png",
        [],
        ["Montar filtros.", "Gerar e exportar relatório."],
    ),
    section(
        "Marketing",
        "Marketing → Marketing",
        "/marketing",
        "Gestão e marketing.",
        "Manuais de conduta e materiais de divulgação para download.",
        "marketing/marketing-manuais.png",
        [],
        ["Enviar PDF ou arquivo.", "Baixar material existente."],
        abas=[
            ("Manuais de Conduta", "Documentos internos de conduta."),
            ("Materiais de Marketing", "Peças de comunicação."),
        ],
    ),
    section(
        "Documentos",
        "Documentos → Documentos",
        "/documentos",
        "Toda a equipe (conforme permissão).",
        "Biblioteca de arquivos institucionais por categoria.",
        "documentos/documentos-arquivos.png",
        ["Envie arquivo e escolha categoria.", "Baixe pelo botão na linha."],
        ["Upload de arquivo.", "Organizar categorias.", "Excluir arquivo obsoleto."],
        abas=[
            ("Arquivos", "Lista de documentos disponíveis."),
            ("Categorias", "Pastas lógicas para classificar arquivos."),
        ],
    ),
    section(
        "Usuários",
        "Administração → Usuários",
        "/configuracoes/usuarios",
        "Somente administrador.",
        "Criar logins, definir perfil (admin, gestor, terapeuta…) e unidades.",
        "admin/usuarios.png",
        ["Novo usuário → e-mail, nome, perfil, unidades → Salvar."],
        COMMON_LIST + ["Perfis controlam o que aparece no menu."],
    ),
    section(
        "Controles de acesso",
        "Administração → Controles de acesso",
        "/configuracoes/controles-acesso",
        "Somente administrador.",
        "Ajustar permissões finas por perfil (o que pode ver e fazer).",
        "admin/controles-acesso-api.png",
        ["Selecione o perfil.", "Marque ou desmarque permissões.", "Salve alterações."],
        [],
        abas=[
            ("API (ações)", "Permissões de leitura/escrita na API."),
            ("Escopo de dados", "Quais dados o perfil enxerga (ex.: só sua unidade)."),
            ("Menu", "Itens visíveis no menu lateral."),
        ],
    ),
    section(
        "Chave Digital",
        "Administração → Chave Digital",
        "/configuracoes/chave-digital",
        "Admin e gestores.",
        "Cadastro da chave para assinar documentos digitalmente.",
        "admin/chave-digital.png",
        ["Registrar chave quando solicitado.", "Revogar se houver troca de certificado."],
        ["Registrar chave.", "Revogar chave existente."],
    ),
]

INTRO = """# Introdução — Manual de Utilização

Este manual explica, em linguagem simples, **como usar o Espaço Terapia OS** no dia a dia.

## Antes de começar

1. **Login:** acesse o endereço informado pela sua clínica, digite e-mail e senha.
2. **Unidade:** no topo da tela, confira qual filial/unidade está selecionada — listas e agenda respeitam essa escolha.
3. **Menu à esquerda:** agrupa as funções por área (Recepção, Clínico, Financeiro…). Itens que você não vê podem estar ocultos pelo seu **perfil de acesso**.

## Símbolos usados nas listas

| Ícone / botão | Significado usual |
|---------------|-------------------|
| Olho | Ver detalhes |
| Lápis | Editar |
| Lixeira | Excluir ou desativar |
| + / Novo | Criar registro |
| ⋯ (três pontos) | Mais ações na linha |

## Evidências visuais

As imagens deste manual foram capturadas na versão atual do sistema (ambiente de demonstração). Pequenas diferenças de cor ou texto podem ocorrer após atualizações.

![Menu lateral](manual-usuario/screenshots/geral/menu-lateral.png)

"""


def append_tab_screenshots(content: str, main_shot: str) -> str:
    """Insere imagens extras capturadas por aba (*-aba-*.png) após a seção Abas."""
    if "## Abas desta tela" not in content or "### Capturas por aba" in content:
        return content
    full_dir = ROOT / "docs" / SHOT / Path(main_shot).parent
    stem = Path(main_shot).stem
    extras = sorted(full_dir.glob(f"{stem}-aba-*.png"))
    if not extras:
        return content
    block = "\n\n### Capturas por aba\n\n"
    for p in extras:
        rel = str(Path(SHOT) / Path(main_shot).parent / p.name).replace("\\", "/")
        label = p.stem.replace(stem + "-", "").replace("-", " ").title()
        block += f"**{label}**\n\n![{label}]({rel})\n\n"
    return content + block


def main():
    MOD.mkdir(parents=True, exist_ok=True)
    (ROOT / "docs" / "manual-usuario" / "00-introducao.md").write_text(INTRO, encoding="utf-8")
    files = []
    for i, content in enumerate(MODULES):
        name = f"{i:02d}-" + content.split("\n")[0].replace("# ", "").lower()
        name = "".join(c if c.isalnum() or c in "-_" else "-" for c in name)[:50] + ".md"
        path = MOD / name
        # use ordered filenames from predefined list
        pass
    # Write with fixed filenames
    names = [
        "00-dashboard.md", "01-agenda.md", "02-agendamentos.md", "03-pacientes.md",
        "04-terapias.md", "05-salas.md", "06-prontuarios.md", "07-anamneses.md",
        "08-aprovacao-atendimentos.md", "09-docs-assinados.md", "10-meu-painel.md",
        "11-minha-agenda.md", "12-profissionais.md", "13-financeiro.md",
        "14-balancetes.md", "15-relatorios-conciliacao.md", "16-auditoria-notas.md",
        "17-contratos.md", "18-folha-pagamento.md", "19-planos-saude.md",
        "20-acoes-judiciais.md", "21-estoque.md", "22-comodato.md", "23-relatorios.md",
        "24-relatorios-avancados.md", "25-marketing.md", "26-documentos.md",
        "27-usuarios.md", "28-controles-acesso.md", "29-chave-digital.md",
    ]
    shots = [
        "geral/dashboard.png",
        "recepcao/agenda.png",
        "recepcao/agendamentos.png",
        "recepcao/pacientes.png",
        "recepcao/terapias.png",
        "recepcao/salas.png",
        "clinico/prontuarios.png",
        "clinico/anamneses.png",
        "clinico/aprovacao-atendimentos.png",
        "clinico/docs-assinados.png",
        "profissionais/meu-painel.png",
        "profissionais/minha-agenda.png",
        "profissionais/profissionais.png",
        "financeiro/financeiro-dashboard.png",
        "financeiro/balancetes.png",
        "financeiro/relatorios-conciliacao.png",
        "financeiro/auditoria-notas.png",
        "rh/contratos.png",
        "rh/folha-clt.png",
        "planos/planos-saude.png",
        "planos/acoes-judiciais.png",
        "estoque/estoque-dashboard.png",
        "estoque/comodato-ativos.png",
        "relatorios/relatorios.png",
        "relatorios/relatorios-avancados.png",
        "marketing/marketing-manuais.png",
        "documentos/documentos-arquivos.png",
        "admin/usuarios.png",
        "admin/controles-acesso-api.png",
        "admin/chave-digital.png",
    ]
    for fname, content, shot in zip(names, MODULES, shots):
        content = append_tab_screenshots(content, shot)
        (MOD / fname).write_text(content, encoding="utf-8")
    print(f"Wrote {len(names)} modules + intro")


if __name__ == "__main__":
    main()
