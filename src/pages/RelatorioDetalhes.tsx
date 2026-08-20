import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Download,
  Printer,
  FileText,
  Upload,
  Trash2,
  CheckCircle2,
  XCircle,
  PenTool,
} from 'lucide-react';
import { format } from 'date-fns';
import { useRelatoriosOperacionais } from '@/hooks/useRelatoriosOperacionais';
import type { Relatorio } from './Relatorios';

const RelatorioDetalhes = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { getById, updateRelatorio } = useRelatoriosOperacionais();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [anexos, setAnexos] = useState<Array<{ id: string; nome: string; tamanho: number; data: string }>>([]);

  const relatorio: Relatorio | null = id ? getById(id) ?? null : null;

  if (!relatorio) {
    return (
      <MainLayout title="Relatório Não Encontrado">
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-muted-foreground mb-4">Relatório não encontrado</p>
          <Button onClick={() => navigate('/relatorios')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Relatórios
          </Button>
        </div>
      </MainLayout>
    );
  }

  const handlePrint = () => {
    window.print();
    toast({
      title: 'Impressão iniciada',
      description: 'Preparando documento para impressão',
    });
  };

  const handleDownloadPDF = () => {
    // Simulação de download PDF
    toast({
      title: 'Download iniciado',
      description: 'O PDF está sendo gerado',
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAnexos = Array.from(files).map((file) => ({
      id: Date.now().toString() + Math.random(),
      nome: file.name,
      tamanho: file.size,
      data: new Date().toISOString(),
    }));

    setAnexos([...anexos, ...newAnexos]);
    toast({
      title: 'Anexos adicionados',
      description: `${files.length} arquivo(s) anexado(s) com sucesso`,
    });
    e.target.value = '';
  };

  const handleRemoveAnexo = (id: string) => {
    setAnexos(anexos.filter((a) => a.id !== id));
    toast({
      title: 'Anexo removido',
      description: 'Arquivo removido com sucesso',
    });
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
  };

  const handleApproveWithSignature = async () => {
    if (!signature) {
      toast({
        title: 'Assinatura obrigatória',
        description: 'É necessário assinar para aprovar o relatório',
        variant: 'destructive',
      });
      return;
    }

    await updateRelatorio(relatorio.id, {
      status: 'aprovado',
      dataAprovacao: new Date().toISOString().split('T')[0],
      aprovadoPor: 'Gestor Sistema',
    });

    toast({
      title: 'Relatório aprovado',
      description: 'Relatório aprovado com assinatura digital',
    });
    navigate('/relatorios');
  };

  const getStatusBadge = (status: Relatorio['status']) => {
    const variants = {
      rascunho: { className: 'bg-muted', label: 'Rascunho' },
      aguardando_aprovacao: { className: 'bg-warning text-warning-foreground', label: 'Aguardando Aprovação' },
      aprovado: { className: 'bg-success text-success-foreground', label: 'Aprovado' },
      rejeitado: { className: 'bg-destructive text-destructive-foreground', label: 'Rejeitado' },
      integrado: { className: 'bg-primary text-primary-foreground', label: 'Integrado' },
    };

    const config = variants[status];
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <MainLayout title="Detalhes do Relatório">
      <div className="space-y-6 print:space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between print:hidden">
          <Button variant="outline" onClick={() => navigate('/relatorios')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Cabeçalho do Relatório */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{relatorio.numero}</CardTitle>
                <p className="text-muted-foreground">
                  Data de Submissão: {relatorio.dataSubmissao ? format(new Date(relatorio.dataSubmissao), 'dd/MM/yyyy') : '-'}
                </p>
              </div>
              {getStatusBadge(relatorio.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Paciente</Label>
                <p className="font-medium">{relatorio.paciente}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Profissional</Label>
                <p className="font-medium">{relatorio.profissional}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Terapia</Label>
                <p className="font-medium">{relatorio.terapia}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Período</Label>
                <p className="font-medium">{relatorio.periodo}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Valor</Label>
                <p className="font-medium text-lg">R$ {relatorio.valor.toFixed(2)}</p>
              </div>
              {relatorio.dataAprovacao && (
                <div>
                  <Label className="text-muted-foreground">Data de Aprovação</Label>
                  <p className="font-medium">{format(new Date(relatorio.dataAprovacao), 'dd/MM/yyyy')}</p>
                </div>
              )}
            </div>

            {relatorio.observacoes && (
              <>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">Observações</Label>
                  <p className="mt-2">{relatorio.observacoes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Histórico de Versões */}
        {relatorio.historicoVersoes && relatorio.historicoVersoes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Histórico de Versões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {relatorio.historicoVersoes.map((versao, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-3 bg-muted rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">v{versao.versao}</Badge>
                        <span className="text-sm font-medium">{versao.status}</span>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(versao.data), 'dd/MM/yyyy')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {versao.alteradoPor}: {versao.observacao}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Anexos */}
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Anexos
              </div>
              <Label htmlFor="file-upload" className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Adicionar Anexo
                  </span>
                </Button>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </Label>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {anexos.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhum anexo adicionado
              </p>
            ) : (
              <div className="space-y-2">
                {anexos.map((anexo) => (
                  <div
                    key={anexo.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{anexo.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {(anexo.tamanho / 1024).toFixed(2)} KB -{' '}
                          {format(new Date(anexo.data), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAnexo(anexo.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assinatura Digital */}
        {relatorio.status === 'aguardando_aprovacao' && (
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="h-5 w-5" />
                Assinatura Digital do Gestor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 bg-background">
                <Label className="mb-2 block">Assine no espaço abaixo:</Label>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  className="border border-dashed rounded-md cursor-crosshair bg-white w-full"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSignature}
                  >
                    Limpar
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleApproveWithSignature}
                  className="bg-success text-success-foreground hover:bg-success/90"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Aprovar com Assinatura
                </Button>
                <Button variant="destructive">
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assinatura Existente */}
        {signature && relatorio.status === 'aprovado' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Assinatura Digital
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-muted">
                <img src={signature} alt="Assinatura" className="max-w-full" />
                <p className="text-sm text-muted-foreground mt-2">
                  Aprovado por: {relatorio.aprovadoPor} em{' '}
                  {relatorio.dataAprovacao ? format(new Date(relatorio.dataAprovacao), 'dd/MM/yyyy') : '-'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default RelatorioDetalhes;
