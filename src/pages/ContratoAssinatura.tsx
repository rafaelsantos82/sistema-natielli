import { useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContratoAssinaturaPublic, useAceitarAssinatura } from '@/hooks/useContratos';
import { useContratoArquivoBlob } from '@/hooks/useContratoArquivoBlob';
import { downloadContratoAssinatura } from '@/lib/api/contratos';
import { ContratoDocumentoPreview } from '@/components/contratos/ContratoDocumentoPreview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, PenTool, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

export default function ContratoAssinatura() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useContratoAssinaturaPublic(token);
  const aceitar = useAceitarAssinatura();
  const [observacoes, setObservacoes] = useState('');
  const [done, setDone] = useState(false);

  const fetchBlob = useCallback(() => {
    if (!token) return Promise.reject(new Error('missing token'));
    return downloadContratoAssinatura(token);
  }, [token]);

  const hasArquivo = Boolean(data?.tem_arquivo);

  const { blobUrl, loading: blobLoading, error: blobError, isPdf, download } =
    useContratoArquivoBlob(
      fetchBlob,
      Boolean(token && data && hasArquivo),
      data?.arquivo_mime,
    );

  const handleAceitar = async () => {
    if (!token) return;
    try {
      await aceitar.mutateAsync({ token, observacoes });
      setDone(true);
      toast.success('Assinatura registrada com sucesso');
      void refetch();
    } catch {
      toast.error('Não foi possível registrar a assinatura');
    }
  };

  if (isError || (!isLoading && !data)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Link inválido</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>Token de assinatura inválido ou expirado.</AlertDescription>
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const jaAssinado = data.ja_assinado || done;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-semibold">Assinatura eletrônica</h1>
            <p className="text-sm text-muted-foreground">{data.contrato_titulo}</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{data.contrato_titulo}</CardTitle>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">{data.contrato_tipo}</Badge>
              <span>Signatário: {data.signatario_nome}</span>
              <span>({data.signatario_email})</span>
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
              onDownload={() =>
                download(data.arquivo_nome ?? `${data.contrato_titulo}.pdf`)
              }
              maxHeightClass="max-h-[40vh]"
            />
          </CardContent>
        </Card>

        {jaAssinado ? (
          <Alert className="border-success/50 bg-success/10">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <AlertDescription>
              Você já registrou seu aceite neste contrato. Obrigado.
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Ao clicar em aceitar, você declara ter lido e concordado com o conteúdo acima
                (aceite eletrônico simples, sem certificado ICP neste fluxo).
              </p>
              <div>
                <Label htmlFor="obs">Observações (opcional)</Label>
                <Textarea
                  id="obs"
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={handleAceitar}
                disabled={aceitar.isPending}
              >
                <PenTool className="h-4 w-4 mr-2" />
                Aceitar e assinar
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
