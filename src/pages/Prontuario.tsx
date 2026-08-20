import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProntuario } from '@/hooks/useProntuario';
import { useConsultas } from '@/hooks/useConsultas';
import { EvolucaoForm } from '@/components/prontuario/EvolucaoForm';
// Prescrições desabilitado — não usado no MVP; reativar descomentando os blocos abaixo.
// import { PrescricaoForm } from '@/components/prontuario/PrescricaoForm';
// Atestados desabilitado — não usado no MVP; reativar descomentando os blocos abaixo.
// import { AtestadoForm } from '@/components/prontuario/AtestadoForm';
import { FormModal } from '@/components/common/FormModal';
import { AssinarDocumentoDialog } from '@/components/signature/AssinarDocumentoDialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { FileText, Upload, Download, Trash2, ArrowLeft, Shield } from 'lucide-react';
// import { Pill, FileCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { generateProntuarioPDF } from '@/lib/utils/pdfGenerator';
// import { generateAtestadoPDF } from '@/lib/utils/pdfGenerator';
import { Separator } from '@/components/ui/separator';

export default function Prontuario() {
  const { consultaId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('evolucoes');
  const [modalType, setModalType] = useState<'evolucao' | 'prescricao' | 'atestado' | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [pdfToSign, setPdfToSign] = useState<Uint8Array | null>(null);
  const [currentDocType, setCurrentDocType] = useState<'prontuario' | 'prescricao' | 'atestado'>('prontuario');

  const {
    getProntuario,
    useProntuarioQuery,
    initProntuario,
    addEvolucao,
    // addPrescricao,
    // addAtestado,
    deleteEvolucao,
    // deletePrescricao,
    // deleteAtestado,
    addDocumento,
    deleteDocumento,
  } = useProntuario();

  const { consultas, vincularProntuario } = useConsultas();
  const consulta = consultas.find((c) => c.id === consultaId);

  useProntuarioQuery(consulta?.pacienteId, consulta?.pacienteNome);

  if (!consulta) {
    return (
      <MainLayout title="Prontuário">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-muted-foreground mb-4">Consulta não encontrada</p>
          <Button onClick={() => navigate('/consultas')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Consultas
          </Button>
        </div>
      </MainLayout>
    );
  }

  const prontuario =
    getProntuario(consulta.pacienteId) ||
    initProntuario(consulta.pacienteId, consulta.pacienteNome) || {
      pacienteId: consulta.pacienteId,
      pacienteNome: consulta.pacienteNome,
      evolucoes: [],
      prescricoes: [],
      atestados: [],
      documentos: [],
    };

  const handleEvolucaoSubmit = async (data: any) => {
    const created = await addEvolucao(
      consulta.pacienteId,
      {
        consultaId: consulta.id,
        data: new Date().toISOString(),
        ...data,
      } as any,
      consulta.pacienteNome,
    );
    if (created?.id) {
      await vincularProntuario(consulta.id, created.id);
    }
    toast({
      title: 'Evolução registrada',
      description: 'Atendimento liberado para aprovação da clínica.',
    });
    setModalType(null);
  };

  // const handlePrescricaoSubmit = (data: any) => {
  //   addPrescricao(consulta.pacienteId, {
  //     consultaId: consulta.id,
  //     data: new Date().toISOString(),
  //     ...data,
  //   });
  //   toast({ title: 'Sucesso', description: 'Prescrição adicionada com sucesso' });
  //   setModalType(null);
  // };

  // const handleAtestadoSubmit = (data: any) => {
  //   addAtestado(consulta.pacienteId, {
  //     consultaId: consulta.id,
  //     data: new Date().toISOString(),
  //     ...data,
  //   });
  //
  //   const pdf = generateAtestadoPDF({
  //     pacienteNome: consulta.pacienteNome,
  //     profissionalNome: consulta.profissionalNome,
  //     profissionalCRM: '',
  //     ...data,
  //   });
  //   pdf.save(`atestado_${consulta.pacienteNome}_${format(new Date(), 'ddMMyyyy')}.pdf`);
  //
  //   toast({ title: 'Sucesso', description: 'Atestado gerado e salvo' });
  //   setModalType(null);
  // };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, upload to storage service
      addDocumento(consulta.pacienteId, {
        consultaId: consulta.id,
        nome: file.name,
        tipo: file.type,
        tamanho: file.size,
        dataUpload: new Date().toISOString(),
        url: URL.createObjectURL(file),
      });
      toast({ title: 'Sucesso', description: 'Documento anexado' });
    }
  };

  const handleExportPDF = () => {
    const pdf = generateProntuarioPDF(prontuario);
    const pdfBytes = new Uint8Array(pdf.output('arraybuffer'));
    setPdfToSign(pdfBytes);
    setCurrentDocType('prontuario');
    setShowSignatureModal(true);
  };

  const handleSignatureComplete = () => {
    toast({ title: 'Sucesso', description: 'Prontuário assinado e salvo no repositório' });
  };

  return (
    <MainLayout title={`Prontuário - ${consulta.pacienteNome}`}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => navigate('/consultas')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button variant="outline" onClick={() => navigate('/documentos-assinados')}>
              <Shield className="h-4 w-4 mr-2" />
              Documentos Assinados
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Informações da Consulta</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  {format(new Date(consulta.dataHora), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
              <Badge>{consulta.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Profissional</p>
                <p className="font-medium">{consulta.profissionalNome}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Motivo</p>
                <p className="font-medium">{consulta.motivo}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="evolucoes">
              <FileText className="h-4 w-4 mr-2" />
              Evoluções
            </TabsTrigger>
            {/* Prescrições desabilitado — não usado no MVP
            <TabsTrigger value="prescricoes">
              <Pill className="h-4 w-4 mr-2" />
              Prescrições
            </TabsTrigger>
            */}
            {/* Atestados desabilitado — não usado no MVP
            <TabsTrigger value="atestados">
              <FileCheck className="h-4 w-4 mr-2" />
              Atestados
            </TabsTrigger>
            */}
            <TabsTrigger value="documentos">
              <Upload className="h-4 w-4 mr-2" />
              Documentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="evolucoes" className="space-y-4">
            <Button onClick={() => setModalType('evolucao')}>
              <FileText className="h-4 w-4 mr-2" />
              Nova Evolução
            </Button>

            {prontuario.evolucoes.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    Nenhuma evolução registrada
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {prontuario.evolucoes.map((evolucao) => (
                  <Card key={evolucao.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">
                          {format(new Date(evolucao.data), 'dd/MM/yyyy HH:mm')}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEvolucao(consulta.pacienteId, evolucao.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Queixa Principal</p>
                        <p className="text-sm text-muted-foreground">{evolucao.queixaPrincipal}</p>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium">História da Doença</p>
                        <p className="text-sm text-muted-foreground">{evolucao.historiaDoenca}</p>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium">Exame Físico</p>
                        <p className="text-sm text-muted-foreground">{evolucao.exameFisico}</p>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium">Hipótese Diagnóstica</p>
                        <p className="text-sm text-muted-foreground">{evolucao.hipoteseDiagnostica}</p>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium">Conduta</p>
                        <p className="text-sm text-muted-foreground">{evolucao.conduta}</p>
                      </div>
                      {evolucao.observacoes && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-sm font-medium">Observações</p>
                            <p className="text-sm text-muted-foreground">{evolucao.observacoes}</p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Prescrições desabilitado — não usado no MVP
          <TabsContent value="prescricoes" className="space-y-4">
            <Button onClick={() => setModalType('prescricao')}>
              <Pill className="h-4 w-4 mr-2" />
              Nova Prescrição
            </Button>

            {prontuario.prescricoes.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    Nenhuma prescrição registrada
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {prontuario.prescricoes.map((prescricao) => (
                  <Card key={prescricao.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{prescricao.medicamento}</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePrescricao(consulta.pacienteId, prescricao.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(prescricao.data), 'dd/MM/yyyy')}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Dosagem</p>
                          <p className="font-medium">{prescricao.dosagem}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Frequência</p>
                          <p className="font-medium">{prescricao.frequencia}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Duração</p>
                          <p className="font-medium">{prescricao.duracao}</p>
                        </div>
                      </div>
                      {prescricao.orientacoes && (
                        <div className="mt-3">
                          <p className="text-sm font-medium">Orientações</p>
                          <p className="text-sm text-muted-foreground">{prescricao.orientacoes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          */}

          {/* Atestados desabilitado — não usado no MVP
          <TabsContent value="atestados" className="space-y-4">
            <Button onClick={() => setModalType('atestado')}>
              <FileCheck className="h-4 w-4 mr-2" />
              Novo Atestado
            </Button>

            {prontuario.atestados.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    Nenhum atestado emitido
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {prontuario.atestados.map((atestado) => (
                  <Card key={atestado.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">CID: {atestado.cid}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(atestado.data), 'dd/MM/yyyy')}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAtestado(consulta.pacienteId, atestado.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Dias de Afastamento</p>
                          <p className="font-medium">{atestado.diasAfastamento} dia(s)</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Início</p>
                          <p className="font-medium">
                            {format(new Date(atestado.dataInicio), 'dd/MM/yyyy')}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Fim</p>
                          <p className="font-medium">
                            {format(new Date(atestado.dataFim), 'dd/MM/yyyy')}
                          </p>
                        </div>
                      </div>
                      {atestado.observacoes && (
                        <div className="mt-3">
                          <p className="text-sm font-medium">Observações</p>
                          <p className="text-sm text-muted-foreground">{atestado.observacoes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          */}

          <TabsContent value="documentos" className="space-y-4">
            <div>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button onClick={() => document.getElementById('file-upload')?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Anexar Documento
              </Button>
            </div>

            {prontuario.documentos.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    Nenhum documento anexado
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {prontuario.documentos.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{doc.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {(doc.tamanho / 1024).toFixed(2)} KB - {format(new Date(doc.dataUpload), 'dd/MM/yyyy HH:mm')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(doc.url, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDocumento(consulta.pacienteId, doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <FormModal
          title="Nova Evolução"
          isOpen={modalType === 'evolucao'}
          onClose={() => setModalType(null)}
          size="4xl"
          hideFooter
        >
          <EvolucaoForm
            onSubmit={handleEvolucaoSubmit}
            onCancel={() => setModalType(null)}
            draftScopeId={`evolucao:${consulta.id}`}
          />
        
        </FormModal>

        {/* Prescrições desabilitado — não usado no MVP
        <FormModal
          title="Nova Prescrição"
          isOpen={modalType === 'prescricao'}
          onClose={() => setModalType(null)}
          size="2xl"
        >
          <PrescricaoForm onSubmit={handlePrescricaoSubmit} onCancel={() => setModalType(null)} />
        </FormModal>
        */}

        {/* Atestados desabilitado — não usado no MVP
        <FormModal
          title="Novo Atestado"
          isOpen={modalType === 'atestado'}
          onClose={() => setModalType(null)}
          size="2xl"
        >
          <AtestadoForm onSubmit={handleAtestadoSubmit} onCancel={() => setModalType(null)} />
        </FormModal>
        */}

        {pdfToSign && (
          <AssinarDocumentoDialog
            isOpen={showSignatureModal}
            onClose={() => {
              setShowSignatureModal(false);
              setPdfToSign(null);
            }}
            documentBytes={pdfToSign}
            documentName={`${currentDocType}_${consulta?.pacienteNome}`}
            documentType={currentDocType}
            onSignatureComplete={handleSignatureComplete}
          />
        )}
      </div>
    </MainLayout>
  );
}
