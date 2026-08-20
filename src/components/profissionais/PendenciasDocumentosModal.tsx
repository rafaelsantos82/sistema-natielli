import { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Upload, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getErrorToastProps } from '@/lib/ui/showErrorToast';
import {
  useProfissionalDocumentos,
  PROFISSIONAL_DOCS_OBRIGATORIOS,
  DOCUMENTO_CATEGORIA_LABEL,
  type DocumentoCategoria,
} from '@/hooks/useProfissionalDocumentos';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useAuth } from '@/contexts/AuthContext';
import { PROFISSIONAL_DOC_ACCEPT, PROFISSIONAL_DOC_ALLOWED_LABEL } from '@/lib/uploads/profissionalDocPolicy';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profissionalId: string;
  profissionalNome?: string;
}

/**
 * Modal acionado pelo badge "Pendências" na tabela de Profissionais.
 * Lista os obrigatórios + status individual e permite enviar/atualizar
 * cada documento sem sair da listagem.
 */
export const PendenciasDocumentosModal = ({
  isOpen,
  onClose,
  profissionalId,
  profissionalNome,
}: Props) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { ativosPorCategoria, uploadAsync, download } = useProfissionalDocumentos();
  const { log } = useAuditLog();

  const [uploadCategoria, setUploadCategoria] = useState<DocumentoCategoria | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const triggerUpload = (cat: DocumentoCategoria) => {
    setUploadCategoria(cat);
    // permitir o setState antes do click
    setTimeout(() => inputRef.current?.click(), 0);
  };

  const handleFile = async (file: File | null) => {
    if (!file || !uploadCategoria) return;
    try {
      const ativos = ativosPorCategoria(profissionalId, uploadCategoria);
      const substitui = ativos[0]?.id;
      const doc = await uploadAsync({
        profissionalId,
        categoria: uploadCategoria,
        file,
        uploadedBy: user?.name ?? 'sistema',
        substitui,
      });
      try {
        log({
          actor_id: user?.id ?? 'sistema',
          actor_name: user?.name ?? 'sistema',
          actor_role: user?.role ?? 'sistema',
          acao: 'documento.upload',
          entidade: 'profissional_documento',
          entidade_id: doc.id,
          diff: {
            origem: 'pendencias_modal',
            categoria: uploadCategoria,
            versao: doc.versao,
            substitui,
            nomeArquivo: doc.nomeArquivo,
          },
        });
      } catch {
        /* audit não bloqueia */
      }
      toast({
        title: substitui ? 'Documento atualizado' : 'Documento enviado',
        description: `${DOCUMENTO_CATEGORIA_LABEL[uploadCategoria]} — v${doc.versao}`,
      });
    } catch (err) {
      toast(getErrorToastProps(err, { action: 'enviar', entity: 'o documento' }));
    } finally {
      setUploadCategoria(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle>Pendências documentais</DialogTitle>
          <DialogDescription>
            {profissionalNome
              ? `Documentos obrigatórios de ${profissionalNome}.`
              : 'Documentos obrigatórios do profissional.'}
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept={PROFISSIONAL_DOC_ACCEPT}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />

        <ul className="divide-y overflow-hidden rounded-md border">
          {PROFISSIONAL_DOCS_OBRIGATORIOS.map((cat) => {
            const ativos = ativosPorCategoria(profissionalId, cat);
            const atual = ativos[0];
            const ok = !!atual;
            return (
              <li key={cat} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 min-w-0">
                <div className="flex items-start gap-2 min-w-0 flex-1 overflow-hidden">
                  {ok ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {DOCUMENTO_CATEGORIA_LABEL[cat]}
                    </p>
                    {atual ? (
                      <div className="mt-0.5 flex min-w-0 items-start gap-1.5 text-muted-foreground">
                        <FileText className="h-3 w-3 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            className="block w-full truncate text-left text-xs hover:underline"
                            title={atual.nomeArquivo}
                            onClick={() => void download(profissionalId, atual)}
                          >
                            {atual.nomeArquivo}
                          </button>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              v{atual.versao}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-destructive">Pendente</p>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={ok ? 'outline' : 'default'}
                  className="shrink-0 self-end sm:self-center"
                  onClick={() => triggerUpload(cat)}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  {ok ? 'Atualizar' : 'Enviar'}
                </Button>
              </li>
            );
          })}
        </ul>

        <p className="text-xs text-muted-foreground">
          Aceito: {PROFISSIONAL_DOC_ALLOWED_LABEL}. Toda alteração é registrada no log de
          auditoria.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
