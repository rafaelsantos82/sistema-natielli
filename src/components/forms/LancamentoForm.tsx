import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { lancamentoSchema, LancamentoFormData } from '@/lib/validations/financeiro.schema';
import { useFinanceiro } from '@/hooks/useFinanceiro';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { MoneyInput } from '@/components/common/MoneyInput';

interface LancamentoFormProps {
  onSubmit: (data: LancamentoFormData) => void;
  defaultValues?: Partial<LancamentoFormData>;
  fixedTipo?: 'Receita' | 'Despesa';
}

const NONE_CENTRO_CUSTO_VALUE = '__none__';

export const LancamentoForm = ({ onSubmit, defaultValues, fixedTipo }: LancamentoFormProps) => {
  const { categorias, centrosCusto } = useFinanceiro();
  const [dateVencimento, setDateVencimento] = useState<Date | undefined>(
    defaultValues?.data_vencimento ? new Date(defaultValues.data_vencimento) : undefined
  );
  const [datePagamento, setDatePagamento] = useState<Date | undefined>(
    defaultValues?.data_pagamento ? new Date(defaultValues.data_pagamento) : undefined
  );

  const form = useForm<LancamentoFormData>({
    resolver: zodResolver(lancamentoSchema),
    defaultValues: {
      tipo: fixedTipo ?? 'Despesa',
      recorrente: false,
      ...defaultValues,
    },
  });

  const tipoSelecionado = fixedTipo ?? form.watch('tipo');
  const recorrente = form.watch('recorrente');
  const categoriasFiltradas = categorias.filter((cat) => cat.tipo === tipoSelecionado);

  useEffect(() => {
    if (fixedTipo) {
      form.setValue('tipo', fixedTipo, { shouldValidate: true });
    }
  }, [fixedTipo, form]);

  const handleCategoriaChange = (categoriaId: string) => {
    const categoria = categorias.find((cat) => cat.id === categoriaId);
    if (categoria) {
      form.setValue('categoria_id', categoria.id);
      form.setValue('categoria_nome', categoria.nome);
    }
  };

  const handleCentroCustoChange = (centroCustoId: string) => {
    if (centroCustoId === NONE_CENTRO_CUSTO_VALUE) {
      form.setValue('centro_custo_id', undefined);
      form.setValue('centro_custo_nome', undefined);
      return;
    }

    const centroCusto = centrosCusto.find((cc) => cc.id === centroCustoId);
    if (centroCusto) {
      form.setValue('centro_custo_id', centroCusto.id);
      form.setValue('centro_custo_nome', centroCusto.nome);
    }
  };

  const handleDateVencimentoSelect = (selectedDate: Date | undefined) => {
    setDateVencimento(selectedDate);
    if (selectedDate) {
      form.setValue('data_vencimento', selectedDate.toISOString().split('T')[0]);
    }
  };

  const handleDatePagamentoSelect = (selectedDate: Date | undefined) => {
    setDatePagamento(selectedDate);
    if (selectedDate) {
      form.setValue('data_pagamento', selectedDate.toISOString().split('T')[0]);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              {fixedTipo ? (
                <FormControl>
                  <Input value={fixedTipo} readOnly aria-readonly="true" />
                </FormControl>
              ) : (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Receita">Receita</SelectItem>
                    <SelectItem value="Despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Descrição do lançamento" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="valor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor</FormLabel>
              <FormControl>
                <MoneyInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="0,00"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoria_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={handleCategoriaChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categoriasFiltradas.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      {categoria.nome}
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
          name="centro_custo_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Centro de Custo (Opcional)</FormLabel>
              <Select
                onValueChange={handleCentroCustoChange}
                value={field.value || NONE_CENTRO_CUSTO_VALUE}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o centro de custo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NONE_CENTRO_CUSTO_VALUE}>Nenhum</SelectItem>
                  {centrosCusto
                    .filter((cc) => cc.ativo)
                    .map((cc) => (
                      <SelectItem key={cc.id} value={cc.id}>
                        {cc.codigo} - {cc.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="data_vencimento"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Vencimento</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className="pl-3 text-left font-normal">
                        {dateVencimento ? (
                          format(dateVencimento, 'dd/MM/yyyy', { locale: ptBR })
                        ) : (
                          <span className="text-muted-foreground">Selecione a data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateVencimento}
                      onSelect={handleDateVencimentoSelect}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="data_pagamento"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Pagamento (Opcional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className="pl-3 text-left font-normal">
                        {datePagamento ? (
                          format(datePagamento, 'dd/MM/yyyy', { locale: ptBR })
                        ) : (
                          <span className="text-muted-foreground">Selecione a data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={datePagamento}
                      onSelect={handleDatePagamentoSelect}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="forma_pagamento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Forma de Pagamento (Opcional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Cartão Débito">Cartão Débito</SelectItem>
                  <SelectItem value="Cartão Crédito">Cartão Crédito</SelectItem>
                  <SelectItem value="Transferência">Transferência</SelectItem>
                  <SelectItem value="Boleto">Boleto</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="documento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Documento/Nota Fiscal (Opcional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Número do documento" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center space-x-2">
          <FormField
            control={form.control}
            name="recorrente"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">Lançamento Recorrente</FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {recorrente && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="frequencia_recorrencia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequência</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a frequência" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Mensal">Mensal</SelectItem>
                      <SelectItem value="Trimestral">Trimestral</SelectItem>
                      <SelectItem value="Semestral">Semestral</SelectItem>
                      <SelectItem value="Anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parcelas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Parcelas</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="1"
                      placeholder="Ex: 12"
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações (Opcional)</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Observações adicionais" rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Salvar Lançamento
        </Button>
      </form>
    </Form>
  );
};
