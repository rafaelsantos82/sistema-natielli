import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormModal } from '@/components/common/FormModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Sparkles, GripVertical, Eye, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DRAFT_TOASTS } from '@/lib/messages/draft-toasts';
import type { Anamnese, QuestionItem } from '@/hooks/useAnamneses';
import { ANAMNESE_TEMPLATES } from '@/data/anamneseTemplates';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { QuestionnairePreview } from './QuestionnairePreview';

const DRAFT_KEY_PREFIX = 'anamnese_draft_v1:';
const draftKeyFor = (id?: string | null) => `${DRAFT_KEY_PREFIX}${id ?? 'new'}`;

interface DraftPayload {
  form: Record<string, unknown>;
  questions: QuestionItem[];
  savedAt: string;
}

const loadDraft = (id?: string | null): DraftPayload | null => {
  try {
    const raw = localStorage.getItem(draftKeyFor(id));
    return raw ? (JSON.parse(raw) as DraftPayload) : null;
  } catch {
    return null;
  }
};

const persistDraft = (id: string | null | undefined, payload: DraftPayload) => {
  try {
    localStorage.setItem(draftKeyFor(id), JSON.stringify(payload));
  } catch {
    /* quota / disabled storage — silencioso */
  }
};

const clearDraft = (id?: string | null) => {
  try {
    localStorage.removeItem(draftKeyFor(id));
  } catch {
    /* noop */
  }
};

const ESPECIALIDADES = [
  'Clínico Geral',
  'Pediatria',
  'Nutrição',
  'Alergologia',
  'Psicologia',
  'Terapia Ocupacional',
  'TEA/Autismo',
  'Psiquiatria',
  'Fonoaudiologia',
  'Outra',
] as const;

const TIPOS_PERGUNTA: { value: QuestionItem['type']; label: string }[] = [
  { value: 'text', label: 'Texto longo' },
  { value: 'string', label: 'Texto curto' },
  { value: 'boolean', label: 'Sim/Não' },
  { value: 'choice', label: 'Múltipla escolha' },
  { value: 'integer', label: 'Número inteiro' },
  { value: 'decimal', label: 'Número decimal' },
  { value: 'date', label: 'Data' },
];

const schema = z.object({
  nome: z.string().min(3, 'Nome obrigatório (mín. 3 caracteres)'),
  especialidade: z.string().min(1, 'Selecione uma especialidade'),
  versao: z.string().min(1, 'Versão obrigatória'),
  status: z.enum(['Ativa', 'Inativa']),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Anamnese, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: Anamnese | null;
}

// Garante linkId estável e único para cada pergunta (necessário para o SortableContext).
const ensureStableIds = (items: QuestionItem[]): QuestionItem[] => {
  const seen = new Set<string>();
  return items.map((q, idx) => {
    let id = q.linkId && q.linkId.trim() ? q.linkId : `q_${Date.now()}_${idx}`;
    while (seen.has(id)) id = `${id}_${idx}`;
    seen.add(id);
    return { ...q, linkId: id };
  });
};

interface SortableQuestionProps {
  question: QuestionItem;
  index: number;
  onUpdate: (patch: Partial<QuestionItem>) => void;
  onRemove: () => void;
}

const SortableQuestion = ({ question, index, onUpdate, onRemove }: SortableQuestionProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: question.linkId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-md border bg-muted/30 p-3 space-y-2">
      <div className="flex items-start gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground mt-2"
          aria-label="Reordenar pergunta"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-xs text-muted-foreground mt-2 w-6">#{index + 1}</span>
        <Input
          value={question.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Enunciado da pergunta"
          className="flex-1"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-3 pl-14 flex-wrap">
        <Select
          value={question.type}
          onValueChange={(v) => onUpdate({ type: v as QuestionItem['type'] })}
        >
          <SelectTrigger className="w-[180px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIPOS_PERGUNTA.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={!!question.required}
            onCheckedChange={(c) => onUpdate({ required: c === true })}
          />
          Obrigatória
        </label>
        {question.enableWhen && question.enableWhen.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            Condicional
          </Badge>
        )}
      </div>
    </div>
  );
};

