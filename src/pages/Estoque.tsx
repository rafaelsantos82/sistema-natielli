import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getErrorToastProps } from '@/lib/ui/showErrorToast';
import { useNavigate } from 'react-router-dom';
import { useEstoque, ItemEstoque, Inventario, SALDO_INSUFICIENTE_MSG } from '@/hooks/useEstoque';
import { movimentacaoFormToInput } from '@/lib/mappers/estoqueMapper';
import { AlertTriangle, Package, TrendingDown, TrendingUp, FileText, Plus, Download, FileSpreadsheet, ClipboardCheck, BarChart3, Calendar } from 'lucide-react';
import { DataTable, DataTableColumn } from '@/components/common/DataTable';
import { FormModal } from '@/components/common/FormModal';
import { PageToolbar } from '@/components/common/PageToolbar';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ItemEstoqueForm } from '@/components/forms/ItemEstoqueForm';
import { MovimentacaoForm } from '@/components/forms/MovimentacaoForm';
import { InventarioForm } from '@/components/forms/InventarioForm';
import { ItemEstoqueFormData, MovimentacaoFormData } from '@/lib/validations/estoque.schema';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { generateEstoquePDF, generateMovimentacoesCSV, downloadCSV } from '@/lib/utils/estoqueReportGenerator';

const FILTER_ALL = 'all';

function isFilterActive(value: string): boolean {
  return value !== '' && value !== FILTER_ALL;
}

