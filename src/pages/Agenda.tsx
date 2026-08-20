import { useState, useMemo, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ClinicalScopeBanner } from '@/components/common/ClinicalScopeBanner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { featureFlags } from '@/lib/featureFlags';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ChevronLeft, ChevronRight, AlertTriangle, Clock, User } from 'lucide-react';
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useUnidadeAtiva } from '@/contexts/UnidadeContext';
import { UNIDADE_PADRAO_ID } from '@/hooks/useUnidades';
import { useConsultas } from '@/hooks/useConsultas';
import { useProfissionais } from '@/hooks/useProfissionais';
import { useSalas } from '@/hooks/useSalas';
import {
  type AgendaEvento,
  consultaToAgendaEvento,
  eventoNoDia,
  eventoNoMes,
  horariosSobrepostos,
  ordenarPorHorario,
  reservaToAgendaEvento,
} from '@/lib/mappers/agendaMapper';

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    agendada: 'Agendada',
    confirmada: 'Confirmada',
    cancelada: 'Cancelada',
    concluida: 'Concluída',
    reservada: 'Reservada',
  };
  return map[status] ?? status;
}

function EventoDiaCard({ evento }: { evento: AgendaEvento }) {
  return (
    <div
      className={`p-2 rounded border-l-2 text-xs ${
        evento.tipo === 'consulta'
          ? 'bg-primary/10 border-primary'
          : 'bg-secondary/50 border-secondary'
      }`}
    >
      <div className="flex items-center gap-1 font-medium text-navy">
        <Clock className="h-3 w-3 shrink-0" />
        {evento.horarioInicio} – {evento.horarioFim}
      </div>
      <div className="font-medium truncate mt-1">{evento.titulo}</div>
      <div className="flex items-center gap-1 text-muted-foreground mt-1 truncate">
        <User className="h-3 w-3 shrink-0" />
        {evento.profissional}
      </div>
      {evento.subtitulo && (
        <div className="text-muted-foreground truncate mt-0.5">{evento.subtitulo}</div>
      )}
      <Badge variant="outline" className="mt-1 text-[10px] h-5">
        {evento.tipo === 'consulta' ? 'Consulta' : 'Reserva'} · {statusLabel(evento.status)}
      </Badge>
    </div>
  );
}

