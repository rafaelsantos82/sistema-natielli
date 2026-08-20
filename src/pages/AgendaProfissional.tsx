import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Edit, Trash2, Clock, Coffee, Umbrella, AlertCircle, Download, CalendarIcon, Repeat } from 'lucide-react';
import { format, isSameDay, addHours, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { generateICS, downloadICS } from '@/lib/utils/icsGenerator';
import { ConflictChecker } from '@/components/agenda/ConflictChecker';
import type { AgendaException } from '@/hooks/useAgendaConflicts';
import { useProfissionalElegibilidade } from '@/hooks/useProfissionalElegibilidade';
import { useProfissionais } from '@/hooks/useProfissionais';
import { buildProfissionalSchedule } from '@/lib/agenda/profissionalSchedule';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const ElegibilidadeBanner = ({ profissionalId }: { profissionalId: string }) => {
  const { verificar } = useProfissionalElegibilidade();
  if (!profissionalId) return null;
  const eleg = verificar(profissionalId);
  if (eleg.elegivel) return null;
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Agenda bloqueada para novos atendimentos</AlertTitle>
      <AlertDescription>
        {eleg.motivos.join(' ')} Resolva as pendências no cadastro do profissional para
        liberar agendamentos.
      </AlertDescription>
    </Alert>
  );
};

