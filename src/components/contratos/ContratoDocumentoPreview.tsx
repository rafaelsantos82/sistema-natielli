import { Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContratoDocumentoPreviewProps {
  conteudo?: string;
  tem_arquivo?: boolean;
  arquivo_nome?: string;
  arquivo_mime?: string;
  blobUrl?: string | null;
  loading?: boolean;
  error?: string | null;
  isPdf?: boolean;
  onDownload?: () => void;
  maxHeightClass?: string;
}

export function ContratoDocumentoPreview({
  conteudo,
  tem_arquivo,
  arquivo_nome,
  blobUrl,
  loading,
  error,
  isPdf,
  onDownload,
  maxHeightClass = 'max-h-[50vh]',
}: ContratoDocumentoPreviewProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (tem_arquivo && isPdf && blobUrl) {
    return (
      <iframe
        title={arquivo_nome ?? 'Contrato'}
        src={blobUrl}
        className={`w-full border rounded-md ${maxHeightClass} min-h-[320px]`}
      />
    );
  }

  if (tem_arquivo && blobUrl && onDownload) {
    return (
      <div className="rounded-md border bg-muted/30 p-6 text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          Este formato não pode ser visualizado no navegador. Baixe o arquivo para abrir no Word ou
          leitor compatível.
        </p>
        {arquivo_nome && <p className="text-sm font-medium">{arquivo_nome}</p>}
        <Button type="button" variant="outline" onClick={onDownload}>
          <Download className="h-4 w-4 mr-2" />
          Baixar documento
        </Button>
      </div>
    );
  }

  if (conteudo) {
    return (
      <div className={`rounded-md border bg-muted/30 p-4 ${maxHeightClass} overflow-y-auto`}>
        <pre className="whitespace-pre-wrap text-sm font-sans">{conteudo}</pre>
      </div>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">Nenhum documento disponível para visualização.</p>
  );
}
