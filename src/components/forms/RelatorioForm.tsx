import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Send, FileCheck } from 'lucide-react';
import type { Relatorio } from '@/pages/Relatorios';

const relatorioSchema = z.object({
  paciente: z.string().min(1, 'Paciente é obrigatório'),
  profissional: z.string().min(1, 'Profissional é obrigatório'),
  terapia: z.string().min(1, 'Terapia é obrigatório'),
  periodo: z.string().min(1, 'Período é obrigatório'),
  valor: z.number().min(0.01, 'Valor deve ser maior que zero'),
  status: z.enum(['rascunho', 'aguardando_aprovacao', 'aprovado', 'rejeitado', 'integrado']),
  observacoes: z.string().optional(),
});

type RelatorioFormData = z.infer<typeof relatorioSchema>;

interface RelatorioFormProps {
  initialData?: Partial<Relatorio>;
  onSubmit: (data: RelatorioFormData) => void;
  onApprove?: () => void;
  onReject?: () => void;
  onIntegrate?: () => void;
}

export const RelatorioForm = ({ initialData, onSubmit, onApprove, onReject, onIntegrate }: RelatorioFormProps) => {
  const form = useForm<RelatorioFormData>({
    resolver: zodResolver(relatorioSchema),
    defaultValues: {
      paciente: initialData?.paciente || '',
      profissional: initialData?.profissional || '',
      terapia: initialData?.terapia || '',
      periodo: initialData?.periodo || '',
      valor: initialData?.valor || 0,
      status: initialData?.status || 'rascunho',
      observacoes: initialData?.observacoes || '',
    },
  });

  const handleFormSubmit = (data: RelatorioFormData) => {
    onSubmit(data);
  };

  const handleSubmitForApproval = () => {
    const currentData = form.getValues();
    onSubmit({ ...currentData, status: 'aguardando_aprovacao' });
  };

  const canEdit = !initialData?.status || ['rascunho', 'rejeitado'].includes(initialData.status);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {initialData?.numero && (
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">Número do Relatório</p>
              <p className="text-lg font-bold">{initialData.numero}</p>
            </div>
            {initialData.status && (
              <Badge>
                {initialData.status === 'rascunho' && 'Rascunho'}
                {initialData.status === 'aguardando_aprovacao' && 'Aguardando Aprovação'}
                {initialData.status === 'aprovado' && 'Aprovado'}
                {initialData.status === 'rejeitado' && 'Rejeitado'}
                {initialData.status === 'integrado' && 'Integrado'}
              </Badge>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="paciente"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paciente *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nome do paciente" disabled={!canEdit} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="profissional"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profissional *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nome do profissional" disabled={!canEdit} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="terapia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Terapia *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Tipo de terapia" disabled={!canEdit} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="periodo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Período *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="MM/AAAA" disabled={!canEdit} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="valor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    placeholder="0.00"
                    disabled={!canEdit}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="aguardando_aprovacao">Aguardando Aprovação</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="rejeitado">Rejeitado</SelectItem>
                    <SelectItem value="integrado">Integrado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Observações sobre o relatório"
                  rows={3}
                  disabled={!canEdit}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {initialData?.historicoVersoes && initialData.historicoVersoes.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-semibold mb-3">Histórico de Versões</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {initialData.historicoVersoes.map((versao) => (
                  <div key={versao.versao} className="text-sm p-3 bg-muted rounded-md">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">Versão {versao.versao}</span>
                      <span className="text-muted-foreground">{versao.data}</span>
                    </div>
                    <div className="text-muted-foreground">
                      <Badge variant="outline" className="mr-2">{versao.status}</Badge>
                      {versao.alteradoPor}
                    </div>
                    <p className="mt-1">{versao.observacao}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />

        <div className="flex gap-2 justify-end">
          {canEdit && (
            <>
              <Button type="submit" variant="outline">
                Salvar Rascunho
              </Button>
              <Button type="button" onClick={handleSubmitForApproval}>
                <Send className="h-4 w-4 mr-2" />
                Enviar para Aprovação
              </Button>
            </>
          )}

          {onApprove && (
            <Button type="button" onClick={onApprove} variant="default" className="bg-success text-success-foreground hover:bg-success/90">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Aprovar
            </Button>
          )}

          {onReject && (
            <Button type="button" onClick={onReject} variant="destructive">
              <XCircle className="h-4 w-4 mr-2" />
              Rejeitar
            </Button>
          )}

          {onIntegrate && (
            <Button type="button" onClick={onIntegrate} variant="default" className="bg-primary">
              <FileCheck className="h-4 w-4 mr-2" />
              Integrar ao Financeiro
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};
