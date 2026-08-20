import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BookOpen, Download, FileText, Image, Search, Trash2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable, DataTableColumn } from '@/components/common/DataTable';
import { FormModal } from '@/components/common/FormModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { UploadManualForm } from '@/components/marketing/UploadManualForm';
import { UploadMaterialForm } from '@/components/marketing/UploadMaterialForm';
import { useAuth } from '@/contexts/AuthContext';
import { formatQueryError } from '@/lib/api/formatApiError';
import {
  useMarketingLists,
  useMarketingMutations,
  type Manual,
  type Material,
} from '@/hooks/useMarketing';

const Marketing = () => {
  const { canWrite, canDelete } = useAuth();
  const canMutate = canWrite('marketing');
  const canRemove = canDelete('marketing');

  const {
    manuais,
    materiais,
    searchManuais,
    searchMateriais,
    isLoading,
    isError,
    error,
  } = useMarketingLists();

  const {
    uploadManualMutation,
    uploadMaterialMutation,
    deleteManualMutation,
    deleteMaterialMutation,
    downloadManualFile,
    downloadMaterialFile,
  } = useMarketingMutations();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('manuais');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deleteManualTarget, setDeleteManualTarget] = useState<Manual | null>(null);
  const [deleteMaterialTarget, setDeleteMaterialTarget] = useState<Material | null>(null);

  const filteredManuais = searchQuery ? searchManuais(searchQuery) : manuais;
  const filteredMateriais = searchQuery ? searchMateriais(searchQuery) : materiais;

  const renderActions = (
    item: { id: string; arquivo_nome: string },
    onDownload: () => void,
    onDelete: () => void,
  ) => (
    <div className="flex justify-end gap-1">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        title="Baixar"
        disabled={!item.arquivo_nome}
        onClick={(e) => {
          e.stopPropagation();
          void onDownload();
        }}
      >
        <Download className="h-4 w-4" />
      </Button>
      {canRemove && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          title="Excluir"
          className="text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  const manuaisColumns: DataTableColumn<Manual>[] = [
    { key: 'titulo', label: 'Título' },
    { key: 'versao', label: 'Versão' },
    {
      key: 'arquivo_nome',
      label: 'Arquivo',
      render: (item) => (
        <span className="max-w-[200px] truncate block" title={item.arquivo_nome}>
          {item.arquivo_nome || '—'}
        </span>
      ),
    },
    {
      key: 'publico_alvo',
      label: 'Público-Alvo',
      render: (item) => (
        <Badge variant="outline">{item.publico_alvo ?? '—'}</Badge>
      ),
    },
    {
      key: 'tags',
      label: 'Tags',
      render: (item) => (
        <div className="flex flex-wrap gap-1">
          {item.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {item.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{item.tags.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => {
        const variants = {
          Rascunho: 'secondary',
          Publicado: 'default',
          Arquivado: 'outline',
        } as const;
        return (
          <Badge
            variant={variants[item.status as keyof typeof variants] ?? 'secondary'}
            className={
              item.status === 'Publicado' ? 'bg-success text-success-foreground' : ''
            }
          >
            {item.status}
          </Badge>
        );
      },
    },
    {
      key: 'updatedAt',
      label: 'Atualizado em',
      render: (item) => format(new Date(item.updatedAt), 'dd/MM/yyyy', { locale: ptBR }),
    },
    {
      key: 'acoes',
      label: 'Ações',
      render: (item) =>
        renderActions(
          item,
          () => downloadManualFile(item),
          () => setDeleteManualTarget(item),
        ),
    },
  ];

  const materiaisColumns: DataTableColumn<Material>[] = [
    { key: 'titulo', label: 'Título' },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (item) => <Badge variant="outline">{item.tipo}</Badge>,
    },
    {
      key: 'arquivo_nome',
      label: 'Arquivo',
      render: (item) => (
        <span className="max-w-[200px] truncate block" title={item.arquivo_nome}>
          {item.arquivo_nome || '—'}
        </span>
      ),
    },
    {
      key: 'tags',
      label: 'Tags',
      render: (item) => (
        <div className="flex flex-wrap gap-1">
          {item.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {item.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{item.tags.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    { key: 'campanha', label: 'Campanha', render: (item) => item.campanha ?? '—' },
    {
      key: 'status',
      label: 'Status',
      render: (item) => {
        const variants = {
          Rascunho: 'secondary',
          Aprovado: 'default',
          Publicado: 'default',
          Arquivado: 'outline',
        } as const;
        return (
          <Badge
            variant={variants[item.status as keyof typeof variants] ?? 'secondary'}
            className={
              item.status === 'Publicado'
                ? 'bg-success text-success-foreground'
                : item.status === 'Aprovado'
                  ? 'bg-info text-info-foreground'
                  : ''
            }
          >
            {item.status}
          </Badge>
        );
      },
    },
    {
      key: 'acoes',
      label: 'Ações',
      render: (item) =>
        renderActions(
          item,
          () => downloadMaterialFile(item),
          () => setDeleteMaterialTarget(item),
        ),
    },
  ];

  const stats = [
    {
      title: 'Manuais Publicados',
      value: manuais.filter((m) => m.status === 'Publicado').length,
      icon: BookOpen,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Materiais Ativos',
      value: materiais.filter((m) => m.status === 'Publicado').length,
      icon: Image,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Campanhas',
      value: new Set(materiais.map((m) => m.campanha).filter(Boolean)).size,
      icon: FileText,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
  ];

  return (
    <MainLayout title="Marketing">
      <div className="space-y-6">
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

        {isError && (
          <Alert variant="destructive">
            <AlertDescription>{formatQueryError(error, 'marketing')}</AlertDescription>
          </Alert>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, tags ou campanha..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="manuais">Manuais de Conduta</TabsTrigger>
              <TabsTrigger value="materiais">Materiais de Marketing</TabsTrigger>
            </TabsList>
            {canMutate && (
              <Button onClick={() => setIsUploadOpen(true)}>
                {activeTab === 'manuais' ? 'Adicionar Manual' : 'Adicionar Material'}
              </Button>
            )}
          </div>

          <TabsContent value="manuais" className="space-y-4">
            <DataTable
              columns={manuaisColumns}
              data={filteredManuais}
              isLoading={isLoading}
              emptyMessage="Nenhum manual encontrado"
            />
          </TabsContent>

          <TabsContent value="materiais" className="space-y-4">
            <DataTable
              columns={materiaisColumns}
              data={filteredMateriais}
              isLoading={isLoading}
              emptyMessage="Nenhum material encontrado"
            />
          </TabsContent>
        </Tabs>
      </div>

      <FormModal
        title={activeTab === 'manuais' ? 'Adicionar Manual' : 'Adicionar Material'}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        hideFooter
        size="lg"
      >
        {activeTab === 'manuais' ? (
          <UploadManualForm
            isLoading={uploadManualMutation.isPending}
            onCancel={() => setIsUploadOpen(false)}
            onSubmit={async (input) => {
              await uploadManualMutation.mutateAsync(input);
              setIsUploadOpen(false);
            }}
          />
        ) : (
          <UploadMaterialForm
            isLoading={uploadMaterialMutation.isPending}
            onCancel={() => setIsUploadOpen(false)}
            onSubmit={async (input) => {
              await uploadMaterialMutation.mutateAsync(input);
              setIsUploadOpen(false);
            }}
          />
        )}
      </FormModal>

      <ConfirmDialog
        isOpen={!!deleteManualTarget}
        title="Excluir manual"
        description={`Deseja excluir "${deleteManualTarget?.titulo}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="destructive"
        onCancel={() => setDeleteManualTarget(null)}
        onConfirm={() => {
          if (deleteManualTarget) {
            void deleteManualMutation.mutateAsync(deleteManualTarget.id).then(() => {
              setDeleteManualTarget(null);
            });
          }
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteMaterialTarget}
        title="Excluir material"
        description={`Deseja excluir "${deleteMaterialTarget?.titulo}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="destructive"
        onCancel={() => setDeleteMaterialTarget(null)}
        onConfirm={() => {
          if (deleteMaterialTarget) {
            void deleteMaterialMutation.mutateAsync(deleteMaterialTarget.id).then(() => {
              setDeleteMaterialTarget(null);
            });
          }
        }}
      />
    </MainLayout>
  );
};

export default Marketing;
