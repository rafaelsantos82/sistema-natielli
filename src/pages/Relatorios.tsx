import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageToolbar } from '@/components/common/PageToolbar';
import { DataTable, DataTableColumn } from '@/components/common/DataTable';
import { FormModal } from '@/components/common/FormModal';
import { RelatorioForm } from '@/components/forms/RelatorioForm';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getErrorToastProps } from '@/lib/ui/showErrorToast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUnidadeAtiva } from '@/contexts/UnidadeContext';
import { UNIDADE_PADRAO_ID } from '@/hooks/useUnidades';
import {
  useRelatoriosOperacionais,
  type RelatorioOperacional as Relatorio,
} from '@/hooks/useRelatoriosOperacionais';

export type { RelatorioOperacional as Relatorio } from '@/hooks/useRelatoriosOperacionais';

/** @deprecated use RelatorioOperacional from hook */
export interface RelatorioLegacy {
  id: number;
  numero: string;
  paciente: string;
  profissional: string;
  terapia: string;
  periodo: string;
  valor: number;
  status: 'rascunho' | 'aguardando_aprovacao' | 'aprovado' | 'rejeitado' | 'integrado';
  /** Unidade onde o relatório foi gerado. Default: UNIDADE_PADRAO_ID. */
  unidadeId?: string;
  dataSubmissao?: string;
  dataAprovacao?: string;
  aprovadoPor?: string;
  observacoes?: string;
  historicoVersoes?: Array<{
    versao: number;
    data: string;
    status: string;
    alteradoPor: string;
    observacao: string;
  }>;
}

