import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useUnidades } from '@/hooks/useUnidades';
import { usePacientesOptions } from '@/hooks/usePacientes';
import { useQuery } from '@tanstack/react-query';
import { listProfissionais } from '@/lib/api/profissionais';
import type { UserDTO } from '@/lib/api/types';

const usuarioObjectSchema = z.object({
  name: z.string().min(2, 'Informe o nome'),
  email: z.string().email('E-mail inválido'),
  role: z.enum(['admin', 'gestor', 'funcionario', 'terceiro', 'terapeuta', 'responsavel']),
  paciente_id: z.string().optional(),
  profissional_id: z.string().optional(),
  password: z.string().optional(),
  unidade_ids: z.array(z.string()).optional(),
});

const linkageRefine = (data: z.infer<typeof usuarioObjectSchema>, ctx: z.RefinementCtx) => {
  if (data.role === 'responsavel' && !data.paciente_id?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selecione o paciente vinculado ao responsável',
      path: ['paciente_id'],
    });
  }
  if (data.role === 'terapeuta' && !data.profissional_id?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selecione o profissional vinculado ao terapeuta',
      path: ['profissional_id'],
    });
  }
};

const baseSchema = usuarioObjectSchema.superRefine(linkageRefine);

export type UsuarioFormData = z.infer<typeof baseSchema>;

const createSchema = usuarioObjectSchema
  .extend({
    password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  })
  .superRefine(linkageRefine);

interface UsuarioFormProps {
  mode: 'create' | 'edit';
  initial?: UserDTO | null;
  onSubmit: (data: UsuarioFormData) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function UsuarioForm({ mode, initial, onSubmit, isSubmitting }: UsuarioFormProps) {
  const { unidades: unidadesFromHook } = useUnidades();
  const unidades = unidadesFromHook.filter((u) => u.status === 'ativa' && !u.deleted_at);
  const { options: pacienteOptions, isLoading: pacientesLoading, isError: pacientesError } =
    usePacientesOptions();
  const profissionaisQuery = useQuery({
    queryKey: ['profissionais', 'options-usuario'],
    queryFn: () => listProfissionais({ limit: 500 }),
  });
  const profissionalOptions = profissionaisQuery.data?.items ?? [];

  const form = useForm<UsuarioFormData>({
    resolver: zodResolver(mode === 'create' ? createSchema : baseSchema),
    defaultValues: {
      name: initial?.name ?? '',
      email: initial?.email ?? '',
      role: (initial?.role as UsuarioFormData['role']) ?? 'funcionario',
      paciente_id: initial?.paciente_id ?? '',
      profissional_id: initial?.profissional_id ?? '',
      password: '',
      unidade_ids: initial?.unidade_ids ?? [],
    },
  });

  const selectedUnidades = form.watch('unidade_ids') ?? [];
  const role = form.watch('role');

  useEffect(() => {
    if (role !== 'responsavel') {
      form.setValue('paciente_id', '');
    }
    if (role !== 'terapeuta') {
      form.setValue('profissional_id', '');
    }
  }, [role, form]);

  const toggleUnidade = (id: string, checked: boolean) => {
    const current = form.getValues('unidade_ids') ?? [];
    if (checked) {
      form.setValue('unidade_ids', [...current, id]);
    } else {
      form.setValue(
        'unidade_ids',
        current.filter((x) => x !== id),
      );
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="user-name">Nome *</Label>
        <Input id="user-name" {...form.register('name')} />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-email">E-mail *</Label>
        <Input id="user-email" type="email" autoComplete="off" {...form.register('email')} />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-role">Perfil *</Label>
        <Select
          value={form.watch('role')}
          onValueChange={(v) => form.setValue('role', v as UsuarioFormData['role'])}
        >
          <SelectTrigger id="user-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="gestor">Gestor</SelectItem>
            <SelectItem value="funcionario">Funcionário</SelectItem>
            <SelectItem value="terapeuta">Terapeuta</SelectItem>
            <SelectItem value="responsavel">Responsável</SelectItem>
            <SelectItem value="terceiro">Terceiro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {role === 'terapeuta' && (
        <div className="space-y-2">
          <Label htmlFor="user-profissional">Profissional vinculado à conta (identidade) *</Label>
          <p className="text-xs text-muted-foreground">
            Os pacientes visíveis serão definidos pelos agendamentos e consultas, não neste cadastro.
          </p>
          <Select
            value={form.watch('profissional_id') || ''}
            onValueChange={(v) => form.setValue('profissional_id', v)}
          >
            <SelectTrigger id="user-profissional">
              <SelectValue
                placeholder={
                  profissionaisQuery.isLoading ? 'Carregando profissionais...' : 'Selecione'
                }
              />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {profissionalOptions.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.profissional_id && (
            <p className="text-sm text-destructive">{form.formState.errors.profissional_id.message}</p>
          )}
        </div>
      )}

      {role === 'responsavel' && (
        <div className="space-y-2">
          <Label htmlFor="user-paciente">Paciente vinculado *</Label>
          <Select
            value={form.watch('paciente_id') || ''}
            onValueChange={(v) => form.setValue('paciente_id', v)}
          >
            <SelectTrigger id="user-paciente">
              <SelectValue placeholder={pacientesLoading ? 'Carregando pacientes...' : 'Selecione'} />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {pacienteOptions.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome_completo ?? p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {pacientesError && (
            <p className="text-xs text-destructive">
              Não foi possível carregar pacientes. Verifique a unidade ativa e tente novamente.
            </p>
          )}
          {form.formState.errors.paciente_id && (
            <p className="text-sm text-destructive">{form.formState.errors.paciente_id.message}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="user-password">
          Senha {mode === 'create' ? '*' : '(deixe em branco para manter)'}
        </Label>
        <Input
          id="user-password"
          type="password"
          autoComplete="new-password"
          {...form.register('password')}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Unidades permitidas</Label>
        <p className="text-xs text-muted-foreground">
          Vazio = acesso a todas as unidades ativas (comportamento padrão para admin).
        </p>
        <div className="max-h-40 overflow-y-auto rounded-md border p-3 space-y-2">
          {unidades.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma unidade ativa cadastrada.</p>
          ) : (
            unidades.map((u) => (
              <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={selectedUnidades.includes(u.id)}
                  onCheckedChange={(c) => toggleUnidade(u.id, c === true)}
                />
                <span>{u.nome}</span>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}
