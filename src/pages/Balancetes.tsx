import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useBalancetes, type BalanceteFiltros, type BalanceteResultado } from '@/hooks/useBalancetes';
import { useUnidadeAtiva } from '@/contexts/UnidadeContext';
import { getUnidadeApiId } from '@/lib/unidades/apiIds';
import { BalanceteEscrituracaoSection } from '@/components/balancetes/BalanceteEscrituracaoSection';
import { BalanceteAjudaModal } from '@/components/balancetes/BalanceteAjudaModal';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Download, FileText, TrendingUp, DollarSign, AlertTriangle, Loader2, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { BalanceteLinha } from '@/lib/contabilidade/types';

const fmt = (n: number) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Balancetes = () => {
  const { toast } = useToast();
  const { unidadeAtiva, unidadeAtivaId } = useUnidadeAtiva();
  const {
    gerarBalancete,
    contas,
    lancamentos,
    isLoading,
    isError,
    addConta,
    addLancamento,
    refetch,
  } = useBalancetes();

  const [filtros, setFiltros] = useState<BalanceteFiltros>({
    periodo_inicio: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    periodo_fim: format(new Date(), 'yyyy-MM-dd'),
    ocultar_zeradas: true,
  });
  const [visaoSeisColunas, setVisaoSeisColunas] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [resultado, setResultado] = useState<BalanceteResultado | null>(null);
  const [ajudaOpen, setAjudaOpen] = useState(false);

  const unidadeApiId = getUnidadeApiId(unidadeAtivaId) ?? undefined;

  const handleGerarBalancete = async () => {
    if (isLoading) {
      toast({ title: 'Aguarde o carregamento dos dados contábeis' });
      return;
    }
    setGerando(true);
    try {
      const payload: BalanceteFiltros = {
        ...filtros,
        unidade_id: unidadeApiId,
      };
      const res = await gerarBalancete(payload);
      setResultado(res);
      const temLinhas = res.linhas.some(
        (l) => l.debitos !== 0 || l.creditos !== 0 || l.saldo_inicial !== 0 || l.saldo_final !== 0,
      );
      if (!temLinhas) {
        toast({
          title: 'Sem movimentação no período',
          description:
            'Cadastre contas e lançamentos contábeis abaixo ou ajuste o período e filtros.',
        });
      } else {
        toast({
          title: 'Balancete gerado',
          description: `${res.linhas.length} conta(s) listada(s).`,
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Não foi possível gerar o balancete.';
      toast({ title: 'Erro', description: msg, variant: 'destructive' });
      setResultado(null);
    } finally {
      setGerando(false);
    }
  };

  const periodoLabel = `${format(new Date(filtros.periodo_inicio), 'dd/MM/yyyy')} a ${format(new Date(filtros.periodo_fim), 'dd/MM/yyyy')}`;

  const buildExportRows = (linhas: BalanceteLinha[]) => {
    if (visaoSeisColunas) {
      return linhas.map((linha) => [
        linha.conta_codigo,
        linha.conta_nome,
        linha.tipo,
        fmt(linha.colunas.saldoAnteriorDevedor),
        fmt(linha.colunas.saldoAnteriorCredor),
        fmt(linha.colunas.movimentoDevedor),
        fmt(linha.colunas.movimentoCredor),
        fmt(linha.colunas.saldoAtualDevedor),
        fmt(linha.colunas.saldoAtualCredor),
      ]);
    }
    return linhas.map((linha) => [
      linha.conta_codigo,
      linha.conta_nome,
      linha.tipo,
      fmt(linha.saldo_inicial),
      fmt(linha.debitos),
      fmt(linha.creditos),
      fmt(linha.saldo_final),
    ]);
  };

  const exportHead = visaoSeisColunas
    ? [
        'Código',
        'Conta',
        'Tipo',
        'Saldo ant. D',
        'Saldo ant. C',
        'Mov. D',
        'Mov. C',
        'Saldo atual D',
        'Saldo atual C',
      ]
    : ['Código', 'Conta', 'Tipo', 'Saldo Inicial', 'Débitos', 'Créditos', 'Saldo Final'];

  const handleExportarPDF = () => {
    if (!resultado) return;
    const doc = new jsPDF({ orientation: visaoSeisColunas ? 'landscape' : 'portrait' });
    doc.setFontSize(16);
    doc.text('Balancete de Verificação', 14, 15);
    doc.setFontSize(10);
    doc.text(`Período: ${periodoLabel}`, 14, 22);
    if (unidadeAtiva?.nome) doc.text(`Unidade: ${unidadeAtiva.nome}`, 14, 28);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 34);

    autoTable(doc, {
      startY: 40,
      head: [exportHead],
      body: buildExportRows(resultado.linhas),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [57, 38, 130] },
    });

    if (resultado.meta) {
      const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 40;
      doc.text(
        `Totais movimento — Débitos: ${fmt(resultado.meta.totalDebitos)} | Créditos: ${fmt(resultado.meta.totalCreditos)}`,
        14,
        finalY + 8,
      );
    }

    doc.save(`balancete-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast({ title: 'PDF exportado' });
  };

  const handleExportarCSV = () => {
    if (!resultado) return;
    const rows = buildExportRows(resultado.linhas);
    const csvContent = '\uFEFF' + [exportHead, ...rows].map((row) => row.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `balancete-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    toast({ title: 'CSV exportado' });
  };

  const meta = resultado?.meta;
  const linhas = resultado?.linhas ?? [];

  const linhaTotais = meta
    ? {
        conta_codigo: '',
        conta_nome: 'TOTAIS (contas analíticas)',
        tipo: 'Sintética' as const,
        nivel: 0,
        colunas: {
          saldoAnteriorDevedor: meta.totalSaldoAnteriorDevedor,
          saldoAnteriorCredor: meta.totalSaldoAnteriorCredor,
          movimentoDevedor: meta.totalDebitos,
          movimentoCredor: meta.totalCreditos,
          saldoAtualDevedor: meta.totalSaldoAtualDevedor,
          saldoAtualCredor: meta.totalSaldoAtualCredor,
        },
        saldo_inicial: 0,
        debitos: meta.totalDebitos,
        creditos: meta.totalCreditos,
        saldo_final: 0,
        natureza: 'Devedora' as const,
      }
  : null;

  return (
    <MainLayout title="Balancetes Financeiros">
      <div className="space-y-6">
        {isError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar contabilidade</AlertTitle>
            <AlertDescription>
              Verifique permissões e conexão com a API. É possível gerar com dados locais se a flag
              estiver desligada.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle className="text-lg sm:text-xl">Gerar Balancete</CardTitle>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5"
                    aria-label="Ajuda sobre balancetes"
                    onClick={() => setAjudaOpen(true)}
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span>Ajuda</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Ajuda sobre balancetes</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="periodo_inicio">Período Inicial</Label>
                <Input
                  id="periodo_inicio"
                  type="date"
                  value={filtros.periodo_inicio}
                  onChange={(e) => setFiltros({ ...filtros, periodo_inicio: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="periodo_fim">Período Final</Label>
                <Input
                  id="periodo_fim"
                  type="date"
                  value={filtros.periodo_fim}
                  onChange={(e) => setFiltros({ ...filtros, periodo_fim: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="centro_custo">Centro de Custo (opcional)</Label>
                <Input
                  id="centro_custo"
                  placeholder="Filtrar por centro de custo"
                  value={filtros.centro_custo ?? ''}
                  onChange={(e) =>
                    setFiltros({ ...filtros, centro_custo: e.target.value || undefined })
                  }
                />
              </div>
              <div>
                <Label>Unidade</Label>
                <Input
                  readOnly
                  value={unidadeAtiva?.nome ?? '—'}
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  O balancete usa a unidade ativa do menu superior.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="ocultar_zeradas"
                  checked={filtros.ocultar_zeradas ?? false}
                  onCheckedChange={(v) => setFiltros({ ...filtros, ocultar_zeradas: v })}
                />
                <Label htmlFor="ocultar_zeradas" className="font-normal">
                  Ocultar contas sem movimento e saldo zero
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="visao_6"
                  checked={visaoSeisColunas}
                  onCheckedChange={setVisaoSeisColunas}
                />
                <Label htmlFor="visao_6" className="font-normal">
                  Visão contador (6 colunas D/C)
                </Label>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleGerarBalancete} disabled={gerando || isLoading}>
                {gerando || isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Gerar Balancete
              </Button>
              {resultado && (
                <>
                  <Button variant="outline" onClick={handleExportarPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </Button>
                  <Button variant="outline" onClick={handleExportarCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <BalanceteAjudaModal open={ajudaOpen} onOpenChange={setAjudaOpen} />

        <BalanceteEscrituracaoSection
          contas={contas}
          lancamentos={lancamentos}
          addConta={addConta}
          addLancamento={addLancamento}
          onSaved={() => void refetch()}
        />

        {resultado && meta && !meta.equilibrado && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Partidas dobradas desbalanceadas</AlertTitle>
            <AlertDescription>
              Total de débitos ({fmt(meta.totalDebitos)}) difere do total de créditos (
              {fmt(meta.totalCreditos)}) no período. Revise os lançamentos antes do fechamento.
            </AlertDescription>
          </Alert>
        )}

        {resultado && linhas.length === 0 && (
          <Alert>
            <AlertTitle>Nenhuma conta no balancete</AlertTitle>
            <AlertDescription>
              Cadastre o plano de contas e lançamentos na seção acima ou desative &quot;Ocultar
              contas sem movimento&quot;.
            </AlertDescription>
          </Alert>
        )}

        {resultado && meta && linhas.length > 0 && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Movimento — Débitos
                  </CardTitle>
                  <div className="bg-destructive/10 text-destructive p-2 rounded-lg">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-navy">R$ {fmt(meta.totalDebitos)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Movimento — Créditos
                  </CardTitle>
                  <div className="bg-success/10 text-success p-2 rounded-lg">
                    <DollarSign className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-navy">R$ {fmt(meta.totalCreditos)}</div>
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Conferência
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2">
                  <Badge variant={meta.equilibrado ? 'default' : 'destructive'}>
                    {meta.equilibrado ? 'Débitos = Créditos' : 'Desbalanceado'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {meta.contasSemMovimento} conta(s) analítica(s) sem movimento no período
                  </span>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Balancete — {periodoLabel}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[640px]">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2">Código</th>
                        <th className="text-left p-2">Conta</th>
                        <th className="text-center p-2">Tipo</th>
                        {visaoSeisColunas ? (
                          <>
                            <th className="text-right p-2">Saldo ant. D</th>
                            <th className="text-right p-2">Saldo ant. C</th>
                            <th className="text-right p-2">Mov. D</th>
                            <th className="text-right p-2">Mov. C</th>
                            <th className="text-right p-2">Saldo atual D</th>
                            <th className="text-right p-2">Saldo atual C</th>
                          </>
                        ) : (
                          <>
                            <th className="text-right p-2">Saldo Inicial</th>
                            <th className="text-right p-2">Débitos</th>
                            <th className="text-right p-2">Créditos</th>
                            <th className="text-right p-2">Saldo Final</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {linhas.map((linha) => (
                        <tr key={linha.conta_codigo} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-mono text-xs">{linha.conta_codigo}</td>
                          <td
                            className={`p-2 ${linha.tipo === 'Sintética' ? 'font-semibold' : ''}`}
                            style={{ paddingLeft: `${(linha.nivel + 1) * 0.75}rem` }}
                          >
                            {linha.conta_nome}
                          </td>
                          <td className="p-2 text-center">
                            <Badge variant={linha.tipo === 'Sintética' ? 'default' : 'secondary'}>
                              {linha.tipo}
                            </Badge>
                          </td>
                          {visaoSeisColunas ? (
                            <>
                              <td className="p-2 text-right font-mono">
                                {fmt(linha.colunas.saldoAnteriorDevedor)}
                              </td>
                              <td className="p-2 text-right font-mono">
                                {fmt(linha.colunas.saldoAnteriorCredor)}
                              </td>
                              <td className="p-2 text-right font-mono text-destructive">
                                {fmt(linha.colunas.movimentoDevedor)}
                              </td>
                              <td className="p-2 text-right font-mono text-success">
                                {fmt(linha.colunas.movimentoCredor)}
                              </td>
                              <td className="p-2 text-right font-mono font-semibold">
                                {fmt(linha.colunas.saldoAtualDevedor)}
                              </td>
                              <td className="p-2 text-right font-mono font-semibold">
                                {fmt(linha.colunas.saldoAtualCredor)}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-2 text-right font-mono">
                                {fmt(linha.saldo_inicial)}
                              </td>
                              <td className="p-2 text-right font-mono text-destructive">
                                {fmt(linha.debitos)}
                              </td>
                              <td className="p-2 text-right font-mono text-success">
                                {fmt(linha.creditos)}
                              </td>
                              <td className="p-2 text-right font-mono font-semibold">
                                {fmt(linha.saldo_final)}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                      {linhaTotais && visaoSeisColunas && (
                        <tr className="border-t-2 bg-muted/80 font-semibold">
                          <td className="p-2" colSpan={3}>
                            {linhaTotais.conta_nome}
                          </td>
                          <td className="p-2 text-right font-mono">
                            {fmt(linhaTotais.colunas.saldoAnteriorDevedor)}
                          </td>
                          <td className="p-2 text-right font-mono">
                            {fmt(linhaTotais.colunas.saldoAnteriorCredor)}
                          </td>
                          <td className="p-2 text-right font-mono">
                            {fmt(linhaTotais.colunas.movimentoDevedor)}
                          </td>
                          <td className="p-2 text-right font-mono">
                            {fmt(linhaTotais.colunas.movimentoCredor)}
                          </td>
                          <td className="p-2 text-right font-mono">
                            {fmt(linhaTotais.colunas.saldoAtualDevedor)}
                          </td>
                          <td className="p-2 text-right font-mono">
                            {fmt(linhaTotais.colunas.saldoAtualCredor)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Balancetes;
