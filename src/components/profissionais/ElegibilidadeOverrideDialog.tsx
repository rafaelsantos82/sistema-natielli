import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog, type AuditAcao } from '@/hooks/useAuditLog';
import { useAuth } from '@/contexts/AuthContext';

export interface ElegibilidadeOverridePayload {
  justificativa: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: ElegibilidadeOverridePayload) => void;
  motivos: string[];
  /** Texto que descreve a ação que será forçada (ex: "reagendar consulta"). */
  acaoLabel: string;
  /** Entidade alvo no log (ex: "consulta"). */
  entidade: string;
  entidadeId: string;
  acaoAuditoria?: AuditAcao;
}

const ROLES_PERMITIDAS = ['admin', 'gestor'] as const;

/**
 * Diálogo de "quebra de bloqueio" para Admin/Gestor: exige justificativa
 * e registra entrada imutável no log de auditoria (ISO 27789).
 */
export const ElegibilidadeOverrideDialog = ({
  isOpen,
  onClose,
  onConfirm,
  motivos,
  acaoLabel,
  entidade,
  entidadeId,
  acaoAuditoria = 'agenda.alteracao',
}: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { log } = useAuditLog();
  const [justificativa, setJustificativa] = useState('');

  const podeOverride = !!user && (ROLES_PERMITIDAS as readonly string[]).includes(user.role);

  const handleConfirm = () => {
    if (!podeOverride) return;
    const fromDom = (
      document.getElementById('justificativa') as HTMLTextAreaElement | null
    )?.value;
    const motivo = (fromDom ?? justificativa).trim();
    if (motivo.length < 10) {
      toast({
        title: 'Justificativa muito curta',
        description: 'Descreva o motivo com pelo menos 10 caracteres.',
        variant: 'destructive',
      });
      return;
    }
    log({
      actor_id: user!.id,
      actor_name: user!.name,
      actor_role: user!.role,
      acao: acaoAuditoria,
      entidade,
      entidade_id: entidadeId,
      diff: {
        tipo: 'override_elegibilidade',
        acao_executada: acaoLabel,
        motivos_bloqueio: motivos,
        justificativa: motivo,
      },
    });
    onConfirm({ justificativa: motivo });
    setJustificativa('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            Forçar {acaoLabel}
          </DialogTitle>
          <DialogDescription>
            Esta ação ignora bloqueios de elegibilidade e fica registrada no log de
            auditoria.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTitle>Pendências detectadas</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4 space-y-0.5">
              {motivos.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>

        {podeOverride ? (
          <div className="space-y-2">
            <Label htmlFor="justificativa">Justificativa (obrigatória)</Label>
            <Textarea
              id="justificativa"
              data-testid="elegibilidade-justificativa"
              rows={4}
              defaultValue=""
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Descreva por que este atendimento precisa prosseguir mesmo com pendências."
            />
          </div>
        ) : (
          <Alert>
            <AlertTitle>Permissão necessária</AlertTitle>
            <AlertDescription>
              Apenas usuários Admin ou Gestor podem forçar esta ação.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            data-testid="elegibilidade-override-confirm"
            onClick={handleConfirm}
            disabled={!podeOverride}
          >
            Confirmar e registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
