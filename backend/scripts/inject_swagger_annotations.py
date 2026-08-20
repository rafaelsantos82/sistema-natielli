#!/usr/bin/env python3
"""Insere blocos godoc/swag antes de handlers HTTP (idempotente)."""
from __future__ import annotations

import re
from pathlib import Path

HANDLERS = Path(__file__).resolve().parent.parent / "internal/interfaces/http/handlers"

# (receiver_type, method_name) -> (tag, summary, router)
SPECS: dict[tuple[str, str], tuple[str, str, str]] = {
    # auth & health
    ("AuthHandler", "IssueToken"): (
        "auth",
        "Emitir JWT (bootstrap dev)",
        "/auth/token [post]",
    ),
    ("AuthHandler", "Me"): ("auth", "Usuário autenticado", "/auth/me [get]"),
    ("HealthHandler", "Health"): ("health", "Health check", "/health [get]"),
    # consultas
    ("ConsultaHandler", "ListConsultas"): (
        "consulta",
        "Listar consultas",
        "/consultas [get]",
    ),
    ("ConsultaHandler", "CreateConsulta"): (
        "consulta",
        "Criar consulta",
        "/consultas [post]",
    ),
    ("ConsultaHandler", "GetConsulta"): (
        "consulta",
        "Obter consulta",
        "/consultas/{id} [get]",
    ),
    ("ConsultaHandler", "UpdateConsulta"): (
        "consulta",
        "Atualizar consulta",
        "/consultas/{id} [put]",
    ),
    ("ConsultaHandler", "DeleteConsulta"): (
        "consulta",
        "Excluir consulta",
        "/consultas/{id} [delete]",
    ),
    ("ConsultaHandler", "ConfirmarConsulta"): (
        "consulta",
        "Confirmar consulta",
        "/consultas/{id}/confirmar [post]",
    ),
    ("ConsultaHandler", "CancelarConsulta"): (
        "consulta",
        "Cancelar consulta",
        "/consultas/{id}/cancelar [post]",
    ),
    ("ConsultaHandler", "ConcluirConsulta"): (
        "consulta",
        "Concluir consulta",
        "/consultas/{id}/concluir [post]",
    ),
    ("ConsultaHandler", "VincularProntuario"): (
        "consulta",
        "Vincular prontuário",
        "/consultas/{id}/vincular-prontuario [post]",
    ),
    ("ConsultaHandler", "AprovarAtendimento"): (
        "consulta",
        "Aprovar atendimento",
        "/consultas/{id}/aprovar-atendimento [post]",
    ),
    ("ConsultaHandler", "RejeitarAtendimento"): (
        "consulta",
        "Rejeitar atendimento",
        "/consultas/{id}/rejeitar-atendimento [post]",
    ),
    # profissionais
    ("ProfissionalHandler", "ListProfissionais"): (
        "profissional",
        "Listar profissionais",
        "/profissionais [get]",
    ),
    ("ProfissionalHandler", "CreateProfissional"): (
        "profissional",
        "Criar profissional",
        "/profissionais [post]",
    ),
    ("ProfissionalHandler", "GetProfissional"): (
        "profissional",
        "Obter profissional",
        "/profissionais/{id} [get]",
    ),
    ("ProfissionalHandler", "UpdateProfissional"): (
        "profissional",
        "Atualizar profissional",
        "/profissionais/{id} [put]",
    ),
    ("ProfissionalHandler", "DeleteProfissional"): (
        "profissional",
        "Excluir profissional",
        "/profissionais/{id} [delete]",
    ),
    ("ProfissionalHandler", "ListConselhos"): (
        "profissional",
        "Listar conselhos",
        "/profissionais/{id}/conselhos [get]",
    ),
    ("ProfissionalHandler", "CreateConselho"): (
        "profissional",
        "Criar conselho",
        "/profissionais/{id}/conselhos [post]",
    ),
    ("ProfissionalHandler", "UpdateConselho"): (
        "profissional",
        "Atualizar conselho",
        "/profissionais/{id}/conselhos/{conselhoId} [put]",
    ),
    ("ProfissionalHandler", "DeleteConselho"): (
        "profissional",
        "Excluir conselho",
        "/profissionais/{id}/conselhos/{conselhoId} [delete]",
    ),
    # unidades
    ("UnidadeHandler", "ListUnidades"): ("unidade", "Listar unidades", "/unidades [get]"),
    ("UnidadeHandler", "GetUnidade"): ("unidade", "Obter unidade", "/unidades/{id} [get]"),
    # salas
    ("SalaHandler", "ListSalas"): ("sala", "Listar salas", "/salas [get]"),
    ("SalaHandler", "CreateSala"): ("sala", "Criar sala", "/salas [post]"),
    ("SalaHandler", "GetSala"): ("sala", "Obter sala", "/salas/{id} [get]"),
    ("SalaHandler", "UpdateSala"): ("sala", "Atualizar sala", "/salas/{id} [put]"),
    ("SalaHandler", "DeleteSala"): ("sala", "Excluir sala", "/salas/{id} [delete]"),
    ("SalaHandler", "ListReservas"): (
        "sala",
        "Listar reservas da sala",
        "/salas/{id}/reservas [get]",
    ),
    ("SalaHandler", "CreateReserva"): (
        "sala",
        "Criar reserva",
        "/salas/{id}/reservas [post]",
    ),
    ("SalaHandler", "UpdateReserva"): (
        "sala",
        "Atualizar reserva",
        "/salas/{id}/reservas/{reservaId} [put]",
    ),
    ("SalaHandler", "DeleteReserva"): (
        "sala",
        "Excluir reserva",
        "/salas/{id}/reservas/{reservaId} [delete]",
    ),
    # notification
    ("NotificationSettingsHandler", "GetNotificationSettings"): (
        "notification",
        "Obter configurações de notificação",
        "/notification-settings [get]",
    ),
    ("NotificationSettingsHandler", "PutNotificationSettings"): (
        "notification",
        "Salvar configurações de notificação",
        "/notification-settings [put]",
    ),
    # prontuario
    ("ProntuarioHandler", "GetPacienteProntuario"): (
        "prontuario",
        "Prontuário do paciente",
        "/prontuario/pacientes/{pacienteId} [get]",
    ),
    ("ProntuarioHandler", "CreateEvolucao"): (
        "prontuario",
        "Criar evolução",
        "/prontuario/evolucoes [post]",
    ),
    ("ProntuarioHandler", "DeleteEvolucao"): (
        "prontuario",
        "Excluir evolução",
        "/prontuario/evolucoes/{id} [delete]",
    ),
    ("ProntuarioHandler", "CreatePrescricao"): (
        "prontuario",
        "Criar prescrição",
        "/prontuario/prescricoes [post]",
    ),
    ("ProntuarioHandler", "DeletePrescricao"): (
        "prontuario",
        "Excluir prescrição",
        "/prontuario/prescricoes/{id} [delete]",
    ),
    ("ProntuarioHandler", "CreateAtestado"): (
        "prontuario",
        "Criar atestado",
        "/prontuario/atestados [post]",
    ),
    ("ProntuarioHandler", "DeleteAtestado"): (
        "prontuario",
        "Excluir atestado",
        "/prontuario/atestados/{id} [delete]",
    ),
    ("ProntuarioHandler", "CreateDocumento"): (
        "prontuario",
        "Criar documento",
        "/prontuario/documentos [post]",
    ),
    ("ProntuarioHandler", "DeleteDocumento"): (
        "prontuario",
        "Excluir documento",
        "/prontuario/documentos/{id} [delete]",
    ),
    # wave2
    ("TerapiaHandler", "List"): ("terapia", "Listar terapias", "/terapias [get]"),
    ("TerapiaHandler", "Create"): ("terapia", "Criar terapia", "/terapias [post]"),
    ("TerapiaHandler", "Get"): ("terapia", "Obter terapia", "/terapias/{id} [get]"),
    ("TerapiaHandler", "Update"): (
        "terapia",
        "Atualizar terapia",
        "/terapias/{id} [put]",
    ),
    ("TerapiaHandler", "Delete"): (
        "terapia",
        "Excluir terapia",
        "/terapias/{id} [delete]",
    ),
    ("AnamneseHandler", "List"): ("anamnese", "Listar anamneses", "/anamneses [get]"),
    ("AnamneseHandler", "Create"): ("anamnese", "Criar anamnese", "/anamneses [post]"),
    ("AnamneseHandler", "Get"): ("anamnese", "Obter anamnese", "/anamneses/{id} [get]"),
    ("AnamneseHandler", "Update"): ("anamnese", "Atualizar anamnese", "/anamneses/{id} [put]"),
    ("AnamneseHandler", "Delete"): (
        "anamnese",
        "Excluir anamnese",
        "/anamneses/{id} [delete]",
    ),
    ("RespostaAnamneseHandler", "List"): (
        "anamnese",
        "Listar respostas de anamnese",
        "/respostas-anamnese [get]",
    ),
    ("RespostaAnamneseHandler", "Create"): (
        "anamnese",
        "Criar resposta de anamnese",
        "/respostas-anamnese [post]",
    ),
    ("FinanceiroHandler", "ListCategorias"): (
        "financeiro",
        "Listar categorias",
        "/financeiro/categorias [get]",
    ),
    ("FinanceiroHandler", "CreateCategoria"): (
        "financeiro",
        "Criar categoria",
        "/financeiro/categorias [post]",
    ),
    ("FinanceiroHandler", "GetCategoria"): (
        "financeiro",
        "Obter categoria",
        "/financeiro/categorias/{id} [get]",
    ),
    ("FinanceiroHandler", "UpdateCategoria"): (
        "financeiro",
        "Atualizar categoria",
        "/financeiro/categorias/{id} [put]",
    ),
    ("FinanceiroHandler", "DeleteCategoria"): (
        "financeiro",
        "Excluir categoria",
        "/financeiro/categorias/{id} [delete]",
    ),
    ("FinanceiroHandler", "ListCentrosCusto"): (
        "financeiro",
        "Listar centros de custo",
        "/financeiro/centros-custo [get]",
    ),
    ("FinanceiroHandler", "CreateCentroCusto"): (
        "financeiro",
        "Criar centro de custo",
        "/financeiro/centros-custo [post]",
    ),
    ("FinanceiroHandler", "GetCentroCusto"): (
        "financeiro",
        "Obter centro de custo",
        "/financeiro/centros-custo/{id} [get]",
    ),
    ("FinanceiroHandler", "UpdateCentroCusto"): (
        "financeiro",
        "Atualizar centro de custo",
        "/financeiro/centros-custo/{id} [put]",
    ),
    ("FinanceiroHandler", "DeleteCentroCusto"): (
        "financeiro",
        "Excluir centro de custo",
        "/financeiro/centros-custo/{id} [delete]",
    ),
    ("FinanceiroHandler", "ListLancamentos"): (
        "financeiro",
        "Listar lançamentos",
        "/financeiro/lancamentos [get]",
    ),
    ("FinanceiroHandler", "CreateLancamento"): (
        "financeiro",
        "Criar lançamento",
        "/financeiro/lancamentos [post]",
    ),
    ("FinanceiroHandler", "GetLancamento"): (
        "financeiro",
        "Obter lançamento",
        "/financeiro/lancamentos/{id} [get]",
    ),
    ("FinanceiroHandler", "UpdateLancamento"): (
        "financeiro",
        "Atualizar lançamento",
        "/financeiro/lancamentos/{id} [put]",
    ),
    ("FinanceiroHandler", "DeleteLancamento"): (
        "financeiro",
        "Excluir lançamento",
        "/financeiro/lancamentos/{id} [delete]",
    ),
    ("RelatorioOperacionalHandler", "List"): (
        "relatorio",
        "Listar relatórios operacionais",
        "/relatorios-operacionais [get]",
    ),
    ("RelatorioOperacionalHandler", "Create"): (
        "relatorio",
        "Criar relatório operacional",
        "/relatorios-operacionais [post]",
    ),
    ("RelatorioOperacionalHandler", "Get"): (
        "relatorio",
        "Obter relatório operacional",
        "/relatorios-operacionais/{id} [get]",
    ),
    ("RelatorioOperacionalHandler", "Update"): (
        "relatorio",
        "Atualizar relatório operacional",
        "/relatorios-operacionais/{id} [put]",
    ),
    ("RelatorioOperacionalHandler", "Delete"): (
        "relatorio",
        "Excluir relatório operacional",
        "/relatorios-operacionais/{id} [delete]",
    ),
    ("AuditHandler", "List"): ("audit", "Listar audit log", "/audit-log [get]"),
}

