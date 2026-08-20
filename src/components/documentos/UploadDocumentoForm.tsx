import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload } from 'lucide-react';
import type { DocumentoCategoriaDTO } from '@/lib/api/documentos.types';
import type { BibliotecaUploadInput } from '@/hooks/useBibliotecaDocumentos';
import {
  PROFISSIONAL_DOC_ACCEPT,
  PROFISSIONAL_DOC_ALLOWED_LABEL,
} from '@/lib/uploads/profissionalDocPolicy';

interface Props {
  categorias: DocumentoCategoriaDTO[];
  defaultCategoriaId?: string;
  onSubmit: (input: BibliotecaUploadInput) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const UploadDocumentoForm = ({
  categorias,
  defaultCategoriaId,
  onSubmit,
  onCancel,
  isLoading,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [categoriaId, setCategoriaId] = useState(defaultCategoriaId ?? '');
  const [titulo, setTitulo] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);

  const ativas = categorias.filter((c) => c.ativo);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFileError(null);
    if (!categoriaId) {
      setFileError('Selecione uma categoria.');
      return;
    }
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setFileError('Selecione um arquivo.');
      return;
    }
    await onSubmit({
      categoriaId,
      file,
      titulo: titulo.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Categoria</Label>
        <Select value={categoriaId} onValueChange={setCategoriaId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a categoria" />
          </SelectTrigger>
          <SelectContent>
            {ativas.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="titulo">Título (opcional)</Label>
        <Input
          id="titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Nome exibido na lista"
        />
      </div>
      <div className="space-y-2">
        <Label>Arquivo</Label>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={PROFISSIONAL_DOC_ACCEPT}
          onChange={() => setFileError(null)}
        />
        <Button type="button" variant="outline" className="w-full" onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4 mr-2" />
          Escolher arquivo
        </Button>
        <p className="text-xs text-muted-foreground">{PROFISSIONAL_DOC_ALLOWED_LABEL}</p>
      </div>
      {fileError && <p className="text-sm text-destructive">{fileError}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || ativas.length === 0}>
          Enviar
        </Button>
      </div>
    </form>
  );
};
