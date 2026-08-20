import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useConsultas, type Consulta } from '@/hooks/useConsultas';
import { useAnamneses } from '@/hooks/useAnamneses';
import { useProfissionalPainel } from '@/hooks/useProfissionalPainel';
import { usePainelEscopo } from '@/hooks/usePainelEscopo';
import { useUnidadeAtiva } from '@/contexts/UnidadeContext';
import { ProfissionalUnidadeToolbar } from '@/components/profissionais/ProfissionalUnidadeToolbar';
import { filterConsultasProfissional } from '@/lib/consultas/filterConsultasProfissional';
import { StatusAtendimentoBadge } from '@/components/atendimentos/StatusAtendimentoBadge';
import { format, isSameDay, isAfter, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  ClipboardList,
  FileQuestion,
  PlayCircle,
  Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConsultaIndicadores {
  temAnamnese: boolean;
  temProntuario: boolean;
  semaforo: 'vermelho' | 'amarelo' | 'verde' | 'cinza';
}

const indicadores = (
  c: Consulta,
  anamneseEncounterIds: Set<string>,
): ConsultaIndicadores => {
  const temProntuario = !!c.prontuario_evolucao_id;
  const temAnamnese = anamneseEncounterIds.has(c.id);

  let semaforo: ConsultaIndicadores['semaforo'] = 'cinza';
  if (c.status_atendimento === 'aprovado') semaforo = 'verde';
  else if (c.status_atendimento === 'aguardando_prontuario') semaforo = 'vermelho';
  else if (c.status_atendimento === 'pronto_para_aprovacao') semaforo = 'amarelo';
  else if (c.status === 'concluida' && !temProntuario) semaforo = 'vermelho';
  else if (c.status === 'confirmada') semaforo = 'amarelo';

  return { temAnamnese, temProntuario, semaforo };
};

const Semaforo = ({ valor }: { valor: ConsultaIndicadores['semaforo'] }) => {
  const map = {
    vermelho: 'bg-destructive',
    amarelo: 'bg-warning',
    verde: 'bg-success',
    cinza: 'bg-muted',
  } as const;
  return <span className={cn('inline-block h-2.5 w-2.5 rounded-full', map[valor])} />;
};

const ItemAgenda = ({
  consulta,
  ind,
  onIniciar,
  onProntuario,
  onAnamnese,
}: {
  consulta: Consulta;
  ind: ConsultaIndicadores;
  onIniciar: () => void;
  onProntuario: () => void;
  onAnamnese: () => void;
}) => (
  <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex flex-1 items-start gap-3">
      <Semaforo valor={ind.semaforo} />
      <div className="flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">
            {format(new Date(consulta.dataHora), "dd/MM 'às' HH:mm", { locale: ptBR })}
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="font-medium">{consulta.pacienteNome}</span>
        </div>
        <p className="text-sm text-muted-foreground">{consulta.motivo}</p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <StatusAtendimentoBadge status={consulta.status_atendimento} />
          <Badge
            variant="outline"
            className={cn('gap-1', ind.temAnamnese ? 'text-success' : 'text-muted-foreground')}
          >
            {ind.temAnamnese ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
            Anamnese
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              'gap-1',
              ind.temProntuario ? 'text-success' : 'text-muted-foreground',
            )}
          >
            {ind.temProntuario ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <Circle className="h-3 w-3" />
            )}
            Prontuário
          </Badge>
        </div>
      </div>
    </div>
    <div className="flex flex-wrap gap-2">
      {consulta.status === 'agendada' || consulta.status === 'confirmada' ? (
        <Button size="sm" onClick={onIniciar}>
          <PlayCircle className="mr-1 h-4 w-4" />
          Iniciar
        </Button>
      ) : null}
      <Button size="sm" variant="outline" onClick={onProntuario}>
        <ClipboardList className="mr-1 h-4 w-4" />
        Prontuário
      </Button>
      <Button size="sm" variant="ghost" onClick={onAnamnese}>
        <FileQuestion className="mr-1 h-4 w-4" />
        Anamnese
      </Button>
    </div>
  </div>
);

