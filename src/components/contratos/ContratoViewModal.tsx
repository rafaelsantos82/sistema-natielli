import { useCallback, useState } from 'react';
import { FormModal } from '@/components/common/FormModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useContratoDetail } from '@/hooks/useContratos';
import { useContratoArquivoBlob } from '@/hooks/useContratoArquivoBlob';
import { downloadContrato } from '@/lib/api/contratos';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Shield } from 'lucide-react';
import { AssinarDocumentoDialog } from '@/components/signature/AssinarDocumentoDialog';
import { ContratoDocumentoPreview } from '@/components/contratos/ContratoDocumentoPreview';
import type { ContratoListRow } from '@/lib/mappers/contratoMapper';

interface ContratoViewModalProps {
  contratoId: string | null;
  summary?: ContratoListRow | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ContratoViewModal({
  contratoId,
  summary,
  isOpen,
  onClose,
}: ContratoViewModalProps) {
  const { data: detail, isLoading } = useContratoDetail(isOpen ? contratoId : null);
  const contrato = detail ?? summary;
  const [icpOpen, setIcpOpen] = useState(false);

  const canEditIcp =
    contrato?.status === 'Rascunho' || contrato?.status === 'Recusado';

  const fetchBlob = useCallback(() => {
    if (!contratoId) return Promise.reject(new Error('missing id'));
    return downloadContrato(contratoId);
  }, [contratoId]);

  const hasArquivo = Boolean(contrato?.tem_arquivo);
  const {
    blobUrl,
    pdfBytes,
    loading: blobLoading,
    error: blobError,
    isPdf,
    download,
  } = useContratoArquivoBlob(
    fetchBlob,
    isOpen && hasArquivo && Boolean(contratoId),
    contrato?.arquivo_mime,
  );

  const showLoading = isLoading && !contrato;
  const showContentLoading = hasArquivo && blobLoading && !blobUrl && !contrato?.conteudo;

  return (
    <>
      <FormModal
        title="Visualizar contrato"
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        hideFooter
      >
        {showLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : contrato ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold">{contrato.titulo}</h3>
                <p className="text-sm text-muted-foreground">
                  {contrato.tipo}
                  {contrato.criado_em &&
                    ` · ${format(new Date(contrato.criado_em), 'dd/MM/yyyy', { locale: ptBR })}`}
                </p>
              </div>
              <Badge>{contrato.status}</Badge>
            </div>
            {(contrato.paciente_nome || contrato.profissional_nome) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {contrato.paciente_nome && (
                  <div>
                    <span className="text-muted-foreground">Paciente: </span>
                    {contrato.paciente_nome}
                  </div>
                )}
                {contrato.profissional_nome && (
                  <div>
                    <span className="text-muted-foreground">Profissional: </span>
                    {contrato.profissional_nome}
                  </div>
                )}
              </div>
            )}
            {contrato.arquivo_nome && (
              <p className="text-sm text-muted-foreground">
                Arquivo: <span className="font-medium">{contrato.arquivo_nome}</span>
              </p>
            )}
            {showContentLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ContratoDocumentoPreview
                conteudo={contrato.conteudo}
                tem_arquivo={hasArquivo}
                arquivo_nome={contrato.arquivo_nome}
                arquivo_mime={contrato.arquivo_mime}
                blobUrl={blobUrl}
                loading={false}
                error={blobError}
                isPdf={isPdf}
                onDownload={() =>
                  download(contrato.arquivo_nome ?? `${contrato.titulo}.pdf`)
                }
              />
            )}
            {canEditIcp && pdfBytes && isPdf && (
              <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={() => setIcpOpen(true)}>
                  <Shield className="h-4 w-4 mr-2" />
                  Assinar com certificado (ICP)
                </Button>
              </div>
            )}
            {canEditIcp && hasArquivo && !isPdf && (
              <p className="text-xs text-muted-foreground">
                Assinatura ICP-Brasil está disponível apenas para contratos em PDF.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Aceite eletrônico via link de signatário é independente da assinatura ICP-Brasil com
              chave da unidade.
            </p>
          </div>
        ) : null}
      </FormModal>
      {pdfBytes && contrato && (
        <AssinarDocumentoDialog
          isOpen={icpOpen}
          onClose={() => setIcpOpen(false)}
          documentBytes={pdfBytes}
          documentName={contrato.arquivo_nome ?? `${contrato.titulo}.pdf`}
          documentType="atestado"
          downloadAfterSign
        />
      )}
    </>
  );
}
