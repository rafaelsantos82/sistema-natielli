import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePassword } from '@/lib/api/auth';
import { setAccessToken } from '@/lib/auth/tokenStore';
import {
  allRequirementsMet,
  evaluatePasswordRequirements,
  shouldShowPasswordErrors,
} from '@/lib/auth/passwordPolicy';
import { useAuth } from '@/contexts/AuthContext';
import { PasswordRequirementsChecklist } from '@/components/account/PasswordRequirementsChecklist';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { showErrorToast } from '@/lib/ui/showErrorToast';
import {
  changePasswordFormSchema,
  type ChangePasswordFormData,
} from '@/lib/validations/account.schema';
import logo from '@/assets/logo.png';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

interface ChangePasswordFormProps {
  variant?: 'standalone' | 'embedded';
  title?: string;
  description?: string;
  showLogout?: boolean;
  hideHeader?: boolean;
  onSuccess?: () => void;
}

function PasswordField({
  id,
  label,
  autoComplete,
  disabled,
  error,
  invalid,
  register,
  showPassword,
  onToggleVisibility,
}: {
  id: string;
  label: string;
  autoComplete: string;
  disabled: boolean;
  error?: string;
  invalid?: boolean;
  register: ReturnType<typeof useForm<ChangePasswordFormData>>['register'];
  showPassword: boolean;
  onToggleVisibility: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          autoComplete={autoComplete}
          disabled={disabled}
          className={cn('h-10 pr-10', invalid && 'border-destructive')}
          {...register(id as keyof ChangePasswordFormData)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-10 w-10 text-muted-foreground"
          onClick={onToggleVisibility}
          disabled={disabled}
          tabIndex={-1}
          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function ChangePasswordForm({
  variant = 'embedded',
  title = 'Trocar senha',
  description = 'Informe sua senha atual e escolha uma nova senha forte.',
  showLogout = false,
  hideHeader = false,
  onSuccess,
}: ChangePasswordFormProps) {
  const { refreshSessionAfterPasswordChange, logout, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordFormSchema),
    mode: 'onChange',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const currentPassword = useWatch({ control: form.control, name: 'currentPassword' }) ?? '';
  const newPassword = useWatch({ control: form.control, name: 'newPassword' }) ?? '';
  const confirmPassword = useWatch({ control: form.control, name: 'confirmPassword' }) ?? '';

  const checks = evaluatePasswordRequirements({
    currentPassword,
    newPassword,
    confirmPassword,
  });
  const showErrors = shouldShowPasswordErrors(newPassword, confirmPassword);
  const requirementsOk = allRequirementsMet(checks);
  const matchInvalid = showErrors && !checks.passwordsMatch;

  const canSubmit =
    requirementsOk && form.formState.isValid && !isLoading && currentPassword.length > 0;

  const handleReset = () => {
    form.reset();
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    setIsLoading(true);
    try {
      const result = await changePassword(data.currentPassword, data.newPassword);
      setAccessToken(result.access_token);
      if (onSuccess) {
        await refreshSessionAfterPasswordChange(result, { redirectTo: false });
        toast.success('Senha alterada com sucesso');
        onSuccess();
      } else if (user?.mustChangePassword) {
        await refreshSessionAfterPasswordChange(result, { redirectTo: '/' });
        toast.success('Senha alterada com sucesso');
      } else {
        await refreshSessionAfterPasswordChange(result, { redirectTo: '/' });
        toast.success('Senha alterada com sucesso');
      }
      handleReset();
    } catch (err) {
      showErrorToast(err, { authFlow: 'password-change', action: 'alterar', entity: 'a senha' });
    } finally {
      setIsLoading(false);
    }
  });

  const formBody = (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PasswordField
        id="currentPassword"
        label="Senha atual"
        autoComplete="current-password"
        disabled={isLoading}
        error={form.formState.errors.currentPassword?.message}
        register={form.register}
        showPassword={showCurrent}
        onToggleVisibility={() => setShowCurrent((v) => !v)}
      />

      <PasswordField
        id="newPassword"
        label="Nova senha"
        autoComplete="new-password"
        disabled={isLoading}
        invalid={matchInvalid}
        error={form.formState.errors.newPassword?.message}
        register={form.register}
        showPassword={showNew}
        onToggleVisibility={() => setShowNew((v) => !v)}
      />

      <PasswordField
        id="confirmPassword"
        label="Confirmar nova senha"
        autoComplete="new-password"
        disabled={isLoading}
        invalid={matchInvalid}
        error={form.formState.errors.confirmPassword?.message}
        register={form.register}
        showPassword={showConfirm}
        onToggleVisibility={() => setShowConfirm((v) => !v)}
      />

      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="mb-3 text-sm font-medium text-foreground">Requisitos da nova senha</p>
        <PasswordRequirementsChecklist checks={checks} showErrors={showErrors} />
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={isLoading}
          onClick={handleReset}
        >
          Desfazer
        </Button>
        <Button type="submit" className="w-full sm:w-auto" disabled={!canSubmit}>
          {isLoading ? 'Salvando...' : 'Alterar senha'}
        </Button>
      </div>

      {showLogout && (
        <Button
          type="button"
          variant="ghost"
          className={cn('w-full text-muted-foreground', variant === 'standalone' && 'mt-2')}
          onClick={() => logout()}
          disabled={isLoading}
        >
          Sair
        </Button>
      )}
    </form>
  );

  if (variant === 'standalone') {
    return (
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="mb-6 flex justify-center">
          <img src={logo} alt="Espaço Terapia" className="h-12 w-12 object-contain" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-navy">{title}</h1>
        <p className="mb-6 text-sm text-muted-foreground">{description}</p>
        {formBody}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!hideHeader && (
        <div>
          <h2 className="text-lg font-semibold text-navy">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      )}
      {formBody}
    </div>
  );
}
