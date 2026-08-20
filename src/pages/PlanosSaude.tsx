import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageToolbar } from '@/components/common/PageToolbar';
import { DataTable } from '@/components/common/DataTable';
import { FormModal } from '@/components/common/FormModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PlanoSaudeForm } from '@/components/forms/PlanoSaudeForm';
import { usePlanosSaude, PlanoSaude } from '@/hooks/usePlanoseSaude';
import { PlanoSaudeFormData } from '@/lib/validations/planoseSaude.schema';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function PlanosSaude() {
  const { planosSaude, addPlanoSaude, updatePlanoSaude, deletePlanoSaude } = usePlanosSaude();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPlano, setSelectedPlano] = useState<PlanoSaude | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAdd = () => {
    setSelectedPlano(null);
    setIsModalOpen(true);
  };

  const handleEdit = (plano: PlanoSaude) => {
    setSelectedPlano(plano);
    setIsModalOpen(true);
  };

  const handleDelete = (plano: PlanoSaude) => {
    setSelectedPlano(plano);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedPlano) {
      deletePlanoSaude(selectedPlano.id);
      toast({
        title: 'Plano de saúde excluído',
        description: 'O plano de saúde foi excluído com sucesso.',
      });
      setIsDeleteDialogOpen(false);
      setSelectedPlano(null);
    }
  };

  const handleSubmit = (data: PlanoSaudeFormData) => {
    if (selectedPlano) {
      updatePlanoSaude(selectedPlano.id, data);
      toast({
        title: 'Plano de saúde atualizado',
        description: 'O plano de saúde foi atualizado com sucesso.',
      });
    } else {
      addPlanoSaude(data as any);
      toast({
        title: 'Plano de saúde cadastrado',
        description: 'O plano de saúde foi cadastrado com sucesso.',
      });
    }
    setIsModalOpen(false);
    setSelectedPlano(null);
  };

  const filteredPlanos = planosSaude.filter((plano) =>
    plano.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plano.cnpj.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plano.registro_ans.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: 'nome', label: 'Nome', sortable: true },
    { key: 'cnpj', label: 'CNPJ', sortable: true },
    { key: 'registro_ans', label: 'Registro ANS', sortable: true },
    { key: 'telefone', label: 'Telefone' },
    { key: 'email', label: 'Email' },
    {
      key: 'ativo',
      label: 'Status',
      render: (plano: PlanoSaude) => (
        <Badge variant={plano.ativo ? 'default' : 'secondary'}>
          {plano.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
  ];

  return (
    <MainLayout title="Planos de Saúde">
      <div className="space-y-6">
        <PageToolbar
          onAdd={handleAdd}
          onSearch={setSearchTerm}
          addButtonText="Novo Plano"
        />

        <DataTable
          columns={columns}
          data={filteredPlanos}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="Nenhum plano de saúde cadastrado"
        />

        <FormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedPlano ? 'Editar Plano de Saúde' : 'Novo Plano de Saúde'}
          hideFooter
        >
          <PlanoSaudeForm
            initialData={selectedPlano || undefined}
            onSubmit={handleSubmit}
            onCancel={() => setIsModalOpen(false)}
          />
        </FormModal>

        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onCancel={() => setIsDeleteDialogOpen(false)}
          title="Excluir Plano de Saúde"
          description="Tem certeza que deseja excluir este plano de saúde? Esta ação não pode ser desfeita."
          onConfirm={confirmDelete}
          variant="destructive"
        />
      </div>
    </MainLayout>
  );
}
