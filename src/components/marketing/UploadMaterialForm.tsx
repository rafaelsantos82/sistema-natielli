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
import { useUnidadeAtiva } from '@/contexts/UnidadeContext';
import type { MaterialUploadInput } from '@/hooks/useMarketing';
import { getUnidadeApiId } from '@/lib/unidades/apiIds';
import {
  PROFISSIONAL_DOC_ACCEPT,
  PROFISSIONAL_DOC_ALLOWED_LABEL,
} from '@/lib/uploads/profissionalDocPolicy';

interface Props {
  onSubmit: (input: MaterialUploadInput) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const UploadMaterialForm = ({ onSubmit, onCancel, isLoading }: Props) => {
  const { unidades } = useUnidadeAtiva();
  const inputRef = useRef<HTMLInputElement>(null);
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('');
  const [campanha, setCampanha] = useState('');
  const [unidadeSlug, setUnidadeSlug] = useState<string>('none');
  const [status, setStatus] = useState('Rascunho');
  const [tagsRaw, setTagsRaw] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFileError(null);
    if (!titulo.trim()) {
      setFileError('Informe o título.');
      return;
    }
    if (!tipo.trim()) {
      setFileError('Informe o tipo.');
      return;
    }
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setFileError('Selecione um arquivo.');
      return;
    }
    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const unidade_id =
      unidadeSlug === 'none' ? undefined : getUnidadeApiId(unidadeSlug) ?? undefined;
    await onSubmit({
      titulo: titulo.trim(),
      tipo: tipo.trim(),
      file,
      tags,
      campanha: campanha.trim() || undefined,
      unidade_id,
      status,
      observacoes: observacoes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="titulo">Título</Label>
        <Input
          id="titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Nome do material"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo</Label>
          <Input
            id="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            placeholder="Banner, folder, vídeo..."
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="campanha">Campanha (opcional)</Label>
          <Input id="campanha" value={campanha} onChange={(e) => setCampanha(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Rascunho">Rascunho</SelectItem>
              <SelectItem value="Aprovado">Aprovado</SelectItem>
              <SelectItem value="Publicado">Publicado</SelectItem>
              <SelectItem value="Arquivado">Arquivado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Unidade (opcional)</Label>
          <Select value={unidadeSlug} onValueChange={setUnidadeSlug}>
            <SelectTrigger>
              <SelectValue placeholder="Nenhuma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              {unidades.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="tags">Tags (opcional)</Label>
        <Input
          id="tags"
          value={tagsRaw}
          onChange={(e) => setTagsRaw(e.target.value)}
          placeholder="tag1, tag2"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações (opcional)</Label>
        <Input
          id="observacoes"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
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
        <Button type="submit" disabled={isLoading}>
          Enviar
        </Button>
      </div>
    </form>
  );
};
