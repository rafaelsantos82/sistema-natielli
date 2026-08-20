import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageToolbar } from '@/components/common/PageToolbar';
import { DataTable, DataTableColumn } from '@/components/common/DataTable';
import { FormModal } from '@/components/common/FormModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ManagePricesModal } from '@/components/modals/ManagePricesModal';
import { ProfissionalForm } from '@/components/forms/ProfissionalForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DollarSign, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';
import { useProfissionalDocumentos } from '@/hooks/useProfissionalDocumentos';
import { PendenciasDocumentosModal } from '@/components/profissionais/PendenciasDocumentosModal';
import { ProfissionalViewModal } from '@/components/profissionais/ProfissionalViewModal';
import { useProfissionais, type Profissional } from '@/hooks/useProfissionais';
import { formToProfissional, profissionalToForm } from '@/lib/mappers/profissionalMapper';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatQueryError } from '@/lib/api/formatApiError';
import { showErrorToast } from '@/lib/ui/showErrorToast';
import { featureFlags } from '@/lib/featureFlags';

type ProfissionalRow = Profissional & {
  excluido: boolean;
  registro: string;
  qtdTerapias: number;
  _docPendente: boolean;
  _inativo: boolean;
  _bloqueado: boolean;
  _qtdPendencias: number;
  _docsPendentes: string[];
};

type FiltroPendencia = 'todos' | 'doc_pendente' | 'inativo' | 'bloqueado';
type OrdenacaoCampo = 'nome' | 'status' | 'pendencias';

