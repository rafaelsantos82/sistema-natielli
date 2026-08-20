import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAgendaConflicts, AgendaException } from '@/hooks/useAgendaConflicts';
import { CalendarIcon, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ConflictCheckerProps {
  exceptions: AgendaException[];
  profissionalSchedule?: {
    diasAtendimento: string[];
    horarioInicio: string;
    horarioFim: string;
    duracaoConsulta: number;
    missingAttendanceDays?: boolean;
  };
  defaultDate?: Date;
  defaultStartTime?: string;
  defaultEndTime?: string;
}

export const ConflictChecker = ({
  exceptions,
  profissionalSchedule,
  defaultDate,
  defaultStartTime,
  defaultEndTime,
}: ConflictCheckerProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(defaultDate);
  const [startTime, setStartTime] = useState(defaultStartTime ?? '09:00');
  const [endTime, setEndTime] = useState(defaultEndTime ?? '10:00');
  const [showAvailableSlots, setShowAvailableSlots] = useState(false);

  useEffect(() => {
    if (defaultDate) setSelectedDate(defaultDate);
  }, [defaultDate]);

  useEffect(() => {
    if (defaultStartTime) setStartTime(defaultStartTime);
  }, [defaultStartTime]);

  useEffect(() => {
    if (defaultEndTime) setEndTime(defaultEndTime);
  }, [defaultEndTime]);

  const { checkConflict, getAvailableSlots } = useAgendaConflicts(exceptions, profissionalSchedule);

  const conflictResult = selectedDate
    ? checkConflict({ date: selectedDate, startTime, endTime })
    : null;

  const availableSlots = selectedDate && profissionalSchedule
    ? getAvailableSlots(selectedDate, profissionalSchedule.duracaoConsulta)
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Verificador de Disponibilidade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {profissionalSchedule?.missingAttendanceDays && (
          <Alert variant="destructive">
            <AlertDescription>
              Este profissional não tem dias de atendimento cadastrados. Atualize o cadastro em
              Profissionais → Agenda de Atendimento.
            </AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Data da Consulta</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP', { locale: ptBR }) : 'Selecione a data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ptBR}
                  className={cn('p-3 pointer-events-auto')}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Horário</Label>
            <div className="flex gap-2">
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <span className="flex items-center">até</span>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
        </div>

        {selectedDate && conflictResult && !profissionalSchedule?.missingAttendanceDays && (
          <Alert variant={conflictResult.hasConflict ? 'destructive' : 'default'}>
            <div className="flex items-start gap-2">
              {conflictResult.hasConflict ? (
                <AlertCircle className="h-5 w-5 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-5 w-5 mt-0.5 text-success" />
              )}
              <div className="flex-1">
                <AlertDescription>
                  {conflictResult.hasConflict ? (
                    <div className="space-y-2">
                      <p className="font-medium">Conflitos encontrados:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {conflictResult.conflicts.map((conflict, index) => (
                          <li key={index} className="text-sm">
                            {conflict.description}
                            {conflict.time && (
                              <span className="ml-2 text-muted-foreground">
                                ({conflict.time})
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="font-medium text-success">
                      Horário disponível! Não há conflitos neste período.
                    </p>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {selectedDate && (
          <div>
            <Button
              variant="outline"
              onClick={() => setShowAvailableSlots(!showAvailableSlots)}
              className="w-full"
            >
              {showAvailableSlots ? 'Ocultar' : 'Mostrar'} Horários Disponíveis
            </Button>

            {showAvailableSlots && (
              <div className="mt-4 space-y-2">
                {availableSlots.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum horário disponível para esta data
                  </p>
                ) : (
                  <>
                    <p className="text-sm font-medium mb-2">
                      Horários disponíveis ({availableSlots.length}):
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map((slot, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="justify-center cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                          onClick={() => {
                            setStartTime(slot.start);
                            setEndTime(slot.end);
                          }}
                        >
                          {slot.start}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
