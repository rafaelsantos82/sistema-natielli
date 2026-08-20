import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { folhaCLTSchema, type FolhaCLT, type FuncionarioCLT } from '@/lib/validations/folhaPagamento.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoneyInput } from '@/components/common/MoneyInput';
import { useEffect } from 'react';

interface FolhaCLTFormProps {
  funcionarios: FuncionarioCLT[];
  folha?: FolhaCLT;
  calcularFolha: (
    funcionario: FuncionarioCLT,
    horasExtras: number,
    adicionalNoturno: number,
    outrosProventos: number,
    outrosDescontos: number
  ) => Omit<FolhaCLT, 'id' | 'funcionario_id' | 'mes_referencia' | 'data_pagamento' | 'status'>;
  isSubmitting?: boolean;
  onSubmit: (data: FolhaCLT) => void | Promise<void>;
  onCancel: () => void;
}

export function FolhaCLTForm({
  funcionarios,
  folha,
  calcularFolha,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: FolhaCLTFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FolhaCLT>({
    resolver: zodResolver(folhaCLTSchema),
    defaultValues: folha || {
      status: 'pendente',
      horas_extras: 0,
      adicional_noturno: 0,
      outros_proventos: 0,
      outros_descontos: 0,
    },
  });

  const funcionarioId = watch('funcionario_id');
  const horasExtras = watch('horas_extras') || 0;
  const adicionalNoturno = watch('adicional_noturno') || 0;
  const outrosProventos = watch('outros_proventos') || 0;
  const outrosDescontos = watch('outros_descontos') || 0;

  useEffect(() => {
    if (funcionarioId) {
      const funcionario = funcionarios.find(f => f.id === funcionarioId);
      if (funcionario) {
        const calculo = calcularFolha(
          funcionario,
          horasExtras,
          adicionalNoturno,
          outrosProventos,
          outrosDescontos
        );
        
        Object.entries(calculo).forEach(([key, value]) => {
          setValue(key as keyof FolhaCLT, value);
        });
      }
    }
  }, [funcionarioId, horasExtras, adicionalNoturno, outrosProventos, outrosDescontos, funcionarios, calcularFolha, setValue]);

  const funcionarioSelecionado = funcionarios.find(f => f.id === funcionarioId);
  const salarioLiquido = watch('salario_liquido') || 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="funcionario_id">Funcionário *</Label>
          <Select
            value={funcionarioId}
            onValueChange={(value) => setValue('funcionario_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o funcionário" />
            </SelectTrigger>
            <SelectContent>
              {funcionarios.filter(f => f.ativo).map((f) => (
                <SelectItem key={f.id} value={f.id!}>
                  {f.nome} - {f.cargo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.funcionario_id && <p className="text-sm text-destructive mt-1">{errors.funcionario_id.message}</p>}
        </div>

        <div>
          <Label htmlFor="mes_referencia">Mês de Referência *</Label>
          <Input id="mes_referencia" type="month" {...register('mes_referencia')} />
          {errors.mes_referencia && <p className="text-sm text-destructive mt-1">{errors.mes_referencia.message}</p>}
        </div>

        {funcionarioSelecionado && (
          <>
            <div className="col-span-2 bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Salário Base</h4>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  funcionarioSelecionado.salario_base
                )}
              </p>
            </div>

            <div>
              <Label htmlFor="horas_extras">Horas Extras (R$)</Label>
              <MoneyInput
                id="horas_extras"
                value={watch('horas_extras') || 0}
                onChange={(value) => setValue('horas_extras', value)}
              />
            </div>

            <div>
              <Label htmlFor="adicional_noturno">Adicional Noturno (R$)</Label>
              <MoneyInput
                id="adicional_noturno"
                value={watch('adicional_noturno') || 0}
                onChange={(value) => setValue('adicional_noturno', value)}
              />
            </div>

            <div>
              <Label htmlFor="outros_proventos">Outros Proventos (R$)</Label>
              <MoneyInput
                id="outros_proventos"
                value={watch('outros_proventos') || 0}
                onChange={(value) => setValue('outros_proventos', value)}
              />
            </div>

            <div>
              <Label htmlFor="outros_descontos">Outros Descontos (R$)</Label>
              <MoneyInput
                id="outros_descontos"
                value={watch('outros_descontos') || 0}
                onChange={(value) => setValue('outros_descontos', value)}
              />
            </div>

            <div className="col-span-2 bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-semibold mb-2">Cálculos Automáticos</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">INSS:</span>
                  <span className="float-right font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(watch('inss') || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">FGTS:</span>
                  <span className="float-right font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(watch('fgts') || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">IRRF:</span>
                  <span className="float-right font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(watch('irrf') || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Vale Transporte:</span>
                  <span className="float-right font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(watch('vale_transporte') || 0)}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t mt-2">
                <span className="font-semibold">Salário Líquido:</span>
                <span className="float-right font-bold text-lg text-primary">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(salarioLiquido)}
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="data_pagamento">Data de Pagamento</Label>
              <Input id="data_pagamento" type="date" {...register('data_pagamento')} />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value as 'pendente' | 'pago' | 'cancelado')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!funcionarioSelecionado || isSubmitting}>
          {isSubmitting ? 'Salvando...' : folha ? 'Atualizar' : 'Gerar Folha'}
        </Button>
      </div>
    </form>
  );
}
