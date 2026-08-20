import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Calendar } from 'lucide-react';
import { ConflictChecker } from '@/components/agenda/ConflictChecker';
import {
  buildProfissionalSchedule,
  endTimeFromStartAndDuration,
  loadAgendaExceptions,
  parseDataHoraLocal,
} from '@/lib/agenda/profissionalSchedule';
import { useEffect, useMemo, useState } from 'react';
export interface PacienteOption {
  id: string;
  nome_completo: string;
  data_nascimento?: string;
  cpf?: string;
  tel_principal?: string;
  email?: string;
}
import { useUnidadeAtiva } from '@/contexts/UnidadeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProfissionais } from '@/hooks/useProfissionais';

const consultaSchema = z.object({
  pacienteId: z.string().min(1, 'Selecione um paciente'),
  profissionalId: z.string().min(1, 'Selecione um profissional'),
  unidadeId: z.string().min(1, 'Unidade é obrigatória'),
  salaId: z.string().min(1, 'Selecione uma sala'),
  dataHora: z.string().min(1, 'Data e hora são obrigatórios'),
  duracao: z.number().min(15, 'Duração mínima de 15 minutos'),
  motivo: z.string().min(3, 'Motivo deve ter pelo menos 3 caracteres'),
  observacoes: z.string().optional(),
  observacoes_anamnese: z.string().optional(),
});

type ConsultaFormData = z.infer<typeof consultaSchema>;

interface ProfissionalOption {
  id: string;
  nome: string;
  especialidade?: string;
}

interface SalaOption {
  id: string;
  nome_sala: string;
  unidadeId?: string;
}

interface ConsultaFormProps {
  onSubmit: (data: ConsultaFormData) => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<ConsultaFormData>;
  pacientes?: PacienteOption[];
  profissionais?: ProfissionalOption[];
  salas?: SalaOption[];
}

