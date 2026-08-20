import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageToolbar } from '@/components/common/PageToolbar';
import { DataTable } from '@/components/common/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useConciliacaoAcaoDetalhe } from '@/hooks/useConciliacaoAcao';
import { useAcoesJudiciais } from '@/hooks/useAcoesJudiciais';
import { useNotasFiscais } from '@/hooks/useNotasFiscais';
import { calcConciliacaoTotais, formatBRL } from '@/lib/conciliacao/conciliacaoCalc';
import { featureFlags } from '@/lib/featureFlags';
import { format } from 'date-fns';
import { CheckCircle, ExternalLink } from 'lucide-react';
import type { NotaFiscal } from '@/hooks/useNotasFiscais';

export default function AcaoJudicialDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: resumoApi, isLoading } = useConciliacaoAcaoDetalhe(id);
  const { acoesJudiciais } = useAcoesJudiciais();
  const { notasFiscais } = useNotasFiscais();

  const acao = acoesJudiciais.find((a) => a.id === id);

  const resumo = useMemo(() => {
    if (featureFlags.planosApiEnabled && resumoApi) {
      return {
        valorAcao: Number(resumoApi.acao_judicial.valor_acao ?? 0),
        valorNotasVinculadas: resumoApi.valor_notas_vinculadas,
        valorPagoTotal: resumoApi.valor_pago_total,
        saldoEmAberto: resumoApi.saldo_em_aberto,
        percentualPago: resumoApi.percentual_pago,
        quitada: resumoApi.quitada,
        qtdNotas: resumoApi.qtd_notas,
        notas: resumoApi.notas ?? [],
        processo: resumoApi.acao_judicial.numero_processo,
        plano: resumoApi.acao_judicial.plano_saude_nome,
      };
    }
    if (!acao) return null;
    const notas = notasFiscais.filter((n) => n.acao_judicial_id === acao.id);
    const valorNotas = notas.reduce((s, n) => s + Number(n.valor_servico ?? n.valor ?? 0), 0);
    const valorPago = notas.reduce((s, n) => s + (Number(n.valor_pago) || 0), 0);
    const t = calcConciliacaoTotais(Number(acao.valor_acao ?? 0), valorNotas, valorPago, notas.length);
    return {
      ...t,
      notas,
      processo: acao.numero_processo,
      plano: acao.plano_saude_nome,
    };
  }, [acao, notasFiscais, resumoApi]);

  const notaColumns = [
    { key: 'numero_nota', label: 'Nº Nota' },
    { key: 'paciente_nome', label: 'Paciente' },
    {
      key: 'valor_servico',
      label: 'Valor',
      render: (n: NotaFiscal) => formatBRL(Number(n.valor_servico ?? n.valor ?? 0)),
    },
    {
      key: 'valor_pago',
      label: 'Pago',
      render: (n: NotaFiscal) => formatBRL(Number(n.valor_pago) || 0),
    },
    {
      key: 'status',
      label: 'Status',
      render: (n: NotaFiscal) => <Badge variant="outline">{n.status}</Badge>,
    },
  ];

  if (!id) {
    return (
      <MainLayout title="Ação Judicial">
        <p className="text-muted-foreground">ID inválido.</p>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={`Ação ${resumo?.processo ?? ''}`}>
      <div className="space-y-6">
        <PageToolbar onBack={() => navigate('/acoes-judiciais')} backLabel="Voltar" />

        {isLoading && featureFlags.planosApiEnabled && (
          <p className="text-sm text-muted-foreground">Carregando conciliação...</p>
        )}

        {!resumo && !isLoading && (
          <p className="text-muted-foreground">Ação judicial não encontrada.</p>
        )}

        {resumo && (
          <>
            {resumo.quitada && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Ação quitada</AlertTitle>
                <AlertDescription>
                  O valor pago nas notas vinculadas atingiu ou superou o valor da ação (
                  {formatBRL(resumo.valorAcao)}).
                </AlertDescription>
              </Alert>
            )}

            <div className="text-sm text-muted-foreground">
              Plano: <span className="font-medium text-foreground">{resumo.plano}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Valor da ação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatBRL(resumo.valorAcao)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total pago</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatBRL(resumo.valorPagoTotal)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Saldo em aberto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{formatBRL(resumo.saldoEmAberto)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Notas vinculadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{resumo.qtdNotas}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total NF: {formatBRL(resumo.valorNotasVinculadas)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Progresso do pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress value={Math.min(100, resumo.percentualPago)} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {resumo.percentualPago.toFixed(1)}% do valor da ação
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Notas fiscais vinculadas</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/auditoria-notas">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Auditoria de notas
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={notaColumns}
                  data={resumo.notas}
                  emptyMessage="Nenhuma nota vinculada a esta ação"
                />
              </CardContent>
            </Card>

            {acao?.data_entrada && (
              <p className="text-xs text-muted-foreground">
                Data de entrada:{' '}
                {format(new Date(acao.data_entrada), 'dd/MM/yyyy')}
              </p>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
