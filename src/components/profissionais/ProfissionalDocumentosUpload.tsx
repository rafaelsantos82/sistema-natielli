import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, Trash2, FileText, AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getErrorToastProps } from '@/lib/ui/showErrorToast';
import {
  useProfissionalDocumentos,
  DOCUMENTO_CATEGORIA_LABEL,
  PROFISSIONAL_DOCS_OBRIGATORIOS,
  type DocumentoCategoria,
  type ProfissionalDocumento,
} from '@/hooks/useProfissionalDocumentos';
import { useAuditLog } from '@/hooks/useAuditLog';

const CATEGORIAS: DocumentoCategoria[] = [
  'documento_pessoal',
  'registro_profissional',
  'comprovante',
  'contrato',
  'outro',
];

import { PROFISSIONAL_DOC_ACCEPT, PROFISSIONAL_DOC_ALLOWED_LABEL } from '@/lib/uploads/profissionalDocPolicy';

const ACEITOS_LABEL = PROFISSIONAL_DOC_ALLOWED_LABEL;

interface Props {
  profissionalId: string;
  uploadedBy?: string;
}

export const ProfissionalDocumentosUpload = ({
  profissionalId,
  uploadedBy = 'sistema',
}: Props) => {
  const { toast } = useToast();
  const { ativosPorCategoria, uploadAsync, remove, download, statusObrigatorios } = useProfissionalDocumentos();
  const { log } = useAuditLog();

  const [categoria, setCategoria] = useState<DocumentoCategoria>('documento_pessoal');
  const [substituiId, setSubstituiId] = useState<string | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);

  if (!profissionalId) {
    return (
      <p className="text-sm text-muted-foreground">
        Salve o profissional para anexar documentos.
      </p>
    );
  }

  const status = statusObrigatorios(profissionalId);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    try {
      const doc = await uploadAsync({
        profissionalId,
        categoria,
        file,
        uploadedBy,
        substitui: substituiId,
      });
      try {
        log({
        actor_id: uploadedBy,
        actor_name: uploadedBy,
        actor_role: 'clinica',
        acao: 'documento.upload',
        entidade: 'profissional_documento',
        entidade_id: doc.id,
        diff: {
          categoria,
          versao: doc.versao,
          substitui: substituiId,
          nomeArquivo: doc.nomeArquivo,
        },
      });
      } catch {
        /* audit não bloqueia upload */
      }
      setSubstituiId(undefined);
      toast({
        title: substituiId ? 'Nova versão enviada' : 'Documento enviado',
        description: `${DOCUMENTO_CATEGORIA_LABEL[categoria]} — v${doc.versao}`,
      });
    } catch (err) {
      toast(getErrorToastProps(err, { action: 'enviar', entity: 'o documento' }));
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async (doc: ProfissionalDocumento) => {
    try {
      await remove(doc.id, profissionalId);
      try {
        log({
          actor_id: uploadedBy,
          actor_name: uploadedBy,
          actor_role: 'clinica',
          acao: 'documento.exclusao',
          entidade: 'profissional_documento',
          entidade_id: doc.id,
          diff: { categoria: doc.categoria, nomeArquivo: doc.nomeArquivo },
        });
      } catch {
        /* audit não bloqueia */
      }
      toast({ title: 'Documento removido' });
    } catch (err) {
      toast(getErrorToastProps(err, { action: 'excluir', entity: 'o documento' }));
    }
  };

  const docsCategoriaAtual = ativosPorCategoria(profissionalId, categoria);

  return (
    <div className="space-y-4">
      {!status.completos && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Documentos obrigatórios pendentes</AlertTitle>
          <AlertDescription>
            Envie:{' '}
            {status.pendentes.map((c) => DOCUMENTO_CATEGORIA_LABEL[c]).join(', ')}. Sem eles, o
            profissional não poderá receber novos agendamentos.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
        <div className="md:col-span-2">
          <Label>Categoria</Label>
          <Select
            value={categoria}
            onValueChange={(v) => {
              setCategoria(v as DocumentoCategoria);
              setSubstituiId(undefined);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIAS.map((c) => (
                <SelectItem key={c} value={c}>
                  {DOCUMENTO_CATEGORIA_LABEL[c]}
                  {PROFISSIONAL_DOCS_OBRIGATORIOS.includes(c) ? ' *' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={PROFISSIONAL_DOC_ACCEPT}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            className="w-full"
            onClick={() => inputRef.current?.click()}
          >
            {substituiId ? (
              <>
                <RefreshCw className="h-4 w-4 mr-1" /> Enviar nova versão
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-1" /> Selecionar arquivo
              </>
            )}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Aceito: {ACEITOS_LABEL}.</p>

      <div className="space-y-2">
        <h4 className="text-sm font-medium">
          {DOCUMENTO_CATEGORIA_LABEL[categoria]}{' '}
          <span className="text-muted-foreground">({docsCategoriaAtual.length})</span>
        </h4>
        {docsCategoriaAtual.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum documento nesta categoria.</p>
        ) : (
          <ul className="divide-y overflow-hidden rounded-md border">
            {docsCategoriaAtual.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-col gap-2 p-3 min-w-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-1 items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      className="block w-full truncate text-left text-sm font-medium hover:underline"
                      title={doc.nomeArquivo}
                      onClick={() => void download(profissionalId, doc)}
                    >
                      {doc.nomeArquivo}
                    </button>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">v{doc.versao}</Badge>
                      {doc.obrigatorio && <Badge variant="secondary">Obrigatório</Badge>}
                      <span>{(doc.tamanhoBytes / 1024).toFixed(0)} KB</span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1 self-end sm:self-center">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSubstituiId(doc.id);
                      inputRef.current?.click();
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" /> Nova versão
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(doc)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
