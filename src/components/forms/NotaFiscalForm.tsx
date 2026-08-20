import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { notaFiscalSchema, NotaFiscalFormData } from '@/lib/validations/planoseSaude.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NotaFiscal } from '@/hooks/useNotasFiscais';
import { PlanoSaude } from '@/hooks/usePlanoseSaude';
import { AcaoJudicial } from '@/hooks/useAcoesJudiciais';
import { MoneyInput } from '@/components/common/MoneyInput';
import { formatBRL, type ConciliacaoTotais } from '@/lib/conciliacao/conciliacaoCalc';

interface NotaFiscalFormProps {
  initialData?: NotaFiscal;
  planosSaude: PlanoSaude[];
  acoesJudiciais?: AcaoJudicial[];
  resumoByAcaoId?: Map<string, ConciliacaoTotais>;
  onSubmit: (data: NotaFiscalFormData) => void;
  onCancel: () => void;
}

export const NotaFiscalForm = ({
  initialData,
  planosSaude,
  acoesJudiciais = [],
  resumoByAcaoId,
  onSubmit,
  onCancel,
}: NotaFiscalFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<NotaFiscalFormData>({
    resolver: zodResolver(notaFiscalSchema),
    defaultValues: initialData || {
      status: 'Pendente',
    },
  });

  const planoSaudeId = watch('plano_saude_id');
  const acaoJudicialId = watch('acao_judicial_id');
  const status = watch('status');

  const acoesDoPlano = acoesJudiciais.filter(
    (a) => (a.plano_saude_id ?? a.plano_id) === planoSaudeId,
  );
  const resumoAcaoSelecionada = acaoJudicialId ? resumoByAcaoId?.get(acaoJudicialId) : undefined;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="numero_nota">Número da Nota *</Label>
          <Input id="numero_nota" {...register('numero_nota')} />
          {errors.numero_nota && <p className="text-sm text-destructive mt-1">{errors.numero_nota.message}</p>}
        </div>

        <div>
          <Label htmlFor="paciente_nome">Nome do Paciente *</Label>
          <Input id="paciente_nome" {...register('paciente_nome')} />
          {errors.paciente_nome && <p className="text-sm text-destructive mt-1">{errors.paciente_nome.message}</p>}
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
          <Label htmlFor="data_emissao">Data de Emissão *</Label>
          <Input id="data_emissao" type="date" {...register('data_emissao')} />
          {errors.data_emissao && <p className="text-sm text-destructive mt-1">{errors.data_emissao.message}</p>}
        </div>

        <div>
          <Label htmlFor="data_vencimento">Data de Vencimento *</Label>
          <Input id="data_vencimento" type="date" {...register('data_vencimento')} />
          {errors.data_vencimento && <p className="text-sm text-destructive mt-1">{errors.data_vencimento.message}</p>}
        </div>

        <div>
          <Label htmlFor="valor_servico">Valor do Serviço *</Label>
          <MoneyInput
            id="valor_servico"
            value={watch('valor_servico') || 0}
            onChange={(value) => setValue('valor_servico', value)}
          />
          {errors.valor_servico && <p className="text-sm text-destructive mt-1">{errors.valor_servico.message}</p>}
        </div>

        <div>
          <Label htmlFor="valor_pago">Valor Pago</Label>
          <MoneyInput
            id="valor_pago"
            value={watch('valor_pago') || 0}
            onChange={(value) => setValue('valor_pago', value)}
          />
          {errors.valor_pago && <p className="text-sm text-destructive mt-1">{errors.valor_pago.message}</p>}
        </div>

        {planoSaudeId && acoesDoPlano.length > 0 && (
          <div className="col-span-2">
            <Label>Ação judicial (opcional)</Label>
            <Select
              value={acaoJudicialId || '__none__'}
              onValueChange={(value) => {
                if (value === '__none__') {
                  setValue('acao_judicial_id', undefined);
                } else {
                  setValue('acao_judicial_id', value);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sem vínculo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sem vínculo</SelectItem>
                {acoesDoPlano.map((acao) => (
                  <SelectItem key={acao.id} value={acao.id}>
                    {acao.numero_processo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {resumoAcaoSelecionada && (
              <p className="text-xs text-muted-foreground mt-2">
                Valor da ação: {formatBRL(resumoAcaoSelecionada.valorAcao)} · Saldo em aberto:{' '}
                {formatBRL(resumoAcaoSelecionada.saldoEmAberto)}
              </p>
            )}
          </div>
        )}

        <div className="col-span-2">
          <Label>Status *</Label>
          <Select value={status} onValueChange={(value: any) => setValue('status', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Pago Parcial">Pago Parcial</SelectItem>
              <SelectItem value="Pago">Pago</SelectItem>
              <SelectItem value="Em Disputa">Em Disputa</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && <p className="text-sm text-destructive mt-1">{errors.status.message}</p>}
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
