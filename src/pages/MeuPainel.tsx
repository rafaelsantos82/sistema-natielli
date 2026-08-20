import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useConsultas, type Consulta } from '@/hooks/useConsultas';
import { useProfissionalPainel } from '@/hooks/useProfissionalPainel';
import { useFaturamentoProfissional } from '@/hooks/useFaturamentoProfissional';
import { useUnidadeAtiva } from '@/contexts/UnidadeContext';
import { usePainelEscopo } from '@/hooks/usePainelEscopo';
import { ProfissionalUnidadeToolbar } from '@/components/profissionais/ProfissionalUnidadeToolbar';
import { filterConsultasProfissional } from '@/lib/consultas/filterConsultasProfissional';
import { format, isSameDay, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertCircle,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Clock,
  DollarSign,
  Info,
  PlayCircle,
  TrendingUp,
} from 'lucide-react';

const formatBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const KpiCard = ({
  titulo,
  valor,
  icone: Icone,
  hint,
  destaque,
}: {
  titulo: string;
  valor: string | number;
  icone: typeof DollarSign;
  hint?: string;
  destaque?: boolean;
}) => (
  <Card className={destaque ? 'border-primary' : ''}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{titulo}</CardTitle>
      <Icone className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{valor}</div>
      {hint && (
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Info className="h-3 w-3" />
          {hint}
        </p>
      )}
    </CardContent>
  </Card>
);

