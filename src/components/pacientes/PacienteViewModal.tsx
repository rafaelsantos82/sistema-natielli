import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Edit, Loader2, X } from 'lucide-react';
import {
  PacienteDetalheView,
  type PacienteDetalheExtras,
} from '@/components/pacientes/PacienteDetalheView';
import type { PacienteListRow } from '@/hooks/usePacientes';
import type { PacienteFormData } from '@/lib/validations/paciente.schema';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  listRow: PacienteListRow | null;
  formData?: PacienteFormData;
  extras?: PacienteDetalheExtras;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onEdit?: (item: PacienteListRow) => void;
  canEdit?: boolean;
}

export const PacienteViewModal = ({
  isOpen,
  onClose,
  listRow,
  formData,
  extras,
  isLoading,
  isError,
  errorMessage,
  onEdit,
  canEdit = true,
}: Props) => {
  if (!listRow) return null;

  const nomeTitulo = formData?.nome_completo ?? listRow.nome;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] max-w-[68rem] flex-col gap-0 overflow-hidden p-0 sm:max-w-[68rem]">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>Visualizar paciente</DialogTitle>
          <DialogDescription className="truncate">{nomeTitulo}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
          {isLoading && (
            <div className="flex min-h-[200px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {isError && !isLoading && (
            <Alert variant="destructive">
              <AlertDescription>
                {errorMessage ?? 'Não foi possível carregar os dados do paciente.'}
              </AlertDescription>
            </Alert>
          )}

          {!isLoading && !isError && formData && (
            <PacienteDetalheView data={formData} extras={extras} />
          )}
        </div>

        <DialogFooter className="shrink-0 flex-col gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
            <X className="mr-1 h-4 w-4" />
            Fechar
          </Button>
          {canEdit && onEdit && (
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={isLoading || isError || !formData}
              onClick={() => onEdit(listRow)}
            >
              <Edit className="mr-1 h-4 w-4" />
              Editar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