const Profissionais = () => {
  const navigate = useNavigate();
  const { list, create, update, softDelete, restore, isLoading, isError, error } =
    useProfissionais();
  const { statusObrigatorios } = useProfissionalDocumentos();
  const profissionais = list({ incluirRemovidos: true });
  const [searchQuery, setSearchQuery] = useState('');
  const [filtro, setFiltro] = useState<FiltroPendencia>('todos');
  const [ordenacao, setOrdenacao] = useState<OrdenacaoCampo>('nome');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isPricesModalOpen, setIsPricesModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Profissional | null>(null);
  const [pendenciasOpen, setPendenciasOpen] = useState(false);
  const [pendenciasTarget, setPendenciasTarget] = useState<ProfissionalRow | null>(null);
  const [viewItem, setViewItem] = useState<Profissional | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const enriched = useMemo(
    () =>
      profissionais.map((p) => {
        const docs = statusObrigatorios(p.id);
        const docPendente = !docs.completos;
        const excluido = Boolean(p.deleted_at);
        const inativo = p.status !== 'ativo' && !excluido;
        return {
          ...p,
          excluido,
          registro: p.numeroRegistro ?? '',
          qtdTerapias: 0,
          _docPendente: docPendente,
          _inativo: inativo,
          _bloqueado: docPendente || inativo,
          _qtdPendencias: (docPendente ? 1 : 0) + (inativo ? 1 : 0),
          _docsPendentes: docs.pendentes,
        } as ProfissionalRow;
      }),
    [profissionais, statusObrigatorios],
  );

  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let list = enriched.filter(
      (prof) =>
        prof.nome.toLowerCase().includes(q) ||
        prof.registro.includes(searchQuery) ||
        (prof.especialidades ?? []).some((esp) => esp.toLowerCase().includes(q)),
    );

    if (filtro === 'doc_pendente') list = list.filter((p) => p._docPendente);
    else if (filtro === 'inativo') list = list.filter((p) => p._inativo);
    else if (filtro === 'bloqueado') list = list.filter((p) => p._bloqueado);

    list = [...list].sort((a, b) => {
      if (ordenacao === 'nome') return a.nome.localeCompare(b.nome);
      if (ordenacao === 'status') return a.status.localeCompare(b.status);
      // pendencias: bloqueados primeiro
      return b._qtdPendencias - a._qtdPendencias || a.nome.localeCompare(b.nome);
    });

    return list;
  }, [enriched, searchQuery, filtro, ordenacao]);

  const columns: DataTableColumn<ProfissionalRow>[] = [
    { key: 'nome', label: 'Nome' },
    {
      key: 'pendencias',
      label: 'Pendências',
      render: (item) => {
        const open = (e: React.MouseEvent) => {
          e.stopPropagation();
          setPendenciasTarget(item);
          setPendenciasOpen(true);
        };
        if (!item._bloqueado) {
          return (
            <button type="button" onClick={open} className="focus:outline-none">
              <Badge className="bg-success text-success-foreground hover:opacity-90 cursor-pointer">
                OK
              </Badge>
            </button>
          );
        }
        return (
          <button
            type="button"
            onClick={open}
            className="flex flex-wrap gap-1 focus:outline-none"
            aria-label="Ver pendências"
          >
            {item._docPendente && (
              <Badge variant="destructive" className="gap-1 cursor-pointer hover:opacity-90">
                <AlertTriangle className="h-3 w-3" />
                Documentos
              </Badge>
            )}
            {item._inativo && (
              <Badge variant="secondary" className="cursor-pointer hover:opacity-90">
                Inativo
              </Badge>
            )}
          </button>
        );
      },
    },
    {
      key: 'conselho',
      label: 'Conselho/Registro',
      render: (item) => `${item.conselho ?? ''} ${item.registro}`.trim(),
    },
    {
      key: 'especialidades',
      label: 'Especialidades',
      render: (item) => (
        <div className="flex gap-1 flex-wrap">
          {(item.especialidades ?? []).map((esp, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {esp}
            </Badge>
          ))}
        </div>
      ),
    },
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
          title={
            item.excluido ? 'Cadastro excluído — use Restaurar para reativar' : undefined
          }
        >
          {item.excluido ? 'inativo (excluído)' : item.status}
        </Badge>
      ),
    },
    {
      key: 'qtdTerapias',
      label: 'Qtd. Terapias',
      render: (item) => <Badge variant="secondary">{item.qtdTerapias}</Badge>,
    },
    {
      key: 'prices',
      label: 'Preços',
      render: (item) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedItem(item);
            setIsPricesModalOpen(true);
          }}
        >
          <DollarSign className="h-4 w-4 mr-1" />
          Gerenciar
        </Button>
      ),
    },
    {
      key: 'agenda',
      label: 'Agenda',
      render: (item) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/profissionais/${item.id}/agenda`);
          }}
        >
          <CalendarIcon className="h-4 w-4 mr-1" />
          Configurar
        </Button>
      ),
    },
  ];

  const handleAdd = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: ProfissionalRow) => {
    if (item.excluido) {
      toast.error('Profissional excluído não pode ser editado. Restaure o cadastro primeiro.');
      return;
    }
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleView = (item: Profissional) => {
    setViewItem(item);
    setIsViewOpen(true);
  };

  const handleCloseView = () => {
    setIsViewOpen(false);
    setViewItem(null);
  };

  const handleEditFromView = (item: Profissional) => {
    handleCloseView();
    handleEdit(item);
  };

  const handleDelete = (item: ProfissionalRow) => {
    if (item.excluido) return;
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleRestore = (item: ProfissionalRow) => {
    setSelectedItem(item);
    setIsRestoreDialogOpen(true);
  };

  const confirmRestore = async () => {
    if (!selectedItem) return;
    try {
      await restore(selectedItem.id);
      setIsRestoreDialogOpen(false);
      setSelectedItem(null);
    } catch {
      // toast via hook
    }
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    try {
      await softDelete(selectedItem.id);
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
    } catch (err) {
      showErrorToast(err, { action: 'excluir', entity: 'o profissional' });
    }
  };

  const handleSubmit = async (formData: Parameters<typeof formToProfissional>[0]) => {
    try {
      const payload = formToProfissional(formData);
      if (selectedItem) {
        await update(selectedItem.id, payload);
        toast.success('Profissional atualizado com sucesso');
      } else {
        await create(payload);
        toast.success('Profissional cadastrado com sucesso');
      }
      setIsModalOpen(false);
      setSelectedItem(null);
    } catch (err) {
      showErrorToast(err, { action: 'salvar', entity: 'o profissional' });
    }
  };

  return (
    <MainLayout title="Profissionais">
      <div className="space-y-4">
        {featureFlags.profissionaisApiEnabled && isError && (
          <Alert variant="destructive">
            <AlertDescription>
              {formatQueryError(error, 'profissionais')}
            </AlertDescription>
          </Alert>
        )}

        <PageToolbar
          onBack={() => navigate(-1)}
          onAdd={handleAdd}
          onSearch={setSearchQuery}
          addButtonText="Adicionar Profissional"
        />

        <div className="flex flex-wrap items-end gap-3 rounded-md border bg-card p-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Filtrar</label>
            <Select value={filtro} onValueChange={(v) => setFiltro(v as FiltroPendencia)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="bloqueado">Apenas com pendências</SelectItem>
                <SelectItem value="doc_pendente">Documentos obrigatórios pendentes</SelectItem>
                <SelectItem value="inativo">Inativos / suspensos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Ordenar por</label>
            <Select value={ordenacao} onValueChange={(v) => setOrdenacao(v as OrdenacaoCampo)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nome">Nome (A-Z)</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="pendencias">Pendências (mais primeiro)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto text-sm text-muted-foreground">
            {filteredData.length} profissional(is)
          </div>
        </div>


        <DataTable
          columns={columns}
          data={filteredData}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDelete}
          onRestore={handleRestore}
          isRowInactive={(item) => item.excluido}
          emptyMessage={isLoading ? 'Carregando...' : 'Nenhum profissional encontrado'}
          getRowId={(item) => item.id}
        />

        <FormModal
          title={selectedItem ? 'Editar Profissional' : 'Adicionar Profissional'}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          size="4xl"
        >
          <ProfissionalForm
            initialData={
              selectedItem
                ? (profissionalToForm(selectedItem) as Parameters<typeof ProfissionalForm>[0]['initialData'])
                : undefined
            }
            profissionalId={selectedItem?.id}
            onSubmit={handleSubmit}
          />
        </FormModal>

        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          title="Confirmar Exclusão"
          description={`Tem certeza que deseja excluir o profissional "${selectedItem?.nome}"? O cadastro permanecerá na lista como inativo e poderá ser restaurado.`}
          onConfirm={confirmDelete}
          onCancel={() => setIsDeleteDialogOpen(false)}
          confirmLabel="Confirmar exclusão"
          variant="destructive"
        />

        <ConfirmDialog
          isOpen={isRestoreDialogOpen}
          title="Restaurar profissional"
          description={`Deseja restaurar o cadastro de "${selectedItem?.nome}"? Ele voltará a ficar ativo.`}
          onConfirm={confirmRestore}
          onCancel={() => {
            setIsRestoreDialogOpen(false);
            setSelectedItem(null);
          }}
          confirmLabel="Restaurar"
        />

        {selectedItem && (
          <ManagePricesModal
            isOpen={isPricesModalOpen}
            onClose={() => {
              setIsPricesModalOpen(false);
              setSelectedItem(null);
            }}
            profissionalId={selectedItem.id}
            profissionalNome={selectedItem.nome}
          />
        )}

        <ProfissionalViewModal
          isOpen={isViewOpen}
          onClose={handleCloseView}
          profissional={viewItem}
          onEdit={viewItem && !viewItem.deleted_at ? handleEditFromView : undefined}
          canEdit={Boolean(viewItem && !viewItem.deleted_at)}
        />

        {pendenciasTarget && (
          <PendenciasDocumentosModal
            isOpen={pendenciasOpen}
            onClose={() => {
              setPendenciasOpen(false);
              setPendenciasTarget(null);
            }}
            profissionalId={String(pendenciasTarget.id)}
            profissionalNome={pendenciasTarget.nome}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Profissionais;
