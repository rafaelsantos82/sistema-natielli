import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ComodatoFormData, comodatoFormSchema } from '@/lib/validations/comodato.schema';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Comodato } from '@/hooks/useComodatos';
import { format } from 'date-fns';

const NONE_ITEM_ESTOQUE = '__none__';

interface ComodatoFormProps {
  onSubmit: (data: ComodatoFormData) => void;
  initialData?: Comodato;
  pacientes?: Array<{ id: string; nome: string }>;
  profissionais?: Array<{ id: string; nome: string }>;
  itensEstoque?: Array<{ id: string; nome: string }>;
}

export function ComodatoForm({
  onSubmit,
  initialData,
  pacientes = [],
  profissionais = [],
  itensEstoque = [],
}: ComodatoFormProps) {
  const form = useForm<ComodatoFormData>({
    resolver: zodResolver(comodatoFormSchema),
    defaultValues: {
      item_id: initialData?.item_id ? initialData.item_id : NONE_ITEM_ESTOQUE,
      item_nome: initialData?.item_nome || '',
      descricao: initialData?.descricao || '',
      paciente_id: initialData?.paciente_id || '',
      paciente_nome: initialData?.paciente_nome || '',
      data_emprestimo: initialData?.data_emprestimo
        ? format(new Date(initialData.data_emprestimo), 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      data_devolucao_prevista: initialData?.data_devolucao_prevista
        ? format(new Date(initialData.data_devolucao_prevista), 'yyyy-MM-dd')
        : '',
      condicao_entrega: initialData?.condicao_entrega || '',
      observacoes: initialData?.observacoes || '',
      responsavel_id: initialData?.responsavel_id || '',
      responsavel_nome: initialData?.responsavel_nome || '',
      numero_serie: initialData?.numero_serie || '',
      quantidade: initialData?.quantidade || 1,
    },
  });

  const handleItemEstoqueChange = (itemId: string) => {
    if (itemId === NONE_ITEM_ESTOQUE) {
      form.setValue('item_id', '');
      return;
    }
    const item = itensEstoque.find((i) => i.id === itemId);
    if (item) {
      form.setValue('item_id', item.id);
      form.setValue('item_nome', item.nome);
    }
  };

  const handlePacienteChange = (pacienteId: string) => {
    const paciente = pacientes.find((p) => p.id === pacienteId);
    if (paciente) {
      form.setValue('paciente_id', paciente.id);
      form.setValue('paciente_nome', paciente.nome);
    }
  };

  const handleResponsavelChange = (responsavelId: string) => {
    const responsavel = profissionais.find((p) => p.id === responsavelId);
    if (responsavel) {
      form.setValue('responsavel_id', responsavel.id);
      form.setValue('responsavel_nome', responsavel.nome);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          onSubmit({
            ...data,
            item_id:
              !data.item_id || data.item_id === NONE_ITEM_ESTOQUE ? undefined : data.item_id,
          });
        })}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {itensEstoque.length > 0 && (
            <FormField
              control={form.control}
              name="item_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item do Estoque (Opcional)</FormLabel>
                  <Select
                    onValueChange={handleItemEstoqueChange}
                    value={field.value && field.value !== '' ? field.value : NONE_ITEM_ESTOQUE}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um item do estoque" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE_ITEM_ESTOQUE}>Nenhum (item externo)</SelectItem>
                      {itensEstoque.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="item_nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Item *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: Cadeira de Rodas" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="numero_serie"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Série</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: SN123456" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade *</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="1" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição do Item</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Descrição detalhada do item emprestado" rows={2} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="paciente_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paciente *</FormLabel>
                <Select onValueChange={handlePacienteChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o paciente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {pacientes.map((paciente) => (
                      <SelectItem key={paciente.id} value={paciente.id}>
                        {paciente.nome}
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
            name="responsavel_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsável *</FormLabel>
                <Select onValueChange={handleResponsavelChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o responsável" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {profissionais.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.nome}
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
            name="data_emprestimo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Empréstimo *</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="data_devolucao_prevista"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Devolução Prevista *</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="condicao_entrega"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Condição na Entrega *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a condição" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Novo">Novo</SelectItem>
                  <SelectItem value="Bom">Bom</SelectItem>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="Desgastado">Desgastado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Observações adicionais sobre o empréstimo" rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
