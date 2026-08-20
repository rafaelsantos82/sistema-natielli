import { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FormModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: () => void;
  /** ID do elemento form a submeter (evita querySelector pegar outro modal). */
  submitFormId?: string;
  onReset?: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  isSubmitting?: boolean;
  submitLabel?: string;
  showReset?: boolean;
  hideFooter?: boolean;
}

const sizeClasses = {
  sm: 'max-w-[24rem]',
  md: 'max-w-[28rem]',
  lg: 'max-w-[34rem]',
  xl: 'max-w-[38rem]',
  '2xl': 'max-w-[44rem]',
  '4xl': 'max-w-[68rem]',
};

export const FormModal = ({
  title,
  isOpen,
  onClose,
  onSubmit,
  submitFormId,
  onReset,
  children,
  size = 'lg',
  isSubmitting = false,
  submitLabel = 'Salvar',
  showReset = true,
  hideFooter = false,
}: FormModalProps) => {
  const handleFooterSubmit = () => {
    if (submitFormId) {
      document.getElementById(submitFormId)?.requestSubmit();
      return;
    }
    onSubmit?.();
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${sizeClasses[size]} max-h-[90vh]`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-180px)] -mx-1">
          <div className="space-y-4 px-3 py-2">
            {children}
          </div>
        </ScrollArea>

        {!hideFooter && (
          <DialogFooter className="gap-2">
            {showReset && onReset && (
              <Button
                type="button"
                variant="outline"
                onClick={onReset}
                disabled={isSubmitting}
              >
                Limpar
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            {(onSubmit || submitFormId) && (
              <Button
                type="button"
                onClick={handleFooterSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : submitLabel}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
