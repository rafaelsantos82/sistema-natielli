import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pacienteSchema, PacienteFormData } from '@/lib/validations/paciente.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface PacienteFormProps {
  initialData?: Partial<PacienteFormData>;
  onSubmit: (data: PacienteFormData) => void;
  isLoading?: boolean;
}

const defaultFormValues: Partial<PacienteFormData> = {
  status: 'ativo',
  consentimento_lgpd: false,
  autorizacao_uso_imagem: false,
};

export const PacienteForm = ({ initialData, onSubmit, isLoading }: PacienteFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm<PacienteFormData>({
    resolver: zodResolver(pacienteSchema),
    defaultValues: {
      ...defaultFormValues,
      ...initialData,
    },
  });

  useEffect(() => {
    reset({
      ...defaultFormValues,
      ...initialData,
    });
  }, [initialData, reset]);

  const sexoBiologico = watch('sexo_biologico');
  const tipoSanguineo = watch('tipo_sanguineo');
  const status = watch('status');
  const consentimentoLgpd = watch('consentimento_lgpd');
  const autorizacaoUsoImagem = watch('autorizacao_uso_imagem');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Accordion type="multiple" className="w-full" defaultValue={['identificacao', 'endereco']}>
        {/* Identificação */}
        <AccordionItem value="identificacao">
          <AccordionTrigger className="text-lg font-semibold">
            🧍‍♂️ Identificação do Paciente
          </AccordionTrigger>
          <AccordionContent className="space-y-4 px-1 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome_completo">Nome Completo *</Label>
                <Input id="nome_completo" {...register('nome_completo')} />
                {errors.nome_completo && (
                  <p className="text-sm text-destructive">{errors.nome_completo.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
                <Input type="date" id="data_nascimento" {...register('data_nascimento')} />
                {errors.data_nascimento && (
                  <p className="text-sm text-destructive">{errors.data_nascimento.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sexo_biologico">Sexo Biológico *</Label>
                <Select
                  value={sexoBiologico}
                  onValueChange={(value) => setValue('sexo_biologico', value as PacienteFormData['sexo_biologico'])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="intersexo">Intersexo</SelectItem>
                    <SelectItem value="nao_informado">Não informado</SelectItem>
                  </SelectContent>
                </Select>
                {errors.sexo_biologico && (
                  <p className="text-sm text-destructive">{errors.sexo_biologico.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rg_numero">RG</Label>
                <Input id="rg_numero" {...register('rg_numero')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rg_orgao">Órgão Emissor</Label>
                <Input id="rg_orgao" {...register('rg_orgao')} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="cpf">CPF do paciente (opcional)</Label>
                <Input id="cpf" {...register('cpf')} placeholder="000.000.000-00" />
                {errors.cpf && (
                  <p className="text-sm text-destructive">{errors.cpf.message}</p>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Endereço e Contato */}
        <AccordionItem value="endereco">
          <AccordionTrigger className="text-lg font-semibold">
            🏠 Endereço e Contato
          </AccordionTrigger>
          <AccordionContent className="space-y-4 px-1 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tel_principal">Telefone Principal *</Label>
                <Input
                  id="tel_principal"
                  {...register('tel_principal')}
                  placeholder="(00) 00000-0000"
                />
                {errors.tel_principal && (
                  <p className="text-sm text-destructive">{errors.tel_principal.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tel_secundario">Telefone Secundário</Label>
                <Input
                  id="tel_secundario"
                  {...register('tel_secundario')}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input type="email" id="email" {...register('email')} />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep">CEP *</Label>
                <Input
                  id="cep"
                  {...register('cep')}
                  placeholder="00000-000"
                />
                {errors.cep && (
                  <p className="text-sm text-destructive">{errors.cep.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input id="endereco" {...register('endereco')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input id="numero" {...register('numero')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input id="complemento" {...register('complemento')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input id="bairro" {...register('bairro')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input id="cidade" {...register('cidade')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="uf">UF *</Label>
                <Input id="uf" maxLength={2} {...register('uf')} placeholder="SP" />
                {errors.uf && (
                  <p className="text-sm text-destructive">{errors.uf.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contato_emergencia_nome">Contato de Emergência (Nome)</Label>
                <Input id="contato_emergencia_nome" {...register('contato_emergencia_nome')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contato_emergencia_tel">Contato de Emergência (Telefone)</Label>
                <Input
                  id="contato_emergencia_tel"
                  {...register('contato_emergencia_tel')}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Responsável legal */}
        <AccordionItem value="responsavel">
          <AccordionTrigger className="text-lg font-semibold">
            👨‍👩‍👧 Responsável legal
          </AccordionTrigger>
          <AccordionContent className="space-y-4 px-1 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="responsavel_nome">Nome do responsável *</Label>
                <Input id="responsavel_nome" {...register('responsavel_nome')} />
                {errors.responsavel_nome && (
                  <p className="text-sm text-destructive">{errors.responsavel_nome.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsavel_cpf">CPF do responsável</Label>
                <Input id="responsavel_cpf" {...register('responsavel_cpf')} />
                {errors.responsavel_cpf && (
                  <p className="text-sm text-destructive">{errors.responsavel_cpf.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsavel_parentesco">Parentesco</Label>
                <Input id="responsavel_parentesco" {...register('responsavel_parentesco')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsavel_tel">Telefone</Label>
                <Input id="responsavel_tel" {...register('responsavel_tel')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsavel_email">E-mail</Label>
                <Input id="responsavel_email" type="email" {...register('responsavel_email')} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Contexto pediátrico */}
        <AccordionItem value="pediatrico">
          <AccordionTrigger className="text-lg font-semibold">
            🎒 Escola e desenvolvimento
          </AccordionTrigger>
          <AccordionContent className="space-y-4 px-1 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="escola">Escola</Label>
                <Input id="escola" {...register('escola')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serie_ano">Série/Ano</Label>
                <Input id="serie_ano" {...register('serie_ano')} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="necessidades_especiais">Necessidades especiais</Label>
                <Textarea id="necessidades_especiais" {...register('necessidades_especiais')} rows={2} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="pediatra_referencia">Pediatra de referência</Label>
                <Input id="pediatra_referencia" {...register('pediatra_referencia')} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Dados Clínicos */}
        <AccordionItem value="clinicos">
          <AccordionTrigger className="text-lg font-semibold">
            ⚕️ Dados Clínicos
          </AccordionTrigger>
          <AccordionContent className="space-y-4 px-1 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="altura">Altura (cm)</Label>
                <Input
                  type="number"
                  id="altura"
                  {...register('altura', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="peso">Peso (kg)</Label>
                <Input
                  type="number"
                  id="peso"
                  step="0.1"
                  {...register('peso', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo_sanguineo">Tipo Sanguíneo</Label>
                <Select
                  value={tipoSanguineo}
                  onValueChange={(value) => setValue('tipo_sanguineo', value as PacienteFormData['tipo_sanguineo'])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                    <SelectItem value="Desconhecido">Desconhecido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alergias">Alergias</Label>
              <Textarea id="alergias" {...register('alergias')} rows={2} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doencas_cronicas">Doenças Crônicas</Label>
              <Textarea id="doencas_cronicas" {...register('doencas_cronicas')} rows={2} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicacoes_continuo">Medicações de Uso Contínuo</Label>
              <Textarea id="medicacoes_continuo" {...register('medicacoes_continuo')} rows={2} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cirurgias_previas">Cirurgias Prévias</Label>
              <Textarea id="cirurgias_previas" {...register('cirurgias_previas')} rows={2} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="historico_familiar">Histórico Familiar</Label>
              <Textarea id="historico_familiar" {...register('historico_familiar')} rows={2} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea id="observacoes" {...register('observacoes')} rows={3} />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Hábitos (pediátrico) */}
        <AccordionItem value="habitos">
          <AccordionTrigger className="text-lg font-semibold">
            💬 Hábitos e rotina
          </AccordionTrigger>
          <AccordionContent className="space-y-4 px-1 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="atividade_fisica_frequencia">Frequência de atividade física</Label>
                <Input id="atividade_fisica_frequencia" {...register('atividade_fisica_frequencia')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="atividade_fisica_tipo">Tipo de atividade física</Label>
                <Input id="atividade_fisica_tipo" {...register('atividade_fisica_tipo')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alimentacao">Alimentação</Label>
                <Input id="alimentacao" {...register('alimentacao')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sono_horas">Horas de sono (0–24)</Label>
                <Input
                  type="number"
                  id="sono_horas"
                  {...register('sono_horas', { valueAsNumber: true })}
                  min={0}
                  max={24}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Administrativos */}
        <AccordionItem value="administrativos">
          <AccordionTrigger className="text-lg font-semibold">
            🧾 Dados Administrativos
          </AccordionTrigger>
          <AccordionContent className="space-y-4 px-1 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profissional_responsavel">Profissional Responsável</Label>
                <Input id="profissional_responsavel" {...register('profissional_responsavel')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status ?? 'ativo'}
                  onValueChange={(value) => setValue('status', value as PacienteFormData['status'])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="falecido">Falecido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="consentimento_lgpd"
                    checked={Boolean(consentimentoLgpd)}
                    onCheckedChange={(checked) => setValue('consentimento_lgpd', checked === true)}
                  />
                  <Label htmlFor="consentimento_lgpd" className="font-semibold">
                    Consentimento LGPD * (obrigatório)
                  </Label>
                </div>
                {errors.consentimento_lgpd && (
                  <p className="text-sm text-destructive">{errors.consentimento_lgpd.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autorizacao_uso_imagem"
                    checked={Boolean(autorizacaoUsoImagem)}
                    onCheckedChange={(checked) => setValue('autorizacao_uso_imagem', checked === true)}
                  />
                  <Label htmlFor="autorizacao_uso_imagem">
                    Autorização de Uso de Imagem
                  </Label>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
};