const Relatorios = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { unidades, unidadeAtivaId, unidadeAtiva } = useUnidadeAtiva();
  const podeVerTodas = user?.role === 'admin' || user?.role === 'gestor';
  const [unidadeFiltro, setUnidadeFiltro] = useState<string>(unidadeAtivaId);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Relatorio | null>(null);
  const {
    relatorios,
    addRelatorio,
    updateRelatorio,
    saveRelatorios,
  } = useRelatoriosOperacionais();

  const filteredData = useMemo(() => {
    return relatorios.filter((rel) => {
      const matchTexto =
        rel.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rel.paciente.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rel.profissional.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchTexto) return false;
      if (unidadeFiltro === 'all') return true;
      return (rel.unidadeId ?? UNIDADE_PADRAO_ID) === unidadeFiltro;
    });
  }, [relatorios, searchQuery, unidadeFiltro]);

  const getStatusBadge = (status: Relatorio['status']) => {
    const variants = {
      rascunho: { variant: 'secondary' as const, label: 'Rascunho', className: 'bg-muted' },
      aguardando_aprovacao: { variant: 'default' as const, label: 'Aguardando Aprovação', className: 'bg-warning text-warning-foreground' },
      aprovado: { variant: 'default' as const, label: 'Aprovado', className: 'bg-success text-success-foreground' },
      rejeitado: { variant: 'destructive' as const, label: 'Rejeitado', className: 'bg-destructive' },
      integrado: { variant: 'default' as const, label: 'Integrado', className: 'bg-primary' },
    };

    const config = variants[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const columns: DataTableColumn<Relatorio>[] = [
    { key: 'numero', label: 'Número' },
    { key: 'paciente', label: 'Paciente' },
    { key: 'profissional', label: 'Profissional' },
    { key: 'terapia', label: 'Terapia' },
    { key: 'periodo', label: 'Período' },
    {
      key: 'valor',
      label: 'Valor',
      render: (item) => `R$ ${item.valor.toFixed(2)}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => getStatusBadge(item.status),
    },
  ];

  const handleAdd = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Relatorio) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: Partial<Relatorio>) => {
    try {
      if (selectedItem) {
        await updateRelatorio(selectedItem.id, {
          ...data,
          historicoVersoes: [
            ...(selectedItem.historicoVersoes || []),
            {
              versao: (selectedItem.historicoVersoes?.length || 0) + 1,
              data: new Date().toISOString().split('T')[0],
              status: data.status || selectedItem.status,
              alteradoPor: 'Usuário Sistema',
              observacao: data.observacoes || 'Atualização do relatório',
            },
          ],
        });
        toast({ title: 'Sucesso', description: 'Relatório atualizado com sucesso' });
      } else {
        const unidadeAlvo = unidadeFiltro === 'all' ? unidadeAtivaId : unidadeFiltro;
        await addRelatorio({
          numero: `REL-${new Date().getFullYear()}-${String(relatorios.length + 1).padStart(3, '0')}`,
          paciente: data.paciente ?? '',
          profissional: data.profissional ?? '',
          terapia: data.terapia ?? '',
          periodo: data.periodo ?? '',
          valor: data.valor ?? 0,
          status: data.status ?? 'rascunho',
          unidadeId: data.unidadeId ?? unidadeAlvo,
          historicoVersoes: [
            {
              versao: 1,
              data: new Date().toISOString().split('T')[0],
              status: 'rascunho',
              alteradoPor: 'Usuário Sistema',
              observacao: 'Criação inicial do relatório',
            },
          ],
        });
        toast({ title: 'Sucesso', description: 'Relatório criado com sucesso' });
      }
      setIsModalOpen(false);
      setSelectedItem(null);
    } catch (err) {
      toast(getErrorToastProps(err, { action: 'salvar', entity: 'o relatório' }));
    }
  };

  const handleApprove = async (item: Relatorio) => {
    await updateRelatorio(item.id, {
      status: 'aprovado',
      dataAprovacao: new Date().toISOString().split('T')[0],
      aprovadoPor: 'Gestor Sistema',
      historicoVersoes: [
        ...(item.historicoVersoes || []),
        {
          versao: (item.historicoVersoes?.length || 0) + 1,
          data: new Date().toISOString().split('T')[0],
          status: 'aprovado',
          alteradoPor: 'Gestor Sistema',
          observacao: 'Relatório aprovado - pronto para integração financeira',
        },
      ],
    });
    toast({
      title: 'Relatório Aprovado',
      description: 'O relatório foi aprovado e está pronto para integração financeira',
    });
  };

  const handleReject = async (item: Relatorio) => {
    const observacao = prompt('Motivo da rejeição:');
    if (!observacao) return;

    await updateRelatorio(item.id, {
      status: 'rejeitado',
      observacoes: observacao,
      historicoVersoes: [
        ...(item.historicoVersoes || []),
        {
          versao: (item.historicoVersoes?.length || 0) + 1,
          data: new Date().toISOString().split('T')[0],
          status: 'rejeitado',
          alteradoPor: 'Gestor Sistema',
          observacao: `Relatório rejeitado: ${observacao}`,
        },
      ],
    });
    toast({
      title: 'Relatório Rejeitado',
      description: 'O profissional será notificado',
      variant: 'destructive',
    });
  };

  const handleIntegrate = (item: Relatorio) => {
    if (item.status !== 'aprovado') {
      toast({
        title: 'Erro',
        description: 'Apenas relatórios aprovados podem ser integrados',
        variant: 'destructive',
      });
      return;
    }

    void updateRelatorio(item.id, {
      status: 'integrado',
      historicoVersoes: [
        ...(item.historicoVersoes || []),
        {
          versao: (item.historicoVersoes?.length || 0) + 1,
          data: new Date().toISOString().split('T')[0],
          status: 'integrado',
          alteradoPor: 'Sistema Financeiro',
          observacao: 'Integrado ao sistema financeiro',
        },
      ],
    });
    toast({
      title: 'Integração Concluída',
      description: 'Relatório integrado ao sistema financeiro com sucesso',
    });
  };

  const titulo =
    unidadeFiltro === 'all'
      ? 'Relatórios — Todas as unidades'
      : `Relatórios — ${unidades.find((u) => u.id === unidadeFiltro)?.nome ?? unidadeAtiva?.nome ?? ''}`.trim();

  return (
    <MainLayout title={titulo}>
      <div className="space-y-4">
        <PageToolbar
          onBack={() => navigate(-1)}
          onAdd={handleAdd}
          onSearch={setSearchQuery}
          addButtonText="Novo Relatório"
        />

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <Select value={unidadeFiltro} onValueChange={setUnidadeFiltro}>
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
          <Badge variant="secondary" className="bg-muted">
            Total: {filteredData.length}
          </Badge>
          <Badge variant="default" className="bg-warning text-warning-foreground">
            Aguardando: {filteredData.filter(r => r.status === 'aguardando_aprovacao').length}
          </Badge>
          <Badge variant="default" className="bg-success text-success-foreground">
            Aprovados: {filteredData.filter(r => r.status === 'aprovado').length}
          </Badge>
          <Badge variant="default" className="bg-primary">
            Integrados: {filteredData.filter(r => r.status === 'integrado').length}
          </Badge>
        </div>

        <DataTable
          columns={columns}
          data={filteredData}
          onEdit={handleEdit}
          onView={(item) => navigate(`/relatorios/${item.id}`)}
          emptyMessage="Nenhum relatório encontrado"
          getRowId={(item) => item.id}
        />

        <FormModal
          title={selectedItem ? 'Editar Relatório' : 'Novo Relatório'}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          size="4xl"
        >
          <RelatorioForm
            initialData={selectedItem || undefined}
            onSubmit={handleSubmit}
            onApprove={selectedItem?.status === 'aguardando_aprovacao' ? () => handleApprove(selectedItem) : undefined}
            onReject={selectedItem?.status === 'aguardando_aprovacao' ? () => handleReject(selectedItem) : undefined}
            onIntegrate={selectedItem?.status === 'aprovado' ? () => handleIntegrate(selectedItem) : undefined}
          />
        </FormModal>
      </div>
    </MainLayout>
  );
};

export default Relatorios;
