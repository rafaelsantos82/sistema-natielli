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
import { SalaDetalheView } from '@/components/salas/SalaDetalheView';
import type { Sala } from '@/hooks/useSalas';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sala: Sala | null;
  onEdit: (sala: Sala) => void;
}

export const SalaViewModal = ({ isOpen, onClose, sala, onEdit }: Props) => {
  if (!sala) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] max-w-[68rem] flex-col gap-0 overflow-hidden p-0 sm:max-w-[68rem]">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>Visualizar sala</DialogTitle>
          <DialogDescription className="truncate">{sala.nome_sala}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
          <SalaDetalheView sala={sala} />
        </div>

        <DialogFooter className="shrink-0 flex-col gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
            <X className="mr-1 h-4 w-4" />
            Fechar
          </Button>
          <Button type="button" className="w-full sm:w-auto" onClick={() => onEdit(sala)}>
            <Edit className="mr-1 h-4 w-4" />
            Editar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

