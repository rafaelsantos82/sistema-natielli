import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MovimentacaoFormData, movimentacaoSchema } from '@/lib/validations/estoque.schema';
import { useEstoque } from '@/hooks/useEstoque';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface MovimentacaoFormProps {
  onSubmit: (data: MovimentacaoFormData) => void | Promise<void>;
  onCancel: () => void;
  defaultValues?: Partial<MovimentacaoFormData>;
  isSubmitting?: boolean;
}

export const MovimentacaoForm = ({
  onSubmit,
  onCancel,
  defaultValues,
  isSubmitting = false,
}: MovimentacaoFormProps) => {
  const { itens } = useEstoque();
  const { user } = useAuth();
  const [date, setDate] = useState<Date>(new Date());

  const form = useForm<MovimentacaoFormData>({
    resolver: zodResolver(movimentacaoSchema),
    defaultValues: {
      item_id: defaultValues?.item_id || '',
      item_nome: defaultValues?.item_nome || '',
      tipo: defaultValues?.tipo || 'Entrada',
      quantidade: defaultValues?.quantidade || 1,
      data_hora: defaultValues?.data_hora || new Date().toISOString(),
      documento: defaultValues?.documento || '',
      motivo: defaultValues?.motivo || '',
      responsavel_id: user?.id ?? '',
      responsavel_nome: user?.name ?? user?.email ?? '',
    },
  });

  const handleItemChange = (itemId: string) => {
    const item = itens.find((i) => i.id === itemId);
    if (item) {
      form.setValue('item_id', item.id);
      form.setValue('item_nome', item.nome);
    }
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      form.setValue('data_hora', selectedDate.toISOString());
    }
  };

  const selectedItem = itens.find((i) => i.id === form.watch('item_id'));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="item_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item *</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  handleItemChange(value);
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o item" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {itens.filter(i => i.status === 'Ativo').map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.codigo} - {item.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedItem && (
                <p className="text-xs text-muted-foreground mt-1">
                  Estoque atual: <strong>{selectedItem.estoque_atual}</strong> {selectedItem.unidade_medida}
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Movimentação *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Entrada">Entrada</SelectItem>
                    <SelectItem value="Saída">Saída</SelectItem>
                    <SelectItem value="Ajuste">Ajuste</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Ex: 10"
                    {...field}
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
            name="data_hora"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data/Hora *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), "dd/MM/yyyy HH:mm", { locale: ptBR })
                        ) : (
                          <span>Selecione a data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateSelect}
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
            name="documento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nº Documento</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: NF-12345" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="motivo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motivo *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva o motivo da movimentação..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Registrando...' : 'Registrar Movimentação'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
