import { Check, X } from 'lucide-react';
import {
  PASSWORD_REQUIREMENT_LABELS,
  type PasswordRequirementChecks,
  type PasswordRequirementKey,
} from '@/lib/auth/passwordPolicy';
import { cn } from '@/lib/utils';

const ORDER: PasswordRequirementKey[] = [
  'minLength',
  'hasNumber',
  'passwordsMatch',
  'differentFromCurrent',
];

interface PasswordRequirementsChecklistProps {
  checks: PasswordRequirementChecks;
  showErrors: boolean;
  className?: string;
}

export function PasswordRequirementsChecklist({
  checks,
  showErrors,
  className,
}: PasswordRequirementsChecklistProps) {
  return (
    <ul className={cn('space-y-2 text-sm', className)} aria-live="polite">
      {ORDER.map((key) => {
        const ok = checks[key];
        const failed = showErrors && !ok;
        const Icon = ok ? Check : X;
        return (
          <li
            key={key}
            className={cn(
              'flex items-start gap-2',
              failed ? 'text-destructive' : ok ? 'text-muted-foreground' : 'text-muted-foreground/70',
            )}
          >
            <Icon
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0',
                ok ? 'text-emerald-600 dark:text-emerald-500' : failed ? 'text-destructive' : 'text-muted-foreground/50',
              )}
              aria-hidden
            />
            <span>{PASSWORD_REQUIREMENT_LABELS[key]}</span>
          </li>
        );
      })}
    </ul>
  );
}
