import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { addDays, format } from 'date-fns';
import { useEffect } from 'react';

const atestadoSchema = z.object({
  cid: z.string().min(1, 'CID é obrigatório'),
  diasAfastamento: z.number().min(1, 'Dias de afastamento é obrigatório'),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().min(1, 'Data de fim é obrigatória'),
  observacoes: z.string().optional(),
});

type AtestadoFormData = z.infer<typeof atestadoSchema>;

interface AtestadoFormProps {
  onSubmit: (data: AtestadoFormData) => void;
  onCancel?: () => void;
}

export const AtestadoForm = ({ onSubmit, onCancel }: AtestadoFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AtestadoFormData>({
    resolver: zodResolver(atestadoSchema),
    defaultValues: {
      dataInicio: format(new Date(), 'yyyy-MM-dd'),
      diasAfastamento: 1,
    },
  });

  const diasAfastamento = watch('diasAfastamento');
  const dataInicio = watch('dataInicio');

  useEffect(() => {
    if (dataInicio && diasAfastamento) {
      const dataFim = addDays(new Date(dataInicio), diasAfastamento - 1);
      setValue('dataFim', format(dataFim, 'yyyy-MM-dd'));
    }
  }, [diasAfastamento, dataInicio, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cid">CID *</Label>
        <Input
          id="cid"
          {...register('cid')}
          placeholder="Ex: Z76.5"
        />
        {errors.cid && (
          <p className="text-sm text-destructive">{errors.cid.message}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="diasAfastamento">Dias de Afastamento *</Label>
          <Input
            id="diasAfastamento"
            type="number"
            min="1"
            {...register('diasAfastamento', { valueAsNumber: true })}
          />
          {errors.diasAfastamento && (
            <p className="text-sm text-destructive">{errors.diasAfastamento.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dataInicio">Data Início *</Label>
          <Input
            id="dataInicio"
            type="date"
            {...register('dataInicio')}
          />
          {errors.dataInicio && (
            <p className="text-sm text-destructive">{errors.dataInicio.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dataFim">Data Fim *</Label>
          <Input
            id="dataFim"
            type="date"
            {...register('dataFim')}
            readOnly
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          {...register('observacoes')}
          placeholder="Observações adicionais"
          rows={2}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Gerar Atestado
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
};
