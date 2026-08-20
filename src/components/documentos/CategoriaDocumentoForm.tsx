import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { DocumentoCategoriaDTO } from '@/lib/api/documentos.types';

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  descricao: z.string().max(500).optional(),
  ordem: z.coerce.number().int().min(0).default(0),
  ativo: z.boolean().default(true),
});

export type CategoriaDocumentoFormData = z.infer<typeof schema>;

interface Props {
  initial?: DocumentoCategoriaDTO | null;
  onSubmit: (data: CategoriaDocumentoFormData) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const CategoriaDocumentoForm = ({ initial, onSubmit, onCancel, isLoading }: Props) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoriaDocumentoFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: initial?.nome ?? '',
      descricao: initial?.descricao ?? '',
      ordem: initial?.ordem ?? 0,
      ativo: initial?.ativo ?? true,
    },
  });

  const ativo = watch('ativo');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome</Label>
        <Input id="nome" {...register('nome')} />
        {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea id="descricao" rows={3} {...register('descricao')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ordem">Ordem</Label>
        <Input id="ordem" type="number" min={0} {...register('ordem')} />
      </div>
      <div className="flex items-center justify-between rounded-md border p-3">
        <Label htmlFor="ativo">Ativa</Label>
        <Switch
          id="ativo"
          checked={ativo}
          onCheckedChange={(v) => setValue('ativo', v)}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {initial ? 'Salvar' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  );
};