export default function Agenda() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [selectedProfissional, setSelectedProfissional] = useState<string>('all');
  const [selectedSala, setSelectedSala] = useState<string>('all');
  const { unidades, unidadeAtivaId, unidadeAtiva } = useUnidadeAtiva();
  const [selectedUnidade, setSelectedUnidade] = useState<string>(unidadeAtivaId);

  const { list: listProfissionais } = useProfissionais();
  const { salas: salasList, reservas: reservasList } = useSalas();
  const { consultas: consultasList, isLoading, consultasApiUnavailable } = useConsultas();

  const profissionais = useMemo(
    () =>
      listProfissionais().map((p) => ({
        id: p.id,
        nome: p.nome,
      })),
    [listProfissionais],
  );

  const salasMeta = useMemo(
    () =>
      salasList.map((s) => ({
        id: s.id,
        nome: s.nome_sala,
        unidadeId: s.unidadeId ?? s.unidade ?? UNIDADE_PADRAO_ID,
      })),
    [salasList],
  );

  useEffect(() => {
    setSelectedUnidade(unidadeAtivaId);
  }, [unidadeAtivaId]);

  const eventosCompletos = useMemo(() => {
    const eventos: AgendaEvento[] = [];
    const unidadeFiltro = selectedUnidade || unidadeAtivaId;

    consultasList.forEach((c) => {
      const unidadeId = c.unidadeId ?? UNIDADE_PADRAO_ID;
      if (unidadeId !== unidadeFiltro) return;
      if (selectedProfissional !== 'all' && c.profissionalId !== selectedProfissional) return;
      eventos.push(consultaToAgendaEvento(c));
    });

    reservasList.forEach((r) => {
      if (selectedSala !== 'all' && r.sala_id !== selectedSala) return;
      if (selectedProfissional !== 'all' && r.profissional_id !== selectedProfissional) return;

      const sala = salasMeta.find((s) => s.id === r.sala_id);
      const unidadeId = sala?.unidadeId ?? UNIDADE_PADRAO_ID;
      if (unidadeId !== unidadeFiltro) return;

      eventos.push(
        reservaToAgendaEvento(r, sala?.nome ?? 'Sala', unidadeId),
      );
    });

    return eventos;
  }, [
    consultasList,
    reservasList,
    salasMeta,
    selectedProfissional,
    selectedSala,
    selectedUnidade,
    unidadeAtivaId,
  ]);

  const conflitos = useMemo(() => {
    const conflitosDetectados: {
      eventos: [AgendaEvento, AgendaEvento];
      tipo: 'profissional' | 'profissional_cross_unidade' | 'sala';
      occursAt: Date;
      unidades: [string, string];
    }[] = [];

    for (let i = 0; i < eventosCompletos.length; i++) {
      for (let j = i + 1; j < eventosCompletos.length; j++) {
        const evento1 = eventosCompletos[i];
        const evento2 = eventosCompletos[j];

        if (!horariosSobrepostos(evento1, evento2)) continue;

        const mesmoProfissional =
          !!evento1.profissionalId &&
          evento1.profissionalId === evento2.profissionalId;
        const mesmaSala =
          !!evento1.salaId && evento1.salaId === evento2.salaId;
        const mesmaUnidade = evento1.unidadeId === evento2.unidadeId;

        const conflitoSala = mesmaSala && mesmaUnidade;
        const conflitoProfissional = mesmoProfissional;

        if (!conflitoSala && !conflitoProfissional) continue;

        const tipo = conflitoProfissional
          ? mesmaUnidade
            ? 'profissional'
            : 'profissional_cross_unidade'
          : 'sala';

        conflitosDetectados.push({
          eventos: [evento1, evento2],
          tipo,
          occursAt: evento1.occursAt,
          unidades: [evento1.unidadeId, evento2.unidadeId],
        });
      }
    }

    return conflitosDetectados;
  }, [eventosCompletos]);

  const handlePrevious = () => {
    if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, -1));
    } else if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (viewMode === 'year') {
      setCurrentDate(new Date(currentDate.getFullYear() - 1, 0, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === 'year') {
      setCurrentDate(new Date(currentDate.getFullYear() + 1, 0, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const renderLoading = () => (
    <p className="text-sm text-muted-foreground py-8 text-center">Carregando agendamentos…</p>
  );

  const renderDayView = () => {
    const eventos = ordenarPorHorario(
      eventosCompletos.filter((e) => eventoNoDia(e, currentDate)),
    );

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          {format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </h3>
        {eventos.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum agendamento para este dia</p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {eventos.map((evento) => (
              <Card key={evento.id} className="p-4">
                <EventoDiaCard evento={evento} />
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { locale: ptBR });
    const weekEnd = endOfWeek(currentDate, { locale: ptBR });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Semana de {format(weekStart, 'dd/MM')} a {format(weekEnd, 'dd/MM/yyyy')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
          {days.map((day) => {
            const dayEventos = ordenarPorHorario(
              eventosCompletos.filter((e) => eventoNoDia(e, day)),
            );
            const isToday = isSameDay(day, new Date());

            return (
              <Card
                key={day.toISOString()}
                className={`min-h-[200px] flex flex-col ${
                  isToday ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <CardHeader className="pb-2">
                  <CardTitle
                    className={`text-sm font-medium text-center ${
                      isToday ? 'text-primary' : ''
                    }`}
                  >
                    {format(day, 'EEE dd/MM', { locale: ptBR })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-2 max-h-[320px] overflow-y-auto pt-0">
                  {dayEventos.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Nenhum agendamento
                    </p>
                  ) : (
                    dayEventos.map((evento) => (
                      <EventoDiaCard key={evento.id} evento={evento} />
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { locale: ptBR });
    const endDate = endOfWeek(monthEnd, { locale: ptBR });
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => (
            <div key={dia} className="text-center font-semibold text-sm p-2">
              {dia}
            </div>
          ))}
          {days.map((day) => {
            const eventos = ordenarPorHorario(
              eventosCompletos.filter((e) => eventoNoDia(e, day)),
            );
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();

            return (
              <div
                key={day.toISOString()}
                className={`border rounded-lg p-2 min-h-[100px] ${
                  isToday ? 'bg-primary/5 border-primary' : 'bg-card'
                } ${!isCurrentMonth ? 'opacity-50' : ''}`}
              >
                <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-primary' : ''}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {eventos.slice(0, 2).map((evento) => (
                    <div
                      key={evento.id}
                      className={`text-xs p-1 rounded truncate ${
                        evento.tipo === 'consulta' ? 'bg-primary/10' : 'bg-secondary/50'
                      }`}
                    >
                      {evento.horarioInicio} {evento.titulo}
                    </div>
                  ))}
                  {eventos.length > 2 && (
                    <div className="text-xs text-muted-foreground">+{eventos.length - 2}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderYearView = () => {
    const months = Array.from({ length: 12 }, (_, i) => new Date(currentDate.getFullYear(), i, 1));

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-center">{currentDate.getFullYear()}</h3>
        <div className="grid grid-cols-3 gap-4">
          {months.map((month) => {
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);
            const eventos = eventosCompletos.filter((e) =>
              eventoNoMes(e, monthStart, monthEnd),
            );

            return (
              <Card
                key={month.toISOString()}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setCurrentDate(month);
                  setViewMode('month');
                }}
              >
                <h4 className="font-semibold mb-2 text-center">
                  {format(month, 'MMMM', { locale: ptBR })}
                </h4>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{eventos.length}</div>
                  <div className="text-xs text-muted-foreground">agendamentos</div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const tituloAgenda = `Agenda — ${
    unidades.find((u) => u.id === selectedUnidade)?.nome ?? unidadeAtiva?.nome ?? ''
  }`.trim();

  const calendarContent = () => {
    if (isLoading) return renderLoading();
    if (viewMode === 'day') return renderDayView();
    if (viewMode === 'week') return renderWeekView();
    if (viewMode === 'month') return renderMonthView();
    return renderYearView();
  };

  return (
    <MainLayout title={tituloAgenda}>
      <div className="space-y-6">
        <ClinicalScopeBanner />
        {featureFlags.consultasApiEnabled && consultasApiUnavailable && (
          <Alert variant="destructive">
            <AlertTitle>Agendamentos indisponíveis para esta unidade</AlertTitle>
            <AlertDescription>
              Não foi possível carregar consultas da API para a unidade selecionada. Verifique o
              cadastro da unidade ou troque a unidade ativa no menu superior. Os agendamentos só
              aparecem na agenda quando a unidade está corretamente vinculada ao backend.
            </AlertDescription>
          </Alert>
        )}
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <Select value={selectedUnidade} onValueChange={setSelectedUnidade}>
                <SelectTrigger className="w-[200px]" aria-label="Unidade">
                  <SelectValue placeholder="Unidade" />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedProfissional} onValueChange={setSelectedProfissional}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todos os profissionais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os profissionais</SelectItem>
                  {profissionais.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSala} onValueChange={setSelectedSala}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todas as salas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as salas</SelectItem>
                  {salasMeta.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Select value={viewMode} onValueChange={(v: 'day' | 'week' | 'month' | 'year') => setViewMode(v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Dia</SelectItem>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="month">Mês</SelectItem>
                  <SelectItem value="year">Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {conflitos.length > 0 && (
          <Card className="p-4 bg-destructive/10 border-destructive/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-destructive mb-2">
                  {conflitos.length} conflito(s) detectado(s)
                </h4>
                <div className="space-y-2 text-sm">
                  {conflitos.slice(0, 3).map((conflito, idx) => {
                    const nomeUnidade = (id?: string) =>
                      unidades.find((u) => u.id === id)?.nome ?? '—';
                    const labelTipo =
                      conflito.tipo === 'profissional'
                        ? 'Mesmo profissional'
                        : conflito.tipo === 'profissional_cross_unidade'
                          ? `Mesmo profissional em unidades diferentes (${nomeUnidade(conflito.unidades[0])} × ${nomeUnidade(conflito.unidades[1])})`
                          : 'Mesma sala';
                    return (
                      <div key={idx} className="text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {format(conflito.occursAt, 'dd/MM/yyyy')} — {labelTipo} em horários
                        sobrepostos
                      </div>
                    );
                  })}
                  {conflitos.length > 3 && (
                    <div className="text-destructive font-medium">
                      +{conflitos.length - 3} conflitos adicionais
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Total de agendamentos</div>
            <div className="text-3xl font-bold text-primary">{eventosCompletos.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Consultas</div>
            <div className="text-3xl font-bold">
              {eventosCompletos.filter((e) => e.tipo === 'consulta').length}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Reservas de sala</div>
            <div className="text-3xl font-bold">
              {eventosCompletos.filter((e) => e.tipo === 'reserva').length}
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" size="icon" onClick={handlePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleToday}>
              Hoje
            </Button>
            <Button variant="outline" size="icon" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {calendarContent()}
        </Card>
      </div>
    </MainLayout>
  );
}