export const ConsultaForm = ({
  onSubmit,
  isSubmitting = false,
  defaultValues,
  pacientes = [],
  profissionais = [],
  salas = [],
}: ConsultaFormProps) => {
  const [showConflictChecker, setShowConflictChecker] = useState(false);
  const { unidades, unidadeAtivaId } = useUnidadeAtiva();
  const { user } = useAuth();
  const { getById: getProfissionalById } = useProfissionais();
  const podeAlterarUnidade = user?.role === 'admin' || user?.role === 'gestor';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ConsultaFormData>({
    resolver: zodResolver(consultaSchema),
    defaultValues: {
      duracao: 60,
      unidadeId: defaultValues?.unidadeId ?? unidadeAtivaId,
      ...defaultValues,
    },
  });

  const selectedPacienteId = watch('pacienteId');
  const selectedProfissionalId = watch('profissionalId');
  const selectedUnidadeId = watch('unidadeId');
  const selectedSalaId = watch('salaId');
  const dataHoraValue = watch('dataHora');
  const duracaoValue = watch('duracao');

  const salasDaUnidade = useMemo(
    () =>
      salas.filter(
        (s) => !selectedUnidadeId || !s.unidadeId || s.unidadeId === selectedUnidadeId,
      ),
    [salas, selectedUnidadeId],
  );

  useEffect(() => {
    if (!selectedSalaId) return;
    const stillValid = salasDaUnidade.some((s) => s.id === selectedSalaId);
    if (!stillValid) {
      setValue('salaId', '', { shouldValidate: true });
    }
  }, [selectedUnidadeId, salasDaUnidade, selectedSalaId, setValue]);

  const profissionalCompleto = useMemo(
    () => (selectedProfissionalId ? getProfissionalById(selectedProfissionalId) : null),
    [selectedProfissionalId, getProfissionalById],
  );

  const profissionalSchedule = useMemo(
    () => buildProfissionalSchedule(profissionalCompleto ?? undefined),
    [profissionalCompleto],
  );

  const agendaExceptions = useMemo(
    () => loadAgendaExceptions(selectedProfissionalId),
    [selectedProfissionalId],
  );

  const conflictDefaults = useMemo(() => {
    const { date, startTime } = parseDataHoraLocal(dataHoraValue);
    const duracao = Number(duracaoValue) || profissionalSchedule?.duracaoConsulta || 60;
    const endTime =
      startTime != null ? endTimeFromStartAndDuration(startTime, duracao) : undefined;
    return { date, startTime, endTime };
  }, [dataHoraValue, duracaoValue, profissionalSchedule?.duracaoConsulta]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pacienteId">Paciente *</Label>
        <Select
          onValueChange={(value) => setValue('pacienteId', value, { shouldValidate: true })}
          defaultValue={defaultValues?.pacienteId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o paciente" />
          </SelectTrigger>
          <SelectContent>
            {pacientes.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nome_completo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.pacienteId && (
          <p className="text-sm text-destructive">{errors.pacienteId.message}</p>
        )}
      </div>

      {/* Bloco de dados do paciente oculto no modal de agendamento (dados incompletos na lista).
      {paciente && (
        <div className="rounded-lg border bg-card p-3 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <IdCard className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">
                Dados do paciente (auto-preenchidos do cadastro)
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/pacientes')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Ver cadastro completo
            </Button>
          </div>

          <Accordion
            type="multiple"
            defaultValue={['identificacao', 'plano']}
            className="w-full"
          >
            <AccordionItem value="identificacao">
              <AccordionTrigger className="text-sm">
                Identificação & Contato
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  <ReadOnlyField label="Nome" value={paciente.nome_completo} />
                  <ReadOnlyField label="CPF" value={paciente.cpf} />
                  <ReadOnlyField
                    label="Data de nascimento"
                    value={
                      paciente.data_nascimento
                        ? `${format(parseISO(paciente.data_nascimento), 'dd/MM/yyyy')}${
                            idade !== undefined ? ` (${idade} anos)` : ''
                          }`
                        : undefined
                    }
                  />
                  <ReadOnlyField label="Sexo biológico" value={paciente.sexo_biologico} />
                  <ReadOnlyField label="Telefone principal" value={paciente.tel_principal} />
                  <ReadOnlyField label="Telefone secundário" value={paciente.tel_secundario} />
                  <ReadOnlyField label="E-mail" value={paciente.email} />
                  <ReadOnlyField label="Responsável" value={paciente.responsavel_nome} />
                  <ReadOnlyField
                    label="Contato emergência"
                    value={
                      paciente.contato_emergencia_nome
                        ? `${paciente.contato_emergencia_nome} • ${
                            paciente.contato_emergencia_tel ?? ''
                          }`
                        : undefined
                    }
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="endereco">
              <AccordionTrigger className="text-sm">Endereço</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  <ReadOnlyField label="CEP" value={paciente.cep} />
                  <ReadOnlyField
                    label="Logradouro"
                    value={
                      paciente.endereco
                        ? `${paciente.endereco}, ${paciente.numero ?? 's/n'}${
                            paciente.complemento ? ` - ${paciente.complemento}` : ''
                          }`
                        : undefined
                    }
                  />
                  <ReadOnlyField label="Bairro" value={paciente.bairro} />
                  <ReadOnlyField label="Cidade" value={paciente.cidade} />
                  <ReadOnlyField label="UF" value={paciente.uf} />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="clinicos">
              <AccordionTrigger className="text-sm">Dados Clínicos</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  <ReadOnlyField
                    label="Peso"
                    value={paciente.peso ? `${paciente.peso} kg` : undefined}
                  />
                  <ReadOnlyField
                    label="Altura"
                    value={paciente.altura ? `${paciente.altura} cm` : undefined}
                  />
                  <ReadOnlyField label="IMC" value={imc} />
                  <ReadOnlyField label="Tipo sanguíneo" value={paciente.tipo_sanguineo} />
                  <div className="md:col-span-3">
                    <ReadOnlyField label="Alergias" value={paciente.alergias} />
                  </div>
                  <div className="md:col-span-3">
                    <ReadOnlyField label="Doenças crônicas" value={paciente.doencas_cronicas} />
                  </div>
                  <div className="md:col-span-3">
                    <ReadOnlyField
                      label="Medicações contínuas"
                      value={paciente.medicacoes_continuo}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <ReadOnlyField
                      label="Cirurgias prévias"
                      value={paciente.cirurgias_previas}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <ReadOnlyField
                      label="Histórico familiar"
                      value={paciente.historico_familiar}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="habitos">
              <AccordionTrigger className="text-sm">Hábitos</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  <ReadOnlyField
                    label="Atividade física"
                    value={
                      paciente.atividade_fisica_tipo
                        ? `${paciente.atividade_fisica_tipo} (${
                            paciente.atividade_fisica_frequencia ?? ''
                          })`
                        : paciente.atividade_fisica_frequencia
                    }
                  />
                  <ReadOnlyField label="Alimentação" value={paciente.alimentacao} />
                  <ReadOnlyField
                    label="Sono"
                    value={paciente.sono_horas ? `${paciente.sono_horas} h/noite` : undefined}
                  />
                  <ReadOnlyField
                    label="Estresse (1-10)"
                    value={paciente.estresse}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="plano">
              <AccordionTrigger className="text-sm">
                Plano de Saúde / Carteirinha
              </AccordionTrigger>
              <AccordionContent>
                {paciente.plano_saude ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                    <ReadOnlyField label="Operadora" value={paciente.plano_saude.nome} />
                    <ReadOnlyField label="Categoria" value={paciente.plano_saude.categoria} />
                    <ReadOnlyField
                      label="Carteirinha"
                      value={paciente.plano_saude.numero_carteirinha}
                    />
                    <ReadOnlyField
                      label="Validade"
                      value={format(parseISO(paciente.plano_saude.validade), 'dd/MM/yyyy')}
                    />
                    <ReadOnlyField label="Titular" value={paciente.plano_saude.titular} />
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Particular — sem plano de saúde cadastrado.
                    </AlertDescription>
                  </Alert>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
      */}

      <div className="space-y-2">
        <Label htmlFor="unidadeId">Unidade *</Label>
        <Select
          value={watch('unidadeId') ?? ''}
          onValueChange={(value) => setValue('unidadeId', value, { shouldValidate: true })}
          disabled={!podeAlterarUnidade}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a unidade" />
          </SelectTrigger>
          <SelectContent>
            {unidades.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.unidadeId && (
          <p className="text-sm text-destructive">{errors.unidadeId.message}</p>
        )}
        {!podeAlterarUnidade && (
          <p className="text-xs text-muted-foreground">
            Apenas admin/gestor pode alterar a unidade do agendamento.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="profissionalId">Profissional *</Label>
        <Select
          onValueChange={(value) => setValue('profissionalId', value, { shouldValidate: true })}
          defaultValue={defaultValues?.profissionalId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o profissional" />
          </SelectTrigger>
          <SelectContent>
            {profissionais.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nome}
                {p.especialidade ? ` — ${p.especialidade}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.profissionalId && (
          <p className="text-sm text-destructive">{errors.profissionalId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="salaId">Sala *</Label>
        <Select
          value={selectedSalaId ?? ''}
          onValueChange={(value) => setValue('salaId', value, { shouldValidate: true })}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                salasDaUnidade.length > 0
                  ? 'Selecione a sala'
                  : 'Nenhuma sala ativa nesta unidade'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {salasDaUnidade.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.nome_sala}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.salaId && (
          <p className="text-sm text-destructive">{errors.salaId.message}</p>
        )}
        {salasDaUnidade.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Cadastre salas ativas em Salas de Atendimento para esta unidade.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dataHora">Data e Hora *</Label>
          <Input id="dataHora" type="datetime-local" {...register('dataHora')} />
          {errors.dataHora && (
            <p className="text-sm text-destructive">{errors.dataHora.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="duracao">Duração (minutos) *</Label>
          <Input
            id="duracao"
            type="number"
            {...register('duracao', { valueAsNumber: true })}
          />
          {errors.duracao && (
            <p className="text-sm text-destructive">{errors.duracao.message}</p>
          )}
        </div>
      </div>

      {selectedProfissionalId && (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowConflictChecker(!showConflictChecker)}
            className="w-full"
          >
            <Calendar className="h-4 w-4 mr-2" />
            {showConflictChecker ? 'Ocultar' : 'Verificar'} Disponibilidade
          </Button>

          {showConflictChecker && (
            <div className="mt-4">
              <ConflictChecker
                exceptions={agendaExceptions}
                profissionalSchedule={profissionalSchedule}
                defaultDate={conflictDefaults.date}
                defaultStartTime={conflictDefaults.startTime}
                defaultEndTime={conflictDefaults.endTime}
              />
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="motivo">Motivo da Consulta *</Label>
        <Input
          id="motivo"
          {...register('motivo')}
          placeholder="Ex: Consulta de rotina, acompanhamento..."
        />
        {errors.motivo && (
          <p className="text-sm text-destructive">{errors.motivo.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          {...register('observacoes')}
          placeholder="Observações adicionais sobre a consulta"
          rows={3}
        />
      </div>

      {/* <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Um lembrete será enviado automaticamente 24h antes da consulta.
        </AlertDescription>
      </Alert> */}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting
          ? 'Salvando…'
          : defaultValues
            ? 'Atualizar Consulta'
            : 'Agendar Consulta'}
      </Button>
    </form>
  );
};
