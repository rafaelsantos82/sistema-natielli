import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, Download, FileText, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getErrorToastProps } from '@/lib/ui/showErrorToast';
import { featureFlags } from '@/lib/featureFlags';
import {
  useProfissionalDocumentos,
  DOCUMENTO_CATEGORIA_LABEL,
  type DocumentoCategoria,
  type ProfissionalDocumento,
} from '@/hooks/useProfissionalDocumentos';

const CATEGORIAS: DocumentoCategoria[] = [
  'documento_pessoal',
  'registro_profissional',
  'comprovante',
  'contrato',
  'outro',
];

interface Props {
  profissionalId: string;
}

export const ProfissionalDocumentosLista = ({ profissionalId }: Props) => {
  const { toast } = useToast();
  const { ativosPorCategoria, download, statusObrigatorios, isLoading } =
    useProfissionalDocumentos();

  const status = statusObrigatorios(profissionalId);
  const apiEnabled = featureFlags.profissionaisApiEnabled;

  const handleDownload = async (doc: ProfissionalDocumento) => {
    try {
      await download(profissionalId, doc);
    } catch (err) {
      toast(getErrorToastProps(err, { action: 'baixar', entity: 'o documento' }));
    }
  };

  if (!apiEnabled) {
    return (
      <p className="text-sm text-muted-foreground">
        Documentos disponíveis quando a integração com a API estiver ativa.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!status.completos && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Documentos obrigatórios pendentes</AlertTitle>
          <AlertDescription>
            Faltam:{' '}
            {status.pendentes.map((c) => DOCUMENTO_CATEGORIA_LABEL[c]).join(', ')}.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-5">
        {CATEGORIAS.map((cat) => {
          const docs = ativosPorCategoria(profissionalId, cat);
          return (
            <div key={cat} className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-medium">{DOCUMENTO_CATEGORIA_LABEL[cat]}</h4>
                <Badge variant="secondary" className="text-xs">
                  {docs.length}
                </Badge>
              </div>
              {docs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum documento nesta categoria.
                </p>
              ) : (
                <ul className="divide-y rounded-md border">
                  {docs.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex flex-col gap-2 p-3 min-w-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-2">
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p
                            className="truncate text-sm font-medium"
                            title={doc.nomeArquivo}
                          >
                            {doc.nomeArquivo}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline">v{doc.versao}</Badge>
                            {doc.obrigatorio && (
                              <Badge variant="secondary">Obrigatório</Badge>
                            )}
                            <span>{(doc.tamanhoBytes / 1024).toFixed(0)} KB</span>
                            <span>
                              {format(new Date(doc.uploadedAt), 'dd/MM/yyyy HH:mm', {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="shrink-0 self-end sm:self-center"
                        onClick={() => void handleDownload(doc)}
                      >
                        <Download className="mr-1 h-4 w-4" />
                        Baixar
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
