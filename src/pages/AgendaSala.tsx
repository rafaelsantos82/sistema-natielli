import { useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormModal } from '@/components/common/FormModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { useSalas, useReservasBySala, Reserva } from '@/hooks/useSalas';
import { formatQueryError } from '@/lib/api/formatApiError';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useProfissionais } from '@/hooks/useProfissionais';
import { ReservaForm } from '@/components/forms/ReservaForm';
import { ReservaFormData } from '@/lib/validations/sala.schema';
import { generateICS, downloadICS } from '@/lib/utils/icsGenerator';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Download,
  Clock,
  User,
  Calendar as CalendarIcon,
  Loader2,
} from 'lucide-react';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  isSameDay,
  parseISO,
  addMinutes,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

type ViewMode = 'semana' | 'mes' | 'ano';

const AgendaSala = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const {
    getSalaById,
    reservas: bundledReservas,
    salasLoading,
    salasFetched,
    addReserva,
    updateReserva,
    deleteReserva,
    checkConflict,
  } = useSalas();
  const sala = getSalaById(id || '');
  const {
    reservas,
    isLoading: reservasLoading,
    isError: reservasError,
    error: reservasQueryError,
    refetch: refetchReservas,
  } = useReservasBySala(id, bundledReservas);

  const [viewMode, setViewMode] = useState<ViewMode>(
    (searchParams.get('view') as ViewMode) || 'semana'
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);

  const { profissionais: profissionaisStorage } = useProfissionais();
  const profissionais = profissionaisStorage
    .filter((p) => p.status === 'ativo')
    .map((p) => ({ id: p.id, nome: p.nome }));

  const handleViewChange = (view: ViewMode) => {
    setViewMode(view);
    setSearchParams({ view });
  };

  const getDateRange = useMemo(() => {
    switch (viewMode) {
      case 'semana':
        return {
          start: startOfWeek(selectedDate, { locale: ptBR }),
          end: endOfWeek(selectedDate, { locale: ptBR }),
        };
      case 'mes':
        return {
          start: startOfMonth(selectedDate),
          end: endOfMonth(selectedDate),
        };
      case 'ano':
        return {
          start: startOfYear(selectedDate),
          end: endOfYear(selectedDate),
        };
    }
  }, [viewMode, selectedDate]);

  const filteredReservas = useMemo(() => {
    return reservas.filter((reserva) => {
      const reservaDate = parseISO(reserva.data_hora_inicio);
      return reservaDate >= getDateRange.start && reservaDate <= getDateRange.end;
    });
  }, [reservas, getDateRange]);

  const handleAddReserva = () => {
    setSelectedReserva(null);
    setIsModalOpen(true);
  };

  const handleEditReserva = (reserva: Reserva) => {
    setSelectedReserva(reserva);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (reserva: Reserva) => {
    setSelectedReserva(reserva);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedReserva && id) {
      await deleteReserva(selectedReserva.id, id);
      toast({
        title: 'Sucesso',
        description: 'Reserva removida com sucesso',
      });
    }
    setIsDeleteDialogOpen(false);
    setSelectedReserva(null);
  };

  const handleFormSubmit = (data: ReservaFormData) => {
    const hasConflict = checkConflict(
      id || '',
      data.data_hora_inicio,
      data.duracao,
      selectedReserva?.id
    );

    if (hasConflict) {
      toast({
        title: 'Conflito de Horário',
        description: 'Já existe uma reserva neste horário',
        variant: 'destructive',
      });
      return;
    }

    if (selectedReserva) {
      updateReserva(selectedReserva.id, data, id);
      toast({
        title: 'Sucesso',
        description: 'Reserva atualizada com sucesso',
      });
    } else {
      addReserva({
        sala_id: data.sala_id,
        data_hora_inicio: data.data_hora_inicio,
        duracao: data.duracao,
        profissional_id: data.profissional_id,
        profissional_nome: data.profissional_nome,
        consulta_id: data.consulta_id,
        tipo_atendimento: data.tipo_atendimento,
        observacoes: data.observacoes,
        rrule: data.rrule,
      });
      toast({
        title: 'Sucesso',
        description: 'Reserva criada com sucesso',
      });
    }
    setIsModalOpen(false);
    setSelectedReserva(null);
  };

  const handleExportICS = () => {
    const icsEvents = filteredReservas.map((reserva) => {
      const startDate = parseISO(reserva.data_hora_inicio);
      const endDate = addMinutes(startDate, reserva.duracao);

      return {
        id: reserva.id,
        summary: `${reserva.tipo_atendimento || 'Reserva'} - ${reserva.profissional_nome}`,
        description: reserva.observacoes || '',
        startDate,
        endDate,
      };
    });

    const icsContent = generateICS(icsEvents, sala?.nome_sala || 'Sala');
    downloadICS(icsContent, `agenda-sala-${format(new Date(), 'yyyy-MM-dd')}.ics`);

    toast({
      title: 'Agenda exportada',
      description: 'O arquivo ICS foi baixado com sucesso',
    });
  };

  const renderWeekView = () => {
    const days = eachDayOfInterval({ start: getDateRange.start, end: getDateRange.end });

    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayReservas = filteredReservas.filter((r) =>
            isSameDay(parseISO(r.data_hora_inicio), day)
          );

          return (
            <Card key={day.toISOString()} className="min-h-[200px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {format(day, 'EEE dd/MM', { locale: ptBR })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dayReservas.map((reserva) => (
                  <div
                    key={reserva.id}
                    className="p-2 bg-primary/10 rounded border-l-2 border-primary text-xs cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => handleEditReserva(reserva)}
                  >
                    <div className="flex items-center gap-1 font-medium text-navy">
                      <Clock className="h-3 w-3" />
                      {format(parseISO(reserva.data_hora_inicio), 'HH:mm')}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground mt-1">
                      <User className="h-3 w-3" />
                      {reserva.profissional_nome}
                    </div>
                    {reserva.tipo_atendimento && (
                      <div className="mt-1 text-muted-foreground">
                        {reserva.tipo_atendimento}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const weeks = eachWeekOfInterval(
      { start: getDateRange.start, end: getDateRange.end },
      { locale: ptBR }
    );

    return (
      <div className="space-y-2">
        {weeks.map((week, weekIdx) => {
          const days = eachDayOfInterval({
            start: startOfWeek(week, { locale: ptBR }),
            end: endOfWeek(week, { locale: ptBR }),
          });

          return (
            <div key={weekIdx} className="grid grid-cols-7 gap-2">
              {days.map((day) => {
                const dayReservas = filteredReservas.filter((r) =>
                  isSameDay(parseISO(r.data_hora_inicio), day)
                );
                const isCurrentMonth = day.getMonth() === selectedDate.getMonth();

                return (
                  <Card
                    key={day.toISOString()}
                    className={cn('min-h-[100px]', !isCurrentMonth && 'opacity-40')}
                  >
                    <CardHeader className="pb-1 pt-2 px-2">
                      <CardTitle className="text-xs">{format(day, 'dd')}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-2 pb-2">
                      {dayReservas.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {dayReservas.length} reserva{dayReservas.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const renderYearView = () => {
    const months = eachMonthOfInterval({ start: getDateRange.start, end: getDateRange.end });

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {months.map((month) => {
          const monthReservas = filteredReservas.filter((r) => {
            const reservaDate = parseISO(r.data_hora_inicio);
            return reservaDate.getMonth() === month.getMonth();
          });

          return (
            <Card key={month.toISOString()}>
              <CardHeader>
                <CardTitle className="text-sm">
                  {format(month, 'MMMM yyyy', { locale: ptBR })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{monthReservas.length}</div>
                  <div className="text-sm text-muted-foreground">
                    reserva{monthReservas.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  if (salasLoading) {
    return (
      <MainLayout title="Agenda da sala">
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (salasFetched && !sala) {
    return (
      <MainLayout title="Sala não encontrada">
        <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
          <p className="text-muted-foreground">Sala não encontrada</p>
          <Button onClick={() => navigate('/salas')}>Voltar para Salas</Button>
        </div>
      </MainLayout>
    );
  }

  if (!sala) {
    return null;
  }

  return (
    <MainLayout title={`Agenda - ${sala.nome_sala}`}>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/salas')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-navy">{sala.nome_sala}</h2>
                <Badge variant={sala.status === 'Ativa' ? 'default' : 'secondary'}>
                  {sala.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{sala.unidade}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={viewMode} onValueChange={(v) => handleViewChange(v as ViewMode)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semana">Semana</SelectItem>
                <SelectItem value="mes">Mês</SelectItem>
                <SelectItem value="ano">Ano</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={handleExportICS}>
              <Download className="h-4 w-4 mr-2" />
              Exportar ICS
            </Button>

            <Button size="sm" onClick={handleAddReserva}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Reserva
            </Button>
          </div>
        </div>

        {reservasError && (
          <Alert variant="destructive">
            <AlertTitle>Não foi possível carregar as reservas</AlertTitle>
            <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>{formatQueryError(reservasQueryError, 'reservas')}</span>
              <Button variant="outline" size="sm" onClick={() => refetchReservas()}>
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    if (viewMode === 'semana') newDate.setDate(newDate.getDate() - 7);
                    else if (viewMode === 'mes') newDate.setMonth(newDate.getMonth() - 1);
                    else newDate.setFullYear(newDate.getFullYear() - 1);
                    setSelectedDate(newDate);
                  }}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Hoje
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    if (viewMode === 'semana') newDate.setDate(newDate.getDate() + 7);
                    else if (viewMode === 'mes') newDate.setMonth(newDate.getMonth() + 1);
                    else newDate.setFullYear(newDate.getFullYear() + 1);
                    setSelectedDate(newDate);
                  }}
                >
                  Próximo
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {reservasLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Carregando reservas...
              </div>
            ) : (
              <>
                {viewMode === 'semana' && renderWeekView()}
                {viewMode === 'mes' && renderMonthView()}
                {viewMode === 'ano' && renderYearView()}
              </>
            )}
          </CardContent>
        </Card>

        <FormModal
          title={selectedReserva ? 'Editar Reserva' : 'Nova Reserva'}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedReserva(null);
          }}
          size="4xl"
        >
          <ReservaForm
            onSubmit={handleFormSubmit}
            defaultValues={selectedReserva || undefined}
            profissionais={profissionais}
            salaId={id}
          />
        </FormModal>

        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          title="Confirmar Exclusão"
          description={`Tem certeza que deseja excluir esta reserva?`}
          onConfirm={confirmDelete}
          onCancel={() => setIsDeleteDialogOpen(false)}
          confirmLabel="Confirmar exclusão"
          variant="destructive"
        />
      </div>
    </MainLayout>
  );
};

export default AgendaSala;
