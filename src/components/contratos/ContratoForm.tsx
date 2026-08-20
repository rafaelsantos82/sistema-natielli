import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  contratoFormSchema,
  type ContratoFormValues,
} from '@/lib/validations/contrato.schema';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ContratoListRow } from '@/lib/mappers/contratoMapper';
import { rowToFormDefaults } from '@/lib/mappers/contratoMapper';
import {
  CONTRATO_DOC_ACCEPT,
  CONTRATO_DOC_ALLOWED_LABEL,
  validateContratoDocFile,
} from '@/lib/uploads/contratoDocPolicy';
import { Upload } from 'lucide-react';

const TIPOS = [
  'Atendimento',
  'Prestação de Serviço',
  'Termo de Responsabilidade',
  'Outros',
] as const;

interface ContratoFormProps {
  formId: string;
  mode: 'create' | 'edit';
  onSubmit: (data: ContratoFormValues, file: File | null) => void | Promise<void>;
  initialData?: ContratoListRow;
  pacientes?: Array<{ id: string; nome: string }>;
  profissionais?: Array<{ id: string; nome: string }>;
}

export function ContratoForm({
  formId,
  mode,
  onSubmit,
  initialData,
  pacientes = [],
  profissionais = [],
}: ContratoFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const defaults = initialData ? rowToFormDefaults(initialData) : {};

  const form = useForm<ContratoFormValues>({
    resolver: zodResolver(contratoFormSchema),
    defaultValues: {
      titulo: defaults.titulo ?? '',
      tipo: (defaults.tipo as ContratoFormValues['tipo']) ?? 'Atendimento',
      paciente_id: defaults.paciente_id ?? '',
      paciente_nome: defaults.paciente_nome ?? '',
      profissional_id: defaults.profissional_id ?? '',
      profissional_nome: defaults.profissional_nome ?? '',
    },
  });

  const handlePaciente = (id: string) => {
    const p = pacientes.find((x) => x.id === id);
    form.setValue('paciente_id', id);
    form.setValue('paciente_nome', p?.nome ?? '');
  };

  const handleProfissional = (id: string) => {
    const p = profissionais.find((x) => x.id === id);
    form.setValue('profissional_id', id);
    form.setValue('profissional_nome', p?.nome ?? '');
  };

  const handleFileChange = () => {
    setFileError(null);
    const file = fileInputRef.current?.files?.[0];
    setSelectedFileName(file?.name ?? null);
  };

  const handleFormSubmit = async (values: ContratoFormValues) => {
    setFileError(null);
    const file = fileInputRef.current?.files?.[0] ?? null;

    if (mode === 'create') {
      if (!file) {
        setFileError('Selecione o arquivo do contrato (PDF ou Word).');
        return;
      }
      try {
        validateContratoDocFile(file);
      } catch (err) {
        setFileError(err instanceof Error ? err.message : 'Arquivo inválido.');
        return;
      }
    } else if (file) {
      try {
        validateContratoDocFile(file);
      } catch (err) {
        setFileError(err instanceof Error ? err.message : 'Arquivo inválido.');
        return;
      }
    }

    await onSubmit(values, file);
  };

  const currentArquivo =
    initialData?.arquivo_nome ??
    (initialData?.tem_arquivo ? 'Documento anexado' : undefined);

  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="titulo"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Título do contrato" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIPOS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="paciente_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paciente</FormLabel>
                <Select onValueChange={handlePaciente} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Opcional" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {pacientes.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="profissional_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profissional</FormLabel>
                <Select onValueChange={handleProfissional} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Opcional" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {profissionais.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor={`${formId}-file`}>
            {mode === 'create' ? 'Arquivo do contrato' : 'Substituir arquivo (opcional)'}
          </Label>
          {mode === 'edit' && currentArquivo && !selectedFileName && (
            <p className="text-sm text-muted-foreground">
              Arquivo atual: <span className="font-medium">{currentArquivo}</span>
            </p>
          )}
          <div className="flex items-center gap-2">
            <Input
              id={`${formId}-file`}
              ref={fileInputRef}
              type="file"
              accept={CONTRATO_DOC_ACCEPT}
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            <Upload className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
          </div>
          {selectedFileName && (
            <p className="text-sm text-muted-foreground">Selecionado: {selectedFileName}</p>
          )}
          <p className="text-xs text-muted-foreground">{CONTRATO_DOC_ALLOWED_LABEL}</p>
          {fileError && <p className="text-sm text-destructive">{fileError}</p>}
        </div>
      </form>
    </Form>
  );
}
