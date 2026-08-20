import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ReservaFormData, reservaSchema } from '@/lib/validations/sala.schema';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ReservaFormProps {
  onSubmit: (data: ReservaFormData) => void;
  defaultValues?: Partial<ReservaFormData>;
  profissionais: { id: string; nome: string }[];
  salaId?: string;
}

export const ReservaForm = ({ onSubmit, defaultValues, profissionais, salaId }: ReservaFormProps) => {
  const [showRecurrence, setShowRecurrence] = useState(!!defaultValues?.rrule);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    defaultValues?.data_hora_inicio ? new Date(defaultValues.data_hora_inicio) : undefined
  );

  const form = useForm<ReservaFormData>({
    resolver: zodResolver(reservaSchema),
    defaultValues: {
      sala_id: salaId || defaultValues?.sala_id || '',
      data_hora_inicio: defaultValues?.data_hora_inicio || '',
      duracao: defaultValues?.duracao || 60,
      profissional_id: defaultValues?.profissional_id || '',
      profissional_nome: defaultValues?.profissional_nome || '',
      consulta_id: defaultValues?.consulta_id || '',
      tipo_atendimento: defaultValues?.tipo_atendimento || '',
      observacoes: defaultValues?.observacoes || '',
      rrule: defaultValues?.rrule || '',
    },
  });

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      const timeValue = form.getValues('data_hora_inicio').split('T')[1] || '09:00';
      const dateStr = format(date, 'yyyy-MM-dd');
      form.setValue('data_hora_inicio', `${dateStr}T${timeValue}`);
    }
  };

  const handleProfissionalChange = (profissionalId: string) => {
    form.setValue('profissional_id', profissionalId);
    const profissional = profissionais.find((p) => p.id === profissionalId);
    if (profissional) {
      form.setValue('profissional_nome', profissional.nome);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="data_hora_inicio"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !selectedDate && 'text-muted-foreground'
                        )}
                      >
                        {selectedDate ? (
                          format(selectedDate, 'PPP', { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      locale={ptBR}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="data_hora_inicio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário *</FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    value={field.value.split('T')[1] || '09:00'}
                    onChange={(e) => {
                      const dateValue = field.value.split('T')[0] || format(new Date(), 'yyyy-MM-dd');
                      field.onChange(`${dateValue}T${e.target.value}`);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="profissional_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profissional *</FormLabel>
                <Select onValueChange={handleProfissionalChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o profissional" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {profissionais.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duracao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duração (minutos) *</FormLabel>
                <FormControl>
                  <Input type="number" min="15" step="15" placeholder="60" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="tipo_atendimento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Atendimento</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Consulta inicial, Sessão de terapia, Avaliação" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações adicionais sobre a reserva"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="border-t pt-4">
          <div className="flex items-center space-x-2 mb-3">
            <Checkbox
              id="recurrence"
              checked={showRecurrence}
              onCheckedChange={(checked) => {
                setShowRecurrence(!!checked);
                if (!checked) {
                  form.setValue('rrule', '');
                }
              }}
            />
            <label
              htmlFor="recurrence"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
            >
              <Repeat className="h-4 w-4" />
              Reserva Recorrente
            </label>
          </div>

          {showRecurrence && (
            <FormField
              control={form.control}
              name="rrule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Regra de Recorrência (RRULE)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20251231T235959Z"
                      className="resize-none font-mono text-xs"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    Formato RFC 5545. Ex: FREQ=WEEKLY (semanal), FREQ=MONTHLY (mensal)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit">Salvar Reserva</Button>
        </div>
      </form>
    </Form>
  );
};
