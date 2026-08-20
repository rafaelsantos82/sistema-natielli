import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { planoSaudeSchema, PlanoSaudeFormData } from '@/lib/validations/planoseSaude.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PlanoSaude } from '@/hooks/usePlanoseSaude';

interface PlanoSaudeFormProps {
  initialData?: PlanoSaude;
  onSubmit: (data: PlanoSaudeFormData) => void;
  onCancel: () => void;
}

export const PlanoSaudeForm = ({ initialData, onSubmit, onCancel }: PlanoSaudeFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PlanoSaudeFormData>({
    resolver: zodResolver(planoSaudeSchema),
    defaultValues: initialData || {
      ativo: true,
    },
  });

  const ativo = watch('ativo');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="nome">Nome do Plano *</Label>
          <Input id="nome" {...register('nome')} />
          {errors.nome && <p className="text-sm text-destructive mt-1">{errors.nome.message}</p>}
        </div>

        <div>
          <Label htmlFor="cnpj">CNPJ *</Label>
          <Input id="cnpj" {...register('cnpj')} placeholder="00.000.000/0000-00" />
          {errors.cnpj && <p className="text-sm text-destructive mt-1">{errors.cnpj.message}</p>}
        </div>

        <div>
          <Label htmlFor="registro_ans">Registro ANS *</Label>
          <Input id="registro_ans" {...register('registro_ans')} />
          {errors.registro_ans && <p className="text-sm text-destructive mt-1">{errors.registro_ans.message}</p>}
        </div>

        <div>
          <Label htmlFor="telefone">Telefone *</Label>
          <Input id="telefone" {...register('telefone')} placeholder="(00) 0000-0000" />
          {errors.telefone && <p className="text-sm text-destructive mt-1">{errors.telefone.message}</p>}
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
        </div>

        <div className="col-span-2">
          <Label htmlFor="endereco">Endereço *</Label>
          <Input id="endereco" {...register('endereco')} />
          {errors.endereco && <p className="text-sm text-destructive mt-1">{errors.endereco.message}</p>}
        </div>

        <div className="col-span-2">
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea id="observacoes" {...register('observacoes')} rows={3} />
          {errors.observacoes && <p className="text-sm text-destructive mt-1">{errors.observacoes.message}</p>}
        </div>

        <div className="col-span-2 flex items-center space-x-2">
          <Switch
            id="ativo"
            checked={ativo}
            onCheckedChange={(checked) => setValue('ativo', checked)}
          />
          <Label htmlFor="ativo">Plano ativo</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {initialData ? 'Atualizar' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  );
};
