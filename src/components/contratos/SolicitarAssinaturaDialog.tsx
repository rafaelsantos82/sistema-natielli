import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signatarioSchema } from '@/lib/validations/contrato.schema';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, PenTool, Plus, Trash2 } from 'lucide-react';

const solicitarSchema = z.object({
  mensagem: z.string().max(2000).optional(),
  expira_em_horas: z.coerce.number().int().min(1).max(720).default(168),
  signatarios: z.array(signatarioSchema).min(1, 'Informe ao menos um signatário'),
});

export type SolicitarAssinaturaFormData = z.infer<typeof solicitarSchema>;

const TIPOS_SIGN = ['Paciente', 'Responsável Legal', 'Profissional', 'Testemunha'] as const;

interface SolicitarAssinaturaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo?: string;
  isSubmitting?: boolean;
  onConfirm: (data: SolicitarAssinaturaFormData) => void;
}

export function SolicitarAssinaturaDialog({
  open,
  onOpenChange,
  titulo,
  isSubmitting,
  onConfirm,
}: SolicitarAssinaturaDialogProps) {
  const form = useForm<SolicitarAssinaturaFormData>({
    resolver: zodResolver(solicitarSchema),
    defaultValues: {
      mensagem: '',
      expira_em_horas: 168,
      signatarios: [
        { nome: '', email: '', tipo: 'Paciente', cpf: '', parentesco: '', ordem: 1 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'signatarios',
  });

  const submit = form.handleSubmit((data) => {
    const signatarios = data.signatarios.map((s, i) => ({
      ...s,
      ordem: i + 1,
    }));
    onConfirm({ ...data, signatarios });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitar assinatura</DialogTitle>
        </DialogHeader>
        {titulo && <p className="text-sm text-muted-foreground">{titulo}</p>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Mensagem (opcional)</Label>
            <Textarea rows={2} {...form.register('mensagem')} />
          </div>
          <div>
            <Label>Validade dos links (horas)</Label>
            <Input
              type="number"
              min={1}
              max={720}
              {...form.register('expira_em_horas', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Signatários</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    nome: '',
                    email: '',
                    tipo: 'Paciente',
                    cpf: '',
                    parentesco: '',
                    ordem: fields.length + 1,
                  })
                }
              >
                <Plus className="h-3 w-3 mr-1" />
                Adicionar
              </Button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Signatário {index + 1}</span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Input placeholder="Nome" {...form.register(`signatarios.${index}.nome`)} />
                <Input
                  placeholder="E-mail"
                  type="email"
                  {...form.register(`signatarios.${index}.email`)}
                />
                <Select
                  value={form.watch(`signatarios.${index}.tipo`)}
                  onValueChange={(v) =>
                    form.setValue(`signatarios.${index}.tipo`, v as typeof TIPOS_SIGN[number])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_SIGN.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.watch(`signatarios.${index}.tipo`) === 'Responsável Legal' && (
                  <Input
                    placeholder="Parentesco"
                    {...form.register(`signatarios.${index}.parentesco`)}
                  />
                )}
                <Input
                  placeholder="CPF (opcional)"
                  {...form.register(`signatarios.${index}.cpf`)}
                />
              </div>
            ))}
            {form.formState.errors.signatarios?.message && (
              <p className="text-sm text-destructive">
                {form.formState.errors.signatarios.message}
              </p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Após enviar, copie os links gerados e envie aos signatários (e-mail em fase futura).
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <PenTool className="h-4 w-4 mr-2" />
              )}
              Gerar links
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
