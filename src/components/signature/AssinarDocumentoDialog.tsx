import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, AlertCircle } from 'lucide-react';
import { useUnidadeAtiva } from '@/contexts/UnidadeContext';
import { useChaveDigital } from '@/hooks/useChaveDigital';
import { useDocumentosAssinadosMutations } from '@/hooks/useDocumentosAssinados';
import type { DocumentoAssinadoType } from '@/lib/api/documentosAssinados.types';
import { downloadDocumentoAssinado } from '@/lib/api/documentosAssinados';

interface AssinarDocumentoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentBytes: Uint8Array;
  documentName: string;
  documentType: DocumentoAssinadoType;
  /** Se true, baixa o PDF assinado após sucesso. */
  downloadAfterSign?: boolean;
  onSignatureComplete?: (docId: string) => void;
}

export function AssinarDocumentoDialog({
  isOpen,
  onClose,
  documentBytes,
  documentName,
  documentType,
  downloadAfterSign = true,
  onSignatureComplete,
}: AssinarDocumentoDialogProps) {
  const { unidadeAtiva, unidadeAtivaId } = useUnidadeAtiva();
  const { data: chave, isLoading: chaveLoading } = useChaveDigital(unidadeAtivaId);
  const { assinarMutation } = useDocumentosAssinadosMutations(unidadeAtivaId);
  const [signing, setSigning] = useState(false);

  const semChave = !chaveLoading && !chave;

  const handleConfirm = async () => {
    if (!unidadeAtivaId || semChave) return;
    setSigning(true);
    try {
      const blob = new Blob([documentBytes], { type: 'application/pdf' });
      const doc = await assinarMutation.mutateAsync({
        file: blob,
        name: documentName,
        type: documentType,
      });
      if (downloadAfterSign) {
        const pdf = await downloadDocumentoAssinado(doc.id);
        const url = URL.createObjectURL(pdf);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${documentName}_assinado.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
      onSignatureComplete?.(doc.id);
      onClose();
    } finally {
      setSigning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Assinar documento
          </DialogTitle>
          <DialogDescription>
            O documento será assinado com a chave digital ICP-Brasil da unidade{' '}
            <strong>{unidadeAtiva?.nome ?? 'ativa'}</strong>. Não é necessário informar senha.
          </DialogDescription>
        </DialogHeader>

        {chaveLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : semChave ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Não há chave digital cadastrada para esta unidade. Um administrador ou gestor deve
              cadastrar o certificado em{' '}
              <Link
                to="/configuracoes/chave-digital"
                className="font-medium underline underline-offset-2"
                onClick={onClose}
              >
                Administração → Chave Digital
              </Link>
              .
            </AlertDescription>
          </Alert>
        ) : (
          <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Titular: </span>
              {chave.signer_common_name}
            </p>
            <p>
              <span className="text-muted-foreground">Válido até: </span>
              {new Date(chave.cert_valid_to).toLocaleDateString('pt-BR')}
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={signing}>
            Cancelar
          </Button>
          <Button
            onClick={() => void handleConfirm()}
            disabled={semChave || chaveLoading || signing || assinarMutation.isPending}
          >
            {(signing || assinarMutation.isPending) && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Assinar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
