import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Loader2, MapPin } from 'lucide-react';
import { useState } from 'react';
import { validateCPF, formatCPF, formatCEP, searchCEP } from '@/lib/utils/validators';
import { useToast } from '@/hooks/use-toast';
import { ProfissionalConselhosManager } from '@/components/profissionais/ProfissionalConselhosManager';
import { ProfissionalDocumentosUpload } from '@/components/profissionais/ProfissionalDocumentosUpload';

const profissionalSchema = z.object({
  // Identificação
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpf: z.string().min(11, 'CPF inválido').refine((val) => validateCPF(val), {
    message: 'CPF inválido',
  }),
  rg: z.string().optional(),
  dataNascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  email: z.string().email('Email inválido'),
  telefone: z.string().min(10, 'Telefone inválido'),
  celular: z.string().min(10, 'Celular inválido'),
  
  // Registro Profissional
  conselho: z.enum(['CRP', 'CRM', 'CREFITO', 'COREN', 'CRN', 'OUTRO']),
  numeroRegistro: z.string().min(1, 'Número de registro é obrigatório'),
  ufRegistro: z.string().min(2, 'UF do registro é obrigatória'),
  
  // Endereço
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  
  // Especialidades
  especialidades: z.array(z.string()).min(1, 'Selecione ao menos uma especialidade'),
  
  // Agenda
  diasAtendimento: z.array(z.string()).min(1, 'Selecione ao menos um dia de atendimento'),
  horarioInicio: z.string().min(1, 'Horário de início é obrigatório'),
  horarioFim: z.string().min(1, 'Horário de fim é obrigatório'),
  duracaoConsulta: z.number().min(15, 'Duração mínima é 15 minutos'),
  
  // LGPD
  consentimentoLGPD: z.boolean(),
  dataConsentimento: z.string().optional(),
  compartilhamentoDados: z.boolean(),
  finalidadeDados: z.string().optional(),
  
  // Administrativo
  status: z.enum(['ativo', 'inativo', 'suspenso']),
  observacoes: z.string().optional(),
});

type ProfissionalFormData = z.infer<typeof profissionalSchema>;

interface ProfissionalFormProps {
  initialData?: Partial<ProfissionalFormData> & { id?: string | number };
  profissionalId?: string;
  onSubmit: (data: ProfissionalFormData) => void;
}

const diasSemana = [
  { value: 'segunda', label: 'Segunda-feira' },
  { value: 'terca', label: 'Terça-feira' },
  { value: 'quarta', label: 'Quarta-feira' },
  { value: 'quinta', label: 'Quinta-feira' },
  { value: 'sexta', label: 'Sexta-feira' },
  { value: 'sabado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' },
];

const especialidadesDisponiveis = [
  'Psicólogo Clínico',
  'Psiquiatra',
  'Psicanalista',
  'Neuropsicólogo',
  'Psicólogo Infantil',
  'Terapeuta Familiar',
  'Psicopedagogo',
  'Terapeuta Ocupacional',
];

