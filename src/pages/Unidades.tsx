import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageToolbar } from '@/components/common/PageToolbar';
import { DataTable, DataTableColumn } from '@/components/common/DataTable';
import { FormModal } from '@/components/common/FormModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUnidadeAtiva } from '@/contexts/UnidadeContext';
import { useUnidades, type Unidade } from '@/hooks/useUnidades';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const unidadeSchema = z.object({
  nome: z.string().min(2, 'Informe o nome'),
  status: z.enum(['ativa', 'inativa']),
  endereco: z.string().optional(),
  telefone: z.string().optional(),
});

type UnidadeFormData = z.infer<typeof unidadeSchema>;

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

const Unidades = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { refresh } = useUnidadeAtiva();
  const { list, create, update, softDelete } = useUnidades();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Unidade | null>(null);

  const podeEditar = user?.role === 'admin' || user?.role === 'gestor';

  const form = useForm<UnidadeFormData>({
    resolver: zodResolver(unidadeSchema),
    defaultValues: { nome: '', status: 'ativa', endereco: '', telefone: '' },
  });

  const dados = list().filter((u) =>
    u.nome.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: DataTableColumn<Unidade>[] = [
    { key: 'nome', label: 'Nome' },
    { key: 'slug', label: 'Slug' },
    {
      key: 'status',
      label: 'Status',
      render: (u) => (
        <Badge variant={u.status === 'ativa' ? 'default' : 'secondary'}>
          {u.status === 'ativa' ? 'Ativa' : 'Inativa'}
        </Badge>
      ),
    },
    { key: 'endereco', label: 'Endereço', render: (u) => u.endereco || '—' },
    { key: 'telefone', label: 'Telefone', render: (u) => u.telefone || '—' },
  ];

  const handleAdd = () => {
    setSelected(null);
    form.reset({ nome: '', status: 'ativa', endereco: '', telefone: '' });
    setOpen(true);
  };

  const handleEdit = (u: Unidade) => {
    setSelected(u);
    form.reset({
      nome: u.nome,
      status: u.status,
      endereco: u.endereco ?? '',
      telefone: u.telefone ?? '',
    });
    setOpen(true);
  };

  const handleDelete = (u: Unidade) => {
    softDelete(u.id);
    refresh();
    toast({ title: 'Unidade desativada', description: u.nome });
  };

  const onSubmit = (data: UnidadeFormData) => {
    if (selected) {
      update(selected.id, { ...data, slug: slugify(data.nome) });
      toast({ title: 'Unidade atualizada', description: data.nome });
    } else {
      create({
        nome: data.nome,
        status: data.status,
        endereco: data.endereco,
        telefone: data.telefone,
        slug: slugify(data.nome),
      });
      toast({ title: 'Unidade criada', description: data.nome });
    }
    refresh();
    setOpen(false);
    setSelected(null);
  };

  return (
    <MainLayout title="Unidades">
      <div className="space-y-4">
        <PageToolbar
          onBack={() => navigate(-1)}
          onAdd={podeEditar ? handleAdd : undefined}
          onSearch={setSearch}
          addButtonText="Nova Unidade"
        />

        <DataTable
          columns={columns}
          data={dados}
          onEdit={podeEditar ? handleEdit : undefined}
          onDelete={podeEditar ? handleDelete : undefined}
          emptyMessage="Nenhuma unidade cadastrada"
        />

        <FormModal
          title={selected ? 'Editar Unidade' : 'Nova Unidade'}
          isOpen={open}
          onClose={() => {
            setOpen(false);
            setSelected(null);
          }}
        >
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" {...form.register('nome')} />
              {form.formState.errors.nome && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.nome.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={form.watch('status')}
                onValueChange={(v) => form.setValue('status', v as 'ativa' | 'inativa')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="inativa">Inativa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input id="endereco" {...form.register('endereco')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" {...form.register('telefone')} />
            </div>

            <div className="flex justify-end">
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </FormModal>
      </div>
    </MainLayout>
  );
};

export default Unidades;
