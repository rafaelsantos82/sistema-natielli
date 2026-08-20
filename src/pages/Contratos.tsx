import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import {
  useContratosList,
  useContratosMutations,
  type Contrato,
} from '@/hooks/useContratos';
import { FileText, Share2, PenTool, FileCheck, AlertCircle, Clock, Copy } from 'lucide-react';
import { DataTable, DataTableColumn } from '@/components/common/DataTable';
import { PageToolbar } from '@/components/common/PageToolbar';
import { FormModal } from '@/components/common/FormModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ContratoForm } from '@/components/contratos/ContratoForm';
import { ContratoViewModal } from '@/components/contratos/ContratoViewModal';
import { CompartilharContratoDialog } from '@/components/contratos/CompartilharContratoDialog';
import {
  SolicitarAssinaturaDialog,
  type SolicitarAssinaturaFormData,
} from '@/components/contratos/SolicitarAssinaturaDialog';
import { formToMetadataPayload } from '@/lib/mappers/contratoMapper';
import type { ContratoFormValues } from '@/lib/validations/contrato.schema';
import type { SignatarioLinkDTO } from '@/lib/api/contratos.types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePacientesOptions } from '@/hooks/usePacientes';
import { useProfissionais } from '@/hooks/useProfissionais';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const FORM_ID_CREATE = 'contrato-form-create';
const FORM_ID_EDIT = 'contrato-form-edit';

