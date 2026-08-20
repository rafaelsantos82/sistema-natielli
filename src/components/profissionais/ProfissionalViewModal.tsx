import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit, X } from 'lucide-react';
import { ProfissionalDetalheView } from '@/components/profissionais/ProfissionalDetalheView';
import type { Profissional } from '@/hooks/useProfissionais';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profissional: Profissional | null;
  onEdit?: (profissional: Profissional) => void;
  canEdit?: boolean;
}

export const ProfissionalViewModal = ({
  isOpen,
  onClose,
  profissional,
  onEdit,
  canEdit = true,
}: Props) => {
  if (!profissional) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] max-w-[68rem] flex-col gap-0 overflow-hidden p-0 sm:max-w-[68rem]">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>Visualizar profissional</DialogTitle>
          <DialogDescription className="truncate">
            {profissional.nome}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
          <ProfissionalDetalheView profissional={profissional} />
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
              onClick={() => onEdit(profissional)}
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
