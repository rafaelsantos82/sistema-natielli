import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageToolbar } from '@/components/common/PageToolbar';
import { DataTable } from '@/components/common/DataTable';
import { FormModal } from '@/components/common/FormModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { NotaFiscalForm } from '@/components/forms/NotaFiscalForm';
import { useNotasFiscais, NotaFiscal } from '@/hooks/useNotasFiscais';
import { usePlanosSaude } from '@/hooks/usePlanoseSaude';
import { useAcoesJudiciais } from '@/hooks/useAcoesJudiciais';
import { useConciliacaoResumo } from '@/hooks/useConciliacaoAcao';
import { NotaFiscalFormData } from '@/lib/validations/planoseSaude.schema';
import { useToast } from '@/hooks/use-toast';
import { getErrorToastProps } from '@/lib/ui/showErrorToast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/common/MoneyInput';
import { format } from 'date-fns';
import { Link2, AlertCircle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { calcConciliacaoTotais, formatBRL } from '@/lib/conciliacao/conciliacaoCalc';
import { featureFlags } from '@/lib/featureFlags';

type VinculoFilter = 'all' | 'vinculadas' | 'sem_vinculo';

export default function AuditoriaNotas() {
  const { notasFiscais, addNotaFiscal, updateNotaFiscal, deleteNotaFiscal, conciliarNota } = useNotasFiscais();
  const { planosSaude } = usePlanosSaude();
  const { acoesJudiciais } = useAcoesJudiciais();
  const { data: resumoApi } = useConciliacaoResumo(
    featureFlags.planosApiEnabled ? { page_size: 500 } : undefined,
  );
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isConciliacaoOpen, setIsConciliacaoOpen] = useState(false);
  const [isSubmittingConciliacao, setIsSubmittingConciliacao] = useState(false);
  const [selectedNota, setSelectedNota] = useState<NotaFiscal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [vinculoFilter, setVinculoFilter] = useState<VinculoFilter>('all');
  const [planoFilter, setPlanoFilter] = useState<string>('all');
  const [selectedAcaoId, setSelectedAcaoId] = useState<string>('');
  const [valorPago, setValorPago] = useState<number>(0);

  const acaoById = useMemo(() => new Map(acoesJudiciais.map((a) => [a.id, a])), [acoesJudiciais]);

  const resumoByAcaoId = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calcConciliacaoTotais>>();
    if (resumoApi?.items) {
      for (const item of resumoApi.items) {
        map.set(item.acao_judicial.id, {
          valorAcao: Number(item.acao_judicial.valor_acao ?? 0),
          valorNotasVinculadas: item.valor_notas_vinculadas,
          valorPagoTotal: item.valor_pago_total,
          saldoEmAberto: item.saldo_em_aberto,
          percentualPago: item.percentual_pago,
          quitada: item.quitada,
          qtdNotas: item.qtd_notas,
        });
      }
      return map;
    }
    for (const acao of acoesJudiciais) {
      const notas = notasFiscais.filter((n) => n.acao_judicial_id === acao.id);
      const valorNotas = notas.reduce((s, n) => s + Number(n.valor_servico ?? n.valor ?? 0), 0);
      const valorPagoSum = notas.reduce((s, n) => s + (Number(n.valor_pago) || 0), 0);
      map.set(
        acao.id,
        calcConciliacaoTotais(Number(acao.valor_acao ?? 0), valorNotas, valorPagoSum, notas.length),
      );
    }
    return map;
  }, [acoesJudiciais, notasFiscais, resumoApi]);

  const handleAdd = () => {
    setSelectedNota(null);
    setIsModalOpen(true);
  };

  const handleEdit = (nota: NotaFiscal) => {
    setSelectedNota(nota);
    setIsModalOpen(true);
  };

  const handleDelete = (nota: NotaFiscal) => {
    setSelectedNota(nota);
    setIsDeleteDialogOpen(true);
  };

  const handleConciliar = (nota: NotaFiscal) => {
    setSelectedNota(nota);
    setSelectedAcaoId(nota.acao_judicial_id ?? '');
    setValorPago(Number(nota.valor_pago) || 0);
    setIsConciliacaoOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedNota) {
      await deleteNotaFiscal(selectedNota.id);
      toast({
        title: 'Nota fiscal excluída',
        description: 'A nota fiscal foi excluída com sucesso.',
      });
      setIsDeleteDialogOpen(false);
      setSelectedNota(null);
    }
  };

  const handleSubmit = async (data: NotaFiscalFormData) => {
    try {
      if (selectedNota) {
        await updateNotaFiscal(selectedNota.id, data);
        toast({
          title: 'Nota fiscal atualizada',
          description: 'A nota fiscal foi atualizada com sucesso.',
        });
      } else {
        await addNotaFiscal(data);
        toast({
          title: 'Nota fiscal cadastrada',
          description: 'A nota fiscal foi cadastrada com sucesso.',
        });
      }
      setIsModalOpen(false);
      setSelectedNota(null);
    } catch (error) {
      toast(getErrorToastProps(error, { action: 'salvar', entity: 'a nota fiscal' }));
    }
  };

  const handleConfirmConciliacao = async () => {
    if (!selectedNota || !selectedAcaoId) return;
    setIsSubmittingConciliacao(true);
    try {
      await conciliarNota(selectedNota.id, selectedAcaoId, valorPago);
      toast({
        title: 'Nota conciliada',
        description: 'A nota foi vinculada à ação judicial com sucesso.',
      });
      setIsConciliacaoOpen(false);
      setSelectedNota(null);
      setSelectedAcaoId('');
      setValorPago(0);
    } catch (error) {
      toast(getErrorToastProps(error, { action: 'conciliar', entity: 'a nota fiscal' }));
    } finally {
      setIsSubmittingConciliacao(false);
    }
  };

  const search = searchTerm.toLowerCase();
  const filteredNotas = notasFiscais.filter((nota) => {
    if (planoFilter !== 'all' && nota.plano_saude_id !== planoFilter) {
      return false;
    }
    if (vinculoFilter === 'vinculadas' && !nota.acao_judicial_id) {
      return false;
    }
    if (vinculoFilter === 'sem_vinculo' && nota.acao_judicial_id) {
      return false;
    }
    const haystack = [
      nota.numero_nota,
      nota.numero,
      nota.plano_saude_nome,
      nota.paciente_nome,
      nota.acao_judicial_id ? acaoById.get(nota.acao_judicial_id)?.numero_processo : '',
    ]
      .map((v) => String(v ?? '').toLowerCase())
      .join(' ');
    return haystack.includes(search);
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Pago':
        return 'default';
      case 'Pago Parcial':
        return 'secondary';
      case 'Em Disputa':
        return 'destructive';
      case 'Pendente':
        return 'outline';
      default:
        return 'default';
    }
  };

  const notasSemVinculo = notasFiscais.filter((n) => !n.acao_judicial_id).length;
  const notasPendentes = notasFiscais.filter((n) => n.status === 'Pendente' || n.status === 'Em Disputa');
  const valorTotalPendente = notasPendentes.reduce(
    (acc, nota) => acc + Number(nota.valor_servico ?? nota.valor ?? 0),
    0,
  );

  const selectedAcaoResumo = selectedAcaoId ? resumoByAcaoId.get(selectedAcaoId) : undefined;
  const selectedAcao = selectedAcaoId ? acaoById.get(selectedAcaoId) : undefined;

  const columns = [
    { key: 'numero_nota', label: 'Nº Nota', sortable: true },
    { key: 'paciente_nome', label: 'Paciente', sortable: true },
    { key: 'plano_saude_nome', label: 'Plano', sortable: true },
    {
      key: 'data_emissao',
      label: 'Emissão',
      render: (nota: NotaFiscal) => {
        if (!nota.data_emissao) return '—';
        const d = new Date(nota.data_emissao);
        return Number.isNaN(d.getTime()) ? '—' : format(d, 'dd/MM/yyyy');
      },
      sortable: true,
    },
    {
      key: 'valor_servico',
      label: 'Valor',
      render: (nota: NotaFiscal) => formatBRL(Number(nota.valor_servico ?? nota.valor ?? 0)),
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      render: (nota: NotaFiscal) => (
        <Badge variant={getStatusVariant(nota.status)}>{nota.status}</Badge>
      ),
    },
    {
      key: 'acao_judicial_id',
      label: 'Ação judicial',
      render: (nota: NotaFiscal) => {
        if (!nota.acao_judicial_id) {
          return (
            <Button variant="ghost" size="sm" onClick={() => handleConciliar(nota)}>
              Conciliar
            </Button>
          );
        }
        const acao = acaoById.get(nota.acao_judicial_id);
        return (
          <div className="flex flex-col gap-1 items-start">
            <Badge variant="outline">
              <Link2 className="w-3 h-3 mr-1" />
              {acao?.numero_processo ?? 'Vinculada'}
            </Badge>
            <Button variant="link" size="sm" className="h-auto p-0" asChild>
              <Link to={`/acoes-judiciais/${nota.acao_judicial_id}`}>
                <ExternalLink className="w-3 h-3 mr-1" />
                Ver ação
              </Link>
            </Button>
          </div>
        );
      },
    },
  ];

  const acoesDisponiveis = selectedNota
    ? acoesJudiciais.filter((a) => (a.plano_saude_id ?? a.plano_id) === selectedNota.plano_saude_id)
    : [];

  return (
    <MainLayout title="Auditoria de Notas">
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sistema de Conciliação</AlertTitle>
          <AlertDescription>
            Concilie notas fiscais de serviços prestados com ações judiciais movidas contra planos de
            saúde. Vincule cada nota à ação correspondente e registre o valor pago para controle por
            processo.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total de Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notasFiscais.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Sem vínculo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{notasSemVinculo}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Notas Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{notasPendentes.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Valor Pendente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBRL(valorTotalPendente)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-48">
            <Label className="text-xs text-muted-foreground">Vínculo</Label>
            <Select value={vinculoFilter} onValueChange={(v) => setVinculoFilter(v as VinculoFilter)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="vinculadas">Vinculadas</SelectItem>
                <SelectItem value="sem_vinculo">Sem vínculo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-56">
            <Label className="text-xs text-muted-foreground">Plano</Label>
            <Select value={planoFilter} onValueChange={setPlanoFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os planos</SelectItem>
                {planosSaude.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <PageToolbar onAdd={handleAdd} onSearch={setSearchTerm} addButtonText="Nova Nota" />

        <DataTable
          columns={columns}
          data={filteredNotas}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="Nenhuma nota fiscal cadastrada"
        />

        <FormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedNota ? 'Editar Nota Fiscal' : 'Nova Nota Fiscal'}
          hideFooter
        >
          <NotaFiscalForm
            initialData={selectedNota || undefined}
            planosSaude={planosSaude}
            acoesJudiciais={acoesJudiciais}
            resumoByAcaoId={resumoByAcaoId}
            onSubmit={handleSubmit}
            onCancel={() => setIsModalOpen(false)}
          />
        </FormModal>

        <FormModal
          isOpen={isConciliacaoOpen}
          onClose={() => {
            if (!isSubmittingConciliacao) {
              setIsConciliacaoOpen(false);
            }
          }}
          title="Conciliar Nota com Ação Judicial"
          hideFooter
        >
          <div className="space-y-4">
            {selectedNota && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Dados da Nota</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Nº Nota:</span> {selectedNota.numero_nota}
                      </div>
                      <div>
                        <span className="font-medium">Paciente:</span> {selectedNota.paciente_nome}
                      </div>
                      <div>
                        <span className="font-medium">Plano:</span> {selectedNota.plano_saude_nome}
                      </div>
                      <div>
                        <span className="font-medium">Valor serviço:</span>{' '}
                        {formatBRL(Number(selectedNota.valor_servico ?? selectedNota.valor ?? 0))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div>
                  <Label>Ação Judicial *</Label>
                  <Select value={selectedAcaoId} onValueChange={setSelectedAcaoId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a ação judicial" />
                    </SelectTrigger>
                    <SelectContent>
                      {acoesDisponiveis.map((acao) => {
                        const resumo = resumoByAcaoId.get(acao.id);
                        return (
                          <SelectItem key={acao.id} value={acao.id}>
                            {acao.numero_processo} — ação {formatBRL(Number(acao.valor_acao ?? 0))}
                            {resumo ? ` · saldo ${formatBRL(resumo.saldoEmAberto)}` : ''}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {acoesDisponiveis.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Nenhuma ação judicial encontrada para este plano de saúde.
                    </p>
                  )}
                </div>

                {selectedAcaoResumo && selectedAcao && (
                  <Card className="bg-muted/40">
                    <CardContent className="pt-4 text-sm space-y-1">
                      <p>
                        Valor da ação: <strong>{formatBRL(selectedAcaoResumo.valorAcao)}</strong>
                      </p>
                      <p>
                        Já pago (todas as notas):{' '}
                        <strong>{formatBRL(selectedAcaoResumo.valorPagoTotal)}</strong>
                      </p>
                      <p>
                        Saldo em aberto da ação:{' '}
                        <strong className="text-destructive">
                          {formatBRL(selectedAcaoResumo.saldoEmAberto)}
                        </strong>
                      </p>
                    </CardContent>
                  </Card>
                )}

                <div>
                  <Label>Valor Pago nesta nota</Label>
                  <MoneyInput value={valorPago} onChange={setValorPago} placeholder="0,00" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Máximo: {formatBRL(Number(selectedNota.valor_servico ?? selectedNota.valor ?? 0))}
                  </p>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsConciliacaoOpen(false)}
                    disabled={isSubmittingConciliacao}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirmConciliacao}
                    disabled={!selectedAcaoId || isSubmittingConciliacao}
                  >
                    {isSubmittingConciliacao ? 'Salvando...' : 'Conciliar'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </FormModal>

        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onCancel={() => setIsDeleteDialogOpen(false)}
          title="Excluir Nota Fiscal"
          description="Tem certeza que deseja excluir esta nota fiscal? Esta ação não pode ser desfeita."
          onConfirm={confirmDelete}
          variant="destructive"
        />
      </div>
    </MainLayout>
  );
}
