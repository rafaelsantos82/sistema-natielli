import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DevolucaoFormData, devolucaoFormSchema } from '@/lib/validations/comodato.schema';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

export const DEVOLUCAO_COMODATO_FORM_ID = 'form-devolucao-comodato';

interface DevolucaoFormProps {
  onSubmit: (data: DevolucaoFormData) => void;
  formId?: string;
}

export function DevolucaoForm({
  onSubmit,
  formId = DEVOLUCAO_COMODATO_FORM_ID,
}: DevolucaoFormProps) {
  const form = useForm<DevolucaoFormData>({
    resolver: zodResolver(devolucaoFormSchema),
    defaultValues: {
      data_devolucao_real: format(new Date(), 'yyyy-MM-dd'),
      condicao_devolucao: '',
      observacoes: '',
    },
  });

  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="data_devolucao_real"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Devolução *</FormLabel>
              <FormControl>
                <Input {...field} type="date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="condicao_devolucao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Condição na Devolução *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a condição" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Novo">Novo</SelectItem>
                  <SelectItem value="Bom">Bom</SelectItem>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="Desgastado">Desgastado</SelectItem>
                  <SelectItem value="Danificado">Danificado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações sobre a Devolução</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Observações sobre o estado do item ou detalhes da devolução" rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
