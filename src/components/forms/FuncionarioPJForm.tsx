import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { funcionarioPJSchema, type FuncionarioPJ } from '@/lib/validations/folhaPagamento.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { MoneyInput } from '@/components/common/MoneyInput';
import { MaskedInput } from '@/components/common/MaskedInput';
import { formatCNPJ } from '@/lib/utils/validators';

function buildDefaultValues(funcionario?: FuncionarioPJ) {
  if (!funcionario) {
    return { ativo: true };
  }
  return {
    ...funcionario,
    cnpj: funcionario.cnpj ? formatCNPJ(funcionario.cnpj) : '',
  };
}

interface FuncionarioPJFormProps {
  funcionario?: FuncionarioPJ;
  isSubmitting?: boolean;
  onSubmit: (data: FuncionarioPJ) => void | Promise<void>;
  onCancel: () => void;
}

export function FuncionarioPJForm({
  funcionario,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: FuncionarioPJFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<FuncionarioPJ>({
    resolver: zodResolver(funcionarioPJSchema),
    defaultValues: buildDefaultValues(funcionario),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="nome">Nome Completo *</Label>
          <Input id="nome" {...register('nome')} />
          {errors.nome && <p className="text-sm text-destructive mt-1">{errors.nome.message}</p>}
        </div>

        <div>
          <Label htmlFor="cnpj">CNPJ *</Label>
          <Controller
            control={control}
            name="cnpj"
            render={({ field }) => (
              <MaskedInput
                id="cnpj"
                mask="cnpj"
                placeholder="00.000.000/0000-00"
                value={field.value ?? ''}
                onChange={field.onChange}
                maxLength={18}
              />
            )}
          />
          {errors.cnpj && <p className="text-sm text-destructive mt-1">{errors.cnpj.message}</p>}
        </div>

        <div>
          <Label htmlFor="razao_social">Razão Social *</Label>
          <Input id="razao_social" {...register('razao_social')} />
          {errors.razao_social && <p className="text-sm text-destructive mt-1">{errors.razao_social.message}</p>}
        </div>

        <div>
          <Label htmlFor="servico">Serviço Prestado *</Label>
          <Input id="servico" {...register('servico')} />
          {errors.servico && <p className="text-sm text-destructive mt-1">{errors.servico.message}</p>}
        </div>

        <div>
          <Label htmlFor="valor_hora">Valor por Hora *</Label>
          <MoneyInput
            id="valor_hora"
            value={watch('valor_hora') || 0}
            onChange={(value) => setValue('valor_hora', value)}
          />
          {errors.valor_hora && <p className="text-sm text-destructive mt-1">{errors.valor_hora.message}</p>}
        </div>

        <div>
          <Label htmlFor="data_inicio">Data de Início *</Label>
          <Input id="data_inicio" type="date" {...register('data_inicio')} />
          {errors.data_inicio && <p className="text-sm text-destructive mt-1">{errors.data_inicio.message}</p>}
        </div>

        <div className="col-span-2 flex items-center space-x-2">
          <Checkbox
            id="ativo"
            {...register('ativo')}
          />
          <Label htmlFor="ativo" className="cursor-pointer">
            Contrato Ativo
          </Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : funcionario ? 'Atualizar' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  );
}
