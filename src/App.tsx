import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { UnidadeProvider } from "./contexts/UnidadeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Unidades from "./pages/Unidades";
import Login from "./pages/Login";
import EsqueciSenha from "./pages/EsqueciSenha";
import RedefinirSenha from "./pages/RedefinirSenha";
import AlterarSenhaObrigatoria from "./pages/AlterarSenhaObrigatoria";
import ContaPerfil from "./pages/ContaPerfil";
import ContaSenha from "./pages/ContaSenha";
import Dashboard from "./pages/Dashboard";
import Pacientes from "./pages/Pacientes";
import Terapias from "./pages/Terapias";
import Consultas from "./pages/Consultas";
import DashboardOcupacao from "./pages/DashboardOcupacao";
import Profissionais from "./pages/Profissionais";
import AgendaProfissional from "./pages/AgendaProfissional";
import MinhaAgenda from "./pages/MinhaAgenda";
import MeuPainel from "./pages/MeuPainel";
import Prontuario from "./pages/Prontuario";
import Relatorios from "./pages/Relatorios";
import RelatoriosAvancados from "./pages/RelatoriosAvancados";
import RelatorioDetalhes from "./pages/RelatorioDetalhes";
import DocumentosAssinados from "./pages/DocumentosAssinados";
import Documentos from "./pages/Documentos";
import Salas from "./pages/Salas";
import AgendaSala from "./pages/AgendaSala";
import Estoque from "./pages/Estoque";
import Comodato from "./pages/Comodato";
import Marketing from "./pages/Marketing";
import Balancetes from "./pages/Balancetes";
import Anamneses from "./pages/Anamneses";
import Contratos from "./pages/Contratos";
import ContratoCompartilhado from "./pages/ContratoCompartilhado";
import ContratoAssinatura from "./pages/ContratoAssinatura";
import Prontuarios from "./pages/Prontuarios";
import Financeiro from "./pages/Financeiro";
import Faturas from "./pages/Faturas";
import FolhaPagamento from "./pages/FolhaPagamento";
import Agenda from "./pages/Agenda";
import PlanosSaude from "./pages/PlanosSaude";
import AcoesJudiciais from "./pages/AcoesJudiciais";
import AcaoJudicialDetalhe from "./pages/AcaoJudicialDetalhe";
import AuditoriaNotas from "./pages/AuditoriaNotas";
import RelatoriosConciliacao from "./pages/RelatoriosConciliacao";
import AtendimentosAprovacao from "./pages/AtendimentosAprovacao";
import NotFound from "./pages/NotFound";
import Configuracoes from "./pages/Configuracoes";
import ControlesAcesso from "./pages/ControlesAcesso";
import ChaveDigital from "./pages/ChaveDigital";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ApiClientError } from "./lib/api/client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiClientError && error.status === 401) return false;
        return failureCount < 1;
      },
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <UnidadeProvider>
          <ErrorBoundary area="aplicação">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/esqueci-senha" element={<EsqueciSenha />} />
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            <Route
              path="/alterar-senha"
              element={
                <ProtectedRoute>
                  <AlterarSenhaObrigatoria />
                </ProtectedRoute>
              }
            />
            <Route path="/contratos/compartilhado/:token" element={<ContratoCompartilhado />} />
            <Route path="/contratos/assinatura/:token" element={<ContratoAssinatura />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/pacientes" element={<ProtectedRoute requiredPermission="menu.pacientes.view"><Pacientes /></ProtectedRoute>} />
            <Route path="/profissionais" element={<ProtectedRoute requiredPermission="menu.profissionais.view"><Profissionais /></ProtectedRoute>} />
            <Route
              path="/profissionais/:id/agenda"
              element={
                <ProtectedRoute>
                  <AgendaProfissional />
                </ProtectedRoute>
              }
            />
            <Route path="/minha-agenda" element={<ProtectedRoute requiredPermission="menu.minha-agenda.view"><MinhaAgenda /></ProtectedRoute>} />
            <Route path="/meu-painel" element={<ProtectedRoute requiredPermission="menu.meu-painel.view"><MeuPainel /></ProtectedRoute>} />
            <Route path="/tratamentos" element={<Navigate to="/terapias" replace />} />
            <Route path="/terapias" element={<ProtectedRoute requiredPermission="menu.terapias.view"><Terapias /></ProtectedRoute>} />
            <Route path="/consultas" element={<ProtectedRoute requiredPermission="menu.consultas.view"><Consultas /></ProtectedRoute>} />
            <Route path="/dashboard-ocupacao" element={<ProtectedRoute><DashboardOcupacao /></ProtectedRoute>} />
            <Route path="/atendimentos/aprovacoes" element={<ProtectedRoute requiredPermission="menu.aprovacoes.view"><AtendimentosAprovacao /></ProtectedRoute>} />
            <Route path="/prontuario/:consultaId" element={<ProtectedRoute><Prontuario /></ProtectedRoute>} />
            <Route path="/prontuarios" element={<ProtectedRoute requiredPermission="menu.prontuarios.view"><Prontuarios /></ProtectedRoute>} />
            <Route path="/salas" element={<ProtectedRoute requiredPermission="menu.salas.view"><Salas /></ProtectedRoute>} />
            <Route path="/salas/:id/agenda" element={<ProtectedRoute><AgendaSala /></ProtectedRoute>} />
            <Route path="/estoque" element={<ProtectedRoute requiredPermission="menu.estoque.view"><Estoque /></ProtectedRoute>} />
            <Route path="/comodato" element={<ProtectedRoute requiredPermission="menu.comodato.view"><Comodato /></ProtectedRoute>} />
            <Route path="/marketing" element={<ProtectedRoute requiredPermission="menu.marketing.view"><Marketing /></ProtectedRoute>} />
            <Route path="/balancetes" element={<ProtectedRoute requiredPermission="menu.balancetes.view"><Balancetes /></ProtectedRoute>} />
            <Route path="/anamneses" element={<ProtectedRoute requiredPermission="menu.anamneses.view"><Anamneses /></ProtectedRoute>} />
            <Route path="/contratos" element={<ProtectedRoute requiredPermission="menu.contratos.view"><Contratos /></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute requiredPermission="menu.relatorios.view"><Relatorios /></ProtectedRoute>} />
            <Route path="/relatorios-avancados" element={<ProtectedRoute requiredPermission="menu.relatorios-avancados.view"><RelatoriosAvancados /></ProtectedRoute>} />
            <Route path="/relatorios/:id" element={<ProtectedRoute><RelatorioDetalhes /></ProtectedRoute>} />
            <Route path="/documentos-assinados" element={<ProtectedRoute requiredPermission="menu.docs-assinados.view"><DocumentosAssinados /></ProtectedRoute>} />
            <Route path="/financeiro" element={<ProtectedRoute requiredPermission="menu.financeiro.view"><Financeiro /></ProtectedRoute>} />
            <Route path="/folha-pagamento" element={<ProtectedRoute requiredPermission="menu.folha-pagamento.view"><FolhaPagamento /></ProtectedRoute>} />
            <Route path="/agenda" element={<ProtectedRoute requiredPermission="menu.agenda.view"><Agenda /></ProtectedRoute>} />
            <Route path="/planos-saude" element={<ProtectedRoute requiredPermission="menu.planos-saude.view"><PlanosSaude /></ProtectedRoute>} />
            <Route path="/acoes-judiciais" element={<ProtectedRoute requiredPermission="menu.acoes-judiciais.view"><AcoesJudiciais /></ProtectedRoute>} />
            <Route path="/acoes-judiciais/:id" element={<ProtectedRoute requiredPermission="menu.acoes-judiciais.view"><AcaoJudicialDetalhe /></ProtectedRoute>} />
            <Route path="/auditoria-notas" element={<ProtectedRoute requiredPermission="menu.auditoria-notas.view"><AuditoriaNotas /></ProtectedRoute>} />
            <Route path="/relatorios-conciliacao" element={<ProtectedRoute requiredPermission="menu.relatorios-conciliacao.view"><RelatoriosConciliacao /></ProtectedRoute>} />
            <Route path="/unidades" element={<ProtectedRoute requiredPermission="menu.unidades.view"><Unidades /></ProtectedRoute>} />
            {/* Placeholder routes for other modules */}
            <Route path="/faturas" element={<ProtectedRoute><Faturas /></ProtectedRoute>} />
            <Route path="/documentos" element={<ProtectedRoute requiredPermission="menu.documentos.view"><Documentos /></ProtectedRoute>} />
            <Route path="/configuracoes" element={<Navigate to="/configuracoes/usuarios" replace />} />
            <Route path="/configuracoes/usuarios" element={<ProtectedRoute requiredPermission="menu.configuracoes.usuarios.view"><Configuracoes /></ProtectedRoute>} />
            <Route path="/configuracoes/controles-acesso" element={<ProtectedRoute requiredPermission="menu.configuracoes.acessos.view"><ControlesAcesso /></ProtectedRoute>} />
            <Route path="/configuracoes/chave-digital" element={<ProtectedRoute requiredPermission="menu.configuracoes.chave-digital.view"><ChaveDigital /></ProtectedRoute>} />
            <Route path="/conta/perfil" element={<ProtectedRoute><ContaPerfil /></ProtectedRoute>} />
            <Route path="/conta/senha" element={<ProtectedRoute><ContaSenha /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </ErrorBoundary>
          </UnidadeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