export const AnamneseFormModal = ({ isOpen, onClose, onSave, initialData }: Props) => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [templateId, setTemplateId] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  // Diálogo "Continuar rascunho?" exibido ao abrir o modal quando há rascunho salvo
  const [pendingDraft, setPendingDraft] = useState<DraftPayload | null>(null);
  // Diálogo de confirmação ao tentar fechar com alterações pendentes
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  // Marca se o usuário modificou algo desde a última hidratação/salvamento
  const [isDirty, setIsDirty] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      especialidade: '',
      versao: '1.0',
      status: 'Ativa',
      observacoes: '',
    },
  });

  const hidratarComBase = () => {
    reset({
      nome: initialData?.nome ?? '',
      especialidade: initialData?.especialidade ?? '',
      versao: initialData?.versao ?? '1.0',
      status: initialData?.status ?? 'Ativa',
      observacoes: initialData?.observacoes ?? '',
    });
    setQuestions(ensureStableIds(initialData?.questionnaire ?? []));
    setDraftSavedAt(null);
    setIsDirty(false);
  };

  useEffect(() => {
    if (!isOpen) {
      setHydrated(false);
      setPendingDraft(null);
      setConfirmCloseOpen(false);
      return;
    }
    const draft = loadDraft(initialData?.id);
    if (draft) {
      // Não restaura automaticamente: oferece escolha ao usuário
      setPendingDraft(draft);
      hidratarComBase();
    } else {
      hidratarComBase();
    }
    setTemplateId('');
    setShowPreview(false);
    // Hydrated impede autosave/dirty durante o reset inicial
    setTimeout(() => setHydrated(true), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialData]);

  const continuarRascunho = () => {
    if (!pendingDraft) return;
    reset(pendingDraft.form as FormData);
    setQuestions(ensureStableIds(pendingDraft.questions ?? []));
    setDraftSavedAt(pendingDraft.savedAt);
    setIsDirty(false);
    setPendingDraft(null);
    toast(DRAFT_TOASTS.restored(pendingDraft.savedAt));
  };

  const comecarDoZero = () => {
    clearDraft(initialData?.id);
    hidratarComBase();
    setPendingDraft(null);
    toast(DRAFT_TOASTS.startedFresh());
  };

  // Autosave (debounced) — observa mudanças no form e nas perguntas
  const watchedAll = watch();
  useEffect(() => {
    if (!isOpen || !hydrated || pendingDraft) return;
    const handle = setTimeout(() => {
      const savedAt = new Date().toISOString();
      persistDraft(initialData?.id, {
        form: watchedAll,
        questions,
        savedAt,
      });
      setDraftSavedAt(savedAt);
      setIsDirty(true);
    }, 600);
    return () => clearTimeout(handle);
  }, [watchedAll, questions, isOpen, hydrated, pendingDraft, initialData?.id]);

  const descartarRascunho = () => {
    clearDraft(initialData?.id);
    hidratarComBase();
    toast(DRAFT_TOASTS.discarded());
  };

  const tryClose = () => {
    // Evita reentrância quando o AlertDialog já está aberto ou em fechamento
    if (confirmCloseOpen) return;
    if (isDirty || draftSavedAt) {
      setConfirmCloseOpen(true);
      return;
    }
    onClose();
  };

  const fecharMantendoRascunho = () => {
    setConfirmCloseOpen(false);
    // Limpa flags locais para que o onClose subsequente do FormModal
    // (disparado por onOpenChange) não reabra o AlertDialog.
    setIsDirty(false);
    setDraftSavedAt(null);
    toast(DRAFT_TOASTS.kept());
    onClose();
  };

  const fecharDescartando = () => {
    clearDraft(initialData?.id);
    setDraftSavedAt(null);
    setIsDirty(false);
    setConfirmCloseOpen(false);
    toast(DRAFT_TOASTS.closedDiscarding());
    onClose();
  };


  const aplicarTemplate = (id: string) => {
    setTemplateId(id);
    const tpl = ANAMNESE_TEMPLATES.find((t) => t.id === id);
    if (tpl) {
      setQuestions(ensureStableIds(tpl.questionnaire.map((q) => ({ ...q }))));
      reset({
        nome: tpl.nome,
        especialidade: tpl.especialidade,
        versao: tpl.versao,
        status: 'Ativa',
        observacoes: tpl.observacoes ?? '',
      });
    }
  };

  const adicionarPergunta = () => {
    setQuestions((prev) => [
      ...prev,
      {
        linkId: `q_${Date.now()}_${prev.length}`,
        text: '',
        type: 'text',
        required: false,
      },
    ]);
  };

  const removerPergunta = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const atualizarPergunta = (idx: number, patch: Partial<QuestionItem>) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setQuestions((prev) => {
      const oldIndex = prev.findIndex((q) => q.linkId === active.id);
      const newIndex = prev.findIndex((q) => q.linkId === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const onSubmit = (data: FormData) => {
    if (questions.length === 0) {
      toast({
        title: 'Adicione perguntas',
        description: 'O questionário deve ter pelo menos uma pergunta.',
        variant: 'destructive',
      });
      return;
    }
    if (questions.some((q) => !q.text.trim())) {
      toast({
        title: 'Pergunta vazia',
        description: 'Todas as perguntas devem ter um enunciado.',
        variant: 'destructive',
      });
      return;
    }

    onSave({
      nome: data.nome,
      especialidade: data.especialidade,
      versao: data.versao,
      status: data.status,
      observacoes: data.observacoes,
      questionnaire: questions,
    });

    clearDraft(initialData?.id);
    setDraftSavedAt(null);
    toast({ title: 'Sucesso', description: 'Anamnese salva com sucesso' });
    onClose();
  };

  return (
    <>
    <FormModal
      isOpen={isOpen}
      onClose={tryClose}
      title={initialData ? 'Editar Anamnese' : 'Nova Anamnese'}
      size="2xl"
      hideFooter
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {pendingDraft && (
          <Alert data-testid="draft-resume-banner">
            <Sparkles className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between gap-3 flex-wrap">
              <span>
                Encontramos um rascunho salvo em{' '}
                <strong>{new Date(pendingDraft.savedAt).toLocaleString('pt-BR')}</strong>.
                Deseja continuar de onde parou?
              </span>
              <span className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={comecarDoZero}
                >
                  Começar do zero
                </Button>
                <Button type="button" size="sm" onClick={continuarRascunho}>
                  Continuar rascunho
                </Button>
              </span>
            </AlertDescription>
          </Alert>
        )}
        {showPreview ? (
          <>
            <Alert>
              <Eye className="h-4 w-4" />
              <AlertDescription>
                Pré-visualização — esta é a aparência do questionário ao ser preenchido.
                Os campos estão desabilitados.
              </AlertDescription>
            </Alert>
            <QuestionnairePreview
              nome={watch('nome')}
              especialidade={watch('especialidade')}
              versao={watch('versao')}
              questions={questions}
            />
          </>
        ) : (
          <>
        {!initialData && (
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              Selecione um <strong>template</strong> abaixo para começar com perguntas padrão da
              especialidade — você pode editar tudo antes de salvar.
            </AlertDescription>
          </Alert>
        )}

        {!initialData && (
          <div className="space-y-2">
            <Label>Template base (opcional)</Label>
            <Select value={templateId} onValueChange={aplicarTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um modelo pronto..." />
              </SelectTrigger>
              <SelectContent>
                {ANAMNESE_TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome} — {t.questionnaire.length} perguntas
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Informações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="nome">Nome da anamnese *</Label>
            <Input id="nome" {...register('nome')} placeholder="Ex.: Anamnese Pediátrica" />
            {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Especialidade *</Label>
            <Controller
              control={control}
              name="especialidade"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESPECIALIDADES.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.especialidade && (
              <p className="text-sm text-destructive">{errors.especialidade.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="versao">Versão *</Label>
            <Input id="versao" {...register('versao')} placeholder="1.0" />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativa">Ativa</SelectItem>
                    <SelectItem value="Inativa">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              {...register('observacoes')}
              rows={2}
              placeholder="Observações internas sobre o uso desta anamnese"
            />
          </div>
        </div>

        {/* Perguntas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-base">Perguntas</Label>
              <Badge variant="outline">{questions.length}</Badge>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={adicionarPergunta}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar pergunta
            </Button>
          </div>

          {questions.length === 0 && (
            <p className="text-sm text-muted-foreground italic border rounded-md p-4 text-center">
              Nenhuma pergunta. Use um template ou adicione manualmente.
            </p>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={questions.map((q) => q.linkId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {questions.map((q, idx) => (
                  <SortableQuestion
                    key={q.linkId}
                    question={q}
                    index={idx}
                    onUpdate={(patch) => atualizarPergunta(idx, patch)}
                    onRemove={() => removerPergunta(idx)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {questions.length > 1 && (
            <p className="text-xs text-muted-foreground italic">
              Arraste pelo ícone <GripVertical className="inline h-3 w-3" /> para reordenar.
            </p>
          )}
        </div>
          </>
        )}
        {draftSavedAt && (
          <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 rounded px-3 py-2">
            <span>
              💾 Rascunho salvo automaticamente às{' '}
              {new Date(draftSavedAt).toLocaleTimeString('pt-BR')}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={descartarRascunho}
            >
              Descartar rascunho
            </Button>
          </div>
        )}
        <div className="flex justify-between gap-2 pt-2 border-t">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowPreview((v) => !v)}
            disabled={questions.length === 0}
          >
            {showPreview ? (
              <>
                <ArrowLeft className="h-4 w-4 mr-1" /> Voltar à edição
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" /> Pré-visualizar
              </>
            )}
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={tryClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {showPreview ? 'Confirmar e salvar' : 'Salvar anamnese'}
            </Button>
          </div>
        </div>
      </form>
    </FormModal>

    <AlertDialog open={confirmCloseOpen} onOpenChange={setConfirmCloseOpen}>
      <AlertDialogContent
        data-testid="confirm-close-dialog"
        className="w-[calc(100%-2rem)] max-w-[28rem] sm:max-w-lg md:max-w-xl"
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="break-words">
            Fechar com alterações pendentes?
          </AlertDialogTitle>
          <AlertDialogDescription className="break-words">
            Você tem alterações não salvas nesta anamnese. Você pode manter o
            rascunho para continuar mais tarde ou descartá-lo definitivamente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end sm:items-center">
          <AlertDialogCancel className="mt-0 w-full sm:w-auto whitespace-normal text-center">
            Continuar editando
          </AlertDialogCancel>
          <Button
            variant="outline"
            onClick={fecharMantendoRascunho}
            className="w-full sm:w-auto whitespace-normal text-center"
          >
            Fechar e manter rascunho
          </Button>
          <AlertDialogAction
            onClick={fecharDescartando}
            className="w-full sm:w-auto whitespace-normal text-center bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Descartar e fechar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};
