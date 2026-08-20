import { Badge } from '@/components/ui/badge';
import type { StatusAtendimento } from '@/hooks/useConsultas';

const LABELS: Record<StatusAtendimento, string> = {
  atendimento_pendente: 'Atendimento pendente',
  aguardando_prontuario: 'Aguardando prontuário',
  pronto_para_aprovacao: 'Pronto para aprovação',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
};

const CLASSES: Record<StatusAtendimento, string> = {
  atendimento_pendente: 'bg-muted text-muted-foreground',
  aguardando_prontuario: 'bg-warning text-warning-foreground',
  pronto_para_aprovacao: 'bg-primary text-primary-foreground',
  aprovado: 'bg-success text-success-foreground',
  rejeitado: 'bg-destructive text-destructive-foreground',
};

interface Props {
  status?: StatusAtendimento;
}

export const StatusAtendimentoBadge = ({ status }: Props) => {
  const value = status ?? 'atendimento_pendente';
  return <Badge className={CLASSES[value]}>{LABELS[value]}</Badge>;
};

export const STATUS_ATENDIMENTO_LABELS = LABELS;