export const ProfissionalForm = ({ initialData, profissionalId, onSubmit }: ProfissionalFormProps) => {
  const profIdEfetivo =
    profissionalId ?? (initialData?.id !== undefined ? String(initialData.id) : '');
  const { toast } = useToast();
  const [especialidadesSelecionadas, setEspecialidadesSelecionadas] = useState<string[]>(
    initialData?.especialidades || []
  );
  const [novaEspecialidade, setNovaEspecialidade] = useState('');
  const [loadingCEP, setLoadingCEP] = useState(false);

  const form = useForm<ProfissionalFormData>({
    resolver: zodResolver(profissionalSchema),
    defaultValues: {
      nome: initialData?.nome || '',
      cpf: initialData?.cpf || '',
      rg: initialData?.rg || '',
      dataNascimento: initialData?.dataNascimento || '',
      email: initialData?.email || '',
      telefone: initialData?.telefone || '',
      celular: initialData?.celular || '',
      conselho: initialData?.conselho || 'CRP',
      numeroRegistro: initialData?.numeroRegistro || '',
      ufRegistro: initialData?.ufRegistro || '',
      cep: initialData?.cep || '',
      logradouro: initialData?.logradouro || '',
      numero: initialData?.numero || '',
      complemento: initialData?.complemento || '',
      bairro: initialData?.bairro || '',
      cidade: initialData?.cidade || '',
      uf: initialData?.uf || '',
      especialidades: initialData?.especialidades || [],
      diasAtendimento: initialData?.diasAtendimento || [],
      horarioInicio: initialData?.horarioInicio || '08:00',
      horarioFim: initialData?.horarioFim || '18:00',
      duracaoConsulta: initialData?.duracaoConsulta || 60,
      consentimentoLGPD: initialData?.consentimentoLGPD || false,
      dataConsentimento: initialData?.dataConsentimento || '',
      compartilhamentoDados: initialData?.compartilhamentoDados || false,
      finalidadeDados: initialData?.finalidadeDados || '',
      status: initialData?.status || 'ativo',
      observacoes: initialData?.observacoes || '',
    },
  });

  const adicionarEspecialidade = (especialidade: string) => {
    if (especialidade && !especialidadesSelecionadas.includes(especialidade)) {
      const novasEspecialidades = [...especialidadesSelecionadas, especialidade];
      setEspecialidadesSelecionadas(novasEspecialidades);
      form.setValue('especialidades', novasEspecialidades);
      setNovaEspecialidade('');
    }
  };

  const removerEspecialidade = (especialidade: string) => {
    const novasEspecialidades = especialidadesSelecionadas.filter(e => e !== especialidade);
    setEspecialidadesSelecionadas(novasEspecialidades);
    form.setValue('especialidades', novasEspecialidades);
  };

  const handleCEPSearch = async (cep: string) => {
    const cleanCEP = cep.replace(/[^\d]/g, '');
    
    if (cleanCEP.length !== 8) {
      return;
    }

    setLoadingCEP(true);
    const result = await searchCEP(cleanCEP);
    setLoadingCEP(false);

    if (result) {
      form.setValue('logradouro', result.logradouro);
      form.setValue('bairro', result.bairro);
      form.setValue('cidade', result.localidade);
      form.setValue('uf', result.uf);
      
      toast({
        title: 'CEP encontrado',
        description: 'Endereço preenchido automaticamente',
      });
    } else {
      toast({
        title: 'CEP não encontrado',
        description: 'Verifique o CEP digitado',
        variant: 'destructive',
      });
    }
  };

  const handleFormSubmit = (data: ProfissionalFormData) => {
    if (data.consentimentoLGPD && !data.dataConsentimento) {
      data.dataConsentimento = new Date().toISOString().split('T')[0];
    }
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <Accordion type="multiple" defaultValue={['identificacao', 'registro']} className="w-full">
          {/* Identificação */}
          <AccordionItem value="identificacao">
            <AccordionTrigger>Identificação</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome completo do profissional" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dataNascimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="000.000.000-00"
                          onChange={(e) => {
                            const formatted = formatCPF(e.target.value);
                            field.onChange(formatted);
                          }}
                          maxLength={14}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RG</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="00.000.000-0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} placeholder="email@exemplo.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="(00) 0000-0000" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="celular"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Celular *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="(00) 00000-0000" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Registro Profissional */}
          <AccordionItem value="registro">
            <AccordionTrigger>Registro Profissional</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="conselho"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conselho *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CRP">CRP - Psicologia</SelectItem>
                          <SelectItem value="CRM">CRM - Medicina</SelectItem>
                          <SelectItem value="CREFITO">CREFITO - Fisioterapia</SelectItem>
                          <SelectItem value="COREN">COREN - Enfermagem</SelectItem>
                          <SelectItem value="CRN">CRN - Nutrição</SelectItem>
                          <SelectItem value="OUTRO">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numeroRegistro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Registro *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="123456" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ufRegistro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UF Registro *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="SP" maxLength={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormDescription>
                Use a seção <strong>Conselhos adicionais</strong> abaixo para registrar
                múltiplos conselhos. O conselho marcado como principal aqui deve coincidir
                com o cadastro principal.
              </FormDescription>
            </AccordionContent>
          </AccordionItem>

          {/* Conselhos Adicionais */}
          <AccordionItem value="conselhos">
            <AccordionTrigger>Conselhos adicionais</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <ProfissionalConselhosManager profissionalId={profIdEfetivo} />
            </AccordionContent>
          </AccordionItem>

          {/* Documentos */}
          <AccordionItem value="documentos">
            <AccordionTrigger>Documentos</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <ProfissionalDocumentosUpload
                profissionalId={profIdEfetivo}
                uploadedBy={initialData?.nome ?? 'sistema'}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Endereço */}
          <AccordionItem value="endereco">
            <AccordionTrigger>Endereço</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input 
                            {...field} 
                            placeholder="00000-000"
                            onChange={(e) => {
                              const formatted = formatCEP(e.target.value);
                              field.onChange(formatted);
                            }}
                            maxLength={9}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleCEPSearch(field.value)}
                            disabled={loadingCEP}
                          >
                            {loadingCEP ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MapPin className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logradouro"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Logradouro</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Rua, Avenida, etc." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="123" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="complemento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complemento</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Apto, Sala, etc." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bairro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Bairro" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Cidade" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Especialidades */}
          <AccordionItem value="especialidades">
            <AccordionTrigger>Especialidades</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="especialidades"
                render={() => (
                  <FormItem>
                    <FormLabel>Especialidades *</FormLabel>
                    <div className="flex gap-2 mb-2">
                      <Select value={novaEspecialidade} onValueChange={setNovaEspecialidade}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecione uma especialidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {especialidadesDisponiveis.map((esp) => (
                            <SelectItem key={esp} value={esp}>
                              {esp}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        onClick={() => adicionarEspecialidade(novaEspecialidade)}
                        size="icon"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {especialidadesSelecionadas.map((esp) => (
                        <Badge key={esp} variant="secondary" className="gap-1">
                          {esp}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removerEspecialidade(esp)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Agenda */}
          <AccordionItem value="agenda">
            <AccordionTrigger>Agenda de Atendimento</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="diasAtendimento"
                render={() => (
                  <FormItem>
                    <FormLabel>Dias de Atendimento *</FormLabel>
                    <div className="grid grid-cols-4 gap-2">
                      {diasSemana.map((dia) => (
                        <FormField
                          key={dia.value}
                          control={form.control}
                          name="diasAtendimento"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(dia.value)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    field.onChange(
                                      checked
                                        ? [...current, dia.value]
                                        : current.filter((v) => v !== dia.value)
                                    );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="!mt-0 font-normal">
                                {dia.label}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="horarioInicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário Início *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="horarioFim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário Fim *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duracaoConsulta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração Consulta (min) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* LGPD */}
          <AccordionItem value="lgpd">
            <AccordionTrigger>Configurações LGPD</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="consentimentoLGPD"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">
                      Profissional concorda com o tratamento de dados pessoais
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="compartilhamentoDados"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">
                      Autoriza compartilhamento de dados com parceiros
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="finalidadeDados"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Finalidade do Tratamento de Dados</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Descreva a finalidade do tratamento dos dados pessoais"
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Conforme Art. 9º da LGPD, deve ser informada a finalidade específica do tratamento
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Administrativo */}
          <AccordionItem value="administrativo">
            <AccordionTrigger>Informações Administrativas</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                        <SelectItem value="suspenso">Suspenso</SelectItem>
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
                      <Textarea
                        {...field}
                        placeholder="Observações adicionais sobre o profissional"
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit">
            {initialData ? 'Atualizar Profissional' : 'Cadastrar Profissional'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