const Estoque = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    itens,
    movimentacoes,
    inventarios,
    getItensComEstoqueBaixo,
    addItem,
    updateItem,
    deleteItem,
    getItemById,
    addMovimentacao,
    getMovimentacoesByItem,
    addInventario,
  } = useEstoque();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('itens');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMovimentacaoModalOpen, setIsMovimentacaoModalOpen] = useState(false);
  const [isSubmittingMovimentacao, setIsSubmittingMovimentacao] = useState(false);
  const [isInventarioModalOpen, setIsInventarioModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemEstoque | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Filtros de relatório
  const [filtroCategoria, setFiltroCategoria] = useState<string>(FILTER_ALL);
  const [filtroStatus, setFiltroStatus] = useState<string>(FILTER_ALL);
  const [filtroNivelEstoque, setFiltroNivelEstoque] = useState<string>(FILTER_ALL);

  const itensComEstoqueBaixo = getItensComEstoqueBaixo();

  const filteredItens = itens.filter(
    (item) =>
      item.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.codigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.categoria.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Itens filtrados para relatório
  const itensRelatorio = useMemo(() => {
    return itens.filter((item) => {
      if (isFilterActive(filtroCategoria) && item.categoria !== filtroCategoria) return false;
      if (isFilterActive(filtroStatus) && item.status !== filtroStatus) return false;
      if (filtroNivelEstoque === 'baixo' && item.estoque_atual > item.estoque_minimo) return false;
      if (filtroNivelEstoque === 'normal' && item.estoque_atual <= item.estoque_minimo) return false;
      return true;
    });
  }, [itens, filtroCategoria, filtroStatus, filtroNivelEstoque]);

  const categorias = Array.from(new Set(itens.map((i) => i.categoria)));

  // Dashboard analytics
  const dashboardData = useMemo(() => {
    // Itens mais movimentados (últimos 30 dias)
    const thirtyDaysAgo = startOfDay(subDays(new Date(), 30));
    const recentMovimentacoes = movimentacoes.filter(
      (mov) => new Date(mov.data_hora) >= thirtyDaysAgo
    );

    const itemMovimentacaoCount = recentMovimentacoes.reduce((acc, mov) => {
      acc[mov.item_id] = (acc[mov.item_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const itensMaisMovimentados = Object.entries(itemMovimentacaoCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([itemId, count]) => {
        const item = itens.find((i) => i.id === itemId);
        return {
          nome: item?.nome || 'Desconhecido',
          movimentacoes: count,
        };
      });

    // Movimentações por tipo
    const movimentacoesPorTipo = recentMovimentacoes.reduce(
      (acc, mov) => {
        acc[mov.tipo] = (acc[mov.tipo] || 0) + mov.quantidade;
        return acc;
      },
      {} as Record<string, number>
    );

    const chartMovimentacoesTipo = Object.entries(movimentacoesPorTipo).map(([tipo, quantidade]) => ({
      tipo,
      quantidade,
    }));

    // Distribuição por categoria
    const itensPorCategoria = itens.reduce((acc, item) => {
      acc[item.categoria] = (acc[item.categoria] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const chartCategoria = Object.entries(itensPorCategoria).map(([categoria, quantidade]) => ({
      name: categoria,
      value: quantidade,
    }));

    // Previsão de reposição (itens com tendência a atingir estoque mínimo)
    const previsaoReposicao = itens
      .filter((item) => item.status === 'Ativo')
      .map((item) => {
        const itemMovs = recentMovimentacoes.filter((m) => m.item_id === item.id);
        const saidas = itemMovs
          .filter((m) => m.tipo === 'Saída')
          .reduce((sum, m) => sum + m.quantidade, 0);
        
        const diasParaAnalise = 30;
        const mediaSaidaDiaria = saidas / diasParaAnalise;
        
        if (mediaSaidaDiaria === 0) return null;
        
        const estoqueDisponivel = item.estoque_atual - item.estoque_minimo;
        const diasAteEstoqueMinimo = estoqueDisponivel / mediaSaidaDiaria;
        
        if (diasAteEstoqueMinimo <= 15 && diasAteEstoqueMinimo > 0) {
          return {
            id: item.id,
            nome: item.nome,
            categoria: item.categoria,
            estoque_atual: item.estoque_atual,
            estoque_minimo: item.estoque_minimo,
            dias_ate_minimo: Math.round(diasAteEstoqueMinimo),
            media_saida_diaria: mediaSaidaDiaria.toFixed(2),
          };
        }
        return null;
      })
      .filter((item) => item !== null)
      .sort((a, b) => a!.dias_ate_minimo - b!.dias_ate_minimo);

    return {
      itensMaisMovimentados,
      chartMovimentacoesTipo,
      chartCategoria,
      previsaoReposicao,
    };
  }, [itens, movimentacoes]);

  const itensColumns: DataTableColumn<typeof itens[0]>[] = [
    { key: 'codigo', label: 'Código' },
    { key: 'nome', label: 'Nome' },
    { key: 'categoria', label: 'Categoria' },
    { key: 'unidade_medida', label: 'Unidade' },
    {
      key: 'estoque_atual',
      label: 'Estoque Atual',
      render: (item) => (
        <Badge
          variant={item.estoque_atual <= item.estoque_minimo ? 'destructive' : 'secondary'}
        >
          {item.estoque_atual}
        </Badge>
      ),
    },
    { key: 'estoque_minimo', label: 'Estoque Mínimo' },
    { key: 'localizacao', label: 'Localização' },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <Badge
          variant={item.status === 'Ativo' ? 'default' : 'secondary'}
          className={
            item.status === 'Ativo'
              ? 'bg-success text-success-foreground'
              : 'bg-muted text-muted-foreground'
          }
        >
          {item.status}
        </Badge>
      ),
    },
  ];

  const handleAddItem = (data: ItemEstoqueFormData) => {
    addItem({
      codigo: data.codigo,
      nome: data.nome,
      categoria: data.categoria,
      unidade_medida: data.unidade_medida,
      estoque_minimo: data.estoque_minimo,
      localizacao: data.localizacao,
      status: data.status,
    });
    setIsAddModalOpen(false);
    toast({
      title: 'Sucesso',
      description: 'Item adicionado ao estoque com sucesso',
    });
  };

  const handleEditItem = (data: ItemEstoqueFormData) => {
    if (selectedItem) {
      updateItem(selectedItem.id, data);
      setIsEditModalOpen(false);
      setSelectedItem(null);
      toast({
        title: 'Sucesso',
        description: 'Item atualizado com sucesso',
      });
    }
  };

  const handleDeleteClick = (item: ItemEstoque) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedItem) {
      deleteItem(selectedItem.id);
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
      toast({
        title: 'Sucesso',
        description: 'Item removido do estoque',
      });
    }
  };

  const handleEditClick = (item: ItemEstoque) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleMovimentacao = async (data: MovimentacaoFormData) => {
    setIsSubmittingMovimentacao(true);
    try {
      await addMovimentacao(movimentacaoFormToInput(data));
      setIsMovimentacaoModalOpen(false);
      toast({
        title: 'Sucesso',
        description: 'Movimentação registrada com sucesso',
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.message === SALDO_INSUFICIENTE_MSG) {
        toast({
          variant: 'destructive',
          title: 'Saldo insuficiente',
          description: error.message,
        });
        return;
      }
      toast(getErrorToastProps(error, { action: 'salvar', entity: 'a movimentação' }));
    } finally {
      setIsSubmittingMovimentacao(false);
    }
  };

  const handleInventario = async (data: Omit<Inventario, 'id' | 'createdAt'>) => {
    addInventario(data);

    for (const contagem of data.contagens) {
      if (contagem.divergencia !== 0) {
        try {
          await addMovimentacao({
            item_id: String(contagem.item_id),
            item_nome: String(contagem.item_nome),
            tipo: 'Ajuste',
            quantidade: Math.abs(Number(contagem.divergencia)),
            saldo_alvo: Number(contagem.contagem_fisica),
            data_hora: new Date().toISOString(),
            documento: undefined,
            motivo: `Ajuste de inventário - ${data.observacoes || 'Sem observações'}`,
            responsavel_id: String(data.responsavel_id),
            responsavel_nome: String(data.responsavel_nome),
          });
        } catch (error: unknown) {
          console.error('Erro ao aplicar ajuste:', error);
        }
      }
    }

    setIsInventarioModalOpen(false);
    toast({
      title: 'Sucesso',
      description: 'Inventário finalizado e ajustes aplicados automaticamente',
    });
  };

  const handleExportPDF = () => {
    const pdf = generateEstoquePDF(itensRelatorio, {
      categoria: isFilterActive(filtroCategoria) ? filtroCategoria : undefined,
      status: isFilterActive(filtroStatus) ? filtroStatus : undefined,
      nivelEstoque: isFilterActive(filtroNivelEstoque) ? filtroNivelEstoque : undefined,
    });
    pdf.save(`relatorio-estoque-${format(new Date(), 'ddMMyyyy')}.pdf`);
    toast({
      title: 'Sucesso',
      description: 'Relatório exportado em PDF',
    });
  };

  const handleExportCSV = () => {
    const csv = generateMovimentacoesCSV(movimentacoes);
    downloadCSV(csv, `movimentacoes-estoque-${format(new Date(), 'ddMMyyyy')}.csv`);
    toast({
      title: 'Sucesso',
      description: 'Movimentações exportadas em CSV',
    });
  };

  const stats = [
    {
      title: 'Total de Itens',
      value: itens.length,
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Itens Ativos',
      value: itens.filter((i) => i.status === 'Ativo').length,
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Estoque Baixo',
      value: itensComEstoqueBaixo.length,
      icon: AlertTriangle,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Categorias',
      value: new Set(itens.map((i) => i.categoria)).size,
      icon: FileText,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
  ];

  const movimentacoesColumns: DataTableColumn<typeof movimentacoes[0]>[] = [
    {
      key: 'data_hora',
      label: 'Data/Hora',
      render: (mov) => format(new Date(mov.data_hora), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
    },
    { key: 'item_nome', label: 'Item' },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (mov) => (
        <Badge
          variant={
            mov.tipo === 'Entrada'
              ? 'default'
              : mov.tipo === 'Saída'
              ? 'destructive'
              : 'secondary'
          }
        >
          {mov.tipo}
        </Badge>
      ),
    },
    { key: 'quantidade', label: 'Quantidade' },
    { key: 'documento', label: 'Documento' },
    { key: 'responsavel_nome', label: 'Responsável' },
    {
      key: 'saldo_atual',
      label: 'Saldo Atual',
      render: (mov) => <Badge variant="outline">{mov.saldo_atual}</Badge>,
    },
  ];

  return (
    <MainLayout title="Estoque">
      <div className="space-y-6">
        {/* Alertas de Estoque Baixo */}
        {itensComEstoqueBaixo.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{itensComEstoqueBaixo.length}</strong> ite
              {itensComEstoqueBaixo.length === 1 ? 'm está' : 'ns estão'} com estoque
              abaixo do mínimo. Verifique a necessidade de reposição.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-border hover:shadow-md transition-shadow">
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
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="itens">Itens</TabsTrigger>
            <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
            <TabsTrigger value="inventario">Inventário</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* KPIs Avançados */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Itens Críticos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {itensComEstoqueBaixo.length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Abaixo do estoque mínimo
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Taxa de Ocupação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {itens.length > 0 
                      ? ((itens.filter(i => i.estoque_atual > i.estoque_minimo).length / itens.length) * 100).toFixed(0)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Itens acima do mínimo
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Movimentações (30d)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {movimentacoes.filter(m => 
                      new Date(m.data_hora) >= startOfDay(subDays(new Date(), 30))
                    ).length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Entradas, saídas e ajustes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Alertas Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">
                    {itensComEstoqueBaixo.length + dashboardData.previsaoReposicao.length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Requerem atenção
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Itens Mais Movimentados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData.itensMaisMovimentados.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dashboardData.itensMaisMovimentados}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="nome" 
                          stroke="hsl(var(--muted-foreground))"
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--foreground))'
                          }}
                        />
                        <Bar dataKey="movimentacoes" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      Nenhuma movimentação nos últimos 30 dias
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Distribuição por Categoria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData.chartCategoria.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={dashboardData.chartCategoria}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="hsl(var(--primary))"
                          dataKey="value"
                        >
                          {dashboardData.chartCategoria.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={`hsl(var(--chart-${(index % 5) + 1}))`}
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--foreground))'
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      Nenhum item cadastrado
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Movimentações por Tipo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData.chartMovimentacoesTipo.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dashboardData.chartMovimentacoesTipo}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="tipo" 
                          stroke="hsl(var(--muted-foreground))"
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--foreground))'
                          }}
                        />
                        <Bar dataKey="quantidade" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      Nenhuma movimentação nos últimos 30 dias
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Previsão de Reposição
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData.previsaoReposicao.length > 0 ? (
                    <div className="space-y-4 max-h-[300px] overflow-y-auto">
                      {dashboardData.previsaoReposicao.map((item) => (
                        <div key={item!.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                          <div className="flex-1">
                            <p className="font-medium text-sm text-foreground">{item!.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {item!.categoria} • Atual: {item!.estoque_atual} • Mínimo: {item!.estoque_minimo}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={item!.dias_ate_minimo <= 7 ? 'destructive' : 'secondary'}>
                              {item!.dias_ate_minimo} dias
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              Média: {item!.media_saida_diaria}/dia
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      Nenhum item próximo ao estoque mínimo
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="itens" className="space-y-4">
            <PageToolbar
              onBack={() => navigate(-1)}
              onAdd={() => setIsAddModalOpen(true)}
              onSearch={setSearchQuery}
              addButtonText="Adicionar Item"
            />

            <DataTable
              columns={itensColumns}
              data={filteredItens}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              emptyMessage="Nenhum item encontrado"
            />
          </TabsContent>

          <TabsContent value="movimentacoes" className="space-y-4">
            <div className="flex justify-between items-center">
              <Button onClick={() => setIsMovimentacaoModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Movimentação
              </Button>
              <Button variant="outline" onClick={handleExportCSV}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>

            {movimentacoes.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma movimentação registrada</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <DataTable
                columns={movimentacoesColumns}
                data={movimentacoes.slice().reverse()}
                emptyMessage="Nenhuma movimentação encontrada"
              />
            )}
          </TabsContent>

          <TabsContent value="relatorios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Filtros de Relatório</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Categoria</label>
                    <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as categorias" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={FILTER_ALL}>Todas as categorias</SelectItem>
                        {categorias.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={FILTER_ALL}>Todos os status</SelectItem>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Nível de Estoque</label>
                    <Select value={filtroNivelEstoque} onValueChange={setFiltroNivelEstoque}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os níveis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={FILTER_ALL}>Todos os níveis</SelectItem>
                        <SelectItem value="baixo">Estoque Baixo</SelectItem>
                        <SelectItem value="normal">Estoque Normal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleExportPDF} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFiltroCategoria(FILTER_ALL);
                      setFiltroStatus(FILTER_ALL);
                      setFiltroNivelEstoque(FILTER_ALL);
                    }}
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resultado da Consulta</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {itensRelatorio.length} item(ns) encontrado(s)
                </p>
                <DataTable
                  columns={itensColumns}
                  data={itensRelatorio}
                  emptyMessage="Nenhum item encontrado com os filtros aplicados"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventario" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Gestão de Inventário</h3>
                <p className="text-sm text-muted-foreground">
                  Realize contagem física e ajuste automaticamente as divergências
                </p>
              </div>
              <Button onClick={() => setIsInventarioModalOpen(true)}>
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Novo Inventário
              </Button>
            </div>

            {inventarios.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum inventário realizado ainda</p>
                    <p className="text-sm mt-2">
                      Clique em "Novo Inventário" para iniciar uma contagem física
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {inventarios.slice().reverse().map((inv) => (
                  <Card key={inv.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">
                            Inventário - {format(new Date(inv.data), 'dd/MM/yyyy', { locale: ptBR })}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            Responsável: {inv.responsavel_nome}
                          </p>
                        </div>
                        <Badge>
                          {inv.contagens.filter((c) => c.divergencia === 0).length}/
                          {inv.contagens.length} corretos
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {inv.observacoes && (
                        <p className="text-sm text-muted-foreground mb-3">
                          <strong>Observações:</strong> {inv.observacoes}
                        </p>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Total de divergências:{' '}
                        <strong>{inv.contagens.filter((c) => c.divergencia !== 0).length}</strong>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Modal Adicionar Item */}
        <FormModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Adicionar Item ao Estoque"
        >
          <ItemEstoqueForm onSubmit={handleAddItem} />
        </FormModal>

        {/* Modal Editar Item */}
        <FormModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedItem(null);
          }}
          title="Editar Item do Estoque"
        >
          <ItemEstoqueForm
            onSubmit={handleEditItem}
            defaultValues={selectedItem || undefined}
          />
        </FormModal>

        {/* Modal Movimentação */}
        <FormModal
          isOpen={isMovimentacaoModalOpen}
          onClose={() => setIsMovimentacaoModalOpen(false)}
          title="Registrar Movimentação"
          hideFooter
        >
          <MovimentacaoForm
            onSubmit={handleMovimentacao}
            onCancel={() => setIsMovimentacaoModalOpen(false)}
            isSubmitting={isSubmittingMovimentacao}
          />
        </FormModal>

        {/* Modal Inventário */}
        <FormModal
          isOpen={isInventarioModalOpen}
          onClose={() => setIsInventarioModalOpen(false)}
          title="Realizar Inventário"
          size="4xl"
        >
          <InventarioForm onSubmit={handleInventario} />
        </FormModal>

        {/* Dialog Confirmar Exclusão */}
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onCancel={() => {
            setIsDeleteDialogOpen(false);
            setSelectedItem(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Excluir Item"
          description={`Tem certeza que deseja excluir o item "${selectedItem?.nome}"? Esta ação não pode ser desfeita.`}
          variant="destructive"
        />
      </div>
    </MainLayout>
  );
};

export default Estoque;
