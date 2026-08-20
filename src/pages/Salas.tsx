import { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageToolbar } from '@/components/common/PageToolbar';
import { DataTable, DataTableColumn } from '@/components/common/DataTable';
import { FormModal } from '@/components/common/FormModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { SalaForm } from '@/components/forms/SalaForm';
import { SalaFormData } from '@/lib/validations/sala.schema';
import { useSalas, Sala } from '@/hooks/useSalas';
import { useAuth } from '@/contexts/AuthContext';
import { useUnidadeAtiva } from '@/contexts/UnidadeContext';
import { UNIDADE_PADRAO_ID } from '@/hooks/useUnidades';
import { Calendar, Building2 } from 'lucide-react';
import { getErrorToastProps } from '@/lib/ui/showErrorToast';
import { SalaViewModal } from '@/components/salas/SalaViewModal';

const Salas = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { salas, addSala, updateSala, deleteSala } = useSalas();
  const { user } = useAuth();
  const { unidades, unidadeAtivaId, unidadeAtiva, setUnidadeAtiva } = useUnidadeAtiva();
  const podeVerTodas = user?.role === 'admin' || user?.role === 'gestor';
  const [unidadeFiltro, setUnidadeFiltro] = useState<string>(unidadeAtivaId);

  useEffect(() => {
    setUnidadeFiltro(unidadeAtivaId);
  }, [unidadeAtivaId]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Sala | null>(null);
  const [viewItem, setViewItem] = useState<Sala | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const nomeUnidade = (id?: string): string => {
    const uid = id ?? UNIDADE_PADRAO_ID;
    return unidades.find((u) => u.id === uid)?.nome ?? '—';
  };

  const filteredData = useMemo(() => {
    return salas.filter((sala) => {
      const salaUnidade = sala.unidadeId ?? UNIDADE_PADRAO_ID;
      const matchUnidade = unidadeFiltro === 'all' || salaUnidade === unidadeFiltro;
      if (!matchUnidade) return false;
      const q = searchQuery.toLowerCase();
      const unidadeLabel = nomeUnidade(sala.unidadeId).toLowerCase();
      return (
        sala.nome_sala.toLowerCase().includes(q) ||
        (sala.codigo ?? '').toLowerCase().includes(q) ||
        unidadeLabel.includes(q) ||
        (sala.unidade ?? '').toLowerCase().includes(q)
      );
    });
  }, [salas, unidadeFiltro, searchQuery, unidades]);

  const columns: DataTableColumn<Sala>[] = [
    { key: 'nome_sala', label: 'Nome' },
    {
      key: 'codigo',
      label: 'Código',
      render: (item) => item.codigo || '—',
    },
    {
      key: 'unidade',
      label: 'Unidade',
      render: (item) => (
        <Badge variant="outline" className="font-normal">
          {nomeUnidade(item.unidadeId) !== '—' ? nomeUnidade(item.unidadeId) : item.unidade}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <Badge
          variant={item.status === 'Ativa' ? 'default' : 'secondary'}
          className={
            item.status === 'Ativa'
              ? 'bg-success text-success-foreground'
              : 'bg-muted text-muted-foreground'
          }
        >
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Agenda',
      render: (item) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate(`/salas/${item.id}/agenda`)}
        >
          <Calendar className="h-4 w-4 mr-1" />
          Ver Agenda
        </Button>
      ),
    },
  ];

  const handleAdd = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Sala) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (item: Sala) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleView = (item: Sala) => {
    setViewItem(item);
    setIsViewOpen(true);
  };

  const handleCloseView = () => {
    setIsViewOpen(false);
    setViewItem(null);
  };

  const handleEditFromView = (item: Sala) => {
    handleCloseView();
    handleEdit(item);
  };

  const confirmDelete = async () => {
    if (!selectedItem || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteSala(selectedItem.id);
      toast({
        title: 'Sucesso',
        description: 'Sala removida com sucesso',
      });
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
    } catch (err) {
      toast(getErrorToastProps(err, { action: 'excluir', entity: 'a sala' }));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (data: SalaFormData) => {
    if (isSaving) return;
    setIsSaving(true);
    const unidadeNome = nomeUnidade(data.unidadeId);
    const payload = {
      nome_sala: data.nome_sala,
      codigo: data.codigo,
      unidadeId: data.unidadeId,
      unidade: unidadeNome,
      status: data.status,
    };

    try {
      if (selectedItem) {
        await updateSala(selectedItem.id, payload);
        toast({
          title: 'Sucesso',
          description: 'Sala atualizada com sucesso',
        });
      } else {
        await addSala({
          ...payload,
          especialidade_atendida: [],
          recursos: [],
        });
        toast({
          title: 'Sucesso',
          description: 'Sala cadastrada com sucesso',
        });
      }
      setIsModalOpen(false);
      setSelectedItem(null);
    } catch (err) {
      toast(getErrorToastProps(err, { action: 'salvar', entity: 'a sala' }));
    } finally {
      setIsSaving(false);
    }
  };

  const formDefaultValues: Partial<SalaFormData> | undefined = selectedItem
    ? {
        nome_sala: selectedItem.nome_sala,
        codigo: selectedItem.codigo ?? '',
        unidadeId: selectedItem.unidadeId ?? unidadeAtivaId,
        status: selectedItem.status,
      }
    : undefined;

  const titulo =
    unidadeFiltro === 'all'
      ? 'Salas de Atendimento — Todas as unidades'
      : `Salas de Atendimento — ${unidades.find((u) => u.id === unidadeFiltro)?.nome ?? unidadeAtiva?.nome ?? nomeUnidade(unidadeFiltro)}`.trim();

  return (
    <MainLayout title={titulo}>
      <div className="space-y-4">
        <PageToolbar
          onBack={() => navigate(-1)}
          onAdd={handleAdd}
          onSearch={setSearchQuery}
          addButtonText="Adicionar Sala"
        />

        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <Select
            value={unidadeFiltro}
            onValueChange={(value) => {
              setUnidadeFiltro(value);
              if (value !== 'all') setUnidadeAtiva(value);
            }}
          >
            <SelectTrigger className="w-[240px]" aria-label="Filtrar por unidade">
              <SelectValue placeholder="Unidade" />
            </SelectTrigger>
            <SelectContent>
              {podeVerTodas && <SelectItem value="all">Todas as unidades</SelectItem>}
              {unidades.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={filteredData}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDelete}
          emptyMessage="Nenhuma sala encontrada"
        />

        <FormModal
          title={selectedItem ? 'Editar Sala' : 'Adicionar Sala'}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedItem(null);
          }}
          size="lg"
        >
          <SalaForm
            key={selectedItem?.id ?? 'new'}
            onSubmit={handleFormSubmit}
            defaultValues={formDefaultValues}
          />
        </FormModal>

        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          title="Confirmar Exclusão"
          description={`Tem certeza que deseja excluir a sala "${selectedItem?.nome_sala}"? Todas as reservas associadas também serão removidas.`}
          onConfirm={confirmDelete}
          onCancel={() => setIsDeleteDialogOpen(false)}
          confirmLabel={isDeleting ? 'Excluindo...' : 'Confirmar exclusão'}
          variant="destructive"
        />

        <SalaViewModal
          isOpen={isViewOpen}
          onClose={handleCloseView}
          sala={viewItem}
          onEdit={handleEditFromView}
        />
      </div>
    </MainLayout>
  );
};

export default Salas;
