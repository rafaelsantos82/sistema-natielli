import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { DataTable, DataTableColumn } from '@/components/common/DataTable';
import { PageToolbar } from '@/components/common/PageToolbar';
import { useFinanceiro, type Lancamento } from '@/hooks/useFinanceiro';
import { useAuth } from '@/contexts/AuthContext';
import { useUnidadeAtiva } from '@/contexts/UnidadeContext';
import { UNIDADE_PADRAO_ID } from '@/hooks/useUnidades';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Faturas (recebíveis): visão somente leitura das receitas registradas no
 * Financeiro, filtrável pela unidade ativa. Admin/Gestor podem ver todas.
 */
const Faturas = () => {
  const { lancamentos } = useFinanceiro();
  const { user } = useAuth();
  const { unidades, unidadeAtivaId, unidadeAtiva } = useUnidadeAtiva();
  const podeVerTodas = user?.role === 'admin' || user?.role === 'gestor';
  const [unidadeFiltro, setUnidadeFiltro] = useState<string>(unidadeAtivaId);
  const [searchQuery, setSearchQuery] = useState('');

  const faturas = useMemo(() => {
    return lancamentos
      .filter((l) => l.tipo === 'Receita')
      .filter((l) => {
        if (unidadeFiltro === 'all') return true;
        return (l.unidadeId ?? UNIDADE_PADRAO_ID) === unidadeFiltro;
      })
      .filter((l) =>
        searchQuery
          ? l.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (l.documento ?? '').toLowerCase().includes(searchQuery.toLowerCase())
          : true,
      );
  }, [lancamentos, unidadeFiltro, searchQuery]);

  const totais = useMemo(() => {
    const acc = { total: 0, recebido: 0, pendente: 0, vencido: 0 };
    for (const f of faturas) {
      acc.total += f.valor;
      if (f.status === 'Pago') acc.recebido += f.valor;
      else if (f.status === 'Vencido') acc.vencido += f.valor;
      else if (f.status === 'Pendente') acc.pendente += f.valor;
    }
    return acc;
  }, [faturas]);

  const columns: DataTableColumn<Lancamento>[] = [
    {
      key: 'data_vencimento',
      label: 'Vencimento',
      render: (l) => format(new Date(l.data_vencimento), 'dd/MM/yyyy', { locale: ptBR }),
    },
    { key: 'descricao', label: 'Descrição' },
    { key: 'documento', label: 'Documento', render: (l) => l.documento ?? '—' },
    { key: 'categoria_nome', label: 'Categoria' },
    {
      key: 'valor',
      label: 'Valor',
      render: (l) => (
        <span className="font-medium">R$ {l.valor.toFixed(2)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (l) => (
        <Badge
          variant={
            l.status === 'Pago'
              ? 'default'
              : l.status === 'Vencido'
              ? 'destructive'
              : 'secondary'
          }
        >
          {l.status}
        </Badge>
      ),
    },
  ];

  const titulo =
    unidadeFiltro === 'all'
      ? 'Faturas — Todas as unidades'
      : `Faturas — ${unidades.find((u) => u.id === unidadeFiltro)?.nome ?? unidadeAtiva?.nome ?? ''}`.trim();

  return (
    <MainLayout title={titulo}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <Select value={unidadeFiltro} onValueChange={setUnidadeFiltro}>
            <SelectTrigger className="w-[240px]" aria-label="Filtrar por unidade">
              <SelectValue placeholder="Unidade" />
            </SelectTrigger>
            <SelectContent>
              {podeVerTodas && <SelectItem value="all">Todas as unidades</SelectItem>}
              {unidades.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-semibold">R$ {totais.total.toFixed(2)}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Recebido</p>
            <p className="text-lg font-semibold text-success">R$ {totais.recebido.toFixed(2)}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Pendente</p>
            <p className="text-lg font-semibold">R$ {totais.pendente.toFixed(2)}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Vencido</p>
            <p className="text-lg font-semibold text-destructive">R$ {totais.vencido.toFixed(2)}</p>
          </CardContent></Card>
        </div>

        <PageToolbar onSearch={setSearchQuery} />

        <Card>
          <CardContent className="pt-6">
            <DataTable
              columns={columns}
              data={faturas}
              emptyMessage="Nenhuma fatura encontrada para a unidade selecionada"
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Faturas;
