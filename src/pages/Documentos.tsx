import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Download, Trash2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageToolbar } from '@/components/common/PageToolbar';
import { DataTable, DataTableColumn } from '@/components/common/DataTable';
import { FormModal } from '@/components/common/FormModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { featureFlags } from '@/lib/featureFlags';
import { formatQueryError } from '@/lib/api/formatApiError';
import { cn } from '@/lib/utils';
import {
  useBibliotecaArquivos,
  useBibliotecaDocumentosMutations,
  useDocumentoCategorias,
  type BibliotecaArquivoDTO,
  type BibliotecaUploadInput,
  type DocumentoCategoriaDTO,
} from '@/hooks/useBibliotecaDocumentos';
import {
  CategoriaDocumentoForm,
  type CategoriaDocumentoFormData,
} from '@/components/documentos/CategoriaDocumentoForm';
import { UploadDocumentoForm } from '@/components/documentos/UploadDocumentoForm';

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const NIL_UUID = '00000000-0000-0000-0000-000000000000';

function isValidBibliotecaArquivo(a: BibliotecaArquivoDTO): boolean {
  if (!a.id || a.id === NIL_UUID) return false;
  if (!a.nome_arquivo?.trim() && a.tamanho_bytes <= 0) return false;
  return true;
}

function formatUploadedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime()) || d.getFullYear() < 2000) return '—';
  return format(d, 'dd/MM/yyyy HH:mm');
}