const AgendaProfissional = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { getById } = useProfissionais();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingException, setEditingException] = useState<AgendaException | null>(null);
  const [exceptions, setExceptions] = useState<AgendaException[]>(() => {
    const stored = localStorage.getItem(`agenda_exceptions_${id}`);
    return stored ? JSON.parse(stored, (key, value) => {
      if (key === 'date') return new Date(value);
      return value;
    }) : [];
  });

  const [exceptionForm, setExceptionForm] = useState({
    type: 'exception' as 'ferias' | 'almoco' | 'exception',
    startTime: '12:00',
    endTime: '13:00',
    description: '',
    recurrence: {
      enabled: false,
      type: 'none' as 'none' | 'weekly' | 'monthly_date' | 'monthly_first_weekday',
      interval: 1,
      endDate: undefined as Date | undefined,
    },
  });

  const profissionalSchedule = useMemo(
    () => buildProfissionalSchedule(id ? getById(id) : null),
    [id, getById],
  );

  const saveExceptions = (newExceptions: AgendaException[]) => {
    localStorage.setItem(`agenda_exceptions_${id}`, JSON.stringify(newExceptions));
    setExceptions(newExceptions);
  };

  const handleAddException = () => {
    if (!selectedDate) {
      toast({
        title: 'Selecione uma data',
        description: 'Por favor, selecione uma data no calendário',
        variant: 'destructive',
      });
      return;
    }

    if (editingException) {
      const updated = exceptions.map(e => 
        e.id === editingException.id 
          ? { 
              ...e, 
              type: exceptionForm.type,
              startTime: exceptionForm.type === 'ferias' ? undefined : exceptionForm.startTime,
              endTime: exceptionForm.type === 'ferias' ? undefined : exceptionForm.endTime,
              description: exceptionForm.description,
              recurrence: exceptionForm.recurrence.enabled ? {
                type: exceptionForm.recurrence.type,
                interval: exceptionForm.recurrence.interval,
                endDate: exceptionForm.recurrence.endDate,
              } : undefined,
            }
          : e
      );
      saveExceptions(updated);
      toast({
        title: 'Exceção atualizada',
        description: 'A exceção foi atualizada com sucesso',
      });
    } else {
      const newException: AgendaException = {
        id: Date.now().toString(),
        date: selectedDate,
        type: exceptionForm.type,
        startTime: exceptionForm.type === 'ferias' ? undefined : exceptionForm.startTime,
        endTime: exceptionForm.type === 'ferias' ? undefined : exceptionForm.endTime,
        description: exceptionForm.description,
        recurrence: exceptionForm.recurrence.enabled ? {
          type: exceptionForm.recurrence.type,
          interval: exceptionForm.recurrence.interval,
          endDate: exceptionForm.recurrence.endDate,
        } : undefined,
      };
      saveExceptions([...exceptions, newException]);
      toast({
        title: 'Exceção adicionada',
        description: 'A exceção foi adicionada com sucesso',
      });
    }

    setIsModalOpen(false);
    setEditingException(null);
    setExceptionForm({
      type: 'exception',
      startTime: '12:00',
      endTime: '13:00',
      description: '',
      recurrence: {
        enabled: false,
        type: 'none',
        interval: 1,
        endDate: undefined,
      },
    });
  };

  const handleEditException = (exception: AgendaException) => {
    setEditingException(exception);
    setExceptionForm({
      type: exception.type,
      startTime: exception.startTime || '12:00',
      endTime: exception.endTime || '13:00',
      description: exception.description,
      recurrence: {
        enabled: !!exception.recurrence,
        type: exception.recurrence?.type || 'none',
        interval: exception.recurrence?.interval || 1,
        endDate: exception.recurrence?.endDate,
      },
    });
    setSelectedDate(exception.date);
    setIsModalOpen(true);
  };

  const handleDeleteException = (exceptionId: string) => {
    const updated = exceptions.filter(e => e.id !== exceptionId);
    saveExceptions(updated);
    toast({
      title: 'Exceção removida',
      description: 'A exceção foi removida com sucesso',
    });
  };

  const getExceptionIcon = (type: string) => {
    switch (type) {
      case 'ferias':
        return <Umbrella className="h-4 w-4" />;
      case 'almoco':
        return <Coffee className="h-4 w-4" />;
      case 'exception':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getExceptionBadgeClass = (type: string) => {
    switch (type) {
      case 'ferias':
        return 'bg-primary text-primary-foreground';
      case 'almoco':
        return 'bg-warning text-warning-foreground';
      case 'exception':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted';
    }
  };

  const getExceptionLabel = (type: string) => {
    switch (type) {
      case 'ferias':
        return 'Férias';
      case 'almoco':
        return 'Almoço';
      case 'exception':
        return 'Exceção';
      default:
        return 'Outro';
    }
  };

  const handleExportICS = () => {
    const icsEvents = exceptions.map(exception => {
      const [startHour, startMinute] = (exception.startTime || '09:00').split(':').map(Number);
      const [endHour, endMinute] = (exception.endTime || '10:00').split(':').map(Number);
      
      const startDate = setMinutes(setHours(new Date(exception.date), startHour), startMinute);
      const endDate = setMinutes(setHours(new Date(exception.date), endHour), endMinute);

      return {
        id: exception.id,
        summary: `${getExceptionLabel(exception.type)} - ${exception.description}`,
        description: exception.description,
        startDate,
        endDate,
        allDay: exception.type === 'ferias',
      };
    });

    const icsContent = generateICS(icsEvents, 'Profissional');
    downloadICS(icsContent, `agenda-profissional-${format(new Date(), 'yyyy-MM-dd')}.ics`);

    toast({
      title: 'Agenda exportada',
      description: 'O arquivo ICS foi baixado com sucesso',
    });
  };

  const selectedDateExceptions = selectedDate 
    ? exceptions.filter(e => isSameDay(e.date, selectedDate))
    : [];

  const modifiers = {
    ferias: exceptions
      .filter(e => e.type === 'ferias')
      .map(e => e.date),
    almoco: exceptions
      .filter(e => e.type === 'almoco')
      .map(e => e.date),
    exception: exceptions
      .filter(e => e.type === 'exception')
      .map(e => e.date),
  };

  const modifiersStyles = {
    ferias: { 
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
    },
    almoco: { 
      backgroundColor: 'hsl(var(--warning))',
      color: 'hsl(var(--warning-foreground))',
    },
    exception: { 
      backgroundColor: 'hsl(var(--destructive))',
      color: 'hsl(var(--destructive-foreground))',
    },
  };

  return (
    <MainLayout title="Configuração de Agenda">
      <div className="space-y-6">
        <ElegibilidadeBanner profissionalId={id ?? ''} />
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/profissionais')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportICS}>
              <Download className="h-4 w-4 mr-2" />
              Exportar ICS
            </Button>
            <Badge variant="outline" className="gap-1">
              <Umbrella className="h-3 w-3" />
              Férias
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Coffee className="h-3 w-3" />
              Almoço
            </Badge>
            <Badge variant="outline" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Exceção
            </Badge>
          </div>
        </div>

        {/* Verificador de Conflitos */}
        <ConflictChecker
          exceptions={exceptions}
          profissionalSchedule={profissionalSchedule}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendário */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Calendário de Disponibilidade</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ptBR}
                className={cn("rounded-md border p-3 pointer-events-auto")}
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
              />
              <div className="mt-4 flex justify-center">
                  <Button
                    onClick={() => {
                      setEditingException(null);
                      setExceptionForm({
                        type: 'exception',
                        startTime: '12:00',
                        endTime: '13:00',
                        description: '',
                        recurrence: {
                          enabled: false,
                          type: 'none',
                          interval: 1,
                          endDate: undefined,
                        },
                      });
                      setIsModalOpen(true);
                    }}
                    disabled={!selectedDate}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Exceção
                  </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Exceções */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : 'Exceções'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateExceptions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma exceção para esta data
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedDateExceptions.map((exception) => (
                    <div
                      key={exception.id}
                      className="p-3 border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <Badge className={cn("gap-1", getExceptionBadgeClass(exception.type))}>
                          {getExceptionIcon(exception.type)}
                          {getExceptionLabel(exception.type)}
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditException(exception)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteException(exception.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {exception.startTime && exception.endTime && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {exception.startTime} - {exception.endTime}
                        </div>
                      )}
                      {exception.description && (
                        <p className="text-sm text-muted-foreground">
                          {exception.description}
                        </p>
                      )}
                      {exception.recurrence && exception.recurrence.type !== 'none' && (
                        <Badge variant="secondary" className="gap-1 mt-1">
                          <Repeat className="h-3 w-3" />
                          Recorrente
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Todas as Exceções */}
        <Card>
          <CardHeader>
            <CardTitle>Todas as Exceções Cadastradas</CardTitle>
          </CardHeader>
          <CardContent>
            {exceptions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma exceção cadastrada
              </p>
            ) : (
              <div className="space-y-2">
                {exceptions
                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                  .map((exception) => (
                    <div
                      key={exception.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Badge className={cn("gap-1", getExceptionBadgeClass(exception.type))}>
                          {getExceptionIcon(exception.type)}
                          {getExceptionLabel(exception.type)}
                        </Badge>
                        <div>
                          <p className="font-medium">
                            {format(exception.date, "dd/MM/yyyy")}
                          </p>
                          {exception.startTime && exception.endTime && (
                            <p className="text-sm text-muted-foreground">
                              {exception.startTime} - {exception.endTime}
                            </p>
                          )}
                          {exception.description && (
                            <p className="text-sm text-muted-foreground">
                              {exception.description}
                            </p>
                          )}
                          {exception.recurrence && exception.recurrence.type !== 'none' && (
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <Repeat className="h-3 w-3" />
                              {exception.recurrence.type === 'weekly' && 'Semanal'}
                              {exception.recurrence.type === 'monthly_date' && 'Mensal (mesmo dia)'}
                              {exception.recurrence.type === 'monthly_first_weekday' && 'Mensal (1º dia útil)'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditException(exception)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteException(exception.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Exceção */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingException ? 'Editar Exceção' : 'Adicionar Exceção'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDate && (
              <div>
                <Label>Data Selecionada</Label>
                <p className="text-sm font-medium mt-1">
                  {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="type">Tipo de Exceção *</Label>
              <Select
                value={exceptionForm.type}
                onValueChange={(value: 'ferias' | 'almoco' | 'exception') =>
                  setExceptionForm({ ...exceptionForm, type: value })
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ferias">Férias (Dia Inteiro)</SelectItem>
                  <SelectItem value="almoco">Almoço Estendido</SelectItem>
                  <SelectItem value="exception">Exceção/Bloqueio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {exceptionForm.type !== 'ferias' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Horário Início *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={exceptionForm.startTime}
                    onChange={(e) =>
                      setExceptionForm({ ...exceptionForm, startTime: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">Horário Fim *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={exceptionForm.endTime}
                    onChange={(e) =>
                      setExceptionForm({ ...exceptionForm, endTime: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o motivo da exceção"
                value={exceptionForm.description}
                onChange={(e) =>
                  setExceptionForm({ ...exceptionForm, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recurrence-enabled"
                  checked={exceptionForm.recurrence.enabled}
                  onCheckedChange={(checked) =>
                    setExceptionForm({
                      ...exceptionForm,
                      recurrence: {
                        ...exceptionForm.recurrence,
                        enabled: !!checked,
                      },
                    })
                  }
                />
                <Label htmlFor="recurrence-enabled" className="flex items-center gap-2 cursor-pointer">
                  <Repeat className="h-4 w-4" />
                  Repetir esta exceção
                </Label>
              </div>

              {exceptionForm.recurrence.enabled && (
                <div className="space-y-3 pl-6 border-l-2">
                  <div>
                    <Label htmlFor="recurrence-type">Tipo de Recorrência</Label>
                    <Select
                      value={exceptionForm.recurrence.type}
                      onValueChange={(value: 'none' | 'weekly' | 'monthly_date' | 'monthly_first_weekday') =>
                        setExceptionForm({
                          ...exceptionForm,
                          recurrence: {
                            ...exceptionForm.recurrence,
                            type: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger id="recurrence-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly_date">Mensal (mesmo dia do mês)</SelectItem>
                        <SelectItem value="monthly_first_weekday">Mensal (primeiro dia útil)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="recurrence-interval">Intervalo</Label>
                    <Input
                      id="recurrence-interval"
                      type="number"
                      min="1"
                      value={exceptionForm.recurrence.interval}
                      onChange={(e) =>
                        setExceptionForm({
                          ...exceptionForm,
                          recurrence: {
                            ...exceptionForm.recurrence,
                            interval: parseInt(e.target.value) || 1,
                          },
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {exceptionForm.recurrence.type === 'weekly'
                        ? `A cada ${exceptionForm.recurrence.interval} semana(s)`
                        : `A cada ${exceptionForm.recurrence.interval} mês/meses`}
                    </p>
                  </div>

                  <div>
                    <Label>Data Final da Recorrência (opcional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !exceptionForm.recurrence.endDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {exceptionForm.recurrence.endDate
                            ? format(exceptionForm.recurrence.endDate, 'PPP', { locale: ptBR })
                            : 'Sem data final'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={exceptionForm.recurrence.endDate}
                          onSelect={(date) =>
                            setExceptionForm({
                              ...exceptionForm,
                              recurrence: {
                                ...exceptionForm.recurrence,
                                endDate: date,
                              },
                            })
                          }
                          locale={ptBR}
                          className={cn('p-3 pointer-events-auto')}
                          disabled={(date) => selectedDate ? date <= selectedDate : false}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddException}>
              {editingException ? 'Atualizar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default AgendaProfissional;
