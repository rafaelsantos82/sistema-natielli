import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageToolbar } from '@/components/common/PageToolbar';
import { DataTable, DataTableColumn } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useConsultas, type Consulta, isElegivelPagamento } from '@/hooks/useConsultas';
import { useAuth } from '@/contexts/AuthContext';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useToast } from '@/hooks/use-toast';
import { getErrorToastProps } from '@/lib/ui/showErrorToast';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, FileText } from 'lucide-react';
import { StatusAtendimentoBadge } from '@/components/atendimentos/StatusAtendimentoBadge';

export default function AtendimentosAprovacao() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { log } = useAuditLog();
  const {
    consultas,
    listarParaAprovacao,
    aprovarAtendimento,
    rejeitarAtendimento,
  } = useConsultas();

  const [searchQuery, setSearchQuery] = useState('');
  const [rejectTarget, setRejectTarget] = useState<Consulta | null>(null);
  const [motivo, setMotivo] = useState('');

  const actor = { id: user?.id ?? 'desconhecido', name: user?.name ?? 'Sistema' };

  const filtra = (lista: Consulta[]) =>
    lista.filter(
      (c) =>
        c.pacienteNome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.profissionalNome.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  const pendentes = filtra(listarParaAprovacao());
  const aprovados = filtra(consultas.filter((c) => c.status_atendimento === 'aprovado'));
  const rejeitados = filtra(consultas.filter((c) => c.status_atendimento === 'rejeitado'));
  const aguardando = filtra(
    consultas.filter((c) => c.status_atendimento === 'aguardando_prontuario'),
  );

  const handleAprovar = (consulta: Consulta) => {
    try {
      aprovarAtendimento(consulta.id, actor);
      log({
        actor_id: actor.id,
        actor_name: actor.name,
        actor_role: user?.role ?? 'desconhecido',
        acao: 'atendimento.aprovacao',
        entidade: 'consulta',
        entidade_id: consulta.id,
        diff: { paciente: consulta.pacienteNome, profissional: consulta.profissionalNome },
      });
      toast({
        title: 'Atendimento aprovado',
        description: 'Liberado para o relatório financeiro.',
      });
    } catch (err) {
      toast(getErrorToastProps(err, { action: 'aprovar', entity: 'o atendimento' }));
    }
  };

  const handleRejeitarConfirm = () => {
    if (!rejectTarget) return;
    try {
      rejeitarAtendimento(rejectTarget.id, motivo, actor);
      log({
        actor_id: actor.id,
        actor_name: actor.name,
        actor_role: user?.role ?? 'desconhecido',
        acao: 'atendimento.rejeicao',
        entidade: 'consulta',
        entidade_id: rejectTarget.id,
        diff: { motivo },
      });
      toast({ title: 'Atendimento rejeitado', description: motivo });
      setRejectTarget(null);
      setMotivo('');
    } catch (err) {
      toast(getErrorToastProps(err, { action: 'rejeitar', entity: 'o atendimento' }));
    }
  };

  const colunasPendentes: DataTableColumn<Consulta>[] = [
    { key: 'pacienteNome', label: 'Paciente' },
    { key: 'profissionalNome', label: 'Profissional' },
    {
      key: 'dataHora',
      label: 'Atendimento',
      render: (c) => format(new Date(c.dataHora), 'dd/MM/yyyy HH:mm'),
    },
    {
      key: 'status_atendimento',
      label: 'Status',
      render: (c) => <StatusAtendimentoBadge status={c.status_atendimento} />,
    },
    {
      key: 'acoes',
      label: 'Ações',
      render: (c) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/prontuario/${c.id}`);
            }}
          >
            <FileText className="h-4 w-4 mr-1" />
            Prontuário
          </Button>
          <Button
            size="sm"
            className="bg-success text-success-foreground hover:bg-success/90"
            onClick={(e) => {
              e.stopPropagation();
              handleAprovar(c);
            }}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Aprovar
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              setRejectTarget(c);
            }}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Rejeitar
          </Button>
        </div>
      ),
    },
  ];

  const colunasGenericas: DataTableColumn<Consulta>[] = [
    { key: 'pacienteNome', label: 'Paciente' },
    { key: 'profissionalNome', label: 'Profissional' },
    {
      key: 'dataHora',
      label: 'Atendimento',
      render: (c) => format(new Date(c.dataHora), 'dd/MM/yyyy HH:mm'),
    },
    {
      key: 'status_atendimento',
      label: 'Status',
      render: (c) => <StatusAtendimentoBadge status={c.status_atendimento} />,
    },
    {
      key: 'detalhe',
      label: 'Detalhe',
      render: (c) =>
        c.status_atendimento === 'rejeitado'
          ? c.motivo_rejeicao ?? '—'
          : c.aprovado_em
          ? `por ${c.aprovado_por} em ${format(new Date(c.aprovado_em), 'dd/MM/yyyy HH:mm')}`
          : '—',
    },
  ];

  const colunasAguardando: DataTableColumn<Consulta>[] = [
    ...colunasGenericas.slice(0, 3),
    {
      key: 'acoes',
      label: 'Prontuário',
      render: (c) => (
        <Button size="sm" variant="outline" onClick={() => navigate(`/prontuario/${c.id}`)}>
          <FileText className="h-4 w-4 mr-1" />
          Abrir
        </Button>
      ),
    },
  ];

  const totalElegivel = consultas.filter(isElegivelPagamento).length;

  return (
    <MainLayout title="Aprovação de Atendimentos">
      <div className="space-y-4">
        <PageToolbar
          onBack={() => navigate(-1)}
          onSearch={setSearchQuery}
          showAdd={false}
        />

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{pendentes.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Aguardando prontuário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{aguardando.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Elegíveis pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success">{totalElegivel}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Rejeitados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">{rejeitados.length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pendentes">
          <TabsList>
            <TabsTrigger value="pendentes">Aprovação ({pendentes.length})</TabsTrigger>
            <TabsTrigger value="aguardando">
              Aguardando prontuário ({aguardando.length})
            </TabsTrigger>
            <TabsTrigger value="aprovados">Aprovados ({aprovados.length})</TabsTrigger>
            <TabsTrigger value="rejeitados">Rejeitados ({rejeitados.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pendentes">
            <DataTable
              columns={colunasPendentes}
              data={pendentes}
              emptyMessage="Nenhum atendimento aguardando aprovação"
              getRowId={(c) => c.id}
            />
          </TabsContent>
          <TabsContent value="aguardando">
            <DataTable
              columns={colunasAguardando}
              data={aguardando}
              emptyMessage="Nenhum atendimento aguardando prontuário"
              getRowId={(c) => c.id}
            />
          </TabsContent>
          <TabsContent value="aprovados">
            <DataTable
              columns={colunasGenericas}
              data={aprovados}
              emptyMessage="Nenhum atendimento aprovado"
              getRowId={(c) => c.id}
            />
          </TabsContent>
          <TabsContent value="rejeitados">
            <DataTable
              columns={colunasGenericas}
              data={rejeitados}
              emptyMessage="Nenhum atendimento rejeitado"
              getRowId={(c) => c.id}
            />
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar atendimento</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o motivo da rejeição. Esta ação fica registrada no log de auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo *</Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: prontuário incompleto, dados divergentes…"
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setRejectTarget(null);
                setMotivo('');
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!motivo.trim()}
              onClick={handleRejeitarConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar rejeição
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
