import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageToolbar } from '@/components/common/PageToolbar';
import { DataTable } from '@/components/common/DataTable';
import { FormModal } from '@/components/common/FormModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AcaoJudicialForm } from '@/components/forms/AcaoJudicialForm';
import { useAcoesJudiciais, AcaoJudicial } from '@/hooks/useAcoesJudiciais';
import { usePlanosSaude } from '@/hooks/usePlanoseSaude';
import { useNotasFiscais } from '@/hooks/useNotasFiscais';
import { useConciliacaoResumo } from '@/hooks/useConciliacaoAcao';
import { AcaoJudicialFormData } from '@/lib/validations/planoseSaude.schema';
import { calcConciliacaoTotais, formatBRL } from '@/lib/conciliacao/conciliacaoCalc';
import { featureFlags } from '@/lib/featureFlags';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';

type AcaoRow = AcaoJudicial & {
  valorPagoTotal: number;
  saldoEmAberto: number;
  percentualPago: number;
  quitada: boolean;
  qtdNotas: number;
};

export default function AcoesJudiciais() {
  const { acoesJudiciais, addAcaoJudicial, updateAcaoJudicial, deleteAcaoJudicial } = useAcoesJudiciais();
  const { notasFiscais } = useNotasFiscais();
  const { data: resumoApi } = useConciliacaoResumo(
    featureFlags.planosApiEnabled ? { page_size: 500 } : undefined,
  );
  const { planosSaude } = usePlanosSaude();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAcao, setSelectedAcao] = useState<AcaoJudicial | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const rows: AcaoRow[] = useMemo(() => {
    const resumoMap = new Map(
      (resumoApi?.items ?? []).map((item) => [
        item.acao_judicial.id,
        item,
      ]),
    );

    return acoesJudiciais.map((acao) => {
      const fromApi = resumoMap.get(acao.id);
      if (fromApi) {
        return {
          ...acao,
          valorPagoTotal: fromApi.valor_pago_total,
          saldoEmAberto: fromApi.saldo_em_aberto,
          percentualPago: fromApi.percentual_pago,
          quitada: fromApi.quitada,
          qtdNotas: fromApi.qtd_notas,
        };
      }
      const notas = notasFiscais.filter((n) => n.acao_judicial_id === acao.id);
      const valorNotas = notas.reduce((s, n) => s + Number(n.valor_servico ?? n.valor ?? 0), 0);
      const valorPago = notas.reduce((s, n) => s + (Number(n.valor_pago) || 0), 0);
      const t = calcConciliacaoTotais(Number(acao.valor_acao ?? 0), valorNotas, valorPago, notas.length);
      return {
        ...acao,
        valorPagoTotal: t.valorPagoTotal,
        saldoEmAberto: t.saldoEmAberto,
        percentualPago: t.percentualPago,
        quitada: t.quitada,
        qtdNotas: t.qtdNotas,
      };
    });
  }, [acoesJudiciais, notasFiscais, resumoApi]);

  const filteredAcoes = rows.filter((acao) => {
    const term = searchTerm.toLowerCase();
    const fields = [acao.numero_processo, acao.plano_saude_nome, acao.descricao, acao.observacoes];
    return fields.some((f) => String(f ?? '').toLowerCase().includes(term));
  });

  const handleAdd = () => {
    setSelectedAcao(null);
    setIsModalOpen(true);
  };

  const handleEdit = (acao: AcaoJudicial) => {
    setSelectedAcao(acao);
    setIsModalOpen(true);
  };

  const handleDelete = (acao: AcaoJudicial) => {
    setSelectedAcao(acao);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedAcao) {
      await deleteAcaoJudicial(selectedAcao.id);
      toast({
        title: 'Ação judicial excluída',
        description: 'A ação judicial foi excluída com sucesso.',
      });
      setIsDeleteDialogOpen(false);
      setSelectedAcao(null);
    }
  };

  const handleSubmit = async (data: AcaoJudicialFormData) => {
    try {
      if (selectedAcao) {
        await updateAcaoJudicial(selectedAcao.id, data as Partial<AcaoJudicial>);
        toast({
          title: 'Ação judicial atualizada',
          description: 'A ação judicial foi atualizada com sucesso.',
        });
      } else {
        await addAcaoJudicial(data as Omit<AcaoJudicial, 'id' | 'createdAt' | 'updatedAt'>);
        toast({
          title: 'Ação judicial cadastrada',
          description: 'A ação judicial foi cadastrada com sucesso.',
        });
      }
      setIsModalOpen(false);
      setSelectedAcao(null);
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a ação judicial.',
        variant: 'destructive',
      });
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Em Andamento':
        return 'default';
      case 'Procedente':
        return 'default';
      case 'Improcedente':
        return 'destructive';
      case 'Acordo':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const columns = [
    { key: 'numero_processo', label: 'Processo', sortable: true },
    { key: 'plano_saude_nome', label: 'Plano de Saúde', sortable: true },
    {
      key: 'valor_acao',
      label: 'Valor da ação',
      render: (acao: AcaoRow) => formatBRL(Number(acao.valor_acao ?? 0)),
      sortable: true,
    },
    {
      key: 'valorPagoTotal',
      label: 'Total pago',
      render: (acao: AcaoRow) => formatBRL(acao.valorPagoTotal),
    },
    {
      key: 'saldoEmAberto',
      label: 'Saldo em aberto',
      render: (acao: AcaoRow) => (
        <span className={acao.saldoEmAberto > 0 ? 'text-destructive font-medium' : ''}>
          {formatBRL(acao.saldoEmAberto)}
        </span>
      ),
    },
    {
      key: 'percentualPago',
      label: '% Pago',
      render: (acao: AcaoRow) => `${acao.percentualPago.toFixed(0)}%`,
    },
    {
      key: 'qtdNotas',
      label: 'Notas',
      render: (acao: AcaoRow) => acao.qtdNotas,
    },
    {
      key: 'quitada',
      label: 'Pagamento',
      render: (acao: AcaoRow) => (
        <Badge variant={acao.quitada ? 'default' : 'secondary'}>
          {acao.quitada ? 'Quitada' : 'Em aberto'}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status processo',
      render: (acao: AcaoRow) => (
        <Badge variant={getStatusVariant(acao.status)}>{acao.status}</Badge>
      ),
    },
    {
      key: 'detalhe',
      label: '',
      render: (acao: AcaoRow) => (
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/acoes-judiciais/${acao.id}`}>
            <Eye className="h-4 w-4 mr-1" />
            Detalhes
          </Link>
        </Button>
      ),
    },
  ];

  const quitadas = rows.filter((r) => r.quitada).length;
  const emAberto = rows.length - quitadas;

  return (
    <MainLayout title="Ações Judiciais">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Total de ações</p>
            <p className="text-2xl font-bold">{rows.length}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Quitadas</p>
            <p className="text-2xl font-bold text-green-600">{quitadas}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Em aberto</p>
            <p className="text-2xl font-bold text-destructive">{emAberto}</p>
          </div>
        </div>

        <PageToolbar onAdd={handleAdd} onSearch={setSearchTerm} addButtonText="Nova Ação" />

        <DataTable
          columns={columns}
          data={filteredAcoes}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="Nenhuma ação judicial cadastrada"
        />

        <FormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedAcao ? 'Editar Ação Judicial' : 'Nova Ação Judicial'}
          hideFooter
        >
          <AcaoJudicialForm
            initialData={selectedAcao || undefined}
            planosSaude={planosSaude}
            onSubmit={handleSubmit}
            onCancel={() => setIsModalOpen(false)}
          />
        </FormModal>

        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onCancel={() => setIsDeleteDialogOpen(false)}
          title="Excluir Ação Judicial"
          description="Tem certeza que deseja excluir esta ação judicial? Esta ação não pode ser desfeita."
          onConfirm={confirmDelete}
          variant="destructive"
        />
      </div>
    </MainLayout>
  );
}
