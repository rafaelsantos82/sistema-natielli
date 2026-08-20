import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
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
import { useConsultas } from '@/hooks/useConsultas';
import { generateConsultasReport } from '@/lib/utils/pdfGenerator';
import { format } from 'date-fns';
import { Download, FileText, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function RelatoriosAvancados() {
  const { consultas } = useConsultas();
  const { toast } = useToast();
  
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    pacienteId: 'all',
    profissionalId: 'all',
  });

  const pacientes = Array.from(new Set(consultas.map(c => c.pacienteNome))).map((nome, idx) => ({
    id: String(idx + 1),
    nome,
  }));

  const profissionais = Array.from(new Set(consultas.map(c => c.profissionalNome))).map((nome, idx) => ({
    id: String(idx + 1),
    nome,
  }));

  const consultasFiltradas = consultas.filter(c => {
    const dataConsulta = new Date(c.dataHora);
    
    if (filtros.dataInicio && dataConsulta < new Date(filtros.dataInicio)) return false;
    if (filtros.dataFim && dataConsulta > new Date(filtros.dataFim)) return false;
    if (filtros.pacienteId !== 'all' && c.pacienteNome !== pacientes.find(p => p.id === filtros.pacienteId)?.nome) return false;
    if (filtros.profissionalId !== 'all' && c.profissionalNome !== profissionais.find(p => p.id === filtros.profissionalId)?.nome) return false;
    
    return true;
  });

  // Statistics
  const stats = {
    total: consultasFiltradas.length,
    concluidas: consultasFiltradas.filter(c => c.status === 'concluida').length,
    canceladas: consultasFiltradas.filter(c => c.status === 'cancelada').length,
    agendadas: consultasFiltradas.filter(c => c.status === 'agendada').length,
  };

  // Chart data - by month
  const consultasPorMes = consultasFiltradas.reduce((acc, c) => {
    const mes = format(new Date(c.dataHora), 'MM/yyyy');
    acc[mes] = (acc[mes] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartDataMes = Object.entries(consultasPorMes).map(([mes, count]) => ({
    mes,
    consultas: count,
  }));

  // Chart data - by professional
  const consultasPorProfissional = consultasFiltradas.reduce((acc, c) => {
    acc[c.profissionalNome] = (acc[c.profissionalNome] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartDataProfissional = Object.entries(consultasPorProfissional)
    .map(([nome, count]) => ({
      nome,
      consultas: count,
    }))
    .sort((a, b) => b.consultas - a.consultas)
    .slice(0, 5);

  // Pie chart data - by status
  const pieData = [
    { name: 'Concluídas', value: stats.concluidas, color: 'hsl(var(--primary))' },
    { name: 'Agendadas', value: stats.agendadas, color: 'hsl(var(--secondary))' },
    { name: 'Canceladas', value: stats.canceladas, color: 'hsl(var(--destructive))' },
  ].filter(item => item.value > 0);

  const handleExportPDF = () => {
    const pdf = generateConsultasReport(consultasFiltradas, {
      dataInicio: filtros.dataInicio,
      dataFim: filtros.dataFim,
      paciente: filtros.pacienteId !== 'all' ? pacientes.find(p => p.id === filtros.pacienteId)?.nome : undefined,
      profissional: filtros.profissionalId !== 'all' ? profissionais.find(p => p.id === filtros.profissionalId)?.nome : undefined,
    });
    
    pdf.save(`relatorio_consultas_${format(new Date(), 'ddMMyyyy_HHmmss')}.pdf`);
    
    toast({
      title: 'Sucesso',
      description: 'Relatório exportado com sucesso',
    });
  };

  return (
    <MainLayout title="Relatórios Avançados">
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Filtros de Relatório
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataFim">Data Fim</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paciente">Paciente</Label>
                <Select
                  value={filtros.pacienteId}
                  onValueChange={(value) => setFiltros({ ...filtros, pacienteId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {pacientes.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profissional">Profissional</Label>
                <Select
                  value={filtros.profissionalId}
                  onValueChange={(value) => setFiltros({ ...filtros, profissionalId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {profissionais.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => setFiltros({ dataInicio: '', dataFim: '', pacienteId: '', profissionalId: '' })}
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Consultas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.concluidas}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? ((stats.concluidas / stats.total) * 100).toFixed(1) : 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Agendadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{stats.agendadas}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? ((stats.agendadas / stats.total) * 100).toFixed(1) : 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.canceladas}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? ((stats.canceladas / stats.total) * 100).toFixed(1) : 0}% do total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Consultas por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartDataMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="consultas" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top 5 Profissionais</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartDataProfissional}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" angle={-45} textAnchor="end" height={100} />
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
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo do Período</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Período Analisado</span>
                <span className="font-medium">
                  {filtros.dataInicio && filtros.dataFim
                    ? `${format(new Date(filtros.dataInicio), 'dd/MM/yyyy')} - ${format(new Date(filtros.dataFim), 'dd/MM/yyyy')}`
                    : 'Todo o histórico'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Taxa de Conclusão</span>
                <span className="font-medium">
                  {stats.total > 0 ? ((stats.concluidas / stats.total) * 100).toFixed(1) : 0}%
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Taxa de Cancelamento</span>
                <span className="font-medium">
                  {stats.total > 0 ? ((stats.canceladas / stats.total) * 100).toFixed(1) : 0}%
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Profissionais Ativos</span>
                <span className="font-medium">{profissionais.length}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pacientes Atendidos</span>
                <span className="font-medium">{pacientes.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
