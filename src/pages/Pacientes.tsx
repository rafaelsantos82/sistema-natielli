import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, UserPlus } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageToolbar } from '@/components/common/PageToolbar';
import { DataTable, DataTableColumn } from '@/components/common/DataTable';
import { ListPagination } from '@/components/common/ListPagination';
import { FormModal } from '@/components/common/FormModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { PacienteForm } from '@/components/forms/PacienteForm';
import { PacienteQuickForm } from '@/components/forms/PacienteQuickForm';
import { PacienteFormData } from '@/lib/validations/paciente.schema';
import { useAuth } from '@/contexts/AuthContext';
import { useUnidadeAtiva } from '@/contexts/UnidadeContext';
import { ClinicalScopeBanner } from '@/components/common/ClinicalScopeBanner';
import {
  usePacienteDetail,
  usePacienteMutations,
  usePacientesList,
  getPacientesListErrorMessage,
  type PacienteListRow,
} from '@/hooks/usePacientes';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formToApiPayload } from '@/lib/mappers/pacienteMapper';
import { dtoToForm } from '@/lib/mappers/pacienteMapper';
import { toast } from 'sonner';
import { showErrorToast } from '@/lib/ui/showErrorToast';
import { PacienteViewModal } from '@/components/pacientes/PacienteViewModal';
import { formatUnidadeNomes } from '@/lib/unidades/apiIds';

const PAGE_SIZE = 20;