const Contratos = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading, isError, refetch } = useContratosList({ q: searchQuery });
  const {
    createMutation,
    updateMutation,
    replaceArquivoMutation,
    deleteMutation,
    compartilharMutation,
    solicitarAssinaturaMutation,
  } = useContratosMutations();

  const contratos = data?.items ?? [];

  const [selected, setSelected] = useState<Contrato | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSignOpen, setIsSignOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [signLinks, setSignLinks] = useState<SignatarioLinkDTO[] | null>(null);

  const { options: pacienteOptions } = usePacientesOptions();
  const pacientes = useMemo(
    () => pacienteOptions.map((p) => ({ id: p.id, nome: p.nome })),
    [pacienteOptions],
  );
  const { list: listProfissionais } = useProfissionais();
  const profissionais = useMemo(
    () => listProfissionais().map((p) => ({ id: p.id, nome: p.nome })),
    [listProfissionais],
  );

  const canEdit = (c: Contrato) => c.status === 'Rascunho' || c.status === 'Recusado';

  const columns: DataTableColumn<Contrato>[] = [
    { key: 'titulo', label: 'Título' },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (item) => <Badge variant="outline">{item.tipo}</Badge>,
    },
    { key: 'paciente_nome', label: 'Paciente' },
    { key: 'profissional_nome', label: 'Profissional' },
    {
      key: 'status',
      label: 'Status',
      render: (item) => {
        const colors: Record<string, string> = {
          'Aguardando Assinatura': 'bg-warning text-warning-foreground',
          Assinado: 'bg-success text-success-foreground',
        };
        return (
          <Badge className={colors[item.status] ?? ''} variant="secondary">
            {item.status}
          </Badge>
        );
      },
    },
    {
      key: 'criado_em',
      label: 'Criado em',
      render: (item) => {
        const d = new Date(item.criado_em);
        return Number.isNaN(d.getTime()) ? '—' : format(d, 'dd/MM/yyyy', { locale: ptBR });
      },
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (item) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            title="Compartilhar"
            disabled={item.status === 'Rascunho'}
            onClick={() => {
              setSelected(item);
              setIsShareOpen(true);
            }}
          >
            <Share2 className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            title="Solicitar assinatura"
            disabled={!canEdit(item)}
            onClick={() => {
              setSelected(item);
              setIsSignOpen(true);
            }}
          >
            <PenTool className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ];

  const stats = [
    { title: 'Total de Contratos', value: contratos.length, icon: FileText, color: 'text-primary', bgColor: 'bg-primary/10' },
    {
      title: 'Aguardando Assinatura',
      value: contratos.filter((c) => c.status === 'Aguardando Assinatura').length,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Assinados',
      value: contratos.filter((c) => c.status === 'Assinado').length,
      icon: FileCheck,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Rascunhos',
      value: contratos.filter((c) => c.status === 'Rascunho').length,
      icon: AlertCircle,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    },
  ];

  const handleCreate = async (values: ContratoFormValues, file: File | null) => {
    if (!file) return;
    await createMutation.mutateAsync({ values, file });
    setIsCreateOpen(false);
  };

  const handleEdit = async (values: ContratoFormValues, file: File | null) => {
    if (!selected) return;
    await updateMutation.mutateAsync({
      id: selected.id,
      payload: formToMetadataPayload(values),
    });
    if (file) {
      await replaceArquivoMutation.mutateAsync({ id: selected.id, file });
    }
    setIsEditOpen(false);
    setSelected(null);
  };

  const handleShare = async (form: { expiracao_horas: number }) => {
    if (!selected) return;
    const res = await compartilharMutation.mutateAsync({
      id: selected.id,
      payload: {
        expiracao_horas: form.expiracao_horas,
      },
    });
    const link = res.url || `${window.location.origin}/contratos/compartilhado/${res.token}`;
    await navigator.clipboard.writeText(link);
    toast.success('Link copiado para a área de transferência');
    setIsShareOpen(false);
    setSelected(null);
  };

  const handleSolicitar = async (form: SolicitarAssinaturaFormData) => {
    if (!selected) return;
    const res = await solicitarAssinaturaMutation.mutateAsync({
      id: selected.id,
      payload: {
        mensagem: form.mensagem,
        expira_em_horas: form.expira_em_horas,
        signatarios: form.signatarios,
      },
    });
    setIsSignOpen(false);
    setSignLinks(res.signatarios);
    setSelected(null);
    void refetch();
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (selected.status === 'Assinado') {
      const ok = window.confirm(
        'Este contrato está assinado. A exclusão é permanente na listagem (soft delete). Deseja continuar?',
      );
      if (!ok) return;
    }
    await deleteMutation.mutateAsync(selected.id);
    setIsDeleteOpen(false);
    setSelected(null);
  };

  return (
    <MainLayout title="Contratos">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
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

        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento de Contratos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isError && (
              <Alert variant="destructive">
                <AlertDescription>Não foi possível carregar os contratos.</AlertDescription>
              </Alert>
            )}
            <PageToolbar
              onBack={() => navigate(-1)}
              onAdd={() => setIsCreateOpen(true)}
              onSearch={setSearchQuery}
              addButtonText="Novo Contrato"
            />
            <DataTable
              columns={columns}
              data={contratos}
              isLoading={isLoading}
              onView={(item) => {
                setSelected(item);
                setIsViewOpen(true);
              }}
              onEdit={(item) => {
                if (!canEdit(item)) {
                  toast.error('Somente contratos em Rascunho ou Recusado podem ser editados');
                  return;
                }
                setSelected(item);
                setIsEditOpen(true);
              }}
              onDelete={(item) => {
                setSelected(item);
                setIsDeleteOpen(true);
              }}
              emptyMessage="Nenhum contrato encontrado"
            />
          </CardContent>
        </Card>
      </div>

      <FormModal
        title="Novo contrato"
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={() => {
          const form = document.getElementById(FORM_ID_CREATE) as HTMLFormElement | null;
          form?.requestSubmit();
        }}
        size="2xl"
        isSubmitting={createMutation.isPending}
        submitLabel="Criar"
      >
        <ContratoForm
          formId={FORM_ID_CREATE}
          mode="create"
          onSubmit={handleCreate}
          pacientes={pacientes}
          profissionais={profissionais}
        />
      </FormModal>

      <FormModal
        title="Editar contrato"
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelected(null);
        }}
        onSubmit={() => {
          const form = document.getElementById(FORM_ID_EDIT) as HTMLFormElement | null;
          form?.requestSubmit();
        }}
        size="2xl"
        isSubmitting={updateMutation.isPending || replaceArquivoMutation.isPending}
      >
        {selected && (
          <ContratoForm
            formId={FORM_ID_EDIT}
            mode="edit"
            initialData={selected}
            onSubmit={handleEdit}
            pacientes={pacientes}
            profissionais={profissionais}
          />
        )}
      </FormModal>

      <ContratoViewModal
        contratoId={selected?.id ?? null}
        summary={selected}
        isOpen={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setSelected(null);
        }}
      />

      <CompartilharContratoDialog
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        titulo={selected?.titulo}
        isSubmitting={compartilharMutation.isPending}
        onConfirm={handleShare}
      />

      <SolicitarAssinaturaDialog
        open={isSignOpen}
        onOpenChange={setIsSignOpen}
        titulo={selected?.titulo}
        isSubmitting={solicitarAssinaturaMutation.isPending}
        onConfirm={handleSolicitar}
      />

      <Dialog open={Boolean(signLinks?.length)} onOpenChange={() => setSignLinks(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Links de assinatura</DialogTitle>
          </DialogHeader>
          <ul className="space-y-3">
            {signLinks?.map((s) => (
              <li key={s.id} className="text-sm border rounded-lg p-3">
                <p className="font-medium">{s.nome}</p>
                <p className="text-muted-foreground text-xs">{s.email}</p>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void navigator.clipboard.writeText(s.url);
                      toast.success('Link copiado');
                    }}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar link
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onCancel={() => {
          setIsDeleteOpen(false);
          setSelected(null);
        }}
        onConfirm={handleDelete}
        title="Excluir contrato"
        description={`Confirma a exclusão de "${selected?.titulo}"?`}
        variant="destructive"
        confirmLabel="Excluir"
      />
    </MainLayout>
  );
};

export default Contratos;