# wave3 — prefix paths
WAVE3: list[tuple[str, str, str, str, str]] = [
    # RH CLT
    ("Wave3Handler", "ListFuncionariosCLT", "rh", "Listar funcionários CLT", "/rh/funcionarios-clt [get]"),
    ("Wave3Handler", "CreateFuncionarioCLT", "rh", "Criar funcionário CLT", "/rh/funcionarios-clt [post]"),
    ("Wave3Handler", "GetFuncionarioCLT", "rh", "Obter funcionário CLT", "/rh/funcionarios-clt/{id} [get]"),
    ("Wave3Handler", "UpdateFuncionarioCLT", "rh", "Atualizar funcionário CLT", "/rh/funcionarios-clt/{id} [put]"),
    ("Wave3Handler", "DeleteFuncionarioCLT", "rh", "Excluir funcionário CLT", "/rh/funcionarios-clt/{id} [delete]"),
    # RH PJ
    ("Wave3Handler", "ListFuncionariosPJ", "rh", "Listar funcionários PJ", "/rh/funcionarios-pj [get]"),
    ("Wave3Handler", "CreateFuncionarioPJ", "rh", "Criar funcionário PJ", "/rh/funcionarios-pj [post]"),
    ("Wave3Handler", "GetFuncionarioPJ", "rh", "Obter funcionário PJ", "/rh/funcionarios-pj/{id} [get]"),
    ("Wave3Handler", "UpdateFuncionarioPJ", "rh", "Atualizar funcionário PJ", "/rh/funcionarios-pj/{id} [put]"),
    ("Wave3Handler", "DeleteFuncionarioPJ", "rh", "Excluir funcionário PJ", "/rh/funcionarios-pj/{id} [delete]"),
    # Folhas
    ("Wave3Handler", "ListFolhasCLT", "rh", "Listar folhas CLT", "/rh/folhas-clt [get]"),
    ("Wave3Handler", "CreateFolhaCLT", "rh", "Criar folha CLT", "/rh/folhas-clt [post]"),
    ("Wave3Handler", "GetFolhaCLT", "rh", "Obter folha CLT", "/rh/folhas-clt/{id} [get]"),
    ("Wave3Handler", "UpdateFolhaCLT", "rh", "Atualizar folha CLT", "/rh/folhas-clt/{id} [put]"),
    ("Wave3Handler", "DeleteFolhaCLT", "rh", "Excluir folha CLT", "/rh/folhas-clt/{id} [delete]"),
    ("Wave3Handler", "ListFolhasPJ", "rh", "Listar folhas PJ", "/rh/folhas-pj [get]"),
    ("Wave3Handler", "CreateFolhaPJ", "rh", "Criar folha PJ", "/rh/folhas-pj [post]"),
    ("Wave3Handler", "GetFolhaPJ", "rh", "Obter folha PJ", "/rh/folhas-pj/{id} [get]"),
    ("Wave3Handler", "UpdateFolhaPJ", "rh", "Atualizar folha PJ", "/rh/folhas-pj/{id} [put]"),
    ("Wave3Handler", "DeleteFolhaPJ", "rh", "Excluir folha PJ", "/rh/folhas-pj/{id} [delete]"),
    # Estoque
    ("Wave3Handler", "ListItensEstoque", "estoque", "Listar itens de estoque", "/estoque/itens [get]"),
    ("Wave3Handler", "CreateItemEstoque", "estoque", "Criar item de estoque", "/estoque/itens [post]"),
    ("Wave3Handler", "GetItemEstoque", "estoque", "Obter item de estoque", "/estoque/itens/{id} [get]"),
    ("Wave3Handler", "UpdateItemEstoque", "estoque", "Atualizar item de estoque", "/estoque/itens/{id} [put]"),
    ("Wave3Handler", "DeleteItemEstoque", "estoque", "Excluir item de estoque", "/estoque/itens/{id} [delete]"),
    ("Wave3Handler", "ListMovimentacoes", "estoque", "Listar movimentações", "/estoque/movimentacoes [get]"),
    ("Wave3Handler", "CreateMovimentacao", "estoque", "Criar movimentação", "/estoque/movimentacoes [post]"),
    ("Wave3Handler", "GetMovimentacao", "estoque", "Obter movimentação", "/estoque/movimentacoes/{id} [get]"),
    ("Wave3Handler", "DeleteMovimentacao", "estoque", "Excluir movimentação", "/estoque/movimentacoes/{id} [delete]"),
    ("Wave3Handler", "ListInventarios", "estoque", "Listar inventários", "/estoque/inventarios [get]"),
    ("Wave3Handler", "CreateInventario", "estoque", "Criar inventário", "/estoque/inventarios [post]"),
    ("Wave3Handler", "GetInventario", "estoque", "Obter inventário", "/estoque/inventarios/{id} [get]"),
    ("Wave3Handler", "UpdateInventario", "estoque", "Atualizar inventário", "/estoque/inventarios/{id} [put]"),
    ("Wave3Handler", "DeleteInventario", "estoque", "Excluir inventário", "/estoque/inventarios/{id} [delete]"),
    # Comodatos
    ("Wave3Handler", "ListComodatos", "comodato", "Listar comodatos", "/comodatos [get]"),
    ("Wave3Handler", "CreateComodato", "comodato", "Criar comodato", "/comodatos [post]"),
    ("Wave3Handler", "GetComodato", "comodato", "Obter comodato", "/comodatos/{id} [get]"),
    ("Wave3Handler", "UpdateComodato", "comodato", "Atualizar comodato", "/comodatos/{id} [put]"),
    ("Wave3Handler", "DeleteComodato", "comodato", "Excluir comodato", "/comodatos/{id} [delete]"),
    # Planos
    ("Wave3Handler", "ListPlanosSaude", "plano", "Listar planos de saúde", "/planos-saude [get]"),
    ("Wave3Handler", "CreatePlanoSaude", "plano", "Criar plano de saúde", "/planos-saude [post]"),
    ("Wave3Handler", "GetPlanoSaude", "plano", "Obter plano de saúde", "/planos-saude/{id} [get]"),
    ("Wave3Handler", "UpdatePlanoSaude", "plano", "Atualizar plano de saúde", "/planos-saude/{id} [put]"),
    ("Wave3Handler", "DeletePlanoSaude", "plano", "Excluir plano de saúde", "/planos-saude/{id} [delete]"),
    # Ações judiciais
    ("Wave3Handler", "ListAcoesJudiciais", "juridico", "Listar ações judiciais", "/acoes-judiciais [get]"),
    ("Wave3Handler", "CreateAcaoJudicial", "juridico", "Criar ação judicial", "/acoes-judiciais [post]"),
    ("Wave3Handler", "GetAcaoJudicial", "juridico", "Obter ação judicial", "/acoes-judiciais/{id} [get]"),
    ("Wave3Handler", "UpdateAcaoJudicial", "juridico", "Atualizar ação judicial", "/acoes-judiciais/{id} [put]"),
    ("Wave3Handler", "DeleteAcaoJudicial", "juridico", "Excluir ação judicial", "/acoes-judiciais/{id} [delete]"),
    # NF
    ("Wave3Handler", "ListNotasFiscais", "fiscal", "Listar notas fiscais", "/notas-fiscais [get]"),
    ("Wave3Handler", "CreateNotaFiscal", "fiscal", "Criar nota fiscal", "/notas-fiscais [post]"),
    ("Wave3Handler", "GetNotaFiscal", "fiscal", "Obter nota fiscal", "/notas-fiscais/{id} [get]"),
    ("Wave3Handler", "UpdateNotaFiscal", "fiscal", "Atualizar nota fiscal", "/notas-fiscais/{id} [put]"),
    ("Wave3Handler", "DeleteNotaFiscal", "fiscal", "Excluir nota fiscal", "/notas-fiscais/{id} [delete]"),
    # Contratos
    ("Wave3Handler", "ListContratos", "contrato", "Listar contratos", "/contratos [get]"),
    ("Wave3Handler", "CreateContrato", "contrato", "Criar contrato", "/contratos [post]"),
    ("Wave3Handler", "GetContrato", "contrato", "Obter contrato", "/contratos/{id} [get]"),
    ("Wave3Handler", "UpdateContrato", "contrato", "Atualizar contrato", "/contratos/{id} [put]"),
    ("Wave3Handler", "DeleteContrato", "contrato", "Excluir contrato", "/contratos/{id} [delete]"),
    # Marketing
    ("Wave3Handler", "ListManuais", "marketing", "Listar manuais", "/marketing/manuais [get]"),
    ("Wave3Handler", "CreateManual", "marketing", "Criar manual", "/marketing/manuais [post]"),
    ("Wave3Handler", "GetManual", "marketing", "Obter manual", "/marketing/manuais/{id} [get]"),
    ("Wave3Handler", "UpdateManual", "marketing", "Atualizar manual", "/marketing/manuais/{id} [put]"),
    ("Wave3Handler", "DeleteManual", "marketing", "Excluir manual", "/marketing/manuais/{id} [delete]"),
    ("Wave3Handler", "ListMateriais", "marketing", "Listar materiais", "/marketing/materiais [get]"),
    ("Wave3Handler", "CreateMaterial", "marketing", "Criar material", "/marketing/materiais [post]"),
    ("Wave3Handler", "GetMaterial", "marketing", "Obter material", "/marketing/materiais/{id} [get]"),
    ("Wave3Handler", "UpdateMaterial", "marketing", "Atualizar material", "/marketing/materiais/{id} [put]"),
    ("Wave3Handler", "DeleteMaterial", "marketing", "Excluir material", "/marketing/materiais/{id} [delete]"),
    # Contabilidade
    ("Wave3Handler", "ListContasContabeis", "contabilidade", "Listar contas contábeis", "/contabilidade/contas [get]"),
    ("Wave3Handler", "CreateContaContabil", "contabilidade", "Criar conta contábil", "/contabilidade/contas [post]"),
    ("Wave3Handler", "GetContaContabil", "contabilidade", "Obter conta contábil", "/contabilidade/contas/{codigo} [get]"),
    ("Wave3Handler", "UpdateContaContabil", "contabilidade", "Atualizar conta contábil", "/contabilidade/contas/{codigo} [put]"),
    ("Wave3Handler", "DeleteContaContabil", "contabilidade", "Excluir conta contábil", "/contabilidade/contas/{codigo} [delete]"),
    ("Wave3Handler", "ListLancamentosContabeis", "contabilidade", "Listar lançamentos contábeis", "/contabilidade/lancamentos [get]"),
    ("Wave3Handler", "CreateLancamentoContabil", "contabilidade", "Criar lançamento contábil", "/contabilidade/lancamentos [post]"),
    ("Wave3Handler", "GetLancamentoContabil", "contabilidade", "Obter lançamento contábil", "/contabilidade/lancamentos/{id} [get]"),
    ("Wave3Handler", "UpdateLancamentoContabil", "contabilidade", "Atualizar lançamento contábil", "/contabilidade/lancamentos/{id} [put]"),
    ("Wave3Handler", "DeleteLancamentoContabil", "contabilidade", "Excluir lançamento contábil", "/contabilidade/lancamentos/{id} [delete]"),
]

