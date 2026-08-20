import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { acaoJudicialSchema, AcaoJudicialFormData } from '@/lib/validations/planoseSaude.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AcaoJudicial } from '@/hooks/useAcoesJudiciais';
import { PlanoSaude } from '@/hooks/usePlanoseSaude';
import { MoneyInput } from '@/components/common/MoneyInput';

interface AcaoJudicialFormProps {
  initialData?: AcaoJudicial;
  planosSaude: PlanoSaude[];
  onSubmit: (data: AcaoJudicialFormData) => void;
  onCancel: () => void;
}

export const AcaoJudicialForm = ({ initialData, planosSaude, onSubmit, onCancel }: AcaoJudicialFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AcaoJudicialFormData>({
    resolver: zodResolver(acaoJudicialSchema),
    defaultValues: initialData || {
      status: 'Em Andamento',
    },
  });

  const planoSaudeId = watch('plano_saude_id');
  const status = watch('status');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="numero_processo">Número do Processo *</Label>
          <Input id="numero_processo" {...register('numero_processo')} placeholder="0000000-00.0000.0.00.0000" />
          {errors.numero_processo && <p className="text-sm text-destructive mt-1">{errors.numero_processo.message}</p>}
        </div>

        <div className="col-span-2">
          <Label>Plano de Saúde *</Label>
          <Select
            value={planoSaudeId}
            onValueChange={(value) => {
              const plano = planosSaude.find(p => p.id === value);
              setValue('plano_saude_id', value);
              if (plano) setValue('plano_saude_nome', plano.nome);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o plano" />
            </SelectTrigger>
            <SelectContent>
              {planosSaude.map((plano) => (
                <SelectItem key={plano.id} value={plano.id}>
                  {plano.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.plano_saude_id && <p className="text-sm text-destructive mt-1">{errors.plano_saude_id.message}</p>}
        </div>

        <div>
          <Label htmlFor="valor_acao">Valor da Ação *</Label>
          <MoneyInput
            id="valor_acao"
            value={watch('valor_acao') || 0}
            onChange={(value) => setValue('valor_acao', value)}
          />
          {errors.valor_acao && <p className="text-sm text-destructive mt-1">{errors.valor_acao.message}</p>}
        </div>

        <div>
          <Label>Status *</Label>
          <Select value={status} onValueChange={(value: any) => setValue('status', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Em Andamento">Em Andamento</SelectItem>
              <SelectItem value="Procedente">Procedente</SelectItem>
              <SelectItem value="Improcedente">Improcedente</SelectItem>
              <SelectItem value="Acordo">Acordo</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && <p className="text-sm text-destructive mt-1">{errors.status.message}</p>}
        </div>

        <div>
          <Label htmlFor="data_entrada">Data de Entrada *</Label>
          <Input id="data_entrada" type="date" {...register('data_entrada')} />
          {errors.data_entrada && <p className="text-sm text-destructive mt-1">{errors.data_entrada.message}</p>}
        </div>

        <div>
          <Label htmlFor="data_sentenca">Data da Sentença</Label>
          <Input id="data_sentenca" type="date" {...register('data_sentenca')} />
          {errors.data_sentenca && <p className="text-sm text-destructive mt-1">{errors.data_sentenca.message}</p>}
        </div>

        <div className="col-span-2">
          <Label htmlFor="descricao">Descrição *</Label>
          <Textarea id="descricao" {...register('descricao')} rows={3} />
          {errors.descricao && <p className="text-sm text-destructive mt-1">{errors.descricao.message}</p>}
        </div>

        <div className="col-span-2">
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea id="observacoes" {...register('observacoes')} rows={2} />
          {errors.observacoes && <p className="text-sm text-destructive mt-1">{errors.observacoes.message}</p>}
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
