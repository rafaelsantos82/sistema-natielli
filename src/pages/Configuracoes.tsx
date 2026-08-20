import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageToolbar } from '@/components/common/PageToolbar';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { FormModal } from '@/components/common/FormModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { UsuarioForm, type UsuarioFormData } from '@/components/forms/UsuarioForm';
import {
  useUsersList,
  useUserMutations,
  ROLE_LABELS,
  type UserListRow,
} from '@/hooks/useUsers';
import { useUnidades } from '@/hooks/useUnidades';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';

const Configuracoes = () => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [selected, setSelected] = useState<UserListRow | null>(null);

  const { data, isLoading, isError } = useUsersList(search);
  const { createMutation, updateMutation, deleteMutation, restoreMutation } =
    useUserMutations();
  const { unidades: todasUnidades } = useUnidades();

  const unidadeNomePorId = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of todasUnidades) {
      map.set(u.id, u.nome);
    }
    return map;
  }, [todasUnidades]);

  const rows = data?.items ?? [];

  const columns: DataTableColumn<UserListRow>[] = [
    { key: 'name', label: 'Nome' },
    { key: 'email', label: 'E-mail' },
    {
      key: 'role',
      label: 'Perfil',
      render: (item) => ROLE_LABELS[item.role] ?? item.role,
    },
    {
      key: 'unidade_ids',
      label: 'Unidades',
      render: (item) => {
        if (!item.unidade_ids?.length) return 'Todas';
        return item.unidade_ids
          .map((id) => unidadeNomePorId.get(id) ?? id.slice(0, 8))
          .join(', ');
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <Badge
          variant={!item.excluido ? 'default' : 'secondary'}
          className={
            !item.excluido
              ? 'bg-success text-success-foreground'
              : 'bg-muted text-muted-foreground'
          }
          title={
            item.excluido ? 'Usuário excluído — use Restaurar para reativar' : undefined
          }
        >
          {item.excluido ? 'inativo (excluído)' : 'ativo'}
        </Badge>
      ),
    },
  ];

  const handleAdd = () => {
    setSelected(null);
    setOpen(true);
  };

  const handleEdit = (item: UserListRow) => {
    if (item.excluido) {
      toast.error('Usuário excluído não pode ser editado. Restaure o cadastro primeiro.');
      return;
    }
    setSelected(item);
    setOpen(true);
  };

  const handleDelete = (item: UserListRow) => {
    if (item.excluido) return;
    setSelected(item);
    setDeleteOpen(true);
  };

  const handleRestore = (item: UserListRow) => {
    setSelected(item);
    setRestoreOpen(true);
  };

  const confirmDelete = async () => {
    if (!selected) return;
    await deleteMutation.mutateAsync(selected.id);
    setDeleteOpen(false);
    setSelected(null);
  };

  const confirmRestore = async () => {
    if (!selected) return;
    await restoreMutation.mutateAsync(selected.id);
    setRestoreOpen(false);
    setSelected(null);
  };

  const handleSubmit = async (formData: UsuarioFormData) => {
    const unidade_ids = formData.unidade_ids?.length ? formData.unidade_ids : [];
    const paciente_id =
      formData.role === 'responsavel' && formData.paciente_id?.trim()
        ? formData.paciente_id.trim()
        : undefined;
    const profissional_id =
      formData.role === 'terapeuta' && formData.profissional_id?.trim()
        ? formData.profissional_id.trim()
        : undefined;

    if (selected) {
      await updateMutation.mutateAsync({
        id: selected.id,
        body: {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          unidade_ids,
          ...(paciente_id !== undefined ? { paciente_id } : {}),
          ...(profissional_id !== undefined ? { profissional_id } : {}),
          ...(formData.password ? { password: formData.password } : {}),
        },
      });
    } else {
      await createMutation.mutateAsync({
        name: formData.name,
        email: formData.email,
        password: formData.password!,
        role: formData.role,
        unidade_ids,
        ...(paciente_id !== undefined ? { paciente_id } : {}),
        ...(profissional_id !== undefined ? { profissional_id } : {}),
      });
    }
    setOpen(false);
    setSelected(null);
  };

  return (
    <MainLayout title="Usuários">
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Settings className="h-5 w-5" />
          <p className="text-sm">Gerencie usuários de acesso ao sistema.</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-navy">Usuários de acesso</h2>

          <PageToolbar
            onAdd={handleAdd}
            onSearch={setSearch}
            addButtonText="Novo usuário"
          />

          {isError && (
            <p className="text-sm text-destructive">
              Não foi possível carregar usuários. Verifique se você está autenticado como
              administrador.
            </p>
          )}

          <DataTable
            columns={columns}
            data={rows}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRestore={handleRestore}
            isRowInactive={(item) => item.excluido}
            emptyMessage="Nenhum usuário cadastrado"
          />
        </section>

        <FormModal
          title={selected ? 'Editar usuário' : 'Novo usuário'}
          isOpen={open}
          onClose={() => {
            setOpen(false);
            setSelected(null);
          }}
        >
          <UsuarioForm
            key={selected?.id ?? 'new'}
            mode={selected ? 'edit' : 'create'}
            initial={selected}
            onSubmit={handleSubmit}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        </FormModal>

        <ConfirmDialog
          isOpen={deleteOpen}
          onCancel={() => {
            setDeleteOpen(false);
            setSelected(null);
          }}
          onConfirm={confirmDelete}
          title="Excluir usuário"
          description={`Confirma a exclusão de ${selected?.name ?? 'este usuário'}? O cadastro permanecerá na lista como inativo e poderá ser restaurado.`}
          confirmLabel="Confirmar exclusão"
          variant="destructive"
        />

        <ConfirmDialog
          isOpen={restoreOpen}
          onCancel={() => {
            setRestoreOpen(false);
            setSelected(null);
          }}
          onConfirm={confirmRestore}
          title="Restaurar usuário"
          description={`Deseja restaurar o acesso de "${selected?.name}"? O usuário voltará a ficar ativo.`}
          confirmLabel="Restaurar"
        />
      </div>
    </MainLayout>
  );
};

export default Configuracoes;
