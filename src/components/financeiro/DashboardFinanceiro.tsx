import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { type Lancamento } from '@/hooks/useFinanceiro';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardFinanceiroProps {
  lancamentos: Lancamento[];
}

export const DashboardFinanceiro = ({ lancamentos }: DashboardFinanceiroProps) => {
  const stats = useMemo(() => {
    const hoje = new Date();
    const inicioMes = startOfMonth(hoje);
    const fimMes = endOfMonth(hoje);

    const lancamentosMes = lancamentos.filter((lanc) => {
      const dataVenc = new Date(lanc.data_vencimento);
      return dataVenc >= inicioMes && dataVenc <= fimMes;
    });

    const receitasPagas = lancamentosMes
      .filter((lanc) => lanc.tipo === 'Receita' && lanc.status === 'Pago')
      .reduce((acc, lanc) => acc + lanc.valor, 0);

    const despesasPagas = lancamentosMes
      .filter((lanc) => lanc.tipo === 'Despesa' && lanc.status === 'Pago')
      .reduce((acc, lanc) => acc + lanc.valor, 0);

    const receitasPendentes = lancamentosMes
      .filter((lanc) => lanc.tipo === 'Receita' && lanc.status !== 'Pago')
      .reduce((acc, lanc) => acc + lanc.valor, 0);

    const despesasPendentes = lancamentosMes
      .filter((lanc) => lanc.tipo === 'Despesa' && lanc.status !== 'Pago')
      .reduce((acc, lanc) => acc + lanc.valor, 0);

    const saldo = receitasPagas - despesasPagas;

    const vencidos = lancamentos.filter((lanc) => lanc.status === 'Vencido').length;

    return {
      receitasPagas,
      despesasPagas,
      receitasPendentes,
      despesasPendentes,
      saldo,
      vencidos,
    };
  }, [lancamentos]);

  const fluxoCaixaMensal = useMemo(() => {
    const meses = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    });

    return meses.map((mes) => {
      const inicio = startOfMonth(mes);
      const fim = endOfMonth(mes);

      const lancamentosMes = lancamentos.filter((lanc) => {
        const dataVenc = new Date(lanc.data_vencimento);
        return dataVenc >= inicio && dataVenc <= fim;
      });

      const receitas = lancamentosMes
        .filter((lanc) => lanc.tipo === 'Receita' && lanc.status === 'Pago')
        .reduce((acc, lanc) => acc + lanc.valor, 0);

      const despesas = lancamentosMes
        .filter((lanc) => lanc.tipo === 'Despesa' && lanc.status === 'Pago')
        .reduce((acc, lanc) => acc + lanc.valor, 0);

      return {
        mes: format(mes, 'MMM', { locale: ptBR }),
        receitas,
        despesas,
        saldo: receitas - despesas,
      };
    });
  }, [lancamentos]);

  const distribuicaoCategorias = useMemo(() => {
    const categorias = new Map<string, { nome: string; valor: number; cor?: string }>();

    lancamentos
      .filter((lanc) => lanc.status === 'Pago')
      .forEach((lanc) => {
        const atual = categorias.get(lanc.categoria_id) || {
          nome: lanc.categoria_nome,
          valor: 0,
        };
        categorias.set(lanc.categoria_id, {
          ...atual,
          valor: atual.valor + lanc.valor,
        });
      });

    return Array.from(categorias.values()).sort((a, b) => b.valor - a.valor).slice(0, 6);
  }, [lancamentos]);

  const COLORS = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receitas do Mês
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              R$ {stats.receitasPagas.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pendente: R$ {stats.receitasPendentes.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas do Mês
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              R$ {stats.despesasPagas.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pendente: R$ {stats.despesasPendentes.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo do Mês
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                stats.saldo >= 0 ? 'text-success' : 'text-destructive'
              }`}
            >
              R$ {stats.saldo.toFixed(2)}
            </div>
            {stats.vencidos > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3 text-destructive" />
                <p className="text-xs text-destructive">{stats.vencidos} vencidos</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Fluxo de Caixa */}
      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Caixa (6 meses)</CardTitle>
          <CardDescription>
            Comparação de receitas e despesas mensais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={fluxoCaixaMensal}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Legend />
              <Line type="monotone" dataKey="receitas" stroke="#10b981" name="Receitas" strokeWidth={2} />
              <Line type="monotone" dataKey="despesas" stroke="#ef4444" name="Despesas" strokeWidth={2} />
              <Line type="monotone" dataKey="saldo" stroke="#3b82f6" name="Saldo" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Gráfico de Barras - Receitas x Despesas */}
        <Card>
          <CardHeader>
            <CardTitle>Receitas x Despesas</CardTitle>
            <CardDescription>Comparação mensal</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={fluxoCaixaMensal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Legend />
                <Bar dataKey="receitas" fill="#10b981" name="Receitas" />
                <Bar dataKey="despesas" fill="#ef4444" name="Despesas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza - Distribuição por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
            <CardDescription>Top 6 categorias (pagos)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={distribuicaoCategorias}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ nome, percent }) => `${nome}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="valor"
                >
                  {distribuicaoCategorias.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