const Secao = ({
  titulo,
  consultas,
  indicadoresFn,
  emptyMsg,
  onIniciar,
  onProntuario,
  onAnamnese,
  destaque,
}: {
  titulo: string;
  consultas: Consulta[];
  indicadoresFn: (c: Consulta) => ConsultaIndicadores;
  emptyMsg: string;
  onIniciar: (c: Consulta) => void;
  onProntuario: (c: Consulta) => void;
  onAnamnese: (c: Consulta) => void;
  destaque?: boolean;
}) => (
  <Card className={cn(destaque && 'border-primary')}>
    <CardHeader>
      <CardTitle className={cn('flex items-center gap-2', destaque && 'text-primary')}>
        {titulo}
        <Badge variant="secondary">{consultas.length}</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent>
      {consultas.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">{emptyMsg}</p>
      ) : (
        <div className="space-y-3">
          {consultas.map((c) => (
            <ItemAgenda
              key={c.id}
              consulta={c}
              ind={indicadoresFn(c)}
              onIniciar={() => onIniciar(c)}
              onProntuario={() => onProntuario(c)}
              onAnamnese={() => onAnamnese(c)}
            />
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

const MinhaAgenda = () => {
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
  const { consultas, confirmarPresenca } = useConsultas();
  const { respostas } = useAnamneses();

  const anamneseEncounterIds = useMemo(
    () => new Set(respostas.map((r) => r.encounter_id ?? '').filter(Boolean)),
    [respostas],
  );

  const minhasConsultas = useMemo(() => {
    const filtradas = filterConsultasProfissional(consultas, profissionalId, escopoUnidade);
    return filtradas.sort(
      (a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime(),
    );
  }, [consultas, profissionalId, escopoUnidade]);

  const { hoje, futuros, passados } = useMemo(() => {
    const today = startOfDay(new Date());
    const hoje: Consulta[] = [];
    const futuros: Consulta[] = [];
    const passados: Consulta[] = [];
    for (const c of minhasConsultas) {
      const d = new Date(c.dataHora);
      if (isSameDay(d, today)) hoje.push(c);
      else if (isAfter(d, today)) futuros.push(c);
      else if (isBefore(d, today)) passados.push(c);
    }
    return { hoje, futuros, passados: passados.reverse() };
  }, [minhasConsultas]);

  const indicadoresFn = (c: Consulta) => indicadores(c, anamneseEncounterIds);

  const onIniciar = (c: Consulta) => {
    if (c.status === 'agendada') confirmarPresenca(c.id);
    navigate(`/prontuario/${c.id}`);
  };
  const onProntuario = (c: Consulta) => navigate(`/prontuario/${c.id}`);
  const onAnamnese = (c: Consulta) =>
    navigate(`/anamneses?paciente=${c.pacienteId}&consulta=${c.id}`);

  const layoutTitle = escopoUnidade
    ? `Minha Agenda — ${unidades.find((u) => u.id === escopoUnidade)?.nome ?? unidadeAtiva?.nome ?? ''}`.trim()
    : podeSelecionarProfissional
      ? 'Minha Agenda — Todas as unidades'
      : 'Minha Agenda';

  return (
    <MainLayout title={layoutTitle}>
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

        {podeSelecionarProfissional ? (
          <ProfissionalUnidadeToolbar
            podeSelecionarProfissional
            profissionalId={profissionalId}
            profissionaisOpcoes={profissionaisOpcoes}
            selecionarProfissional={selecionarProfissional}
            isLoadingProfissionais={isLoadingProfissionais}
            unidadeFiltro={unidadeFiltro}
            setUnidadeFiltro={setUnidadeFiltro}
            unidades={unidades}
            podeVerTodas={podeVerTodas}
            heading={
              profissional ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Stethoscope className="h-4 w-4" />
                  <span>
                    Visualizando agenda de{' '}
                    <strong className="text-foreground">{profissional.nome}</strong>
                  </span>
                </div>
              ) : null
            }
            actions={
              <Button
                variant="outline"
                onClick={() => navigate(`/meu-painel${buildPainelQuery(profissionalId)}`)}
              >
                Ir para Meu Painel
              </Button>
            }
          />
        ) : (
          profissional && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Stethoscope className="h-4 w-4" />
                <span>
                  Visualizando agenda de{' '}
                  <strong className="text-foreground">{profissional.nome}</strong>
                </span>
              </div>
              <Button variant="outline" onClick={() => navigate('/meu-painel')}>
                Ir para Meu Painel
              </Button>
            </div>
          )
        )}

        <Secao
          titulo="Hoje"
          destaque
          consultas={hoje}
          indicadoresFn={indicadoresFn}
          emptyMsg="Sem atendimentos hoje."
          onIniciar={onIniciar}
          onProntuario={onProntuario}
          onAnamnese={onAnamnese}
        />
        <Secao
          titulo="Próximos dias"
          consultas={futuros}
          indicadoresFn={indicadoresFn}
          emptyMsg="Nenhum atendimento futuro agendado."
          onIniciar={onIniciar}
          onProntuario={onProntuario}
          onAnamnese={onAnamnese}
        />
        <Secao
          titulo="Passados"
          consultas={passados}
          indicadoresFn={indicadoresFn}
          emptyMsg="Sem atendimentos passados."
          onIniciar={onIniciar}
          onProntuario={onProntuario}
          onAnamnese={onAnamnese}
        />
      </div>
    </MainLayout>
  );
};

export default MinhaAgenda;
