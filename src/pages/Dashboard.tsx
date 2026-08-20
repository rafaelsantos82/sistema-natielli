import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, DollarSign, FileText, Clock } from 'lucide-react';
import { AniversariantesWidget } from '@/components/dashboard/AniversariantesWidget';
import { EmptyIntegrationState } from '@/components/common/EmptyIntegrationState';
import { usePacientesList } from '@/hooks/usePacientes';
import { useConsultas } from '@/hooks/useConsultas';

const Dashboard = () => {
  const { data: pacientesData, isLoading: pacientesLoading } = usePacientesList('', 1, 1);
  const { consultas } = useConsultas();

  const pacientesAtivos =
    pacientesData?.meta?.total ??
    pacientesData?.rows?.filter((p) => p.status === 'ativo').length ??
    0;

  const hoje = new Date();
  const agendamentosHoje = consultas.filter((c) => {
    const d = new Date(c.dataHora);
    return (
      d.getFullYear() === hoje.getFullYear() &&
      d.getMonth() === hoje.getMonth() &&
      d.getDate() === hoje.getDate()
    );
  }).length;

  const stats = [
    {
      title: 'Pacientes Ativos',
      value: pacientesLoading ? '—' : String(pacientesAtivos),
      icon: Users,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
      href: '/pacientes',
      linkLabel: 'Ver pacientes',
    },
    {
      title: 'Agendamentos Hoje',
      value: String(agendamentosHoje),
      icon: Calendar,
      color: 'text-info',
      bgColor: 'bg-info/10',
      href: '/consultas',
      linkLabel: 'Ver agendamentos',
    },
    {
      title: 'Receita Mensal',
      value: '—',
      icon: DollarSign,
      color: 'text-success',
      bgColor: 'bg-success/10',
      href: '/financeiro',
      linkLabel: 'Ver financeiro',
    },
    {
      title: 'Relatórios Pendentes',
      value: '—',
      icon: FileText,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      href: '/relatorios',
      linkLabel: 'Ver relatórios',
    },
  ];

  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-6 text-white shadow-lg">
          <h2 className="text-2xl font-bold mb-2 text-white">Bem-vindo ao Espaço Terapia</h2>
          <p className="text-white/90">
            Gerencie suas operações clínicas de forma eficiente e organizada
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card
              key={stat.title}
              className="border-border hover:shadow-md transition-shadow"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} ${stat.color} p-2 rounded-lg`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy">{stat.value}</div>
                <Link
                  to={stat.href}
                  className="text-xs text-primary hover:underline mt-1 inline-block"
                >
                  {stat.linkLabel}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Atividades Recentes
              </CardTitle>
              <CardDescription>Últimas ações no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyIntegrationState
                moduleName="Atividades recentes"
                description="Nenhuma atividade recente."
              />
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Desempenho</CardTitle>
              <CardDescription>Indicadores do mês</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyIntegrationState
                moduleName="Indicadores do mês"
                description="Sem indicadores no período."
              />
            </CardContent>
          </Card>
        </div>

        <AniversariantesWidget />
      </div>
    </MainLayout>
  );
};

export default Dashboard;
