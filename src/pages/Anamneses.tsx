import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getErrorToastProps } from '@/lib/ui/showErrorToast';
import { useNavigate } from 'react-router-dom';
import { useAnamneses, type Anamnese } from '@/hooks/useAnamneses';
import { FileQuestion, Plus, Shield, AlertCircle } from 'lucide-react';
import { DataTable, DataTableColumn } from '@/components/common/DataTable';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AnamneseFormModal } from '@/components/anamneses/AnamneseFormModal';

const Anamneses = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { anamneses, addAnamnese, updateAnamnese, deleteAnamnese } = useAnamneses();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Anamnese | null>(null);

  const filteredAnamneses = anamneses.filter(
    (anamnese) =>
      anamnese.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      anamnese.especialidade.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: DataTableColumn<typeof anamneses[0]>[] = [
    { key: 'nome', label: 'Nome' },
    {
      key: 'especialidade',
      label: 'Especialidade',
      render: (item) => (
        <Badge
          variant={item.especialidade === 'Básica' ? 'default' : 'secondary'}
          className={
            item.especialidade === 'Básica'
              ? 'bg-primary text-primary-foreground'
              : ''
          }
        >
          {item.especialidade}
        </Badge>
      ),
    },
    { key: 'versao', label: 'Versão' },
    {
      key: 'questionnaire',
      label: 'Questões',
      render: (item) => (
        <Badge variant="outline">{item.questionnaire.length} questões</Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <Badge
          variant={item.status === 'Ativa' ? 'default' : 'secondary'}
          className={
            item.status === 'Ativa'
              ? 'bg-success text-success-foreground'
              : 'bg-muted text-muted-foreground'
          }
        >
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'updatedAt',
      label: 'Atualizado em',
      render: (item) => format(new Date(item.updatedAt), 'dd/MM/yyyy', { locale: ptBR }),
    },
  ];

  const handleDelete = (item: typeof anamneses[0]) => {
    try {
      deleteAnamnese(item.id);
      toast({
        title: 'Sucesso',
        description: 'Anamnese excluída com sucesso',
      });
    } catch (error) {
      toast(getErrorToastProps(error, { action: 'excluir', entity: 'a anamnese' }));
    }
  };

  const stats = [
    {
      title: 'Total de Anamneses',
      value: anamneses.length,
      icon: FileQuestion,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Anamneses Ativas',
      value: anamneses.filter((a) => a.status === 'Ativa').length,
      icon: Shield,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Especialidades',
      value: new Set(anamneses.map((a) => a.especialidade)).size,
      icon: AlertCircle,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
  ];

  return (
    <MainLayout title="Anamneses por Especialidade">
      <div className="space-y-6">
        {/* Info sobre Anamnese Básica */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            A <strong>Anamnese Básica</strong> é aplicada automaticamente a todos os pacientes.
            As anamneses por especialidade são adicionadas conforme o tipo de atendimento.
          </AlertDescription>
        </Alert>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
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
                <div className="text-2xl font-bold text-navy">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Toolbar e Tabela */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Questionários de Anamnese</CardTitle>
                <CardDescription>
                  Gerencie os questionários por especialidade com versionamento
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEditingItem(null);
                  setIsModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Anamnese
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                placeholder="Buscar por nome ou especialidade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <DataTable
              columns={columns}
              data={filteredAnamneses}
              onView={(item) =>
                toast({
                  title: 'Visualizar',
                  description: `Abrindo ${item.nome}`,
                })
              }
              onEdit={(item) => {
                if (item.especialidade === 'Básica') {
                  toast({
                    title: 'Atenção',
                    description: 'A anamnese básica não pode ser editada',
                    variant: 'destructive',
                  });
                } else {
                  setEditingItem(item);
                  setIsModalOpen(true);
                }
              }}
              onDelete={(item) => {
                if (item.especialidade === 'Básica') {
                  toast({
                    title: 'Erro',
                    description: 'A anamnese básica não pode ser excluída',
                    variant: 'destructive',
                  });
                } else {
                  handleDelete(item);
                }
              }}
              emptyMessage="Nenhuma anamnese encontrada"
            />
          </CardContent>
        </Card>

        {/* Documentação */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Como funciona?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>1. Anamnese Básica:</strong> Aplicada automaticamente no início de qualquer
              atendimento.
            </p>
            <p>
              <strong>2. Anamnese por Especialidade:</strong> Adicionada após a básica, conforme a
              especialidade do profissional ou sala.
            </p>
            <p>
              <strong>3. Lógica Condicional:</strong> Perguntas podem aparecer/desaparecer baseado
              nas respostas anteriores.
            </p>
            <p>
              <strong>4. Versionamento:</strong> Novas versões não invalidam respostas antigas,
              mantendo histórico completo.
            </p>
            <p className="text-xs mt-4">
              <strong>Baseado em:</strong> FHIR Questionnaire/QuestionnaireResponse (HL7)
            </p>
          </CardContent>
        </Card>

        <AnamneseFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
          onSave={(data) => {
            if (editingItem) {
              updateAnamnese(editingItem.id, data);
            } else {
              addAnamnese(data);
            }
          }}
          initialData={editingItem}
        />
      </div>
    </MainLayout>
  );
};

export default Anamneses;
