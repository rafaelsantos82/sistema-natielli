import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { funcionarioCLTSchema, type FuncionarioCLT } from '@/lib/validations/folhaPagamento.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { MoneyInput } from '@/components/common/MoneyInput';
import { MaskedInput } from '@/components/common/MaskedInput';
import { formatCPF } from '@/lib/utils/validators';

function buildDefaultValues(funcionario?: FuncionarioCLT) {
  if (!funcionario) {
    return {
      ativo: true,
      dependentes: 0,
      vale_transporte: true,
      vale_alimentacao: 0,
    };
  }
  return {
    ...funcionario,
    cpf: funcionario.cpf ? formatCPF(funcionario.cpf) : '',
  };
}

interface FuncionarioCLTFormProps {
  funcionario?: FuncionarioCLT;
  isSubmitting?: boolean;
  onSubmit: (data: FuncionarioCLT) => void | Promise<void>;
  onCancel: () => void;
}

export function FuncionarioCLTForm({
  funcionario,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: FuncionarioCLTFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<FuncionarioCLT>({
    resolver: zodResolver(funcionarioCLTSchema),
    defaultValues: buildDefaultValues(funcionario),
  });

  const valeTransporte = watch('vale_transporte');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="nome">Nome Completo *</Label>
          <Input id="nome" {...register('nome')} />
          {errors.nome && <p className="text-sm text-destructive mt-1">{errors.nome.message}</p>}
        </div>

        <div>
          <Label htmlFor="cpf">CPF *</Label>
          <Controller
            control={control}
            name="cpf"
            render={({ field }) => (
              <MaskedInput
                id="cpf"
                mask="cpf"
                placeholder="000.000.000-00"
                value={field.value ?? ''}
                onChange={field.onChange}
                maxLength={14}
              />
            )}
          />
          {errors.cpf && <p className="text-sm text-destructive mt-1">{errors.cpf.message}</p>}
        </div>

        <div>
          <Label htmlFor="cargo">Cargo *</Label>
          <Input id="cargo" {...register('cargo')} />
          {errors.cargo && <p className="text-sm text-destructive mt-1">{errors.cargo.message}</p>}
        </div>

        <div>
          <Label htmlFor="salario_base">Salário Base *</Label>
          <MoneyInput
            id="salario_base"
            value={watch('salario_base') || 0}
            onChange={(value) => setValue('salario_base', value)}
          />
          {errors.salario_base && <p className="text-sm text-destructive mt-1">{errors.salario_base.message}</p>}
        </div>

        <div>
          <Label htmlFor="data_admissao">Data de Admissão *</Label>
          <Input id="data_admissao" type="date" {...register('data_admissao')} />
          {errors.data_admissao && <p className="text-sm text-destructive mt-1">{errors.data_admissao.message}</p>}
        </div>

        <div>
          <Label htmlFor="dependentes">Número de Dependentes</Label>
          <Input
            id="dependentes"
            type="number"
            min="0"
            {...register('dependentes', { valueAsNumber: true })}
          />
          {errors.dependentes && <p className="text-sm text-destructive mt-1">{errors.dependentes.message}</p>}
        </div>

        <div>
          <Label htmlFor="vale_alimentacao">Vale Alimentação (R$)</Label>
          <MoneyInput
            id="vale_alimentacao"
            value={watch('vale_alimentacao') || 0}
            onChange={(value) => setValue('vale_alimentacao', value)}
          />
          {errors.vale_alimentacao && <p className="text-sm text-destructive mt-1">{errors.vale_alimentacao.message}</p>}
        </div>

        <div className="col-span-2 flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="vale_transporte"
              checked={valeTransporte}
              onCheckedChange={(checked) => setValue('vale_transporte', checked as boolean)}
            />
            <Label htmlFor="vale_transporte" className="cursor-pointer">
              Desconta Vale Transporte (6%)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="ativo"
              {...register('ativo')}
            />
            <Label htmlFor="ativo" className="cursor-pointer">
              Funcionário Ativo
            </Label>
          </div>
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
