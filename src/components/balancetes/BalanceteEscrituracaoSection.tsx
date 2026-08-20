import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import type { ContaContabil, LancamentoContabil } from '@/lib/contabilidade/types';
import { getUnidadeApiId } from '@/lib/unidades/apiIds';
import { useUnidadeAtiva } from '@/contexts/UnidadeContext';
import { Plus } from 'lucide-react';

interface Props {
  contas: ContaContabil[];
  lancamentos: LancamentoContabil[];
  addConta: (data: Omit<ContaContabil, 'id'>) => Promise<void>;
  addLancamento: (data: Omit<LancamentoContabil, 'id'>) => Promise<void>;
  onSaved?: () => void;
}

export function BalanceteEscrituracaoSection({
  contas,
  lancamentos,
  addConta,
  addLancamento,
  onSaved,
}: Props) {
  const { toast } = useToast();
  const { unidadeAtivaId } = useUnidadeAtiva();
  const [open, setOpen] = useState(false);
  const [contaForm, setContaForm] = useState({
    codigo: '',
    nome: '',
    tipo: 'Analítica' as ContaContabil['tipo'],
    natureza: 'Devedora' as ContaContabil['natureza'],
    pai: '',
  });
  const [lancForm, setLancForm] = useState({
    data: new Date().toISOString().slice(0, 10),
    conta_codigo: '',
    debito: '',
    credito: '',
    historico: '',
    centro_custo: '',
  });

  const handleAddConta = async () => {
    if (!contaForm.codigo.trim() || !contaForm.nome.trim()) {
      toast({ title: 'Preencha código e nome da conta', variant: 'destructive' });
      return;
    }
    try {
      await addConta({
        codigo: contaForm.codigo.trim(),
        nome: contaForm.nome.trim(),
        tipo: contaForm.tipo,
        natureza: contaForm.natureza,
        pai: contaForm.pai.trim() || null,
      });
      toast({ title: 'Conta cadastrada' });
      setContaForm({ codigo: '', nome: '', tipo: 'Analítica', natureza: 'Devedora', pai: '' });
      onSaved?.();
    } catch {
      toast({ title: 'Erro ao cadastrar conta', variant: 'destructive' });
    }
  };

  const handleAddLancamento = async () => {
    const deb = parseFloat(lancForm.debito.replace(',', '.')) || 0;
    const cred = parseFloat(lancForm.credito.replace(',', '.')) || 0;
    if (!lancForm.conta_codigo || !lancForm.historico.trim()) {
      toast({ title: 'Informe conta e histórico', variant: 'destructive' });
      return;
    }
    if ((deb > 0 && cred > 0) || (deb <= 0 && cred <= 0)) {
      toast({
        title: 'Informe apenas débito ou crédito (valor positivo)',
        variant: 'destructive',
      });
      return;
    }
    const conta = contas.find((c) => c.codigo === lancForm.conta_codigo);
    const unidadeUuid = getUnidadeApiId(unidadeAtivaId);
    try {
      await addLancamento({
        data: lancForm.data,
        conta_codigo: lancForm.conta_codigo,
        conta_nome: conta?.nome ?? lancForm.conta_codigo,
        debito: deb,
        credito: cred,
        historico: lancForm.historico.trim(),
        centro_custo: lancForm.centro_custo.trim() || null,
        unidade_id: unidadeUuid,
      });
      toast({ title: 'Lançamento registrado' });
      setLancForm({
        data: lancForm.data,
        conta_codigo: lancForm.conta_codigo,
        debito: '',
        credito: '',
        historico: '',
        centro_custo: lancForm.centro_custo,
      });
      onSaved?.();
    } catch {
      toast({ title: 'Erro ao registrar lançamento', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">Escrituração contábil</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
          {open ? 'Ocultar' : 'Cadastrar contas e lançamentos'}
        </Button>
      </CardHeader>
      {open && (
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            {contas.length} conta(s) · {lancamentos.length} lançamento(s). Use partidas dobradas:
            cada movimentação deve ter contrapartida em outra conta.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3 border rounded-lg p-4">
              <h3 className="font-medium text-sm">Nova conta</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Código</Label>
                  <Input
                    value={contaForm.codigo}
                    onChange={(e) => setContaForm({ ...contaForm, codigo: e.target.value })}
                    placeholder="1.1.01"
                  />
                </div>
                <div>
                  <Label>Nome</Label>
                  <Input
                    value={contaForm.nome}
                    onChange={(e) => setContaForm({ ...contaForm, nome: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={contaForm.tipo}
                    onValueChange={(v) =>
                      setContaForm({ ...contaForm, tipo: v as ContaContabil['tipo'] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Analítica">Analítica</SelectItem>
                      <SelectItem value="Sintética">Sintética</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Natureza</Label>
                  <Select
                    value={contaForm.natureza}
                    onValueChange={(v) =>
                      setContaForm({ ...contaForm, natureza: v as ContaContabil['natureza'] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Devedora">Devedora</SelectItem>
                      <SelectItem value="Credora">Credora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Conta pai (opcional)</Label>
                <Input
                  value={contaForm.pai}
                  onChange={(e) => setContaForm({ ...contaForm, pai: e.target.value })}
                  placeholder="1.1"
                />
              </div>
              <Button size="sm" onClick={handleAddConta}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar conta
              </Button>
            </div>

            <div className="space-y-3 border rounded-lg p-4">
              <h3 className="font-medium text-sm">Novo lançamento</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={lancForm.data}
                    onChange={(e) => setLancForm({ ...lancForm, data: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Conta</Label>
                  <Select
                    value={lancForm.conta_codigo}
                    onValueChange={(v) => setLancForm({ ...lancForm, conta_codigo: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {contas
                        .filter((c) => c.tipo === 'Analítica')
                        .map((c) => (
                          <SelectItem key={c.codigo} value={c.codigo}>
                            {c.codigo} — {c.nome}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Débito</Label>
                  <Input
                    inputMode="decimal"
                    value={lancForm.debito}
                    onChange={(e) => setLancForm({ ...lancForm, debito: e.target.value, credito: '' })}
                  />
                </div>
                <div>
                  <Label>Crédito</Label>
                  <Input
                    inputMode="decimal"
                    value={lancForm.credito}
                    onChange={(e) => setLancForm({ ...lancForm, credito: e.target.value, debito: '' })}
                  />
                </div>
              </div>
              <div>
                <Label>Histórico</Label>
                <Input
                  value={lancForm.historico}
                  onChange={(e) => setLancForm({ ...lancForm, historico: e.target.value })}
                />
              </div>
              <div>
                <Label>Centro de custo (opcional)</Label>
                <Input
                  value={lancForm.centro_custo}
                  onChange={(e) => setLancForm({ ...lancForm, centro_custo: e.target.value })}
                />
              </div>
              <Button size="sm" onClick={handleAddLancamento}>
                <Plus className="h-4 w-4 mr-1" />
                Registrar lançamento
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