const MeuPainel = () => {
  const navigate = useNavigate();
  const { unidadeAtiva } = useUnidadeAtiva();
  const {
    unidades,
    unidadeFiltro,
    setUnidadeFiltro,
    escopoUnidade,
    podeVerTodas,
    buildPainelQuery,
  } = usePainelEscopo();
  const {
    profissional,
    profissionalId,
    isResolved,
    podeSelecionarProfissional,
    profissionaisOpcoes,
    selecionarProfissional,
    isLoadingProfissionais,
  } = useProfissionalPainel(escopoUnidade);
  const { consultas } = useConsultas();
  const faturamento = useFaturamentoProfissional(profissionalId, escopoUnidade);

  const minhas = useMemo(
    () => filterConsultasProfissional(consultas, profissionalId, escopoUnidade),
    [consultas, profissionalId, escopoUnidade],
  );

  const today = startOfDay(new Date());
  const now = new Date();

  const hojeLista = useMemo(
    () =>
      minhas
        .filter((c) => isSameDay(new Date(c.dataHora), today))
        .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime()),
    [minhas, today],
  );

  const proximoAtendimento = useMemo(
    () => hojeLista.find((c) => new Date(c.dataHora) >= now) ?? null,
    [hojeLista, now],
  );

  const pendentesProntuario = useMemo(
    () => minhas.filter((c) => c.status_atendimento === 'aguardando_prontuario'),
    [minhas],
  );

  const aguardandoFinalizacao = useMemo(
    () =>
      minhas.filter(
        (c) =>
          c.status_atendimento === 'aguardando_prontuario' ||
          c.status_atendimento === 'pronto_para_aprovacao',
      ),
    [minhas],
  );

  const renderListaCompacta = (titulo: string, lista: Consulta[], emptyMsg: string) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>{titulo}</span>
          <Badge variant="secondary">{lista.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {lista.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{emptyMsg}</p>
        ) : (
          <div className="space-y-2">
            {lista.slice(0, 8).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-md border p-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.pacienteNome}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(c.dataHora), "dd/MM HH:mm", { locale: ptBR })} • {c.motivo}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(`/prontuario/${c.id}`)}
                >
                  Abrir
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <MainLayout title={
      escopoUnidade
        ? `Meu Painel — ${unidades.find((u) => u.id === escopoUnidade)?.nome ?? unidadeAtiva?.nome ?? ''}`.trim()
        : 'Meu Painel — Todas as unidades'
    }>
      <TooltipProvider>
        <div className="space-y-4">
          {!isResolved && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Profissional não vinculado</AlertTitle>
              <AlertDescription>
                Não foi possível identificar seu cadastro de profissional. Solicite ao gestor que
                vincule seu e-mail a um profissional ativo.
              </AlertDescription>
            </Alert>
          )}

          <ProfissionalUnidadeToolbar
            podeSelecionarProfissional={podeSelecionarProfissional}
            profissionalId={profissionalId}
            profissionaisOpcoes={profissionaisOpcoes}
            selecionarProfissional={selecionarProfissional}
            isLoadingProfissionais={isLoadingProfissionais}
            unidadeFiltro={unidadeFiltro}
            setUnidadeFiltro={setUnidadeFiltro}
            unidades={unidades}
            podeVerTodas={podeVerTodas}
            heading={
              <>
                <h2 className="text-lg font-semibold">
                  {profissional ? `Olá, ${profissional.nome}` : 'Meu Painel'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Visão rápida de hoje, pendências e faturamento.
                </p>
              </>
            }
            actions={
              <>
                <Button
                  onClick={() =>
                    navigate(`/minha-agenda${buildPainelQuery(profissionalId)}`)
                  }
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Abrir Minha Agenda
                </Button>
                <Button variant="outline" onClick={() => navigate('/prontuarios')}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Prontuários
                </Button>
              </>
            }
          />

          {/* Próximo atendimento — destaque */}
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Clock className="h-5 w-5" />
                Próximo atendimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {proximoAtendimento ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-3xl font-bold">
                      {format(new Date(proximoAtendimento.dataHora), 'HH:mm', { locale: ptBR })}
                    </p>
                    <p className="text-lg font-medium">{proximoAtendimento.pacienteNome}</p>
                    <p className="text-sm text-muted-foreground">{proximoAtendimento.motivo}</p>
                  </div>
                  <Button onClick={() => navigate(`/prontuario/${proximoAtendimento.id}`)}>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Iniciar Atendimento
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sem próximos atendimentos hoje. Aproveite para revisar pendências.
                </p>
              )}
            </CardContent>
          </Card>

          {/* KPIs */}
          <div className="grid gap-3 md:grid-cols-3">
            <KpiCard
              titulo="Atendimentos hoje"
              valor={hojeLista.length}
              icone={CalendarCheck}
              destaque
            />
            <KpiCard
              titulo="Pendentes de prontuário"
              valor={pendentesProntuario.length}
              icone={ClipboardList}
            />
            <KpiCard
              titulo="Aguardando finalização"
              valor={aguardandoFinalizacao.length}
              icone={TrendingUp}
            />
          </div>

          {/* Faturamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-5 w-5" />
                Faturamento
                {!faturamento.temVinculoFinanceiro && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Aguardando integração de baixa financeira para exibir valores detalhados.
                    </TooltipContent>
                  </Tooltip>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">A receber (pendente)</p>
                  <p className="text-xl font-bold">{formatBRL(faturamento.aReceberValor)}</p>
                  <p className="text-xs text-muted-foreground">
                    {faturamento.aReceberCount} atendimentos
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Aprovado</p>
                  <p className="text-xl font-bold">{formatBRL(faturamento.aprovadosValor)}</p>
                  <p className="text-xs text-muted-foreground">
                    {faturamento.aprovadosCount} atendimentos
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Pago</p>
                  <p className="text-xl font-bold">{formatBRL(faturamento.pagoValor)}</p>
                  <p className="text-xs text-muted-foreground">
                    {faturamento.pagoCount} atendimentos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Listas rápidas */}
          <div className="grid gap-4 md:grid-cols-2">
            {renderListaCompacta('Hoje', hojeLista, 'Sem atendimentos hoje.')}
            {renderListaCompacta(
              'Pendentes de prontuário',
              pendentesProntuario,
              'Nenhuma pendência de prontuário. 🎉',
            )}
          </div>
        </div>
      </TooltipProvider>
    </MainLayout>
  );
};

export default MeuPainel;