for row in WAVE3:
    SPECS[(row[0], row[1])] = (row[2], row[3], row[4])


def block(receiver: str, method: str, tag: str, summary: str, router: str) -> str:
    sec = ""
    if receiver != "AuthHandler" and method != "Health":
        sec = "//\t@Security\t\tBearerAuth\n"
    elif receiver == "AuthHandler" and method == "IssueToken":
        sec = "//\t@Param\t\t\tX-Bootstrap-Token\theader\tstring\ttrue\t\"Token bootstrap (dev)\"\n"
    accept = ""
    if "[post]" in router or "[put]" in router:
        accept = "//\t@Accept\t\t\tjson\n"
    success_line = "//\t@Success\t\t200\t{object}\tmap[string]interface{}\n"
    if "[post]" in router:
        success_line = "//\t@Success\t\t201\t{object}\tmap[string]interface{}\n"
    if "[delete]" in router:
        success_line = "//\t@Success\t\t204\n"
    id_param = ""
    if "{id}" in router or "{codigo}" in router or "{pacienteId}" in router or "{conselhoId}" in router or "{reservaId}" in router:
        pname = "id"
        if "{codigo}" in router:
            pname = "codigo"
        elif "{pacienteId}" in router:
            pname = "pacienteId"
        elif "{conselhoId}" in router:
            pname = "conselhoId"
        elif "{reservaId}" in router:
            pname = "reservaId"
        id_param = f"//\t@Param\t\t\t{pname}\tpath\tstring\ttrue\t\"ID\"\n"
    unidade_q = ""
    if receiver == "NotificationSettingsHandler":
        unidade_q = "//\t@Param\t\t\tunidade_id\tquery\tstring\tfalse\t\"Unidade (UUID)\"\n"

    return (
        f"// {method} godoc\n"
        f"//\n"
        f"//\t@Summary\t\t{summary}\n"
        f"//\t@Tags\t\t\t{tag}\n"
        f"{accept}"
        f"//\t@Produce\t\tjson\n"
        f"{sec}"
        f"{unidade_q}"
        f"{id_param}"
        f"{success_line}"
        f"//\t@Failure\t\t400\t{{object}}\tmap[string]interface{{}}\n"
        f"//\t@Failure\t\t401\t{{object}}\tmap[string]interface{{}}\n"
        f"//\t@Router\t\t\t{router}\n"
    )


FUNC_RE = re.compile(r"^func \(h \*(\w+)\) (\w+)\(c \*gin\.Context\)")


def process_file(path: Path) -> int:
    text = path.read_text()
    lines = text.splitlines(keepends=True)
    out: list[str] = []
    i = 0
    n = 0
    while i < len(lines):
        m = FUNC_RE.match(lines[i].rstrip("\n"))
        if m:
            recv, meth = m.group(1), m.group(2)
            key = (recv, meth)
            if key in SPECS:
                tag, summary, router = SPECS[key]
                # skip if already annotated
                chunk = "".join(out[-30:])
                if f"// {meth} godoc" in chunk:
                    out.append(lines[i])
                    i += 1
                    continue
                out.append(block(recv, meth, tag, summary, router))
                n += 1
        out.append(lines[i])
        i += 1
    if n:
        path.write_text("".join(out))
    return n


def main() -> None:
    total = 0
    for go in sorted(HANDLERS.glob("*.go")):
        if go.name.endswith("_test.go"):
            continue
        total += process_file(go)
    print(f"annotated {total} handlers")


if __name__ == "__main__":
    main()
