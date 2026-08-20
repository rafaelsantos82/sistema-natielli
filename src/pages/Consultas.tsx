import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageToolbar } from '@/components/common/PageToolbar';
import { DataTable, DataTableColumn } from '@/components/common/DataTable';
import { FormModal } from '@/components/common/FormModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useConsultas, Consulta } from '@/hooks/useConsultas';
import { useProfissionalElegibilidade } from '@/hooks/useProfissionalElegibilidade';
import { ConsultaForm } from '@/components/forms/ConsultaForm';
import { NotificationSettings } from '@/components/consultas/NotificationSettings';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Calendar } from 'lucide-react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { usePacientesOptions } from '@/hooks/usePacientes';
import { useProfissionais } from '@/hooks/useProfissionais';
import { useSalas } from '@/hooks/useSalas';
import { ElegibilidadeOverrideDialog } from '@/components/profissionais/ElegibilidadeOverrideDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useUnidadeAtiva } from '@/contexts/UnidadeContext';
import { UNIDADE_PADRAO_ID } from '@/hooks/useUnidades';
import { getErrorToastProps } from '@/lib/ui/showErrorToast';

const Consultas = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Consulta | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'cancel' | 'confirm' | 'complete' | null>(null);
  const { user } = useAuth();
  const { unidadeAtivaId, unidadeAtiva, podeTrocarUnidade } = useUnidadeAtiva();
  const [verTodasUnidades, setVerTodasUnidades] = useState(false);
  const podeOverride = user?.role === 'admin' || user?.role === 'gestor';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overrideState, setOverrideState] = useState<{
    motivos: string[];
    acaoLabel: string;
    entidadeId: string;
    proceed: () => void | Promise<void>;
  } | null>(null);

  const {
    consultas,
    addConsulta,
    updateConsulta,
    deleteConsulta,
    confirmarPresenca,
    cancelarConsulta,
    concluirConsulta,
  } = useConsultas();
  const { verificar: verificarElegibilidade } = useProfissionalElegibilidade();

  const { options: pacienteOptions } = usePacientesOptions();
  const { profissionais: profissionaisStorage } = useProfissionais();
  const { salas } = useSalas();

  const salasAtivas = salas
    .filter((s) => s.status === 'Ativa')
    .map((s) => ({
      id: s.id,
      nome_sala: s.nome_sala,
      unidadeId: s.unidadeId,
    }));

  const pacientes = pacienteOptions.map((p) => ({
    id: p.id,
    nome_completo: p.nome_completo,
  }));

  const profissionais = profissionaisStorage
    .filter((p) => p.status === 'ativo')
    .map((p) => ({
      id: p.id,
      nome: p.nome,
      especialidade: p.especialidades?.[0],
    }));

  const filteredData = consultas.filter((item) => {
    const matchUnidade =
      verTodasUnidades ||
      (item.unidadeId ?? UNIDADE_PADRAO_ID) === unidadeAtivaId;
    const matchSearch =
      item.pacienteNome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.profissionalNome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.motivo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchUnidade && matchSearch;
  });

  const columns: DataTableColumn<Consulta>[] = [
    { 
      key: 'pacienteNome', 
      label: 'Paciente',
    },
    { 
      key: 'profissionalNome', 
      label: 'Profissional',
    },
    {
      key: 'salaNome',
      label: 'Sala',
      render: (item) => item.salaNome || '—',
    },
    {
      key: 'dataHora',
      label: 'Data/Hora',
      render: (item) => format(new Date(item.dataHora), 'dd/MM/yyyy HH:mm'),
    },
    { key: 'motivo', label: 'Motivo' },
    {
      key: 'status',
      label: 'Status',
      render: (item) => {
        const variants = {
          agendada: 'default',
          confirmada: 'secondary',
          cancelada: 'destructive',
          concluida: 'outline',
        } as const;
        return (
          <Badge variant={variants[item.status]}>
            {item.status}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      label: 'Ações Rápidas',
      render: (item) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/prontuario/${item.id}`)}
          >
            Prontuário
          </Button>
          {item.status === 'agendada' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleConfirm(item)}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Confirmar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCancel(item)}
              >
                <XCircle className="h-3 w-3 mr-1" />
                Cancelar
              </Button>
            </>
          )}
          {item.status === 'confirmada' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleComplete(item)}
            >
              Concluir
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleAdd = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Consulta) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleSubmit = (data: any) => {
    const mudouProfissional =
      !!selectedItem && selectedItem.profissionalId !== data.profissionalId;
    const mudouDataHora = !!selectedItem && selectedItem.dataHora !== data.dataHora;
    const precisaValidar = !selectedItem || mudouProfissional || mudouDataHora;

    const persistir = async () => {
      setIsSubmitting(true);
      try {
        const payload = {
          ...data,
          pacienteNome:
            pacientes.find((p) => p.id === data.pacienteId)?.nome_completo || '',
          profissionalNome:
            profissionais.find((p) => p.id === data.profissionalId)?.nome || '',
        };
        if (selectedItem) {
          await updateConsulta(selectedItem.id, {
            ...payload,
            status: 'agendada',
          });
          toast({
            title: 'Sucesso',
            description: mudouDataHora
              ? 'Agendamento reagendado com sucesso'
              : 'Agendamento atualizado com sucesso',
          });
        } else {
          await addConsulta({
            ...payload,
            status: 'agendada',
          });
          toast({ title: 'Sucesso', description: 'Agendamento criado com sucesso' });
        }
        setIsModalOpen(false);
        setSelectedItem(null);
      } catch (err) {
        toast(
          getErrorToastProps(err, {
            action: selectedItem ? 'atualizar' : 'criar',
            entity: 'o agendamento',
          }),
        );
      } finally {
        setIsSubmitting(false);
      }
    };

    const skipElegibilidade = import.meta.env.VITE_E2E === 'true';
    if (precisaValidar && !skipElegibilidade) {
      const eleg = verificarElegibilidade(data.profissionalId);
      if (!eleg.elegivel) {
        if (podeOverride) {
          setOverrideState({
            motivos: eleg.motivos,
            acaoLabel: selectedItem ? 'reagendar agendamento' : 'criar agendamento',
            entidadeId: selectedItem?.id ?? 'nova',
            proceed: persistir,
          });
        } else {
          toast({
            title: selectedItem
              ? 'Reagendamento bloqueado'
              : 'Profissional bloqueado para novos agendamentos',
            description: eleg.motivos.join(' '),
            variant: 'destructive',
          });
        }
        return;
      }
    }

    void persistir();
  };

  const handleConfirm = (item: Consulta) => {
    setSelectedItem(item);
    setActionType('confirm');
    setConfirmDialogOpen(true);
  };

  const handleCancel = (item: Consulta) => {
    setSelectedItem(item);
    setActionType('cancel');
    setConfirmDialogOpen(true);
  };

  const handleComplete = (item: Consulta) => {
    setSelectedItem(item);
    setActionType('complete');
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = () => {
    if (!selectedItem || !actionType) return;

    const executar = () => {
      switch (actionType) {
        case 'confirm':
          confirmarPresenca(selectedItem.id);
          toast({ title: 'Sucesso', description: 'Presença confirmada' });
          break;
        case 'cancel':
          cancelarConsulta(selectedItem.id);
          toast({ title: 'Consulta cancelada', description: 'A consulta foi cancelada' });
          break;
        case 'complete':
          concluirConsulta(selectedItem.id);
          toast({ title: 'Sucesso', description: 'Consulta concluída' });
          break;
      }
      setConfirmDialogOpen(false);
      setSelectedItem(null);
      setActionType(null);
    };

    if (actionType === 'confirm' || actionType === 'complete') {
      const eleg = verificarElegibilidade(selectedItem.profissionalId);
      if (!eleg.elegivel) {
        if (podeOverride) {
          setConfirmDialogOpen(false);
          setOverrideState({
            motivos: eleg.motivos,
            acaoLabel:
              actionType === 'confirm' ? 'confirmar presença' : 'concluir consulta',
            entidadeId: selectedItem.id,
            proceed: executar,
          });
        } else {
          toast({
            title:
              actionType === 'confirm'
                ? 'Não é possível confirmar presença'
                : 'Não é possível concluir consulta',
            description: eleg.motivos.join(' '),
            variant: 'destructive',
          });
          setConfirmDialogOpen(false);
          setSelectedItem(null);
          setActionType(null);
        }
        return;
      }
    }

    executar();
  };

  const handleDelete = async (item: Consulta) => {
    try {
      await deleteConsulta(item.id);
      toast({
        title: 'Sucesso',
        description: 'Agendamento excluído com sucesso',
      });
    } catch (err) {
      toast(getErrorToastProps(err, { action: 'excluir', entity: 'o agendamento' }));
    }
  };

  return (
    <MainLayout
      title={
        verTodasUnidades
          ? 'Agendamentos — Todas as unidades'
          : `Agendamentos — ${unidadeAtiva?.nome ?? ''}`.trim()
      }
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <PageToolbar
            onBack={() => navigate(-1)}
            onAdd={handleAdd}
            onSearch={setSearchQuery}
            addButtonText="Novo Agendamento"
          />
          <div className="flex gap-2">
            {podeTrocarUnidade && podeOverride && (
              <Button
                variant={verTodasUnidades ? 'default' : 'outline'}
                onClick={() => setVerTodasUnidades((v) => !v)}
              >
                {verTodasUnidades ? 'Filtrar pela unidade ativa' : 'Ver todas as unidades'}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard-ocupacao')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSettings(!showSettings)}
            >
              Configurações
            </Button>
          </div>
        </div>

        {showSettings && <NotificationSettings />}

        <DataTable
          columns={columns}
          data={filteredData}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="Nenhum agendamento encontrado"
        />

        <FormModal
          title={selectedItem ? 'Editar Agendamento' : 'Novo Agendamento'}
          isOpen={isModalOpen}
          onClose={() => {
            if (isSubmitting) return;
            setIsModalOpen(false);
            setSelectedItem(null);
          }}
          size="2xl"
        >
          <ConsultaForm
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            defaultValues={selectedItem ? {
              pacienteId: selectedItem.pacienteId,
              profissionalId: selectedItem.profissionalId,
              unidadeId: selectedItem.unidadeId ?? unidadeAtivaId,
              salaId: selectedItem.salaId,
              dataHora: selectedItem.dataHora,
              duracao: selectedItem.duracao,
              motivo: selectedItem.motivo,
              observacoes: selectedItem.observacoes,
            } : { unidadeId: unidadeAtivaId }}
            pacientes={pacientes}
            profissionais={profissionais}
            salas={salasAtivas}
          />
        </FormModal>

        <ConfirmDialog
          isOpen={confirmDialogOpen}
          onCancel={() => setConfirmDialogOpen(false)}
          onConfirm={handleConfirmAction}
          title={
            actionType === 'confirm'
              ? 'Confirmar Presença'
              : actionType === 'cancel'
              ? 'Cancelar Consulta'
              : 'Concluir Consulta'
          }
          description={
            actionType === 'confirm'
              ? 'Deseja confirmar a presença do paciente nesta consulta?'
              : actionType === 'cancel'
              ? 'Deseja realmente cancelar esta consulta?'
              : 'Deseja marcar esta consulta como concluída?'
          }
          variant={actionType === 'cancel' ? 'destructive' : 'default'}
        />

        {overrideState && (
          <ElegibilidadeOverrideDialog
            isOpen={!!overrideState}
            onClose={() => setOverrideState(null)}
            onConfirm={() => {
              const proceed = overrideState.proceed;
              setOverrideState(null);
              void proceed();
            }}
            motivos={overrideState.motivos}
            acaoLabel={overrideState.acaoLabel}
            entidade="consulta"
            entidadeId={overrideState.entidadeId}
            acaoAuditoria="agenda.alteracao"
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Consultas;
