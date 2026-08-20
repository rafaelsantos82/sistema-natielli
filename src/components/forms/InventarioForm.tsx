import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useEstoque } from '@/hooks/useEstoque';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const inventarioSchema = z.object({
  data: z.string().min(1, 'Data é obrigatória'),
  responsavel_id: z.string().min(1, 'Responsável é obrigatório'),
  responsavel_nome: z.string().min(1, 'Nome do responsável é obrigatório'),
  contagens: z.array(
    z.object({
      item_id: z.string(),
      item_nome: z.string(),
      estoque_sistema: z.number(),
      contagem_fisica: z.coerce.number().min(0, 'Contagem não pode ser negativa'),
      divergencia: z.number(),
    })
  ),
  observacoes: z.string().optional(),
});

type InventarioFormData = z.infer<typeof inventarioSchema>;

interface InventarioFormProps {
  onSubmit: (data: InventarioFormData) => void;
}

export const InventarioForm = ({ onSubmit }: InventarioFormProps) => {
  const { itens } = useEstoque();
  const { user } = useAuth();

  const form = useForm<InventarioFormData>({
    resolver: zodResolver(inventarioSchema),
    defaultValues: {
      data: new Date().toISOString().split('T')[0],
      responsavel_id: user?.id ?? '',
      responsavel_nome: user?.name ?? user?.email ?? '',
      contagens: itens
        .filter((i) => i.status === 'Ativo')
        .map((item) => ({
          item_id: item.id,
          item_nome: item.nome,
          estoque_sistema: item.estoque_atual,
          contagem_fisica: item.estoque_atual,
          divergencia: 0,
        })),
      observacoes: '',
    },
  });

  const { fields, update } = useFieldArray({
    control: form.control,
    name: 'contagens',
  });

  const handleContagemChange = (index: number, value: number) => {
    const contagem = fields[index];
    const divergencia = value - contagem.estoque_sistema;
    update(index, {
      ...contagem,
      contagem_fisica: value,
      divergencia,
    });
  };

  const totalDivergencias = fields.filter((c) => c.divergencia !== 0).length;
  const totalItens = fields.length;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItens}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Divergências</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{totalDivergencias}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Conformidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {totalItens > 0 ? Math.round(((totalItens - totalDivergencias) / totalItens) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className={cn(
                'grid grid-cols-4 gap-4 items-center p-3 rounded-lg border',
                field.divergencia !== 0 ? 'bg-warning/10 border-warning' : 'bg-card'
              )}
            >
              <div>
                <p className="text-sm font-medium">{field.item_nome}</p>
                <p className="text-xs text-muted-foreground">
                  ID: {field.item_id.slice(0, 8)}
                </p>
              </div>

              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Sistema</p>
                <Badge variant="secondary">{field.estoque_sistema}</Badge>
              </div>

              <div>
                <FormField
                  control={form.control}
                  name={`contagens.${index}.contagem_fisica`}
                  render={({ field: inputField }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Contagem"
                          {...inputField}
                          onChange={(e) => {
                            inputField.onChange(e);
                            handleContagemChange(index, Number(e.target.value));
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="text-center">
                {field.divergencia === 0 ? (
                  <div className="flex items-center justify-center gap-1 text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">OK</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1 text-warning">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {field.divergencia > 0 ? '+' : ''}
                      {field.divergencia}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Adicione observações sobre o inventário..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit">Finalizar Inventário</Button>
        </div>
      </form>
    </Form>
  );
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
