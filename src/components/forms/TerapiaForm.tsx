import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { terapiaSchema, TerapiaFormData, ItemRegimeFormData } from '@/lib/validations/terapia.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface TerapiaFormProps {
  initialData?: Partial<TerapiaFormData>;
  onSubmit: (data: TerapiaFormData) => void;
  isLoading?: boolean;
}

const steps = [
  { id: 1, title: 'Identificação', description: 'Dados básicos da terapia' },
  { id: 2, title: 'Esquema/Regime', description: 'Medicamentos e dosagens' },
  { id: 3, title: 'Condições/Segurança', description: 'Indicações e contraindicações' },
  { id: 4, title: 'Gestão', description: 'Status e anexos' },
];

export const TerapiaForm = ({ initialData, onSubmit, isLoading }: TerapiaFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    control,
  } = useForm<TerapiaFormData>({
    resolver: zodResolver(terapiaSchema),
    defaultValues: {
      status: 'Ativo',
      versao: 1,
      necessidade_consentimento: false,
      itens_regime: [
        {
          medicamento: '',
          via: 'VO',
          dose: 0,
          dose_unidade: 'mg',
          frequencia: '',
        },
      ],
      ...initialData,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'itens_regime',
  });

  const necessidade_consentimento = watch('necessidade_consentimento');

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addItemRegime = () => {
    append({
      medicamento: '',
      via: 'VO',
      dose: 0,
      dose_unidade: 'mg',
      frequencia: '',
    } as ItemRegimeFormData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Stepper */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center relative">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= step.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step.id}
              </div>
              <div className="text-xs mt-2 text-center max-w-[100px]">
                <div className="font-medium">{step.title}</div>
                <div className="text-muted-foreground hidden sm:block">{step.description}</div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  currentStep > step.id ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Identificação */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Identificação da Terapia</h3>
          
          <div className="space-y-2">
            <Label htmlFor="nome_terapia">Nome da Terapia *</Label>
            <Input id="nome_terapia" {...register('nome_terapia')} />
            {errors.nome_terapia && (
              <p className="text-sm text-destructive">{errors.nome_terapia.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="objetivo_terapeutico">Objetivo Terapêutico *</Label>
            <Textarea
              id="objetivo_terapeutico"
              {...register('objetivo_terapeutico')}
              rows={3}
            />
            {errors.objetivo_terapeutico && (
              <p className="text-sm text-destructive">{errors.objetivo_terapeutico.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="diretriz_protocolar">Diretriz Protocolar *</Label>
            <Select
              onValueChange={(value) => setValue('diretriz_protocolar', value as any)}
              defaultValue={initialData?.diretriz_protocolar}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Protocolo Clinico">Protocolo Clínico</SelectItem>
                <SelectItem value="Diretriz interna">Diretriz Interna</SelectItem>
                <SelectItem value="Off-label justificado">Off-label Justificado</SelectItem>
              </SelectContent>
            </Select>
            {errors.diretriz_protocolar && (
              <p className="text-sm text-destructive">{errors.diretriz_protocolar.message}</p>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Esquema/Regime */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Esquema/Regime Terapêutico</h3>
            <Button type="button" onClick={addItemRegime} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Medicamento
            </Button>
          </div>

          {errors.itens_regime?.message && (
            <p className="text-sm text-destructive">{errors.itens_regime.message}</p>
          )}

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-3 relative">
                <div className="flex justify-between items-start">
                  <Badge variant="outline">Medicamento {index + 1}</Badge>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`itens_regime.${index}.medicamento`}>Medicamento *</Label>
                    <Input
                      id={`itens_regime.${index}.medicamento`}
                      {...register(`itens_regime.${index}.medicamento`)}
                    />
                    {errors.itens_regime?.[index]?.medicamento && (
                      <p className="text-sm text-destructive">
                        {errors.itens_regime[index]?.medicamento?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`itens_regime.${index}.via`}>Via *</Label>
                    <Select
                      onValueChange={(value) => setValue(`itens_regime.${index}.via`, value as any)}
                      defaultValue={field.via}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VO">Oral (VO)</SelectItem>
                        <SelectItem value="IV">Intravenosa (IV)</SelectItem>
                        <SelectItem value="IM">Intramuscular (IM)</SelectItem>
                        <SelectItem value="SC">Subcutânea (SC)</SelectItem>
                        <SelectItem value="SL">Sublingual (SL)</SelectItem>
                        <SelectItem value="Topica">Tópica</SelectItem>
                        <SelectItem value="Inalatoria">Inalatória</SelectItem>
                        <SelectItem value="Retal">Retal</SelectItem>
                        <SelectItem value="Ocular">Ocular</SelectItem>
                        <SelectItem value="Nasal">Nasal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`itens_regime.${index}.dose`}>Dose *</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        id={`itens_regime.${index}.dose`}
                        {...register(`itens_regime.${index}.dose`, { valueAsNumber: true })}
                        className="flex-1"
                      />
                      <Select
                        onValueChange={(value) =>
                          setValue(`itens_regime.${index}.dose_unidade`, value as any)
                        }
                        defaultValue={field.dose_unidade}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mg">mg</SelectItem>
                          <SelectItem value="g">g</SelectItem>
                          <SelectItem value="mcg">mcg</SelectItem>
                          <SelectItem value="UI">UI</SelectItem>
                          <SelectItem value="mL">mL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {errors.itens_regime?.[index]?.dose && (
                      <p className="text-sm text-destructive">
                        {errors.itens_regime[index]?.dose?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`itens_regime.${index}.frequencia`}>Frequência *</Label>
                    <Input
                      id={`itens_regime.${index}.frequencia`}
                      {...register(`itens_regime.${index}.frequencia`)}
                      placeholder="Ex: 1x/dia, 8/8h"
                    />
                    {errors.itens_regime?.[index]?.frequencia && (
                      <p className="text-sm text-destructive">
                        {errors.itens_regime[index]?.frequencia?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`itens_regime.${index}.horario`}>Horário</Label>
                    <Input
                      type="time"
                      id={`itens_regime.${index}.horario`}
                      {...register(`itens_regime.${index}.horario`)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`itens_regime.${index}.duracao`}>Duração</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        id={`itens_regime.${index}.duracao`}
                        {...register(`itens_regime.${index}.duracao`, { valueAsNumber: true })}
                        className="flex-1"
                      />
                      <Select
                        onValueChange={(value) =>
                          setValue(`itens_regime.${index}.duracao_unidade`, value as any)
                        }
                        defaultValue={field.duracao_unidade}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dias">Dias</SelectItem>
                          <SelectItem value="semanas">Semanas</SelectItem>
                          <SelectItem value="meses">Meses</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`itens_regime.${index}.orientacoes`}>Orientações</Label>
                    <Textarea
                      id={`itens_regime.${index}.orientacoes`}
                      {...register(`itens_regime.${index}.orientacoes`)}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="regra_ajuste">Regra de Ajuste</Label>
            <Textarea id="regra_ajuste" {...register('regra_ajuste')} rows={2} />
          </div>
        </div>
      )}

      {/* Step 3: Condições/Segurança */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Condições e Segurança</h3>

          <div className="space-y-2">
            <Label htmlFor="indicacoes">Indicações</Label>
            <Textarea id="indicacoes" {...register('indicacoes')} rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contraindicacoes">Contraindicações</Label>
            <Textarea id="contraindicacoes" {...register('contraindicacoes')} rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interacoes_relevantes">Interações Relevantes</Label>
            <Textarea id="interacoes_relevantes" {...register('interacoes_relevantes')} rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monitorizacao">Monitorização</Label>
            <Textarea id="monitorizacao" {...register('monitorizacao')} rows={2} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventos_adversos">Eventos Adversos</Label>
            <Textarea id="eventos_adversos" {...register('eventos_adversos')} rows={2} />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="necessidade_consentimento"
                onCheckedChange={(checked) =>
                  setValue('necessidade_consentimento', checked as boolean)
                }
              />
              <Label htmlFor="necessidade_consentimento" className="font-semibold">
                Necessidade de Consentimento
              </Label>
            </div>

            {necessidade_consentimento && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="texto_consentimento">Texto de Consentimento *</Label>
                <Textarea
                  id="texto_consentimento"
                  {...register('texto_consentimento')}
                  rows={4}
                  placeholder="Texto que será apresentado ao paciente para consentimento"
                />
                {errors.texto_consentimento && (
                  <p className="text-sm text-destructive">{errors.texto_consentimento.message}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Gestão */}
      {currentStep === 4 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Gestão da Terapia</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                onValueChange={(value) => setValue('status', value as any)}
                defaultValue={initialData?.status || 'Ativo'}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="versao">Versão</Label>
              <Input
                type="number"
                id="versao"
                {...register('versao', { valueAsNumber: true })}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" {...register('observacoes')} rows={4} />
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button type="button" onClick={prevStep} disabled={currentStep === 1} variant="outline">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>

        {currentStep < steps.length ? (
          <Button type="button" onClick={nextStep}>
            Próximo
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar Terapia'}
          </Button>
        )}
      </div>
    </form>
  );
};
