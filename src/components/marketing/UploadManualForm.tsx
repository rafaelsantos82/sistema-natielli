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
import type { ManualUploadInput } from '@/hooks/useMarketing';
import {
  PROFISSIONAL_DOC_ACCEPT,
  PROFISSIONAL_DOC_ALLOWED_LABEL,
} from '@/lib/uploads/profissionalDocPolicy';

interface Props {
  onSubmit: (input: ManualUploadInput) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const UploadManualForm = ({ onSubmit, onCancel, isLoading }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [titulo, setTitulo] = useState('');
  const [versao, setVersao] = useState('1.0');
  const [publicoAlvo, setPublicoAlvo] = useState<ManualUploadInput['publico_alvo']>('Interno');
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
    if (!versao.trim()) {
      setFileError('Informe a versão.');
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
    await onSubmit({
      titulo: titulo.trim(),
      versao: versao.trim(),
      publico_alvo: publicoAlvo,
      file,
      tags,
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
          placeholder="Nome do manual"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="versao">Versão</Label>
          <Input
            id="versao"
            value={versao}
            onChange={(e) => setVersao(e.target.value)}
            placeholder="1.0"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Público-alvo</Label>
          <Select value={publicoAlvo} onValueChange={(v) => setPublicoAlvo(v as ManualUploadInput['publico_alvo'])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Interno">Interno</SelectItem>
              <SelectItem value="Externo">Externo</SelectItem>
              <SelectItem value="Ambos">Ambos</SelectItem>
            </SelectContent>
          </Select>
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
              <SelectItem value="Publicado">Publicado</SelectItem>
              <SelectItem value="Arquivado">Arquivado</SelectItem>
            </SelectContent>
          </Select>
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
