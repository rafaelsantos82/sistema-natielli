import { useState, useMemo, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useFinanceiro, type Lancamento, type Categoria, type CentroCusto } from '@/hooks/useFinanceiro';
import { useAuth } from '@/contexts/AuthContext';
import { useUnidadeAtiva } from '@/contexts/UnidadeContext';
import { UNIDADE_PADRAO_ID } from '@/hooks/useUnidades';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Plus,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  FileCheck,
  Settings,
  Building2,
  Layers,
} from 'lucide-react';
import { DataTable, DataTableColumn } from '@/components/common/DataTable';
import { FormModal } from '@/components/common/FormModal';
import { PageToolbar } from '@/components/common/PageToolbar';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { LancamentoForm } from '@/components/forms/LancamentoForm';
import { CategoriaForm } from '@/components/forms/CategoriaForm';
import { CentroCustoForm } from '@/components/forms/CentroCustoForm';
import { DashboardFinanceiro } from '@/components/financeiro/DashboardFinanceiro';
import { LancamentoFormData, CategoriaFormData, CentroCustoFormData } from '@/lib/validations/financeiro.schema';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const FinanceiroPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    categorias,
    addCategoria,
    updateCategoria,
    deleteCategoria,
    centrosCusto,
    addCentroCusto,
    updateCentroCusto,
    deleteCentroCusto,
    lancamentos,
    addLancamento,
    updateLancamento,
    deleteLancamento,
    registrarPagamento,
    conciliarLancamento,
  } = useFinanceiro();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddLancamentoModalOpen, setIsAddLancamentoModalOpen] = useState(false);
  const [isEditLancamentoModalOpen, setIsEditLancamentoModalOpen] = useState(false);
  const [isAddCategoriaModalOpen, setIsAddCategoriaModalOpen] = useState(false);
  const [isEditCategoriaModalOpen, setIsEditCategoriaModalOpen] = useState(false);
  const [isAddCentroCustoModalOpen, setIsAddCentroCustoModalOpen] = useState(false);
  const [isEditCentroCustoModalOpen, setIsEditCentroCustoModalOpen] = useState(false);
  const [selectedLancamento, setSelectedLancamento] = useState<Lancamento | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
  const [selectedCentroCusto, setSelectedCentroCusto] = useState<CentroCusto | null>(null);
  const [lancamentoContext, setLancamentoContext] = useState<'pagar' | 'receber' | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'lancamento' | 'categoria' | 'centroCusto'>('lancamento');
  const [verTotalConsolidado, setVerTotalConsolidado] = useState(false);

  const { user } = useAuth();
  const { unidadeAtivaId, unidadeAtiva } = useUnidadeAtiva();
  const podeVerConsolidado = user?.role === 'admin' || user?.role === 'gestor';

  const lancamentosPorUnidade = useMemo(
    () =>
      lancamentos.filter(
        (l) => (l.unidadeId ?? UNIDADE_PADRAO_ID) === unidadeAtivaId,
      ),
    [lancamentos, unidadeAtivaId],
  );

  const lancamentosEscopo = verTotalConsolidado ? lancamentos : lancamentosPorUnidade;

  useEffect(() => {
    setVerTotalConsolidado(false);
  }, [unidadeAtivaId]);

  const pageTitle = verTotalConsolidado
    ? 'Financeiro — Todas as unidades'
    : `Financeiro — ${unidadeAtiva?.nome ?? ''}`.trim();

  const filteredLancamentos = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return lancamentosEscopo.filter((lanc) => {
      if (!q) return true;
      return (
        lanc.descricao.toLowerCase().includes(q) ||
        lanc.categoria_nome.toLowerCase().includes(q)
      );
    });
  }, [lancamentosEscopo, searchQuery]);

  const lancamentosPorStatus = useMemo(() => {
    return {
      contasPagar: filteredLancamentos.filter((l) => l.tipo === 'Despesa' && l.status !== 'Cancelado'),
      contasReceber: filteredLancamentos.filter((l) => l.tipo === 'Receita' && l.status !== 'Cancelado'),
      pendentes: filteredLancamentos.filter((l) => l.status === 'Pendente'),
      vencidos: filteredLancamentos.filter((l) => l.status === 'Vencido'),
      pagos: filteredLancamentos.filter((l) => l.status === 'Pago'),
    };
  }, [filteredLancamentos]);

  const columnsLancamento: DataTableColumn<Lancamento>[] = [
    {
      key: 'data_vencimento',
      label: 'Vencimento',
      render: (lanc) => format(new Date(lanc.data_vencimento), 'dd/MM/yyyy', { locale: ptBR }),
    },
    { key: 'descricao', label: 'Descrição' },
    {
      key: 'valor',
      label: 'Valor',
      render: (lanc) => (
        <span className={lanc.tipo === 'Receita' ? 'text-success font-medium' : 'text-destructive font-medium'}>
          R$ {lanc.valor.toFixed(2)}
        </span>
      ),
    },
    { key: 'categoria_nome', label: 'Categoria' },
    {
      key: 'status',
      label: 'Status',
      render: (lanc) => (
        <Badge
          variant={
            lanc.status === 'Pago' ? 'default' : lanc.status === 'Vencido' ? 'destructive' : 'secondary'
          }
        >
          {lanc.status}
        </Badge>
      ),
    },
    {
      key: 'conciliado',
      label: 'Conciliado',
      render: (lanc) =>
        lanc.conciliado ? (
          <CheckCircle className="h-4 w-4 text-success" />
        ) : (
          <XCircle className="h-4 w-4 text-muted-foreground" />
        ),
    },
  ];

  const columnsCategorias: DataTableColumn<Categoria>[] = [
    { key: 'nome', label: 'Nome' },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (cat) => (
        <Badge variant={cat.tipo === 'Receita' ? 'default' : 'secondary'}>{cat.tipo}</Badge>
      ),
    },
    {
      key: 'cor',
      label: 'Cor',
      render: (cat) =>
        cat.cor ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: cat.cor }} />
          </div>
        ) : null,
    },
  ];

  const columnsCentrosCusto: DataTableColumn<CentroCusto>[] = [
    { key: 'codigo', label: 'Código' },
    { key: 'nome', label: 'Nome' },
    {
      key: 'ativo',
      label: 'Status',
      render: (cc) => <Badge variant={cc.ativo ? 'default' : 'secondary'}>{cc.ativo ? 'Ativo' : 'Inativo'}</Badge>,
    },
  ];

  const handleAddLancamento = async (data: LancamentoFormData) => {
    const forcedTipo =
      lancamentoContext === 'pagar'
        ? 'Despesa'
        : lancamentoContext === 'receber'
          ? 'Receita'
          : data.tipo;
    try {
      await addLancamento({
        ...(data as any),
        tipo: forcedTipo,
        unidadeId: (data as any).unidadeId ?? unidadeAtivaId,
      });
      setIsAddLancamentoModalOpen(false);
      setLancamentoContext(null);
      toast({
        title: 'Sucesso',
        description: 'Lançamento registrado com sucesso',
      });
    } catch (err) {
      toast({
        title: 'Erro',
        description:
          err instanceof Error
            ? err.message
            : 'Não foi possível registrar o lançamento. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleEditLancamento = (data: LancamentoFormData) => {
    if (selectedLancamento) {
      updateLancamento(selectedLancamento.id, data);
      setIsEditLancamentoModalOpen(false);
      setSelectedLancamento(null);
      toast({
        title: 'Sucesso',
        description: 'Lançamento atualizado com sucesso',
      });
    }
  };

  const handlePagarLancamento = (lancamento: Lancamento) => {
    const hoje = new Date().toISOString().split('T')[0];
    registrarPagamento(lancamento.id, hoje);
    toast({
      title: 'Pagamento Registrado',
      description: `${lancamento.descricao} marcado como pago`,
    });
  };

  const handleConciliar = (lancamento: Lancamento) => {
    conciliarLancamento(lancamento.id);
    toast({
      title: 'Lançamento Conciliado',
      description: `${lancamento.descricao} foi conciliado`,
    });
  };

  const handleDeleteLancamento = (lancamento: Lancamento) => {
    setSelectedLancamento(lancamento);
    setDeleteType('lancamento');
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteType === 'lancamento' && selectedLancamento) {
      deleteLancamento(selectedLancamento.id);
      toast({ title: 'Sucesso', description: 'Lançamento removido com sucesso' });
    } else if (deleteType === 'categoria' && selectedCategoria) {
      deleteCategoria(selectedCategoria.id);
      toast({ title: 'Sucesso', description: 'Categoria removida com sucesso' });
    } else if (deleteType === 'centroCusto' && selectedCentroCusto) {
      deleteCentroCusto(selectedCentroCusto.id);
      toast({ title: 'Sucesso', description: 'Centro de custo removido com sucesso' });
    }
    setIsDeleteDialogOpen(false);
    setSelectedLancamento(null);
    setSelectedCategoria(null);
    setSelectedCentroCusto(null);
  };

  const vencidosCount = lancamentosPorStatus.vencidos.length;

  return (
    <MainLayout title={pageTitle}>
      <div className="space-y-6">
        {vencidosCount > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{vencidosCount}</strong> lançamento{vencidosCount === 1 ? ' está' : 's estão'} vencido
              {vencidosCount === 1 ? '' : 's'}. Verifique as contas pendentes.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="contas-pagar">
              Contas a Pagar ({lancamentosPorStatus.contasPagar.length})
            </TabsTrigger>
            <TabsTrigger value="contas-receber">
              Contas a Receber ({lancamentosPorStatus.contasReceber.length})
            </TabsTrigger>
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
            <TabsTrigger value="centros-custo">Centros de Custo</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-4 space-y-4">
            {podeVerConsolidado && (
              <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3 sm:items-center">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-background border border-border">
                    {verTotalConsolidado ? (
                      <Layers className="h-4 w-4 text-primary" aria-hidden />
                    ) : (
                      <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-medium leading-tight">Escopo do dashboard</p>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      {verTotalConsolidado ? (
                        'Exibindo totais de todas as unidades'
                      ) : (
                        <>
                          Unidade ativa:{' '}
                          <span className="font-medium text-foreground">
                            {unidadeAtiva?.nome ?? '—'}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={verTotalConsolidado ? 'default' : 'outline'}
                  className="w-full shrink-0 sm:w-auto"
                  onClick={() => setVerTotalConsolidado((v) => !v)}
                >
                  <span className="sm:hidden">
                    {verTotalConsolidado ? 'Só unidade ativa' : 'Total consolidado'}
                  </span>
                  <span className="hidden sm:inline">
                    {verTotalConsolidado
                      ? 'Filtrar pela unidade ativa'
                      : 'Ver total consolidado'}
                  </span>
                </Button>
              </div>
            )}
            <DashboardFinanceiro lancamentos={lancamentosEscopo} />
          </TabsContent>

          <TabsContent value="contas-pagar" className="space-y-4">
            <PageToolbar
              backLabel="Voltar"
              onBack={() => navigate(-1)}
              onAdd={() => {
                setLancamentoContext('pagar');
                setIsAddLancamentoModalOpen(true);
              }}
              onSearch={setSearchQuery}
              addButtonText="Nova Despesa"
            />

            <Card>
              <CardContent className="pt-6">
                <DataTable
                  columns={columnsLancamento}
                  data={lancamentosPorStatus.contasPagar}
                  onEdit={(lanc) => {
                    setSelectedLancamento(lanc);
                    setIsEditLancamentoModalOpen(true);
                  }}
                  onDelete={handleDeleteLancamento}
                  emptyMessage="Nenhuma conta a pagar"
                />
                {lancamentosPorStatus.contasPagar.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">Ações rápidas:</p>
                    <div className="flex flex-wrap gap-2">
                      {lancamentosPorStatus.contasPagar
                        .filter((lanc) => lanc.status !== 'Pago')
                        .map((lanc) => (
                          <div key={lanc.id} className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handlePagarLancamento(lanc)}>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Pagar: {lanc.descricao}
                            </Button>
                            {lanc.status === 'Pago' && !lanc.conciliado && (
                              <Button size="sm" variant="default" onClick={() => handleConciliar(lanc)}>
                                <FileCheck className="h-4 w-4 mr-1" />
                                Conciliar
                              </Button>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contas-receber" className="space-y-4">
            <PageToolbar
              backLabel="Voltar"
              onBack={() => navigate(-1)}
              onAdd={() => {
                setLancamentoContext('receber');
                setIsAddLancamentoModalOpen(true);
              }}
              onSearch={setSearchQuery}
              addButtonText="Nova Receita"
            />

            <Card>
              <CardContent className="pt-6">
                <DataTable
                  columns={columnsLancamento}
                  data={lancamentosPorStatus.contasReceber}
                  onEdit={(lanc) => {
                    setSelectedLancamento(lanc);
                    setIsEditLancamentoModalOpen(true);
                  }}
                  onDelete={handleDeleteLancamento}
                  emptyMessage="Nenhuma conta a receber"
                />
                {lancamentosPorStatus.contasReceber.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">Ações rápidas:</p>
                    <div className="flex flex-wrap gap-2">
                      {lancamentosPorStatus.contasReceber
                        .filter((lanc) => lanc.status !== 'Pago')
                        .map((lanc) => (
                          <div key={lanc.id} className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handlePagarLancamento(lanc)}>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Receber: {lanc.descricao}
                            </Button>
                            {lanc.status === 'Pago' && !lanc.conciliado && (
                              <Button size="sm" variant="default" onClick={() => handleConciliar(lanc)}>
                                <FileCheck className="h-4 w-4 mr-1" />
                                Conciliar
                              </Button>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categorias" className="space-y-4">
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={() => setIsAddCategoriaModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6">
                <DataTable
                  columns={columnsCategorias}
                  data={categorias}
                  onEdit={(cat) => {
                    setSelectedCategoria(cat);
                    setIsEditCategoriaModalOpen(true);
                  }}
                  onDelete={(cat) => {
                    setSelectedCategoria(cat);
                    setDeleteType('categoria');
                    setIsDeleteDialogOpen(true);
                  }}
                  emptyMessage="Nenhuma categoria cadastrada"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="centros-custo" className="space-y-4">
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={() => setIsAddCentroCustoModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Centro de Custo
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6">
                <DataTable
                  columns={columnsCentrosCusto}
                  data={centrosCusto}
                  onEdit={(cc) => {
                    setSelectedCentroCusto(cc);
                    setIsEditCentroCustoModalOpen(true);
                  }}
                  onDelete={(cc) => {
                    setSelectedCentroCusto(cc);
                    setDeleteType('centroCusto');
                    setIsDeleteDialogOpen(true);
                  }}
                  emptyMessage="Nenhum centro de custo cadastrado"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <FormModal
          title="Novo Lançamento"
          isOpen={isAddLancamentoModalOpen}
          onClose={() => {
            setIsAddLancamentoModalOpen(false);
            setLancamentoContext(null);
          }}
        >
          <LancamentoForm
            onSubmit={handleAddLancamento}
            fixedTipo={
              lancamentoContext === 'pagar'
                ? 'Despesa'
                : lancamentoContext === 'receber'
                  ? 'Receita'
                  : undefined
            }
          />
        </FormModal>

        <FormModal
          title="Editar Lançamento"
          isOpen={isEditLancamentoModalOpen}
          onClose={() => {
            setIsEditLancamentoModalOpen(false);
            setSelectedLancamento(null);
          }}
        >
          <LancamentoForm
            onSubmit={handleEditLancamento}
            defaultValues={selectedLancamento || undefined}
            fixedTipo={selectedLancamento?.tipo}
          />
        </FormModal>

        <FormModal
          title="Nova Categoria"
          isOpen={isAddCategoriaModalOpen}
          onClose={() => setIsAddCategoriaModalOpen(false)}
        >
          <CategoriaForm
            onSubmit={(data) => {
              addCategoria(data as any);
              setIsAddCategoriaModalOpen(false);
              toast({ title: 'Sucesso', description: 'Categoria criada com sucesso' });
            }}
          />
        </FormModal>

        <FormModal
          title="Editar Categoria"
          isOpen={isEditCategoriaModalOpen}
          onClose={() => {
            setIsEditCategoriaModalOpen(false);
            setSelectedCategoria(null);
          }}
        >
          <CategoriaForm
            onSubmit={(data) => {
              if (selectedCategoria) {
                updateCategoria(selectedCategoria.id, data);
                setIsEditCategoriaModalOpen(false);
                setSelectedCategoria(null);
                toast({ title: 'Sucesso', description: 'Categoria atualizada com sucesso' });
              }
            }}
            defaultValues={selectedCategoria || undefined}
          />
        </FormModal>

        <FormModal
          title="Novo Centro de Custo"
          isOpen={isAddCentroCustoModalOpen}
          onClose={() => setIsAddCentroCustoModalOpen(false)}
        >
          <CentroCustoForm
            onSubmit={(data) => {
              addCentroCusto(data as any);
              setIsAddCentroCustoModalOpen(false);
              toast({ title: 'Sucesso', description: 'Centro de custo criado com sucesso' });
            }}
          />
        </FormModal>

        <FormModal
          title="Editar Centro de Custo"
          isOpen={isEditCentroCustoModalOpen}
          onClose={() => {
            setIsEditCentroCustoModalOpen(false);
            setSelectedCentroCusto(null);
          }}
        >
          <CentroCustoForm
            onSubmit={(data) => {
              if (selectedCentroCusto) {
                updateCentroCusto(selectedCentroCusto.id, data);
                setIsEditCentroCustoModalOpen(false);
                setSelectedCentroCusto(null);
                toast({ title: 'Sucesso', description: 'Centro de custo atualizado com sucesso' });
              }
            }}
            defaultValues={selectedCentroCusto || undefined}
          />
        </FormModal>

        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onCancel={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Confirmar Exclusão"
          description={
            deleteType === 'lancamento'
              ? 'Tem certeza que deseja excluir este lançamento?'
              : deleteType === 'categoria'
              ? 'Tem certeza que deseja excluir esta categoria?'
              : 'Tem certeza que deseja excluir este centro de custo?'
          }
        />
      </div>
    </MainLayout>
  );
};

export default FinanceiroPage;
