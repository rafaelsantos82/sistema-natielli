import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { DataTable } from '@/components/common/DataTable';
import { FormModal } from '@/components/common/FormModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFolhaPagamento } from '@/hooks/useFolhaPagamento';
import { FuncionarioCLTForm } from '@/components/forms/FuncionarioCLTForm';
import { FuncionarioPJForm } from '@/components/forms/FuncionarioPJForm';
import { FolhaCLTForm } from '@/components/forms/FolhaCLTForm';
import { FolhaPJForm } from '@/components/forms/FolhaPJForm';
import type { FuncionarioCLT, FuncionarioPJ, FolhaCLT, FolhaPJ } from '@/lib/validations/folhaPagamento.schema';
import { UserCog, Users, FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { showErrorToast } from '@/lib/ui/showErrorToast';
import { generateHoleritePDF } from '@/lib/utils/holeritePdfGenerator';
import { generateReciboPJPDF } from '@/lib/utils/reciboPJPdfGenerator';

export default function FolhaPagamento() {
  const {
    funcionariosCLT,
    funcionariosPJ,
    folhasCLT,
    folhasPJ,
    loading,
    addFuncionarioCLT,
    updateFuncionarioCLT,
    deleteFuncionarioCLT,
    addFuncionarioPJ,
    updateFuncionarioPJ,
    deleteFuncionarioPJ,
    addFolhaCLT,
    updateFolhaCLT,
    deleteFolhaCLT,
    addFolhaPJ,
    updateFolhaPJ,
    deleteFolhaPJ,
    calcularFolhaCLT,
  } = useFolhaPagamento();

  const [modalFuncionarioCLT, setModalFuncionarioCLT] = useState(false);
  const [modalFuncionarioPJ, setModalFuncionarioPJ] = useState(false);
  const [modalFolhaCLT, setModalFolhaCLT] = useState(false);
  const [modalFolhaPJ, setModalFolhaPJ] = useState(false);
  const [selectedFuncionarioCLT, setSelectedFuncionarioCLT] = useState<FuncionarioCLT | undefined>();
  const [selectedFuncionarioPJ, setSelectedFuncionarioPJ] = useState<FuncionarioPJ | undefined>();
  const [selectedFolhaCLT, setSelectedFolhaCLT] = useState<FolhaCLT | undefined>();
  const [selectedFolhaPJ, setSelectedFolhaPJ] = useState<FolhaPJ | undefined>();
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; id: string }>({
    open: false,
    type: '',
    id: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddFuncionarioCLT = async (data: FuncionarioCLT) => {
    setIsSubmitting(true);
    try {
      await addFuncionarioCLT(data);
      toast.success('Funcionário CLT cadastrado com sucesso');
      setModalFuncionarioCLT(false);
      setSelectedFuncionarioCLT(undefined);
    } catch (err) {
      showErrorToast(err, { action: 'criar', entity: 'o funcionário CLT' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateFuncionarioCLT = async (data: FuncionarioCLT) => {
    if (!selectedFuncionarioCLT?.id) return;
    setIsSubmitting(true);
    try {
      await updateFuncionarioCLT(selectedFuncionarioCLT.id, data);
      toast.success('Funcionário CLT atualizado com sucesso');
      setModalFuncionarioCLT(false);
      setSelectedFuncionarioCLT(undefined);
    } catch (err) {
      showErrorToast(err, { action: 'salvar', entity: 'o funcionário CLT' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddFuncionarioPJ = async (data: FuncionarioPJ) => {
    setIsSubmitting(true);
    try {
      await addFuncionarioPJ(data);
      toast.success('Prestador PJ cadastrado com sucesso');
      setModalFuncionarioPJ(false);
      setSelectedFuncionarioPJ(undefined);
    } catch (err) {
      showErrorToast(err, { action: 'criar', entity: 'o prestador PJ' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateFuncionarioPJ = async (data: FuncionarioPJ) => {
    if (!selectedFuncionarioPJ?.id) return;
    setIsSubmitting(true);
    try {
      await updateFuncionarioPJ(selectedFuncionarioPJ.id, data);
      toast.success('Prestador PJ atualizado com sucesso');
      setModalFuncionarioPJ(false);
      setSelectedFuncionarioPJ(undefined);
    } catch (err) {
      showErrorToast(err, { action: 'salvar', entity: 'o prestador PJ' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddFolhaCLT = async (data: FolhaCLT) => {
    setIsSubmitting(true);
    try {
      await addFolhaCLT(data);
      toast.success('Folha de pagamento gerada com sucesso');
      setModalFolhaCLT(false);
      setSelectedFolhaCLT(undefined);
    } catch (err) {
      showErrorToast(err, { action: 'criar', entity: 'a folha de pagamento' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateFolhaCLT = async (data: FolhaCLT) => {
    if (!selectedFolhaCLT?.id) return;
    setIsSubmitting(true);
    try {
      await updateFolhaCLT(selectedFolhaCLT.id, data);
      toast.success('Folha de pagamento atualizada com sucesso');
      setModalFolhaCLT(false);
      setSelectedFolhaCLT(undefined);
    } catch (err) {
      showErrorToast(err, { action: 'salvar', entity: 'a folha de pagamento' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddFolhaPJ = async (data: FolhaPJ) => {
    setIsSubmitting(true);
    try {
      await addFolhaPJ(data);
      toast.success('Pagamento PJ gerado com sucesso');
      setModalFolhaPJ(false);
      setSelectedFolhaPJ(undefined);
    } catch (err) {
      showErrorToast(err, { action: 'criar', entity: 'o pagamento PJ' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateFolhaPJ = async (data: FolhaPJ) => {
    if (!selectedFolhaPJ?.id) return;
    setIsSubmitting(true);
    try {
      await updateFolhaPJ(selectedFolhaPJ.id, data);
      toast.success('Pagamento PJ atualizado com sucesso');
      setModalFolhaPJ(false);
      setSelectedFolhaPJ(undefined);
    } catch (err) {
      showErrorToast(err, { action: 'salvar', entity: 'o pagamento PJ' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const { type, id } = deleteDialog;

    try {
      if (type === 'funcionarioCLT') {
        await deleteFuncionarioCLT(id);
        toast.success('Funcionário CLT excluído com sucesso');
      } else if (type === 'funcionarioPJ') {
        await deleteFuncionarioPJ(id);
        toast.success('Prestador PJ excluído com sucesso');
      } else if (type === 'folhaCLT') {
        await deleteFolhaCLT(id);
        toast.success('Folha de pagamento excluída com sucesso');
      } else if (type === 'folhaPJ') {
        await deleteFolhaPJ(id);
        toast.success('Pagamento PJ excluído com sucesso');
      }
    } catch (err) {
      showErrorToast(err, { action: 'excluir', entity: 'o registro' });
    }

    setDeleteDialog({ open: false, type: '', id: '' });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      pendente: 'secondary',
      pago: 'default',
      cancelado: 'destructive',
    };
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  const handleDownloadHolerite = (folha: FolhaCLT) => {
    const funcionario = funcionariosCLT.find(f => f.id === folha.funcionario_id);
    if (funcionario) {
      generateHoleritePDF(folha, funcionario);
      toast.success('Holerite gerado com sucesso');
    }
  };

  const handleDownloadReciboPJ = (folha: FolhaPJ) => {
    const funcionario = funcionariosPJ.find(f => f.id === folha.funcionario_id);
    if (funcionario) {
      generateReciboPJPDF(folha, funcionario);
      toast.success('Recibo gerado com sucesso');
    }
  };

  if (loading) {
    return (
      <MainLayout title="Folha de Pagamento">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Folha de Pagamento">
      <Tabs defaultValue="clt" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clt">
            <UserCog className="h-4 w-4 mr-2" />
            CLT
          </TabsTrigger>
          <TabsTrigger value="pj">
            <Users className="h-4 w-4 mr-2" />
            PJ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clt" className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Funcionários CLT</h2>
              <Button onClick={() => setModalFuncionarioCLT(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Funcionário
              </Button>
            </div>
            <DataTable
              data={funcionariosCLT}
              columns={[
                { key: 'nome', label: 'Nome' },
                { key: 'cpf', label: 'CPF' },
                { key: 'cargo', label: 'Cargo' },
                {
                  key: 'salario_base',
                  label: 'Salário Base',
                  render: (item) =>
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.salario_base),
                },
                {
                  key: 'ativo',
                  label: 'Status',
                  render: (item) => <Badge variant={item.ativo ? 'default' : 'secondary'}>{item.ativo ? 'Ativo' : 'Inativo'}</Badge>,
                },
              ]}
              onEdit={(row) => {
                setSelectedFuncionarioCLT(row as FuncionarioCLT);
                setModalFuncionarioCLT(true);
              }}
              onDelete={(row) => setDeleteDialog({ open: true, type: 'funcionarioCLT', id: row.id! })}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Folhas de Pagamento CLT</h2>
              <Button onClick={() => setModalFolhaCLT(true)} disabled={funcionariosCLT.length === 0}>
                <FileText className="h-4 w-4 mr-2" />
                Gerar Folha
              </Button>
            </div>
            <DataTable
              data={folhasCLT}
              columns={[
                {
                  key: 'funcionario_id',
                  label: 'Funcionário',
                  render: (item) => funcionariosCLT.find(f => f.id === item.funcionario_id)?.nome || '-',
                },
                { key: 'mes_referencia', label: 'Mês' },
                {
                  key: 'salario_liquido',
                  label: 'Salário Líquido',
                  render: (item) =>
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.salario_liquido),
                },
                { key: 'status', label: 'Status', render: (item) => getStatusBadge(item.status) },
              ]}
              onView={(row) => handleDownloadHolerite(row as FolhaCLT)}
              onEdit={(row) => {
                setSelectedFolhaCLT(row as FolhaCLT);
                setModalFolhaCLT(true);
              }}
              onDelete={(row) => setDeleteDialog({ open: true, type: 'folhaCLT', id: row.id! })}
            />
          </div>
        </TabsContent>

        <TabsContent value="pj" className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Prestadores PJ</h2>
              <Button onClick={() => setModalFuncionarioPJ(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Prestador
              </Button>
            </div>
            <DataTable
              data={funcionariosPJ}
              columns={[
                { key: 'nome', label: 'Nome' },
                { key: 'cnpj', label: 'CNPJ' },
                { key: 'servico', label: 'Serviço' },
                {
                  key: 'valor_hora',
                  label: 'Valor/Hora',
                  render: (item) =>
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor_hora),
                },
                {
                  key: 'ativo',
                  label: 'Status',
                  render: (item) => <Badge variant={item.ativo ? 'default' : 'secondary'}>{item.ativo ? 'Ativo' : 'Inativo'}</Badge>,
                },
              ]}
              onEdit={(row) => {
                setSelectedFuncionarioPJ(row as FuncionarioPJ);
                setModalFuncionarioPJ(true);
              }}
              onDelete={(row) => setDeleteDialog({ open: true, type: 'funcionarioPJ', id: row.id! })}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Pagamentos PJ</h2>
              <Button onClick={() => setModalFolhaPJ(true)} disabled={funcionariosPJ.length === 0}>
                <FileText className="h-4 w-4 mr-2" />
                Gerar Pagamento
              </Button>
            </div>
            <DataTable
              data={folhasPJ}
              columns={[
                {
                  key: 'funcionario_id',
                  label: 'Prestador',
                  render: (item) => funcionariosPJ.find(f => f.id === item.funcionario_id)?.nome || '-',
                },
                { key: 'mes_referencia', label: 'Mês' },
                { key: 'horas_trabalhadas', label: 'Horas' },
                {
                  key: 'valor_liquido',
                  label: 'Valor Líquido',
                  render: (item) =>
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor_liquido),
                },
                { key: 'status', label: 'Status', render: (item) => getStatusBadge(item.status) },
              ]}
              onView={(row) => handleDownloadReciboPJ(row as FolhaPJ)}
              onEdit={(row) => {
                setSelectedFolhaPJ(row as FolhaPJ);
                setModalFolhaPJ(true);
              }}
              onDelete={(row) => setDeleteDialog({ open: true, type: 'folhaPJ', id: row.id! })}
            />
          </div>
        </TabsContent>
      </Tabs>

      <FormModal
        isOpen={modalFuncionarioCLT}
        onClose={() => {
          setModalFuncionarioCLT(false);
          setSelectedFuncionarioCLT(undefined);
        }}
        title={selectedFuncionarioCLT ? 'Editar Funcionário CLT' : 'Cadastrar Funcionário CLT'}
        hideFooter
      >
        <FuncionarioCLTForm
          funcionario={selectedFuncionarioCLT}
          isSubmitting={isSubmitting}
          onSubmit={selectedFuncionarioCLT ? handleUpdateFuncionarioCLT : handleAddFuncionarioCLT}
          onCancel={() => {
            setModalFuncionarioCLT(false);
            setSelectedFuncionarioCLT(undefined);
          }}
        />
      </FormModal>

      <FormModal
        isOpen={modalFuncionarioPJ}
        onClose={() => {
          setModalFuncionarioPJ(false);
          setSelectedFuncionarioPJ(undefined);
        }}
        title={selectedFuncionarioPJ ? 'Editar Prestador PJ' : 'Cadastrar Prestador PJ'}
        hideFooter
      >
        <FuncionarioPJForm
          funcionario={selectedFuncionarioPJ}
          isSubmitting={isSubmitting}
          onSubmit={selectedFuncionarioPJ ? handleUpdateFuncionarioPJ : handleAddFuncionarioPJ}
          onCancel={() => {
            setModalFuncionarioPJ(false);
            setSelectedFuncionarioPJ(undefined);
          }}
        />
      </FormModal>

      <FormModal
        isOpen={modalFolhaCLT}
        onClose={() => {
          setModalFolhaCLT(false);
          setSelectedFolhaCLT(undefined);
        }}
        title={selectedFolhaCLT ? 'Editar Folha de Pagamento' : 'Gerar Folha de Pagamento'}
        size="2xl"
        hideFooter
      >
        <FolhaCLTForm
          funcionarios={funcionariosCLT}
          folha={selectedFolhaCLT}
          isSubmitting={isSubmitting}
          calcularFolha={calcularFolhaCLT}
          onSubmit={selectedFolhaCLT ? handleUpdateFolhaCLT : handleAddFolhaCLT}
          onCancel={() => {
            setModalFolhaCLT(false);
            setSelectedFolhaCLT(undefined);
          }}
        />
      </FormModal>

      <FormModal
        isOpen={modalFolhaPJ}
        onClose={() => {
          setModalFolhaPJ(false);
          setSelectedFolhaPJ(undefined);
        }}
        title={selectedFolhaPJ ? 'Editar Pagamento PJ' : 'Gerar Pagamento PJ'}
        size="2xl"
        hideFooter
      >
        <FolhaPJForm
          funcionarios={funcionariosPJ}
          folha={selectedFolhaPJ}
          isSubmitting={isSubmitting}
          onSubmit={selectedFolhaPJ ? handleUpdateFolhaPJ : handleAddFolhaPJ}
          onCancel={() => {
            setModalFolhaPJ(false);
            setSelectedFolhaPJ(undefined);
          }}
        />
      </FormModal>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onCancel={() => setDeleteDialog({ open: false, type: '', id: '' })}
        onConfirm={handleDelete}
        title="Confirmar exclusão"
        description="Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita."
        variant="destructive"
      />
    </MainLayout>
  );
}
