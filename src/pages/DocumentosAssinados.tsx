import { useState } from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Download,
  Shield,
  CheckCircle2,
  XCircle,
  FileText,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUnidadeAtiva } from '@/contexts/UnidadeContext';
import {
  useDocumentosAssinadosList,
  useDocumentosAssinadosMutations,
  type DocumentoAssinadoDTO,
} from '@/hooks/useDocumentosAssinados';
import { featureFlags } from '@/lib/featureFlags';
import { formatQueryError } from '@/lib/api/formatApiError';
import type { VerifyAssinaturaResult } from '@/lib/api/documentosAssinados.types';

const TYPE_LABELS: Record<string, string> = {
  prontuario: 'Prontuário',
  prescricao: 'Prescrição',
  atestado: 'Atestado',
};

export default function DocumentosAssinados() {
  const { toast } = useToast();
  const { unidadeAtiva, unidadeAtivaId } = useUnidadeAtiva();
  const { data, isLoading, isError, error } = useDocumentosAssinadosList(unidadeAtivaId);
  const { verificarMutation, downloadMutation } = useDocumentosAssinadosMutations(unidadeAtivaId);

  const documents = data?.items ?? [];

  const [selectedDoc, setSelectedDoc] = useState<DocumentoAssinadoDTO | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerifyAssinaturaResult | null>(
    null,
  );

  const handleDownload = (doc: DocumentoAssinadoDTO) => {
    downloadMutation.mutate({
      id: doc.id,
      filename: `${doc.name}_assinado.pdf`,
    });
  };

  const handleVerify = async (doc: DocumentoAssinadoDTO) => {
    try {
      const result = await verificarMutation.mutateAsync(doc.id);
      setVerificationResult(result);
      setSelectedDoc(doc);

      if (result.valid) {
        toast({ title: 'Assinatura Válida', description: result.message });
      } else {
        toast({
          title: 'Assinatura Inválida',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch {
      /* toast via mutation */
    }
  };

  if (!featureFlags.documentosAssinadosApiEnabled) {
    return (
      <MainLayout title="Documentos Assinados">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Integração com API desabilitada (VITE_API_DOCUMENTOS_ASSINADOS=false).
          </AlertDescription>
        </Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Documentos Assinados">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Repositório de Documentos Assinados Digitalmente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Documentos assinados com a chave digital ICP-Brasil da unidade{' '}
              <strong>{unidadeAtiva?.nome ?? 'ativa'}</strong>. Use Verificar para validar
              autenticidade no servidor.
            </p>
            <p className="text-xs text-muted-foreground">
              Documentos antigos salvos apenas no navegador (localStorage) não aparecem aqui.{' '}
              <Link to="/configuracoes/chave-digital" className="underline">
                Cadastrar chave digital
              </Link>
            </p>
          </CardContent>
        </Card>

        {isError && (
          <Alert variant="destructive">
            <AlertDescription>{formatQueryError(error)}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Carregando documentos…
            </CardContent>
          </Card>
        ) : documents.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum documento assinado nesta unidade</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {documents.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold truncate">{doc.name}</h3>
                        <Badge variant="secondary">
                          {TYPE_LABELS[doc.type] ?? doc.type}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Assinado por</p>
                          <p className="font-medium">{doc.signer_common_name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Data/Hora</p>
                          <p className="font-medium">
                            {format(new Date(doc.signed_at), 'dd/MM/yyyy HH:mm')}
                          </p>
                        </div>
                        {doc.signer_org && (
                          <div>
                            <p className="text-muted-foreground">Organização</p>
                            <p className="font-medium">{doc.signer_org}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-muted-foreground">Algoritmo</p>
                          <p className="font-medium">{doc.algorithm}</p>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground break-all">
                        Hash: {doc.document_hash.substring(0, 48)}…
                      </p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleVerify(doc)}
                        disabled={verificarMutation.isPending}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Verificar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(doc)}
                        disabled={downloadMutation.isPending}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {verificationResult?.valid ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    Assinatura Válida
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-destructive" />
                    Assinatura Inválida
                  </>
                )}
              </DialogTitle>
            </DialogHeader>

            {selectedDoc && verificationResult && (
              <div className="space-y-4">
                <p className="text-sm">{verificationResult.message}</p>

                <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                  <h4 className="font-semibold text-sm">Detalhes da Assinatura</h4>
                  <div className="grid gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Assinante</p>
                      <p className="font-medium">{selectedDoc.signer_common_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Certificado válido até</p>
                      <p className="font-medium">
                        {format(new Date(selectedDoc.cert_valid_to), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Emissor</p>
                      <p className="font-medium">{selectedDoc.cert_issuer}</p>
                    </div>
                  </div>
                </div>

                {verificationResult.valid && (
                  <div className="flex items-start gap-2 p-3 bg-success/10 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Documento Autêntico</p>
                      <p className="text-muted-foreground">
                        A assinatura foi validada no servidor com a chave da unidade.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
