import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const prescricaoSchema = z.object({
  medicamento: z.string().min(3, 'Nome do medicamento é obrigatório'),
  dosagem: z.string().min(1, 'Dosagem é obrigatória'),
  frequencia: z.string().min(1, 'Frequência é obrigatória'),
  duracao: z.string().min(1, 'Duração é obrigatória'),
  orientacoes: z.string().optional(),
});

type PrescricaoFormData = z.infer<typeof prescricaoSchema>;

interface PrescricaoFormProps {
  onSubmit: (data: PrescricaoFormData) => void;
  onCancel?: () => void;
}

export const PrescricaoForm = ({ onSubmit, onCancel }: PrescricaoFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PrescricaoFormData>({
    resolver: zodResolver(prescricaoSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="medicamento">Medicamento *</Label>
        <Input
          id="medicamento"
          {...register('medicamento')}
          placeholder="Nome do medicamento"
        />
        {errors.medicamento && (
          <p className="text-sm text-destructive">{errors.medicamento.message}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dosagem">Dosagem *</Label>
          <Input
            id="dosagem"
            {...register('dosagem')}
            placeholder="Ex: 500mg"
          />
          {errors.dosagem && (
            <p className="text-sm text-destructive">{errors.dosagem.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequencia">Frequência *</Label>
          <Input
            id="frequencia"
            {...register('frequencia')}
            placeholder="Ex: 8/8h"
          />
          {errors.frequencia && (
            <p className="text-sm text-destructive">{errors.frequencia.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="duracao">Duração *</Label>
          <Input
            id="duracao"
            {...register('duracao')}
            placeholder="Ex: 7 dias"
          />
          {errors.duracao && (
            <p className="text-sm text-destructive">{errors.duracao.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="orientacoes">Orientações</Label>
        <Textarea
          id="orientacoes"
          {...register('orientacoes')}
          placeholder="Orientações de uso"
          rows={2}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Adicionar Prescrição
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
