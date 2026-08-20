import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DRAFT_TOASTS } from '@/lib/messages/draft-toasts';

const evolucaoSchema = z.object({
  queixaPrincipal: z.string().min(5, 'Queixa principal é obrigatória'),
  historiaDoenca: z.string().min(5, 'História da doença é obrigatória'),
  exameFisico: z.string().min(5, 'Exame físico é obrigatório'),
  hipoteseDiagnostica: z.string().min(3, 'Hipótese diagnóstica é obrigatória'),
  conduta: z.string().min(5, 'Conduta é obrigatória'),
  observacoes: z.string().optional(),
});

type EvolucaoFormData = z.infer<typeof evolucaoSchema>;

interface EvolucaoFormProps {
  onSubmit: (data: EvolucaoFormData) => void;
  defaultValues?: Partial<EvolucaoFormData>;
  onCancel?: () => void;
  /**
   * Identificador único do escopo do rascunho (ex.: `evolucao:<consultaId>`).
   * Quando informado, ativa autosave/restore/discard via localStorage usando
   * a constante padrão DRAFT_TOASTS.
   */
  draftScopeId?: string;
}

const DRAFT_KEY_PREFIX = 'evolucao_draft_v1:';
const draftKey = (scope: string) => `${DRAFT_KEY_PREFIX}${scope}`;

interface DraftPayload {
  form: Partial<EvolucaoFormData>;
  savedAt: string;
}

const loadDraft = (scope?: string): DraftPayload | null => {
  if (!scope) return null;
  try {
    const raw = localStorage.getItem(draftKey(scope));
    return raw ? (JSON.parse(raw) as DraftPayload) : null;
  } catch {
    return null;
  }
};

const persistDraft = (scope: string, payload: DraftPayload) => {
  try {
    localStorage.setItem(draftKey(scope), JSON.stringify(payload));
  } catch {
    /* noop */
  }
};

const clearDraft = (scope?: string) => {
  if (!scope) return;
  try {
    localStorage.removeItem(draftKey(scope));
  } catch {
    /* noop */
  }
};

const EMPTY_DEFAULTS: EvolucaoFormData = {
  queixaPrincipal: '',
  historiaDoenca: '',
  exameFisico: '',
  hipoteseDiagnostica: '',
  conduta: '',
  observacoes: '',
};

export const EvolucaoForm = ({
  onSubmit,
  defaultValues,
  onCancel,
  draftScopeId,
}: EvolucaoFormProps) => {
  const { toast } = useToast();
  const [pendingDraft, setPendingDraft] = useState<DraftPayload | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const hydratedRef = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EvolucaoFormData>({
    resolver: zodResolver(evolucaoSchema),
    defaultValues: { ...EMPTY_DEFAULTS, ...defaultValues },
  });

  // Detecta rascunho existente ao montar — não restaura automaticamente
  useEffect(() => {
    const draft = loadDraft(draftScopeId);
    if (draft) {
      setPendingDraft(draft);
    }
    // hydratedRef permite o primeiro autosave somente após a montagem
    setTimeout(() => {
      hydratedRef.current = true;
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftScopeId]);

  // Autosave debounced (800ms)
  const watched = watch();
  useEffect(() => {
    if (!draftScopeId || !hydratedRef.current || pendingDraft) return;
    const handle = setTimeout(() => {
      const savedAt = new Date().toISOString();
      persistDraft(draftScopeId, { form: watched, savedAt });
      setDraftSavedAt(savedAt);
    }, 800);
    return () => clearTimeout(handle);
  }, [watched, draftScopeId, pendingDraft]);

  const continuarRascunho = () => {
    if (!pendingDraft) return;
    reset({ ...EMPTY_DEFAULTS, ...pendingDraft.form });
    setDraftSavedAt(pendingDraft.savedAt);
    setPendingDraft(null);
    toast(DRAFT_TOASTS.restored(pendingDraft.savedAt));
  };

  const comecarDoZero = () => {
    clearDraft(draftScopeId);
    reset({ ...EMPTY_DEFAULTS, ...defaultValues });
    setDraftSavedAt(null);
    setPendingDraft(null);
    toast(DRAFT_TOASTS.startedFresh());
  };

  const descartarRascunho = () => {
    clearDraft(draftScopeId);
    reset({ ...EMPTY_DEFAULTS, ...defaultValues });
    setDraftSavedAt(null);
    toast(DRAFT_TOASTS.discarded());
  };

  const handleFinalSubmit = (data: EvolucaoFormData) => {
    clearDraft(draftScopeId);
    setDraftSavedAt(null);
    onSubmit(data);
  };

  const handleCancel = () => {
    if (draftSavedAt) {
      // Mantém rascunho ao cancelar
      toast(DRAFT_TOASTS.kept());
    }
    onCancel?.();
  };

  return (
    <form onSubmit={handleSubmit(handleFinalSubmit)} className="space-y-4">
      {pendingDraft && (
        <Alert data-testid="evolucao-draft-resume-banner">
          <Sparkles className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between gap-3 flex-wrap">
            <span>
              Encontramos um rascunho salvo em{' '}
              <strong>{new Date(pendingDraft.savedAt).toLocaleString('pt-BR')}</strong>.
              Deseja continuar de onde parou?
            </span>
            <span className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={comecarDoZero}>
                Começar do zero
              </Button>
              <Button type="button" size="sm" onClick={continuarRascunho}>
                Continuar rascunho
              </Button>
            </span>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="queixaPrincipal">Queixa Principal *</Label>
        <Textarea
          id="queixaPrincipal"
          {...register('queixaPrincipal')}
          placeholder="Descreva a queixa principal do paciente"
          rows={2}
        />
        {errors.queixaPrincipal && (
          <p className="text-sm text-destructive">{errors.queixaPrincipal.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="historiaDoenca">História da Doença Atual *</Label>
        <Textarea
          id="historiaDoenca"
          {...register('historiaDoenca')}
          placeholder="Descreva a história da doença atual"
          rows={3}
        />
        {errors.historiaDoenca && (
          <p className="text-sm text-destructive">{errors.historiaDoenca.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="exameFisico">Exame Físico *</Label>
        <Textarea
          id="exameFisico"
          {...register('exameFisico')}
          placeholder="Descreva os achados do exame físico"
          rows={3}
        />
        {errors.exameFisico && (
          <p className="text-sm text-destructive">{errors.exameFisico.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="hipoteseDiagnostica">Hipótese Diagnóstica *</Label>
        <Textarea
          id="hipoteseDiagnostica"
          {...register('hipoteseDiagnostica')}
          placeholder="Informe a hipótese diagnóstica"
          rows={2}
        />
        {errors.hipoteseDiagnostica && (
          <p className="text-sm text-destructive">{errors.hipoteseDiagnostica.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="conduta">Conduta *</Label>
        <Textarea
          id="conduta"
          {...register('conduta')}
          placeholder="Descreva a conduta terapêutica"
          rows={3}
        />
        {errors.conduta && (
          <p className="text-sm text-destructive">{errors.conduta.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          {...register('observacoes')}
          placeholder="Observações adicionais"
          rows={2}
        />
      </div>

      {draftSavedAt && (
        <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 rounded px-3 py-2">
          <span className="flex items-center gap-1">
            <Save className="h-3 w-3" />
            Rascunho salvo automaticamente às{' '}
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

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Salvar Evolução
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
};
