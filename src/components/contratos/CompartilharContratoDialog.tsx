import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  compartilhamentoSchema,
  type CompartilhamentoFormData,
} from '@/lib/validations/contrato.schema';
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
import { Loader2, Share2 } from 'lucide-react';

interface CompartilharContratoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo?: string;
  isSubmitting?: boolean;
  onConfirm: (data: CompartilhamentoFormData) => void;
}

export function CompartilharContratoDialog({
  open,
  onOpenChange,
  titulo,
  isSubmitting,
  onConfirm,
}: CompartilharContratoDialogProps) {
  const form = useForm<CompartilhamentoFormData>({
    resolver: zodResolver(compartilhamentoSchema),
    defaultValues: {
      expiracao_horas: 72,
    },
  });

  const submit = form.handleSubmit((data) => onConfirm(data));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar contrato</DialogTitle>
        </DialogHeader>
        {titulo && (
          <p className="text-sm text-muted-foreground truncate">{titulo}</p>
        )}
        <p className="text-sm text-muted-foreground">
          O link permite visualizar e baixar o documento.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="expiracao_horas">Validade (horas)</Label>
            <Input
              id="expiracao_horas"
              type="number"
              min={1}
              max={720}
              {...form.register('expiracao_horas', { valueAsNumber: true })}
            />
            {form.formState.errors.expiracao_horas && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.expiracao_horas.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Share2 className="h-4 w-4 mr-2" />
              )}
              Gerar link
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
