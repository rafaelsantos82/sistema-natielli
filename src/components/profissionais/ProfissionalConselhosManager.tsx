import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Star, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useProfissionalConselhos,
  type ProfissionalConselho,
} from '@/hooks/useProfissionalConselhos';
import type { ConselhoTipo } from '@/hooks/useProfissionais';

const CONSELHO_TIPOS: { value: ConselhoTipo; label: string }[] = [
  { value: 'CRP', label: 'CRP - Psicologia' },
  { value: 'CRM', label: 'CRM - Medicina' },
  { value: 'CREFITO', label: 'CREFITO - Fisioterapia' },
  { value: 'COREN', label: 'COREN - Enfermagem' },
  { value: 'CRN', label: 'CRN - Nutrição' },
  { value: 'CREFONO', label: 'CREFONO - Fonoaudiologia' },
  { value: 'CRO', label: 'CRO - Odontologia' },
  { value: 'CRBM', label: 'CRBM - Biomedicina' },
  { value: 'OUTRO', label: 'Outro' },
];

interface Props {
  profissionalId: string;
}

export const ProfissionalConselhosManager = ({ profissionalId }: Props) => {
  const { toast } = useToast();
  const { listByProfissional, add, remove, setPrincipal } = useProfissionalConselhos();
  const conselhos = listByProfissional(profissionalId);

  const [tipo, setTipo] = useState<ConselhoTipo>('CRP');
  const [numero, setNumero] = useState('');
  const [uf, setUf] = useState('');

  const handleAdd = () => {
    const numTrim = numero.trim();
    const ufTrim = uf.trim().toUpperCase();
    if (!numTrim) {
      toast({ title: 'Número obrigatório', variant: 'destructive' });
      return;
    }
    if (ufTrim.length !== 2) {
      toast({ title: 'UF inválida', description: 'Use 2 letras (ex: SP).', variant: 'destructive' });
      return;
    }
    const duplicado = conselhos.some(
      (c) => c.tipo === tipo && c.numero === numTrim && c.uf === ufTrim,
    );
    if (duplicado) {
      toast({ title: 'Conselho já cadastrado', variant: 'destructive' });
      return;
    }
    add({
      profissionalId,
      tipo,
      numero: numTrim,
      uf: ufTrim,
      principal: conselhos.length === 0,
    });
    setNumero('');
    setUf('');
    toast({ title: 'Conselho adicionado' });
  };

  const handleSetPrincipal = (c: ProfissionalConselho) => {
    setPrincipal(c.id);
    toast({ title: 'Conselho principal atualizado' });
  };

  const handleRemove = (c: ProfissionalConselho) => {
    if (c.principal && conselhos.length > 1) {
      toast({
        title: 'Defina outro principal antes',
        description: 'O conselho principal não pode ser removido enquanto for o único marcado.',
        variant: 'destructive',
      });
      return;
    }
    remove(c.id);
    toast({ title: 'Conselho removido' });
  };

  if (!profissionalId) {
    return (
      <p className="text-sm text-muted-foreground">
        Salve o profissional para gerenciar conselhos adicionais.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
        <div className="md:col-span-2">
          <Label>Tipo</Label>
          <Select value={tipo} onValueChange={(v) => setTipo(v as ConselhoTipo)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONSELHO_TIPOS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Número</Label>
          <Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="123456" />
        </div>
        <div>
          <Label>UF</Label>
          <Input
            value={uf}
            onChange={(e) => setUf(e.target.value.toUpperCase())}
            maxLength={2}
            placeholder="SP"
          />
        </div>
        <div className="md:col-span-4 flex justify-end">
          <Button type="button" onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Adicionar conselho
          </Button>
        </div>
      </div>

      {conselhos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum conselho cadastrado.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {conselhos.map((c) => (
            <li key={c.id} className="flex items-center justify-between p-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant={c.principal ? 'default' : 'outline'}>{c.tipo}</Badge>
                <span className="font-medium truncate">
                  {c.numero}/{c.uf}
                </span>
                {c.principal && (
                  <Badge variant="secondary" className="gap-1">
                    <Star className="h-3 w-3" /> Principal
                  </Badge>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                {!c.principal && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSetPrincipal(c)}
                  >
                    <Star className="h-4 w-4 mr-1" /> Tornar principal
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemove(c)}
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
  );
};
