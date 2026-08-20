import { Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const SCOPE_MESSAGES: Record<string, string> = {
  responsavel: 'Visualizando somente dados do paciente vinculado.',
  terapeuta:
    'Visualizando pacientes da sua carteira (vínculo por agendamentos e consultas).',
};

export function ClinicalScopeBanner() {
  const { user } = useAuth();
  if (!user) return null;
  const message = SCOPE_MESSAGES[user.role];
  if (!message) return null;

  return (
    <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