const Documentos = () => {
  const { canWrite, canDelete } = useAuth();
  const canMutate = canWrite('documentos');
  const canRemove = canDelete('documentos');

  const [activeTab, setActiveTab] = useState('arquivos');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('all');

  const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteCategoriaOpen, setIsDeleteCategoriaOpen] = useState(false);
  const [isDeleteArquivoOpen, setIsDeleteArquivoOpen] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<DocumentoCategoriaDTO | null>(null);
  const [selectedArquivo, setSelectedArquivo] = useState<BibliotecaArquivoDTO | null>(null);

  const includeInativas = activeTab === 'categorias';
  const {
    data: categorias = [],
    isLoading: catLoading,
    isError: catError,
    error: catErr,
  } = useDocumentoCategorias(includeInativas);

  const categoriaIdFilter =
    categoriaFiltro === 'all' ? undefined : categoriaFiltro;

  const {
    data: arquivosResult,
    isLoading: arqLoading,
    isError: arqError,
    error: arqErr,
  } = useBibliotecaArquivos({
    categoriaId: categoriaIdFilter,
    q: searchQuery,
    pageSize: 200,
  });

  const arquivos = arquivosResult?.items ?? [];

  const {
    createCategoriaMutation,
    updateCategoriaMutation,
    deleteCategoriaMutation,
    uploadMutation,
    deleteArquivoMutation,
    download,
  } = useBibliotecaDocumentosMutations();

  const categoriasAtivas = useMemo(() => categorias.filter((c) => c.ativo), [categorias]);

  const arquivosValidos = useMemo(
    () => arquivos.filter(isValidBibliotecaArquivo),
    [arquivos],
  );

  const filteredArquivos = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return arquivosValidos;
    return arquivosValidos.filter(
      (a) =>
        a.titulo.toLowerCase().includes(q) ||
        a.nome_arquivo.toLowerCase().includes(q) ||
        a.categoria_nome.toLowerCase().includes(q),
    );
  }, [arquivosValidos, searchQuery]);

  const columnsArquivos: DataTableColumn<BibliotecaArquivoDTO>[] = [
    { key: 'titulo', label: 'Título' },
    { key: 'categoria_nome', label: 'Categoria' },
    {
      key: 'nome_arquivo',
      label: 'Arquivo',
      render: (item) => (
        <span className="max-w-[200px] truncate block" title={item.nome_arquivo}>
          {item.nome_arquivo}
        </span>
      ),
    },
    {
      key: 'tamanho_bytes',
      label: 'Tamanho',
      render: (item) => formatBytes(item.tamanho_bytes),
    },
    {
      key: 'uploaded_at',
      label: 'Enviado em',
      render: (item) => formatUploadedAt(item.uploaded_at),
    },
    {
      key: 'uploaded_by_nome',
      label: 'Enviado por',
      render: (item) => item.uploaded_by_nome || '—',
    },
    {
      key: 'acoes',
      label: 'Ações',
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            title="Baixar"
            onClick={(e) => {
              e.stopPropagation();
              void download(item);
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
              onClick={(e) => {
                e.stopPropagation();
                setSelectedArquivo(item);
                setIsDeleteArquivoOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const columnsCategorias: DataTableColumn<DocumentoCategoriaDTO>[] = [
    { key: 'nome', label: 'Nome' },
    {
      key: 'descricao',
      label: 'Descrição',
      render: (item) => item.descricao || '—',
    },
    { key: 'ordem', label: 'Ordem' },
    {
      key: 'ativo',
      label: 'Status',
      render: (item) => (
        <Badge variant={item.ativo ? 'default' : 'secondary'}>
          {item.ativo ? 'Ativa' : 'Inativa'}
        </Badge>
      ),
    },
  ];

  const handleCategoriaSubmit = async (data: CategoriaDocumentoFormData) => {
    const payload = {
      nome: data.nome,
      descricao: data.descricao,
      ordem: data.ordem,
      ativo: data.ativo,
    };
    if (selectedCategoria) {
      await updateCategoriaMutation.mutateAsync({ id: selectedCategoria.id, payload });
    } else {
      await createCategoriaMutation.mutateAsync(payload);
    }
    setIsCategoriaModalOpen(false);
    setSelectedCategoria(null);
  };

  const handleUpload = async (input: BibliotecaUploadInput) => {
    await uploadMutation.mutateAsync(input);
    setIsUploadModalOpen(false);
  };

  const confirmDeleteCategoria = async () => {
    if (!selectedCategoria) return;
    await deleteCategoriaMutation.mutateAsync(selectedCategoria.id);
    setIsDeleteCategoriaOpen(false);
    setSelectedCategoria(null);
    if (categoriaFiltro === selectedCategoria.id) setCategoriaFiltro('all');
  };

  const confirmDeleteArquivo = async () => {
    if (!selectedArquivo) return;
    await deleteArquivoMutation.mutateAsync(selectedArquivo.id);
    setIsDeleteArquivoOpen(false);
    setSelectedArquivo(null);
  };

  if (!featureFlags.documentosApiEnabled) {
    return (
      <MainLayout title="Documentos">
        <Alert>
          <AlertDescription>
            Integração com a API de documentos desabilitada. Defina VITE_API_DOCUMENTOS=true.
          </AlertDescription>
        </Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Documentos">
      <div className="space-y-4">
        <PageToolbar
          onSearch={activeTab === 'arquivos' ? setSearchQuery : undefined}
          onAdd={
            canMutate
              ? () => {
                  if (activeTab === 'categorias') {
                    setSelectedCategoria(null);
                    setIsCategoriaModalOpen(true);
                  } else {
                    setIsUploadModalOpen(true);
                  }
                }
              : undefined
          }
          addButtonText={activeTab === 'categorias' ? 'Nova categoria' : 'Enviar documento'}
        />

        {(catError || arqError) && (
          <Alert variant="destructive">
            <AlertDescription>
              {formatQueryError(catError ? catErr : arqErr, 'documentos')}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
          </TabsList>

          <TabsContent value="arquivos" className="space-y-4 mt-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <Card className="md:w-60 shrink-0 hidden md:block">
                <CardContent className="p-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground px-2 py-1">Categorias</p>
                  <button
                    type="button"
                    className={cn(
                      'w-full text-left rounded-md px-2 py-2 text-sm hover:bg-muted',
                      categoriaFiltro === 'all' && 'bg-muted font-medium',
                    )}
                    onClick={() => setCategoriaFiltro('all')}
                  >
                    Todas
                  </button>
                  {categoriasAtivas.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={cn(
                        'w-full text-left rounded-md px-2 py-2 text-sm hover:bg-muted truncate',
                        categoriaFiltro === c.id && 'bg-muted font-medium',
                      )}
                      onClick={() => setCategoriaFiltro(c.id)}
                    >
                      {c.nome}
                    </button>
                  ))}
                </CardContent>
              </Card>

              <div className="flex-1 min-w-0 space-y-3">
                <div className="md:hidden">
                  <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categoriasAtivas.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {canMutate && categoriasAtivas.length === 0 && !catLoading && (
                  <Alert>
                    <AlertDescription>
                      Cadastre uma categoria na aba Categorias antes de enviar documentos.
                    </AlertDescription>
                  </Alert>
                )}

                <Card>
                  <CardContent className="pt-6 overflow-x-auto">
                    <DataTable
                      columns={columnsArquivos}
                      data={filteredArquivos}
                      isLoading={arqLoading || catLoading}
                      emptyMessage="Nenhum documento encontrado"
                      getRowId={(item) => item.id}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="categorias" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6 overflow-x-auto">
                <DataTable
                  columns={columnsCategorias}
                  data={categorias}
                  isLoading={catLoading}
                  onEdit={
                    canMutate
                      ? (item) => {
                          setSelectedCategoria(item);
                          setIsCategoriaModalOpen(true);
                        }
                      : undefined
                  }
                  onDelete={
                    canRemove
                      ? (item) => {
                          setSelectedCategoria(item);
                          setIsDeleteCategoriaOpen(true);
                        }
                      : undefined
                  }
                  emptyMessage="Nenhuma categoria cadastrada"
                  getRowId={(item) => item.id}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <FormModal
          title={selectedCategoria ? 'Editar categoria' : 'Nova categoria'}
          isOpen={isCategoriaModalOpen}
          onClose={() => {
            setIsCategoriaModalOpen(false);
            setSelectedCategoria(null);
          }}
          size="lg"
          hideFooter
        >
          <CategoriaDocumentoForm
            initial={selectedCategoria}
            onSubmit={handleCategoriaSubmit}
            onCancel={() => {
              setIsCategoriaModalOpen(false);
              setSelectedCategoria(null);
            }}
            isLoading={createCategoriaMutation.isPending || updateCategoriaMutation.isPending}
          />
        </FormModal>

        <FormModal
          title="Enviar documento"
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          size="lg"
          hideFooter
        >
          <UploadDocumentoForm
            categorias={categorias}
            defaultCategoriaId={categoriaFiltro !== 'all' ? categoriaFiltro : undefined}
            onSubmit={handleUpload}
            onCancel={() => setIsUploadModalOpen(false)}
            isLoading={uploadMutation.isPending}
          />
        </FormModal>

        <ConfirmDialog
          isOpen={isDeleteCategoriaOpen}
          title="Excluir categoria"
          description={`Tem certeza que deseja excluir a categoria "${selectedCategoria?.nome}"? Só é possível excluir categorias sem documentos vinculados.`}
          onConfirm={confirmDeleteCategoria}
          onCancel={() => {
            setIsDeleteCategoriaOpen(false);
            setSelectedCategoria(null);
          }}
          confirmLabel="Excluir"
          variant="destructive"
        />

        <ConfirmDialog
          isOpen={isDeleteArquivoOpen}
          title="Excluir documento"
          description={`Tem certeza que deseja excluir "${selectedArquivo?.titulo}"? O arquivo será marcado como removido.`}
          onConfirm={confirmDeleteArquivo}
          onCancel={() => {
            setIsDeleteArquivoOpen(false);
            setSelectedArquivo(null);
          }}
          confirmLabel="Excluir"
          variant="destructive"
        />
      </div>
    </MainLayout>
  );
};

export default Documentos;
