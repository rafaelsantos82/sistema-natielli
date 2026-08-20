import { useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useContratoCompartilhadoPublic,
  useRecordAcessoCompartilhado,
} from '@/hooks/useContratos';
import { useContratoArquivoBlob } from '@/hooks/useContratoArquivoBlob';
import { downloadContratoCompartilhado } from '@/lib/api/contratos';
import { ContratoDocumentoPreview } from '@/components/contratos/ContratoDocumentoPreview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Download, Shield, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ContratoCompartilhado() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useContratoCompartilhadoPublic(token);
  const recordAcesso = useRecordAcessoCompartilhado();
  const acessoRegistrado = useRef(false);

  const fetchBlob = useCallback(() => {
    if (!token) return Promise.reject(new Error('missing token'));
    return downloadContratoCompartilhado(token);
  }, [token]);

  const hasArquivo = Boolean(data?.tem_arquivo);
  const hasDocumento = hasArquivo || Boolean(data?.conteudo);

  const { blobUrl, loading: blobLoading, error: blobError, isPdf, download } =
    useContratoArquivoBlob(
      fetchBlob,
      Boolean(token && data && hasArquivo),
      data?.arquivo_mime,
    );

  useEffect(() => {
    if (token && data && !acessoRegistrado.current) {
      acessoRegistrado.current = true;
      recordAcesso.mutate(token);
    }
  }, [token, data, recordAcesso]);

  const handleDownload = () => {
    if (!data) return;
    if (hasArquivo) {
      download(data.arquivo_nome ?? `${data.titulo}.pdf`);
      return;
    }
    if (!data.conteudo) return;
    const element = document.createElement('a');
    const file = new Blob([data.conteudo], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${data.titulo || 'contrato'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (isError || (!isLoading && !data)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Acesso negado</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>Link inválido ou expirado.</AlertDescription>
            </Alert>
            <Button onClick={() => navigate('/')} className="w-full mt-4" variant="outline">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Carregando contrato...</p>
        </div>
      </div>
    );
  }

  const expiresAt = new Date(data.expira_em);
  const hoursRemaining = Math.max(
    0,
    Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)),
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">Documento compartilhado</h1>
              <p className="text-sm text-muted-foreground">Acesso seguro e temporário</p>
            </div>
          </div>
          {hasDocumento && (
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Baixar
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4">
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Expira em aproximadamente <strong>{hoursRemaining} hora(s)</strong>
          </AlertDescription>
        </Alert>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <CardTitle className="text-2xl">{data.titulo}</CardTitle>
                <Badge variant={data.status === 'Assinado' ? 'default' : 'secondary'}>
                  {data.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{data.tipo}</Badge>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <ContratoDocumentoPreview
              conteudo={data.conteudo}
              tem_arquivo={hasArquivo}
              arquivo_nome={data.arquivo_nome}
              arquivo_mime={data.arquivo_mime}
              blobUrl={blobUrl}
              loading={hasArquivo && blobLoading}
              error={blobError}
              isPdf={isPdf}
              onDownload={() => download(data.arquivo_nome ?? `${data.titulo}.pdf`)}
              maxHeightClass="max-h-[70vh]"
            />
          </CardContent>
        </Card>

        {data.paciente_nome && (
          <Card className="mt-4">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Paciente</p>
              <p className="font-medium">{data.paciente_nome}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="border-t bg-muted/30 py-6 mt-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-muted-foreground space-y-1">
          <p>O acesso a este link é registrado para fins de auditoria.</p>
          <p>Para imprimir, baixe o arquivo e use seu leitor local.</p>
          <p>
            Expira em {format(expiresAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>
    </div>
  );
}
