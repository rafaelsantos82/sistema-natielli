import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { folhaPJSchema, type FolhaPJ, type FuncionarioPJ } from '@/lib/validations/folhaPagamento.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MoneyInput } from '@/components/common/MoneyInput';
import { useEffect } from 'react';

interface FolhaPJFormProps {
  funcionarios: FuncionarioPJ[];
  folha?: FolhaPJ;
  isSubmitting?: boolean;
  onSubmit: (data: FolhaPJ) => void | Promise<void>;
  onCancel: () => void;
}

export function FolhaPJForm({
  funcionarios,
  folha,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: FolhaPJFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FolhaPJ>({
    resolver: zodResolver(folhaPJSchema),
    defaultValues: folha || {
      status: 'pendente',
      horas_trabalhadas: 0,
      retencao_iss: 0,
      retencao_ir: 0,
    },
  });

  const funcionarioId = watch('funcionario_id');
  const horasTrabalhadas = watch('horas_trabalhadas') || 0;
  const valorHora = watch('valor_hora') || 0;
  const retencaoIss = watch('retencao_iss') || 0;
  const retencaoIr = watch('retencao_ir') || 0;

  useEffect(() => {
    if (funcionarioId) {
      const funcionario = funcionarios.find(f => f.id === funcionarioId);
      if (funcionario) {
        setValue('valor_hora', funcionario.valor_hora);
      }
    }
  }, [funcionarioId, funcionarios, setValue]);

  useEffect(() => {
    const valorTotal = horasTrabalhadas * valorHora;
    const valorLiquido = valorTotal - retencaoIss - retencaoIr;
    
    setValue('valor_total', valorTotal);
    setValue('valor_liquido', valorLiquido);
  }, [horasTrabalhadas, valorHora, retencaoIss, retencaoIr, setValue]);

  const funcionarioSelecionado = funcionarios.find(f => f.id === funcionarioId);
  const valorTotal = watch('valor_total') || 0;
  const valorLiquido = watch('valor_liquido') || 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="funcionario_id">Prestador PJ *</Label>
          <Select
            value={funcionarioId}
            onValueChange={(value) => setValue('funcionario_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o prestador" />
            </SelectTrigger>
            <SelectContent>
              {funcionarios.filter(f => f.ativo).map((f) => (
                <SelectItem key={f.id} value={f.id!}>
                  {f.nome} - {f.servico}
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
            <div>
              <Label htmlFor="horas_trabalhadas">Horas Trabalhadas *</Label>
              <Input
                id="horas_trabalhadas"
                type="number"
                step="0.5"
                min="0"
                {...register('horas_trabalhadas', { valueAsNumber: true })}
              />
              {errors.horas_trabalhadas && (
                <p className="text-sm text-destructive mt-1">{errors.horas_trabalhadas.message}</p>
              )}
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

            <div className="col-span-2 bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Valor Total</h4>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}
              </p>
            </div>

            <div>
              <Label htmlFor="retencao_iss">Retenção ISS (R$)</Label>
              <MoneyInput
                id="retencao_iss"
                value={watch('retencao_iss') || 0}
                onChange={(value) => setValue('retencao_iss', value)}
              />
            </div>

            <div>
              <Label htmlFor="retencao_ir">Retenção IR (R$)</Label>
              <MoneyInput
                id="retencao_ir"
                value={watch('retencao_ir') || 0}
                onChange={(value) => setValue('retencao_ir', value)}
              />
            </div>

            <div className="col-span-2 bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Valor Líquido</h4>
              <p className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorLiquido)}
              </p>
            </div>

            <div className="col-span-2">
              <Label htmlFor="descricao_servicos">Descrição dos Serviços</Label>
              <Textarea
                id="descricao_servicos"
                {...register('descricao_servicos')}
                placeholder="Descreva os serviços prestados no período..."
                rows={3}
              />
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
          {isSubmitting ? 'Salvando...' : folha ? 'Atualizar' : 'Gerar Pagamento'}
        </Button>
      </div>
    </form>
  );
}
