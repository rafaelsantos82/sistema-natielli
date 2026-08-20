import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getErrorToastProps } from '@/lib/ui/showErrorToast';
import { useNavigate } from 'react-router-dom';
import { useComodatos, type Comodato } from '@/hooks/useComodatos';
import {
  getComodatoStatusLabel,
  isComodatoDevolvido,
  partitionComodatos,
} from '@/lib/comodato/comodatoStatus';
import { AlertTriangle, Package, CheckCircle, Clock, Plus, ArrowLeft, FileText, Shield } from 'lucide-react';
import { DataTable, DataTableColumn } from '@/components/common/DataTable';
import { FormModal } from '@/components/common/FormModal';
import { PageToolbar } from '@/components/common/PageToolbar';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ComodatoForm } from '@/components/forms/ComodatoForm';
import { DevolucaoForm, DEVOLUCAO_COMODATO_FORM_ID } from '@/components/forms/DevolucaoForm';
import { AssinarDocumentoDialog } from '@/components/signature/AssinarDocumentoDialog';
import { ComodatoNotifications } from '@/components/comodato/ComodatoNotifications';
import { ComodatoFormData, DevolucaoFormData } from '@/lib/validations/comodato.schema';
import { downloadTermoComodato, getTermoComodatoPDFBytes } from '@/lib/utils/comodatoTermGenerator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePacientesOptions } from '@/hooks/usePacientes';
import { useProfissionais } from '@/hooks/useProfissionais';
import { useEstoque } from '@/hooks/useEstoque';

const ComodatoPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    comodatos,
    addComodato,
    updateComodato,
    deleteComodato,
    registrarDevolucao,
    getComodatosAtivos,
    getComodatosAtrasados,
  } = useComodatos();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ativos');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDevolucaoModalOpen, setIsDevolucaoModalOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [selectedComodato, setSelectedComodato] = useState<Comodato | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmittingDevolucao, setIsSubmittingDevolucao] = useState(false);
  const [termoPdfBytes, setTermoPdfBytes] = useState<Uint8Array | null>(null);

  const { options: pacienteOptions } = usePacientesOptions();
  const pacientes = useMemo(
    () => pacienteOptions.map((p) => ({ id: p.id, nome: p.nome })),
    [pacienteOptions]
  );

  const { list: listProfissionais } = useProfissionais();
  const { itens: itensEstoque } = useEstoque();

  const profissionais = useMemo(
    () => listProfissionais().map((p) => ({ id: p.id, nome: p.nome })),
    [listProfissionais],
  );

  const comodatosAtivos = getComodatosAtivos();
  const comodatosAtrasados = getComodatosAtrasados();

  const filteredComodatos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return comodatos;
    }
    return comodatos.filter(
      (comodato) =>
        String(comodato.item_nome ?? '').toLowerCase().includes(q) ||
        String(comodato.paciente_nome ?? '').toLowerCase().includes(q) ||
        String(comodato.responsavel_nome ?? '').toLowerCase().includes(q),
    );
  }, [comodatos, searchQuery]);

  const comodatosPorStatus = useMemo(
    () => partitionComodatos(filteredComodatos),
    [filteredComodatos],
  );

  const columns: DataTableColumn<Comodato>[] = [
    { key: 'item_nome', label: 'Item' },
    {
      key: 'quantidade',
      label: 'Qtd',
      render: (comodato) => <Badge variant="outline">{comodato.quantidade}</Badge>,
    },
    { key: 'paciente_nome', label: 'Paciente' },
    {
      key: 'data_emprestimo',
      label: 'Data Empréstimo',
      render: (comodato) => format(new Date(comodato.data_emprestimo), 'dd/MM/yyyy', { locale: ptBR }),
    },
    {
      key: 'data_devolucao_prevista',
      label: 'Devolução Prevista',
      render: (comodato) => format(new Date(comodato.data_devolucao_prevista), 'dd/MM/yyyy', { locale: ptBR }),
    },
    {
      key: 'status',
      label: 'Status',
      render: (comodato) => {
        const label = getComodatoStatusLabel(comodato);
        return (
          <Badge
            variant={
              label === 'Atrasado'
                ? 'destructive'
                : label === 'Emprestado' || label === 'Ativo'
                  ? 'default'
                  : 'secondary'
            }
          >
            {label}
          </Badge>
        );
      },
    },
    { key: 'responsavel_nome', label: 'Responsável' },
  ];

  const handleAddComodato = async (data: ComodatoFormData) => {
    try {
      await addComodato({
        item_id: data.item_id,
        item_nome: data.item_nome,
        descricao: data.descricao,
        paciente_id: data.paciente_id,
        paciente_nome: data.paciente_nome,
        data_emprestimo: data.data_emprestimo,
        data_devolucao_prevista: data.data_devolucao_prevista,
        condicao_entrega: data.condicao_entrega,
        observacoes: data.observacoes,
        responsavel_id: data.responsavel_id,
        responsavel_nome: data.responsavel_nome,
        numero_serie: data.numero_serie,
        quantidade: data.quantidade,
      });
      setIsAddModalOpen(false);
      toast({
        title: 'Sucesso',
        description: 'Comodato registrado com sucesso',
      });
    } catch (error) {
      toast(getErrorToastProps(error, { action: 'registrar', entity: 'o comodato' }));
    }
  };

  const handleEditComodato = async (data: ComodatoFormData) => {
    if (!selectedComodato) return;
    try {
      await updateComodato(selectedComodato.id, {
        item_id: data.item_id,
        item_nome: data.item_nome,
        descricao: data.descricao,
        paciente_id: data.paciente_id,
        paciente_nome: data.paciente_nome,
        data_emprestimo: data.data_emprestimo,
        data_devolucao_prevista: data.data_devolucao_prevista,
        condicao_entrega: data.condicao_entrega,
        observacoes: data.observacoes,
        responsavel_id: data.responsavel_id,
        responsavel_nome: data.responsavel_nome,
        numero_serie: data.numero_serie,
        quantidade: data.quantidade,
      });
      setIsEditModalOpen(false);
      setSelectedComodato(null);
      toast({
        title: 'Sucesso',
        description: 'Comodato atualizado com sucesso',
      });
    } catch (error) {
      toast(getErrorToastProps(error, { action: 'atualizar', entity: 'o comodato' }));
    }
  };

  const handleDevolucao = async (data: DevolucaoFormData) => {
    if (!selectedComodato) return;
    setIsSubmittingDevolucao(true);
    try {
      await registrarDevolucao(selectedComodato.id, data);
      setIsDevolucaoModalOpen(false);
      setSelectedComodato(null);
      setActiveTab('devolvidos');
      toast({
        title: 'Sucesso',
        description: 'Devolução registrada com sucesso',
      });
    } catch (error) {
      toast(getErrorToastProps(error, { action: 'registrar', entity: 'a devolução' }));
    } finally {
      setIsSubmittingDevolucao(false);
    }
  };

  const handleDeleteClick = (comodato: Comodato) => {
    setSelectedComodato(comodato);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedComodato) {
      deleteComodato(selectedComodato.id);
      setIsDeleteDialogOpen(false);
      setSelectedComodato(null);
      toast({
        title: 'Sucesso',
        description: 'Comodato removido com sucesso',
      });
    }
  };

  const handleEditClick = (comodato: Comodato) => {
    if (comodato.status !== 'Devolvido') {
      setSelectedComodato(comodato);
      setIsEditModalOpen(true);
    } else {
      toast({
        title: 'Atenção',
        description: 'Não é possível editar um comodato já devolvido',
        variant: 'destructive',
      });
    }
  };

  const handleDevolucaoClick = (comodato: Comodato) => {
    if (comodato.status !== 'Devolvido') {
      setSelectedComodato(comodato);
      setIsDevolucaoModalOpen(true);
    }
  };

  const handleGerarTermo = (comodato: Comodato) => {
    try {
      downloadTermoComodato(comodato);
      toast({
        title: 'Termo Gerado',
        description: 'Termo de responsabilidade baixado com sucesso',
      });
    } catch (error) {
      toast(getErrorToastProps(error, { action: 'enviar', entity: 'o termo' }));
    }
  };

  const handleAssinarTermo = (comodato: Comodato) => {
    try {
      const pdfBytes = getTermoComodatoPDFBytes(comodato);
      setTermoPdfBytes(pdfBytes);
      setSelectedComodato(comodato);
      setIsSignatureModalOpen(true);
    } catch (error) {
      toast(getErrorToastProps(error, { action: 'assinar', entity: 'o termo' }));
    }
  };

  const handleSignatureComplete = () => {
    if (!selectedComodato) return;

    toast({
      title: 'Termo assinado',
      description: 'O termo foi assinado e salvo no repositório de documentos.',
    });
    setIsSignatureModalOpen(false);
    setSelectedComodato(null);
    setTermoPdfBytes(null);
  };

  const stats = [
    {
      title: 'Total de Comodatos',
      value: comodatos.length,
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Emprestados',
      value: comodatosAtivos.length,
      icon: Clock,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      title: 'Atrasados',
      value: comodatosAtrasados.length,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      title: 'Devolvidos',
      value: comodatos.filter(isComodatoDevolvido).length,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  return (
    <MainLayout title="Gestão de Comodato">
      <div className="space-y-6">
        {/* Notificações de Vencimento */}
        <ComodatoNotifications comodatos={comodatos} />

        {/* Alertas de Comodatos Atrasados */}
        {comodatosAtrasados.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{comodatosAtrasados.length}</strong> comodato
              {comodatosAtrasados.length === 1 ? ' está' : 's estão'} com devolução atrasada.
              Verifique a necessidade de contato com os pacientes.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ativos">Ativos ({comodatosPorStatus.ativos.length})</TabsTrigger>
            <TabsTrigger value="atrasados">Atrasados ({comodatosPorStatus.atrasados.length})</TabsTrigger>
            <TabsTrigger value="devolvidos">Devolvidos ({comodatosPorStatus.devolvidos.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="ativos" className="space-y-4">
            <PageToolbar
              onBack={() => navigate(-1)}
              backLabel="Voltar"
              onAdd={() => setIsAddModalOpen(true)}
              onSearch={setSearchQuery}
              addButtonText="Novo Comodato"
            />

            <Card>
              <CardContent className="pt-6">
                <DataTable
                  columns={columns}
                  data={comodatosPorStatus.ativos}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  emptyMessage="Nenhum comodato ativo"
                />
                {comodatosPorStatus.ativos.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">
                      Ações disponíveis:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {comodatosPorStatus.ativos.map((comodato) => (
                        <div key={comodato.id} className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDevolucaoClick(comodato)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Devolver: {comodato.item_nome}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGerarTermo(comodato)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Termo
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleAssinarTermo(comodato)}
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Assinar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="atrasados" className="space-y-4">
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>

            {comodatosPorStatus.atrasados.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum comodato atrasado</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <DataTable
                    columns={columns}
                    data={comodatosPorStatus.atrasados}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                    emptyMessage="Nenhum comodato atrasado"
                  />
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">
                      Registrar devoluções dos itens atrasados:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {comodatosPorStatus.atrasados.map((comodato) => (
                        <div key={comodato.id} className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDevolucaoClick(comodato)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Devolver: {comodato.item_nome}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGerarTermo(comodato)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Termo
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleAssinarTermo(comodato)}
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Assinar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="devolvidos" className="space-y-4">
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>

            <DataTable
              columns={[
                ...columns,
                {
                  key: 'data_devolucao_real',
                  label: 'Data Devolução',
                  render: (comodato) =>
                    comodato.data_devolucao_real
                      ? format(new Date(comodato.data_devolucao_real), 'dd/MM/yyyy', { locale: ptBR })
                      : '-',
                },
                {
                  key: 'condicao_devolucao',
                  label: 'Condição Devolução',
                  render: (comodato) => (
                    <Badge variant="outline">{comodato.condicao_devolucao || '-'}</Badge>
                  ),
                },
              ]}
              data={comodatosPorStatus.devolvidos}
              onDelete={handleDeleteClick}
              emptyMessage="Nenhum comodato devolvido"
            />
          </TabsContent>
        </Tabs>

        {/* Modal de Adicionar Comodato */}
        <FormModal
          title="Novo Comodato"
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={() => {
            const form = document.querySelector('form') as HTMLFormElement;
            form?.requestSubmit();
          }}
          size="4xl"
        >
          <ComodatoForm
            onSubmit={handleAddComodato}
            pacientes={pacientes}
            profissionais={profissionais}
            itensEstoque={itensEstoque}
          />
        </FormModal>

        {/* Modal de Editar Comodato */}
        <FormModal
          title="Editar Comodato"
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedComodato(null);
          }}
          onSubmit={() => {
            const form = document.querySelector('form') as HTMLFormElement;
            form?.requestSubmit();
          }}
          size="4xl"
        >
          {selectedComodato && (
            <ComodatoForm
              onSubmit={handleEditComodato}
              initialData={selectedComodato}
              pacientes={pacientes}
              profissionais={profissionais}
              itensEstoque={itensEstoque}
            />
          )}
        </FormModal>

        {/* Modal de Devolução */}
        <FormModal
          title={`Registrar Devolução - ${selectedComodato?.item_nome || ''}`}
          isOpen={isDevolucaoModalOpen}
          onClose={() => {
            if (!isSubmittingDevolucao) {
              setIsDevolucaoModalOpen(false);
              setSelectedComodato(null);
            }
          }}
          submitFormId={DEVOLUCAO_COMODATO_FORM_ID}
          isSubmitting={isSubmittingDevolucao}
          submitLabel="Registrar Devolução"
          showReset={false}
        >
          <DevolucaoForm onSubmit={handleDevolucao} />
        </FormModal>

        {/* Diálogo de Confirmação de Exclusão */}
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onCancel={() => {
            setIsDeleteDialogOpen(false);
            setSelectedComodato(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Confirmar Exclusão"
          description={`Tem certeza que deseja excluir o comodato "${selectedComodato?.item_nome}"? Esta ação não pode ser desfeita.`}
          variant="destructive"
        />

        {/* Modal de Assinatura Digital */}
        {termoPdfBytes && selectedComodato && (
          <AssinarDocumentoDialog
            isOpen={isSignatureModalOpen}
            onClose={() => {
              setIsSignatureModalOpen(false);
              setSelectedComodato(null);
              setTermoPdfBytes(null);
            }}
            documentBytes={termoPdfBytes}
            documentName={`termo-comodato-${selectedComodato.paciente_nome}`}
            documentType="prontuario"
            onSignatureComplete={handleSignatureComplete}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default ComodatoPage;
