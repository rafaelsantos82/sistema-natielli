import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useNotasFiscais } from '@/hooks/useNotasFiscais';
import { usePlanosSaude } from '@/hooks/usePlanoseSaude';
import { useAcoesJudiciais } from '@/hooks/useAcoesJudiciais';
import { useConciliacaoResumo } from '@/hooks/useConciliacaoAcao';
import { calcConciliacaoTotais } from '@/lib/conciliacao/conciliacaoCalc';
import { featureFlags } from '@/lib/featureFlags';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function RelatoriosConciliacao() {
  const { notasFiscais } = useNotasFiscais();
  const { planosSaude } = usePlanosSaude();
  const { acoesJudiciais } = useAcoesJudiciais();
  const { data: resumoApi } = useConciliacaoResumo(
    featureFlags.planosApiEnabled ? { page_size: 500 } : undefined,
  );
  const [selectedPlanoId, setSelectedPlanoId] = useState<string>('todos');

  const filteredNotas = selectedPlanoId === 'todos'
    ? notasFiscais
    : notasFiscais.filter(n => n.plano_saude_id === selectedPlanoId);

  const filteredAcoes = selectedPlanoId === 'todos'
    ? acoesJudiciais
    : acoesJudiciais.filter(
        (a) => (a.plano_saude_id ?? a.plano_id) === selectedPlanoId,
      );

  // KPIs gerais
  const valorServico = (nota: (typeof notasFiscais)[0]) =>
    Number(nota.valor_servico ?? nota.valor ?? 0);

  const kpis = useMemo(() => {
    const totalNotas = filteredNotas.reduce((acc, nota) => acc + valorServico(nota), 0);
    const totalPago = filteredNotas.reduce((acc, nota) => acc + (Number(nota.valor_pago) || 0), 0);
    const saldoDevedor = totalNotas - totalPago;
    const taxaRecuperacao = totalNotas > 0 ? (totalPago / totalNotas) * 100 : 0;
    const notasConciliadas = filteredNotas.filter(n => n.acao_judicial_id).length;
    const notasPendentes = filteredNotas.filter(n => n.status === 'Pendente' || n.status === 'Em Disputa').length;

    return {
      totalNotas,
      totalPago,
      saldoDevedor,
      taxaRecuperacao,
      notasConciliadas,
      notasPendentes,
    };
  }, [filteredNotas]);

  const resumoMap = useMemo(
    () => new Map((resumoApi?.items ?? []).map((i) => [i.acao_judicial.id, i])),
    [resumoApi],
  );

  const dadosPorAcao = useMemo(() => {
    return filteredAcoes.map((acao) => {
      const fromApi = resumoMap.get(acao.id);
      const notasVinculadas = filteredNotas.filter((n) => n.acao_judicial_id === acao.id);
      const valorNotas = fromApi?.valor_notas_vinculadas ?? notasVinculadas.reduce(
        (acc, n) => acc + valorServico(n),
        0,
      );
      const valorPago = fromApi?.valor_pago_total ?? notasVinculadas.reduce(
        (acc, n) => acc + (Number(n.valor_pago) || 0),
        0,
      );
      const valorAcao = Number(acao.valor_acao ?? 0);
      const totais = calcConciliacaoTotais(valorAcao, valorNotas, valorPago, notasVinculadas.length);
      const processo = String(acao.numero_processo ?? acao.tipo ?? acao.id);
      const label = processo.length > 15 ? `${processo.substring(0, 15)}...` : processo;

      return {
        numero_processo: label,
        numeroCompleto: processo,
        valorAcao,
        valorNotas,
        valorPago,
        saldoAcao: totais.saldoEmAberto,
        saldoNotas: valorNotas - valorPago,
        quitada: totais.quitada,
        status: String(acao.status ?? '—'),
      };
    });
  }, [filteredAcoes, filteredNotas, resumoMap]);

  // Dados por plano de saúde
  const dadosPorPlano = useMemo(() => {
    const planosComNotas = selectedPlanoId === 'todos' ? planosSaude : planosSaude.filter(p => p.id === selectedPlanoId);
    
    return planosComNotas.map(plano => {
      const notasPlano = notasFiscais.filter(n => n.plano_saude_id === plano.id);
      const totalNotas = notasPlano.reduce((acc, n) => acc + valorServico(n), 0);
      const totalPago = notasPlano.reduce((acc, n) => acc + (Number(n.valor_pago) || 0), 0);
      const saldoDevedor = totalNotas - totalPago;
      const taxaRecuperacao = totalNotas > 0 ? (totalPago / totalNotas) * 100 : 0;

      return {
        nome: plano.nome,
        totalNotas,
        totalPago,
        saldoDevedor,
        taxaRecuperacao,
      };
    }).filter(d => d.totalNotas > 0);
  }, [planosSaude, notasFiscais, selectedPlanoId]);

  // Dados para gráfico de pizza de status
  const dadosStatus = useMemo(() => {
    const statusCount = {
      'Pago': filteredNotas.filter(n => n.status === 'Pago').length,
      'Pago Parcial': filteredNotas.filter(n => n.status === 'Pago Parcial').length,
      'Em Disputa': filteredNotas.filter(n => n.status === 'Em Disputa').length,
      'Pendente': filteredNotas.filter(n => n.status === 'Pendente').length,
    };

    return Object.entries(statusCount)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [filteredNotas]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-lg">
          <p className="font-medium">{payload[0].payload.numeroCompleto || payload[0].payload.nome}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: item.color }}>
              {item.name}: {formatCurrency(item.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <MainLayout title="Relatórios de Conciliação">
      <div className="space-y-6">
        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Selecione o plano de saúde para análise detalhada</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Plano de Saúde</Label>
                <Select value={selectedPlanoId} onValueChange={setSelectedPlanoId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Planos</SelectItem>
                    {planosSaude.map(plano => (
                      <SelectItem key={plano.id} value={plano.id}>
                        {plano.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total em Notas</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(kpis.totalNotas)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredNotas.length} notas fiscais
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(kpis.totalPago)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.notasConciliadas} notas conciliadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Saldo Devedor</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(kpis.saldoDevedor)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.notasPendentes} notas pendentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Recuperação</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.taxaRecuperacao.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Do valor total em notas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos principais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Valores por Ação Judicial */}
          <Card>
            <CardHeader>
              <CardTitle>Valores por Ação Judicial</CardTitle>
              <CardDescription>Valor da ação, notas vinculadas, pagamentos e saldo judicial</CardDescription>
            </CardHeader>
            <CardContent>
              {dadosPorAcao.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosPorAcao}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="numero_processo" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="valorAcao" name="Valor da Ação" fill="#8b5cf6" />
                    <Bar dataKey="valorNotas" name="Valor das Notas" fill="#3b82f6" />
                    <Bar dataKey="valorPago" name="Valor Pago" fill="#22c55e" />
                    <Bar dataKey="saldoAcao" name="Saldo da Ação" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Nenhuma ação judicial com notas vinculadas
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status das Notas */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
              <CardDescription>Quantidade de notas por status de pagamento</CardDescription>
            </CardHeader>
            <CardContent>
              {dadosStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dadosStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dadosStatus.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Nenhuma nota cadastrada
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Análise por Plano de Saúde */}
        <Card>
          <CardHeader>
            <CardTitle>Análise por Plano de Saúde</CardTitle>
            <CardDescription>Valores totais, pagos e saldo devedor por plano</CardDescription>
          </CardHeader>
          <CardContent>
            {dadosPorPlano.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dadosPorPlano} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="nome" type="category" width={150} tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="totalNotas" name="Total em Notas" fill="#3b82f6" />
                  <Bar dataKey="totalPago" name="Total Pago" fill="#22c55e" />
                  <Bar dataKey="saldoDevedor" name="Saldo Devedor" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                Nenhum plano com notas cadastradas
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabela detalhada por plano */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento por Plano de Saúde</CardTitle>
            <CardDescription>Visão consolidada dos valores e taxa de recuperação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Plano de Saúde</th>
                    <th className="text-right p-2">Total Notas</th>
                    <th className="text-right p-2">Total Pago</th>
                    <th className="text-right p-2">Saldo Devedor</th>
                    <th className="text-right p-2">Taxa Recuperação</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosPorPlano.length > 0 ? (
                    dadosPorPlano.map((plano, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{plano.nome}</td>
                        <td className="text-right p-2">{formatCurrency(plano.totalNotas)}</td>
                        <td className="text-right p-2 text-green-600">{formatCurrency(plano.totalPago)}</td>
                        <td className="text-right p-2 text-destructive">{formatCurrency(plano.saldoDevedor)}</td>
                        <td className="text-right p-2">
                          <Badge variant={plano.taxaRecuperacao > 70 ? 'default' : plano.taxaRecuperacao > 40 ? 'secondary' : 'destructive'}>
                            {plano.taxaRecuperacao.toFixed(1)}%
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center p-4 text-muted-foreground">
                        Nenhum dado disponível
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalhamento por Ação Judicial</CardTitle>
            <CardDescription>Pagamento vs valor da ação e notas vinculadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Processo</th>
                    <th className="text-right p-2">Valor da Ação</th>
                    <th className="text-right p-2">Valor Notas</th>
                    <th className="text-right p-2">Valor Pago</th>
                    <th className="text-right p-2">Saldo da Ação</th>
                    <th className="text-center p-2">Pagamento</th>
                    <th className="text-center p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosPorAcao.length > 0 ? (
                    dadosPorAcao.map((acao, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{acao.numeroCompleto}</td>
                        <td className="text-right p-2">{formatCurrency(acao.valorAcao)}</td>
                        <td className="text-right p-2">{formatCurrency(acao.valorNotas)}</td>
                        <td className="text-right p-2 text-green-600">{formatCurrency(acao.valorPago)}</td>
                        <td className="text-right p-2 text-destructive">{formatCurrency(acao.saldoAcao)}</td>
                        <td className="text-center p-2">
                          <Badge variant={acao.quitada ? 'default' : 'secondary'}>
                            {acao.quitada ? 'Quitada' : 'Em aberto'}
                          </Badge>
                        </td>
                        <td className="text-center p-2">
                          <Badge
                            variant={
                              acao.status === 'Procedente'
                                ? 'default'
                                : acao.status === 'Em Andamento'
                                  ? 'secondary'
                                  : acao.status === 'Acordo'
                                    ? 'outline'
                                    : 'destructive'
                            }
                          >
                            {acao.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center p-4 text-muted-foreground">
                        Nenhuma ação judicial cadastrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
