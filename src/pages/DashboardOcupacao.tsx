import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useConsultas } from '@/hooks/useConsultas';
import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Calendar, Clock, TrendingUp, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DashboardOcupacao() {
  const { consultas } = useConsultas();

  const metrics = useMemo(() => {
    const now = new Date();
    const thisMonth = consultas.filter((c) => {
      const date = new Date(c.dataHora);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    const totalSlots = 160; // Assuming 8h/day * 20 working days
    const occupiedSlots = thisMonth.filter((c) => c.status !== 'cancelada').length;
    const taxaOcupacao = ((occupiedSlots / totalSlots) * 100).toFixed(1);

    // Count by hour
    const horariosProcurados = thisMonth.reduce((acc, c) => {
      const hour = new Date(c.dataHora).getHours();
      const hourLabel = `${hour}:00`;
      acc[hourLabel] = (acc[hourLabel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const chartHorarios = Object.entries(horariosProcurados)
      .map(([hora, count]) => ({ hora, consultas: count }))
      .sort((a, b) => parseInt(a.hora) - parseInt(b.hora));

    // Status distribution
    const statusDistribution = consultas.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pieData = Object.entries(statusDistribution).map(([status, value]) => ({
      name: status,
      value,
    }));

    // Cancellation rate
    const canceladas = consultas.filter((c) => c.status === 'cancelada').length;
    const taxaCancelamento = ((canceladas / consultas.length) * 100).toFixed(1);

    // Average time between consultations
    const sortedConsultas = [...thisMonth]
      .filter((c) => c.status !== 'cancelada')
      .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime());

    let totalGaps = 0;
    for (let i = 1; i < sortedConsultas.length; i++) {
      const gap = new Date(sortedConsultas[i].dataHora).getTime() - 
                   new Date(sortedConsultas[i - 1].dataHora).getTime() - 
                   (sortedConsultas[i - 1].duracao * 60 * 1000);
      totalGaps += gap;
    }
    const avgGapMinutes = sortedConsultas.length > 1 
      ? Math.round(totalGaps / (sortedConsultas.length - 1) / 60000) 
      : 0;

    return {
      taxaOcupacao,
      taxaCancelamento,
      avgGapMinutes,
      chartHorarios,
      pieData,
      totalConsultas: consultas.length,
      consultasMes: thisMonth.length,
    };
  }, [consultas]);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  return (
    <MainLayout title="Dashboard de Ocupação">
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.taxaOcupacao}%</div>
              <p className="text-xs text-muted-foreground">Este mês</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Cancelamento</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.taxaCancelamento}%</div>
              <p className="text-xs text-muted-foreground">Total histórico</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio Entre Consultas</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgGapMinutes}min</div>
              <p className="text-xs text-muted-foreground">Intervalo médio</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Consultas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalConsultas}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.consultasMes} este mês
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Horários Mais Procurados</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.chartHorarios}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hora" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="consultas" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={metrics.pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {metrics.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Insights e Recomendações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {parseFloat(metrics.taxaOcupacao) > 85 && (
              <div className="flex items-start gap-2">
                <Badge variant="default">Alta Demanda</Badge>
                <p className="text-sm text-muted-foreground">
                  Taxa de ocupação acima de 85%. Considere aumentar a disponibilidade ou adicionar mais profissionais.
                </p>
              </div>
            )}
            {parseFloat(metrics.taxaCancelamento) > 15 && (
              <div className="flex items-start gap-2">
                <Badge variant="destructive">Atenção</Badge>
                <p className="text-sm text-muted-foreground">
                  Taxa de cancelamento elevada. Revise a política de confirmação e lembretes.
                </p>
              </div>
            )}
            {metrics.avgGapMinutes > 60 && (
              <div className="flex items-start gap-2">
                <Badge variant="secondary">Otimização</Badge>
                <p className="text-sm text-muted-foreground">
                  Intervalos longos entre consultas. Considere otimizar a agenda para reduzir tempo ocioso.
                </p>
              </div>
            )}
            {parseFloat(metrics.taxaOcupacao) < 50 && (
              <div className="flex items-start gap-2">
                <Badge variant="secondary">Oportunidade</Badge>
                <p className="text-sm text-muted-foreground">
                  Taxa de ocupação baixa. Considere estratégias de marketing ou revisão de preços.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