const Pacientes = () => {
  const navigate = useNavigate();
  const { user, canWritePacientes, canWrite, canDelete } = useAuth();
  const isTerapeuta = user?.role === 'terapeuta';
  const canMutatePacientes = canWritePacientes || canWrite('pacientes');
  const canRemovePacientes = canDelete('pacientes') || canWritePacientes;
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'quick' | 'full'>('quick');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PacienteListRow | null>(null);
  const [viewItem, setViewItem] = useState<PacienteListRow | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { isTodasUnidades, unidadeAtiva, unidadeAtivaId: unidadeFiltroId, unidades } =
    useUnidadeAtiva();

  useEffect(() => {
    setPage(1);
  }, [searchQuery, isTodasUnidades, unidadeFiltroId]);

  const { data, isLoading, isError, error } = usePacientesList(searchQuery, page, PAGE_SIZE, {
    todasUnidades: isTodasUnidades,
  });
  const editingPacienteId = useMemo(() => {
    if (selectedItem && isModalOpen && modalMode === 'full') return selectedItem.id;
    if (viewItem && isViewOpen) return viewItem.id;
    return null;
  }, [selectedItem, isModalOpen, modalMode, viewItem, isViewOpen]);
  const {
    data: detailDto,
    isLoading: isDetailLoading,
    isError: isDetailError,
    error: detailError,
  } = usePacienteDetail(editingPacienteId);
  const { createMutation, updateMutation, deleteMutation, restoreMutation, unidadeAtivaId } =
    usePacienteMutations();

  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const pageSize = meta?.page_size ?? PAGE_SIZE;
  const totalPages = meta?.total_pages ?? 0;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pacientes = data?.rows ?? [];
  const pageTitle = isTodasUnidades
    ? 'Pacientes — Todas as unidades'
    : unidadeAtiva?.nome
      ? `Pacientes — ${unidadeAtiva.nome}`
      : 'Pacientes';
  const vinculoHint =
    isTodasUnidades && !selectedItem && unidadeAtiva?.nome
      ? `O paciente será vinculado a ${unidadeAtiva.nome}`
      : null;

  const columns: DataTableColumn<PacienteListRow>[] = [
    { key: 'nome', label: 'Nome' },
    ...(isTodasUnidades
      ? [
          {
            key: 'unidade',
            label: 'Unidade',
            render: (item: PacienteListRow) => formatUnidadeNomes(item.unidadeIds, unidades),
          },
        ]
      : []),
    { key: 'cpf', label: 'CPF' },
    ...(isTerapeuta
      ? [
          {
            key: 'proximaConsulta',
            label: 'Próxima consulta',
            render: (item: PacienteListRow) => item.proximaConsulta ?? '—',
          },
          {
            key: 'ultimaConsulta',
            label: 'Última consulta',
            render: (item: PacienteListRow) => item.ultimaConsulta ?? '—',
          },
          {
            key: 'totalConsultas',
            label: 'Consultas',
            render: (item: PacienteListRow) =>
              item.totalConsultas != null ? String(item.totalConsultas) : '—',
          },
        ]
      : [
          { key: 'dataNasc', label: 'Data Nasc.' },
          { key: 'telefone', label: 'Telefone' },
          { key: 'email', label: 'E-mail' },
        ]),
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <Badge
          variant={item.status === 'ativo' && !item.excluido ? 'default' : 'secondary'}
          className={
            item.status === 'ativo' && !item.excluido
              ? 'bg-success text-success-foreground'
              : 'bg-muted text-muted-foreground'
          }
          title={item.excluido ? 'Cadastro excluído — use Restaurar para reativar' : undefined}
        >
          {item.excluido ? 'inativo (excluído)' : item.status}
        </Badge>
      ),
    },
  ];

  const handleQuickAdd = () => {
    if (!canMutatePacientes) {
      toast.error('Sem permissão para cadastrar pacientes');
      return;
    }
    setSelectedItem(null);
    setModalMode('quick');
    setIsModalOpen(true);
  };

  const handleFullAdd = () => {
    if (!canMutatePacientes) {
      toast.error('Sem permissão para cadastrar pacientes');
      return;
    }
    setSelectedItem(null);
    setModalMode('full');
    setIsModalOpen(true);
  };

  const handleEdit = (item: PacienteListRow) => {
    if (item.excluido) {
      toast.error('Paciente excluído não pode ser editado. Restaure o cadastro primeiro.');
      return;
    }
    if (!canMutatePacientes) {
      toast.error('Sem permissão para editar pacientes');
      return;
    }
    setSelectedItem(item);
    setModalMode('full');
    setIsModalOpen(true);
  };

  const handleView = (item: PacienteListRow) => {
    setViewItem(item);
    setIsViewOpen(true);
  };

  const handleCloseView = () => {
    setIsViewOpen(false);
    setViewItem(null);
  };

  const handleEditFromView = (item: PacienteListRow) => {
    handleCloseView();
    handleEdit(item);
  };

  const handleDelete = (item: PacienteListRow) => {
    if (item.excluido) return;
    if (!canRemovePacientes) {
      toast.error('Sem permissão para excluir pacientes');
      return;
    }
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleRestore = (item: PacienteListRow) => {
    if (!canMutatePacientes) {
      toast.error('Sem permissão para restaurar pacientes');
      return;
    }
    setSelectedItem(item);
    setIsRestoreDialogOpen(true);
  };

  const confirmRestore = async () => {
    if (!selectedItem) return;
    try {
      await restoreMutation.mutateAsync(selectedItem.id);
      setIsRestoreDialogOpen(false);
      setSelectedItem(null);
    } catch {
      // toast via mutation
    }
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    try {
      await deleteMutation.mutateAsync(selectedItem.id);
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
    } catch {
      // toast via mutation
    }
  };

  const handleFormSubmit = async (formData: PacienteFormData) => {
    if (!canMutatePacientes) {
      toast.error('Sem permissão para salvar pacientes');
      return;
    }
    try {
      const payload = formToApiPayload(formData, unidadeAtivaId);
      if (selectedItem) {
        await updateMutation.mutateAsync({ id: selectedItem.id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setIsModalOpen(false);
      setSelectedItem(null);
    } catch (err) {
      showErrorToast(err, { action: 'salvar', entity: 'o paciente' });
    }
  };

  const detailFormData = useMemo(
    () => (detailDto ? dtoToForm(detailDto) : undefined),
    [detailDto],
  );

  return (
    <MainLayout title={pageTitle}>
      <div className="space-y-4">
        <ClinicalScopeBanner />

        <PageToolbar
          backLabel="Voltar"
          onBack={() => navigate(-1)}
          onAdd={canMutatePacientes ? handleQuickAdd : undefined}
          onSearch={setSearchQuery}
          addButtonText="Cadastro Rápido"
          secondaryAction={
            canMutatePacientes
              ? {
                  label: 'Cadastro Completo',
                  onClick: handleFullAdd,
                  icon: <UserPlus className="mr-2 h-4 w-4" />,
                }
              : undefined
          }
        />

        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Não foi possível carregar pacientes</AlertTitle>
            <AlertDescription>{getPacientesListErrorMessage(error)}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <p className="text-sm text-muted-foreground">Carregando pacientes...</p>
        )}

        {!isLoading && total > 0 && (
          <p className="text-sm text-muted-foreground">
            Mostrando {from}–{to} de {total} pacientes
          </p>
        )}

        <DataTable
          columns={columns}
          data={pacientes}
          onEdit={canMutatePacientes ? handleEdit : undefined}
          onView={handleView}
          onDelete={canRemovePacientes ? handleDelete : undefined}
          onRestore={canMutatePacientes ? handleRestore : undefined}
          isRowInactive={(item) => Boolean(item.excluido)}
          emptyMessage="Nenhum paciente encontrado"
        />

        <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} />

        <FormModal
          title={
            selectedItem
              ? 'Editar Paciente'
              : modalMode === 'quick'
                ? 'Cadastro Rápido de Paciente'
                : 'Cadastro Completo de Paciente'
          }
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          size={modalMode === 'quick' && !selectedItem ? '2xl' : '4xl'}
        >
          {vinculoHint && (
            <p className="text-sm text-muted-foreground mb-3">{vinculoHint}</p>
          )}
          {modalMode === 'quick' && !selectedItem ? (
            <PacienteQuickForm onSubmit={handleFormSubmit} />
          ) : selectedItem && isDetailLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Carregando dados do paciente...
            </p>
          ) : (
            <PacienteForm
              key={selectedItem?.id ?? 'novo-paciente'}
              onSubmit={handleFormSubmit}
              initialData={detailFormData}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          )}
        </FormModal>

        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          title="Confirmar Exclusão"
          description={`Tem certeza que deseja excluir o paciente "${selectedItem?.nome}"? O cadastro permanecerá na lista como inativo e poderá ser restaurado.`}
          onConfirm={confirmDelete}
          onCancel={() => setIsDeleteDialogOpen(false)}
          confirmLabel="Confirmar exclusão"
          variant="destructive"
        />

        <ConfirmDialog
          isOpen={isRestoreDialogOpen}
          title="Restaurar paciente"
          description={`Deseja restaurar o cadastro de "${selectedItem?.nome}"? Ele voltará a ficar ativo.`}
          onConfirm={confirmRestore}
          onCancel={() => {
            setIsRestoreDialogOpen(false);
            setSelectedItem(null);
          }}
          confirmLabel="Restaurar"
        />

        <PacienteViewModal
          isOpen={isViewOpen}
          onClose={handleCloseView}
          listRow={viewItem}
          formData={viewItem?.id === editingPacienteId ? detailFormData : undefined}
          extras={
            detailDto
              ? {
                  profissional_responsavel: detailDto.profissional_responsavel,
                  vacinas: detailDto.vacinas,
                  documentos_anexos: detailDto.documentos_anexos,
                  proximaConsulta: viewItem?.proximaConsulta,
                  ultimaConsulta: viewItem?.ultimaConsulta,
                  totalConsultas: viewItem?.totalConsultas,
                }
              : undefined
          }
          isLoading={Boolean(viewItem) && isDetailLoading}
          isError={Boolean(viewItem) && isDetailError}
          errorMessage={
            detailError instanceof Error
              ? detailError.message
              : 'Não foi possível carregar os dados do paciente para visualização.'
          }
          onEdit={
            canMutatePacientes && viewItem && !viewItem.excluido ? handleEditFromView : undefined
          }
          canEdit={canMutatePacientes && Boolean(viewItem && !viewItem.excluido)}
        />
      </div>
    </MainLayout>
  );
};

export default Pacientes;
