import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageToolbar } from '@/components/common/PageToolbar';
import { DataTable, DataTableColumn } from '@/components/common/DataTable';
import { FormModal } from '@/components/common/FormModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { TerapiaForm } from '@/components/forms/TerapiaForm';
import { TerapiaFormData } from '@/lib/validations/terapia.schema';
import { useTerapias, type Terapia } from '@/hooks/useTerapias';
import { featureFlags } from '@/lib/featureFlags';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatQueryError } from '@/lib/api/formatApiError';
import { getErrorToastProps } from '@/lib/ui/showErrorToast';

const Terapias = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Terapia | null>(null);

  const { terapias, isLoading, isError, error, addTerapia, updateTerapia, deleteTerapia } =
    useTerapias();

  const filteredData = terapias.filter((item) =>
    item.nome_terapia.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.objetivo_terapeutico.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: DataTableColumn<Terapia>[] = [
    { key: 'nome_terapia', label: 'Nome' },
    { key: 'objetivo_terapeutico', label: 'Objetivo' },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <Badge variant={item.status === 'Ativo' ? 'default' : 'secondary'}>
          {item.status}
        </Badge>
      ),
    },
    { key: 'versao', label: 'Versão' },
    { key: 'updated_at', label: 'Atualizado em' },
  ];

  const handleAdd = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Terapia) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (item: Terapia) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    try {
      await deleteTerapia(selectedItem.id);
      toast({ title: 'Sucesso', description: 'Terapia removido com sucesso' });
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
    } catch (err) {
      toast(getErrorToastProps(err, { action: 'excluir', entity: 'a terapia' }));
    }
  };

  const handleFormSubmit = async (data: TerapiaFormData) => {
    try {
      const payload = {
        nome_terapia: data.nome_terapia,
        objetivo_terapeutico: data.objetivo_terapeutico,
        status: data.status,
        versao: selectedItem?.versao ?? 1,
        updated_at: new Date().toISOString(),
      };
      if (selectedItem) {
        await updateTerapia(selectedItem.id, payload);
      } else {
        await addTerapia(payload);
      }
      toast({
        title: 'Sucesso',
        description: selectedItem ? 'Terapia atualizado' : 'Terapia cadastrado',
      });
      setIsModalOpen(false);
      setSelectedItem(null);
    } catch (err) {
      toast(getErrorToastProps(err, { action: 'salvar', entity: 'a terapia' }));
    }
  };

  return (
    <MainLayout title="Terapias">
      <div className="space-y-4">
        <PageToolbar
          onBack={() => navigate(-1)}
          onAdd={handleAdd}
          onSearch={setSearchQuery}
          addButtonText="Adicionar Terapia"
        />

        {featureFlags.terapiasApiEnabled && isError && (
          <Alert variant="destructive">
            <AlertDescription>{formatQueryError(error, 'terapias')}</AlertDescription>
          </Alert>
        )}

        <DataTable
          columns={columns}
          data={filteredData}
          onEdit={handleEdit}
          onView={(item) => console.log('View', item)}
          onDelete={handleDelete}
          emptyMessage={isLoading ? 'Carregando...' : 'Nenhum terapia encontrado'}
          getRowId={(item) => item.id}
        />

        <FormModal
          title={selectedItem ? 'Editar Terapia' : 'Adicionar Terapia'}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          size="4xl"
        >
          <TerapiaForm onSubmit={handleFormSubmit} />
        </FormModal>

        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          title="Confirmar Inativação"
          description={`Tem certeza que deseja inativar o terapia "${selectedItem?.nome_terapia}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setIsDeleteDialogOpen(false)}
          confirmLabel="Inativar"
          variant="destructive"
        />
      </div>
    </MainLayout>
  );
};

export default Terapias;
